#!/usr/bin/env python3
"""Cut generated pose sheets into sprites and pack them into one atlas.

A pose sheet is one generated image holding several poses of one subject on a
grid, for example 3 columns by 2 rows. Generating the poses together, from one
canonical reference, is what keeps a character looking like itself from pose
to pose. This follows the method of Codex's hatch-pet skill: generated pixels
are never redrawn, only separated from the background, measured and packed.

    uv run --with pillow --with numpy --with scipy python tools/art/cut.py tools/art/atlases.json [name ...]

The spec lists atlases. Each has an output path, a target size and sheets:

    "yoru": {
      "out": "public/art/sprites/yoru",
      "size": 440,                         pixels that one unit becomes
      "sheets": [{
        "file": "yoru-play.png", "grid": "3x2",
        "names": ["idle", "blink", "don-left", "don-right", "ka-left", "ka-right"],
        "unit": "idle",                    the sprite whose height is one unit,
                                           or "slot" (a grid slot's height),
                                           or "each" (every sprite is one unit wide)
        "anchor": "feet",                  or "centre"
        "scale": 1                         optional, to match one sheet to another
      }]
    }

A name starting with "-" is cut and measured but left out of the atlas, which
is how the same reference pose can open every sheet of a character.

Writes <out>.webp and <out>.json. The JSON gives, for every sprite, its
rectangle in the atlas and its anchor: the point the game holds still while it
swaps one pose for another.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

PADDING = 4          # transparent pixels kept around every sprite
SPECK = 0.0006       # parts smaller than this share of a slot are dropped as dirt
SOLID = 40           # alpha above which a pixel counts as part of the figure


def load(path: Path, key: str | None) -> np.ndarray:
    image = np.asarray(Image.open(path).convert("RGBA")).astype(np.float32)
    if image[..., 3].min() < 250:
        # generated alpha tops out just under full; solid means solid
        alpha = image[..., 3]
        image[..., 3] = np.where(alpha >= 250, 255, alpha)
        return image
    # no transparency in the file: key out the flat background colour
    if key:
        colour = np.array([int(key[i:i + 2], 16) for i in (1, 3, 5)], dtype=np.float32)
    else:
        corners = np.concatenate([image[:8, :8, :3].reshape(-1, 3), image[:8, -8:, :3].reshape(-1, 3),
                                  image[-8:, :8, :3].reshape(-1, 3), image[-8:, -8:, :3].reshape(-1, 3)])
        colour = np.median(corners, axis=0)
    distance = np.linalg.norm(image[..., :3] - colour, axis=-1)
    matte = np.clip((distance - 40) / 80, 0, 1)
    rgb = image[..., :3]
    edge = (matte > 0) & (matte < 1)
    # take the background colour back out of the soft edge
    rgb[edge] = np.clip((rgb[edge] - colour * (1 - matte[edge, None])) / np.maximum(matte[edge, None], 0.05), 0, 255)
    image[..., 3] = matte * 255
    return image


def slot_masks(image: np.ndarray, columns: int, rows: int) -> list[np.ndarray | None]:
    """One mask per grid slot, holding every part whose middle lies in it."""
    solid = image[..., 3] > SOLID
    labels, count = ndimage.label(solid, structure=np.ones((3, 3)))
    height, width = solid.shape
    masks: list[np.ndarray | None] = [None] * (columns * rows)
    if not count:
        return masks
    index = np.arange(1, count + 1)
    areas = ndimage.sum(solid, labels, index)
    centres = ndimage.center_of_mass(solid, labels, index)
    smallest = SPECK * (width / columns) * (height / rows)
    lookup = np.full(count + 1, -1)
    for label, area, (cy, cx) in zip(index, areas, centres):
        if area >= smallest:
            lookup[label] = min(rows - 1, int(cy / height * rows)) * columns + min(columns - 1, int(cx / width * columns))
    owner = lookup[labels]
    for slot in range(columns * rows):
        mask = owner == slot
        if mask.any():
            masks[slot] = mask
    return masks


def cut(image: np.ndarray, mask: np.ndarray, anchor: str) -> dict:
    near = ndimage.binary_dilation(mask, iterations=4)          # keep this sprite's soft edge
    piece = image.copy()
    piece[~near] = 0
    ys, xs = np.nonzero(piece[..., 3] > 0)
    top, bottom, left, right = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    piece = piece[top:bottom, left:right]
    alpha = piece[..., 3]
    used = np.nonzero(alpha.max(axis=1) > SOLID)[0]
    head, ground = int(used.min()), int(used.max()) + 1
    columns_used = np.nonzero(alpha.max(axis=0) > SOLID)[0]
    if anchor == "centre":
        at = ((columns_used.min() + columns_used.max() + 1) / 2, (head + ground) / 2)
    else:
        # across: the middle of whatever stands on the ground; down: the ground
        band = alpha[max(0, ground - max(6, int(0.07 * (ground - head)))):ground]
        weight = (band > SOLID).sum(axis=0).astype(np.float64)
        at = (float((weight * np.arange(len(weight))).sum() / max(1.0, weight.sum())), float(ground))
    return {"pixels": piece, "anchor": at, "tall": ground - head, "wide": int(columns_used.max() - columns_used.min() + 1)}


def build(name: str, spec: dict, root: Path, sources: Path) -> None:
    size = spec["size"]
    sprites: dict[str, tuple[Image.Image, tuple[float, float]]] = {}
    for sheet in spec["sheets"]:
        columns, rows = (int(v) for v in sheet["grid"].lower().split("x"))
        names = sheet["names"]
        if len(names) != columns * rows:
            raise SystemExit(f"{sheet['file']}: {len(names)} names for {columns * rows} slots")
        image = load(sources / sheet["file"], sheet.get("key"))
        masks = slot_masks(image, columns, rows)
        pieces = {}
        for label, mask in zip(names, masks):
            if label == "":
                continue
            if mask is None:
                raise SystemExit(f"{sheet['file']}: slot '{label}' is empty")
            pieces[label] = cut(image, mask, sheet.get("anchor", "feet"))
        unit = sheet.get("unit", "slot")
        for label, piece in pieces.items():
            if label.startswith("-"):
                continue
            if unit == "slot":
                one = image.shape[0] / rows
            elif unit == "each":
                one = piece["wide"]
            else:
                one = pieces[unit]["tall"]
            scale = size / one * sheet.get("scale", 1)
            picture = Image.fromarray(np.clip(piece["pixels"], 0, 255).astype(np.uint8), "RGBA")
            picture = picture.resize((max(1, round(picture.width * scale)), max(1, round(picture.height * scale))), Image.Resampling.LANCZOS)
            if label in sprites:
                raise SystemExit(f"{name}: two sprites are called '{label}'")
            sprites[label] = (picture, (piece["anchor"][0] * scale, piece["anchor"][1] * scale))
            print(f"  {label:14s} {picture.width:4d}x{picture.height:<4d} from {sheet['file']} at {scale:.3f}")

    # pack in rows, tallest first
    order = sorted(sprites, key=lambda label: -sprites[label][0].height)
    widest = max(picture.width for picture, _ in sprites.values()) + 2 * PADDING
    area = sum((p.width + 2 * PADDING) * (p.height + 2 * PADDING) for p, _ in sprites.values())
    limit = max(widest, int(np.ceil(np.sqrt(area) * 1.15)))
    x = y = shelf = 0
    places = {}
    for label in order:
        picture = sprites[label][0]
        w, h = picture.width + 2 * PADDING, picture.height + 2 * PADDING
        if x and x + w > limit:
            x, y, shelf = 0, y + shelf, 0
        places[label] = (x, y)
        x, shelf = x + w, max(shelf, h)
    width = max(px + sprites[label][0].width + 2 * PADDING for label, (px, _) in places.items())
    atlas = Image.new("RGBA", (width, y + shelf), (0, 0, 0, 0))
    manifest = {"image": f"{Path(spec['out']).name}.webp", "width": atlas.width, "height": atlas.height, "unit": size, "sprites": {}}
    for label, (picture, (ax, ay)) in sprites.items():
        px, py = places[label]
        atlas.alpha_composite(picture, (px + PADDING, py + PADDING))
        manifest["sprites"][label] = {
            "x": px, "y": py, "w": picture.width + 2 * PADDING, "h": picture.height + 2 * PADDING,
            "ax": round(ax + PADDING, 1), "ay": round(ay + PADDING, 1),
        }
    out = root / spec["out"]
    out.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(out.with_suffix(".webp"), "WEBP", quality=spec.get("quality", 88), method=6)
    out.with_suffix(".json").write_text(json.dumps(manifest, separators=(",", ":")) + "\n")
    kilobytes = out.with_suffix(".webp").stat().st_size / 1024
    print(f"{name}: {out.with_suffix('.webp')}  {atlas.width}x{atlas.height}  {len(sprites)} sprites  {kilobytes:.0f} KB")


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    path = Path(sys.argv[1]).resolve()
    spec = json.loads(path.read_text())
    root = path.parent.parent.parent                       # tools/art/atlases.json -> the repo
    sources = (path.parent / spec.get("sources", "sheets")).resolve()
    for name, atlas in spec["atlases"].items():
        if len(sys.argv) > 2 and name not in sys.argv[2:]:
            continue
        build(name, atlas, root, sources)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
