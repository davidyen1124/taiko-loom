#!/usr/bin/env python3
"""Lay an atlas out as a labelled contact sheet, for checking by eye.

    uv run --with pillow python tools/art/contact.py public/art/sprites/yoru.json out.png [background]

Every sprite is placed with its anchor on the same cross, which shows at a
glance whether a character holds its size and its place from pose to pose.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

manifest = Path(sys.argv[1])
data = json.loads(manifest.read_text())
atlas = Image.open(manifest.with_name(data["image"])).convert("RGBA")
background = sys.argv[3] if len(sys.argv) > 3 else "#7fb4c9"
sprites = data["sprites"]
left = max(s["ax"] for s in sprites.values())
right = max(s["w"] - s["ax"] for s in sprites.values())
up = max(s["ay"] for s in sprites.values())
down = max(s["h"] - s["ay"] for s in sprites.values())
cell = (int(left + right) + 16, int(up + down) + 40)
columns = min(6, len(sprites))
rows = -(-len(sprites) // columns)
sheet = Image.new("RGBA", (cell[0] * columns, cell[1] * rows), background)
draw = ImageDraw.Draw(sheet)
for i, (name, s) in enumerate(sprites.items()):
    ox, oy = (i % columns) * cell[0], (i // columns) * cell[1]
    ax, ay = ox + 8 + left, oy + 8 + up
    draw.line((ox, ay, ox + cell[0], ay), fill="#ffffff", width=1)
    draw.line((ax, oy, ax, oy + cell[1]), fill="#ffffff", width=1)
    piece = atlas.crop((s["x"], s["y"], s["x"] + s["w"], s["y"] + s["h"]))
    sheet.alpha_composite(piece, (int(ax - s["ax"]), int(ay - s["ay"])))
    draw.text((ox + 8, oy + cell[1] - 22), name, fill="#101010")
sheet.convert("RGB").save(sys.argv[2])
print(sys.argv[2], sheet.size)
