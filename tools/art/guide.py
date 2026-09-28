#!/usr/bin/env python3
"""Draw a layout guide for a pose sheet: slots, safe area and ground line.

    uv run --with pillow python tools/art/guide.py guide-3x2.png 3 2 1536 1024

The guide is attached to the prompt as a layout-only reference, as Codex's
hatch-pet skill does. Nothing of it may appear in the generated picture.
"""
import sys

from PIL import Image, ImageDraw

out, columns, rows, width, height = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
image = Image.new("RGB", (width, height), "#f7f7f7")
draw = ImageDraw.Draw(image)
cell_width, cell_height = width / columns, height / rows
for row in range(rows):
    for column in range(columns):
        left, top = column * cell_width, row * cell_height
        draw.rectangle((left, top, left + cell_width - 1, top + cell_height - 1), outline="#111111", width=3)
        side, edge = cell_width * 0.09, cell_height * 0.08
        draw.rectangle((left + side, top + edge, left + cell_width - side, top + cell_height - edge), outline="#2f80ed", width=3)
        for y in range(int(top + edge), int(top + cell_height - edge), 22):
            draw.line((left + cell_width / 2, y, left + cell_width / 2, y + 12), fill="#b8b8b8", width=2)
        ground = top + cell_height - edge - 1
        draw.line((left + side, ground, left + cell_width - side, ground), fill="#e08a2f", width=3)
image.save(out)
