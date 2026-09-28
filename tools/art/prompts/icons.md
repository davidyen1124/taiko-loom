Use the $imagegen skill (built-in image_gen tool) and follow the row-strip method of the $hatch-pet skill (read ~/.codex/skills/hatch-pet/SKILL.md): a layout guide gives the slots, a reference image gives the style, and the result must be clean enough to cut into sprites. This is for a game, not a Codex pet package: do not prepare a pet run folder, do not run the hatch-pet scripts, do not package anything, and do not write any code other than a one-line alpha measurement.

Attached images:
- Image 1: `yoru-canonical.png`, the game's mascot, as a style reference.
- Image 2: `guide-3x2.png`, layout guide only.

## The one image to make: `icons.png`

Use case: stylized-concept
Asset type: sprite sheet for a 2D rhythm game, to be cut into sprites
Primary request: three difficulty badges and three crowns for a rhythm game's menus, on a 3 column by 2 row sheet
Size: match the guide's shape, as large as the tool allows.

Style/medium (must match Image 1):
Premium 2D mobile-game mascot illustration. Bold, clean, even-weight dark plum-black outline (#1a1014). Smooth cel shading with soft gradients, one soft shadow tone and one highlight tone per material. Glossy highlights on the eyes, nose, drum skin and sticks. Subtle warm rim light. Rich saturated festival colours: chestnut fur, indigo coat, vermilion red, cream, leaf green, gold. Crisp clean edges. Polished, appealing, toy-like and huggable. Not flat clip-art, not pixel art, not photoreal, not a 3D render.

Slots, left to right, top row first:
Slots 1 to 3 are round emblem badges, all exactly the same size: a bold dark outline, a glossy warm-white rim ring, and a coloured enamel centre holding one simple symbol with a dark outline.
1. EASY: orange-red centre (#f2642b) with a five-petal pink-and-white cherry blossom.
2. MEDIUM: green centre (#6fae2e) with one fresh light-green leaf with a centre vein.
3. HARD: blue centre (#3d7fd9) with one bright flame, white-hot at its core and pale blue outside.
Slots 4 to 6 are crowns, all exactly the same shape and size: a chunky five-point crown seen from the front, bold dark outline, a band along the bottom, one round jewel in the middle, glossy highlights.
4. SILVER CROWN: polished silver with a sky-blue jewel.
5. GOLD CROWN: polished gold with a ruby-red jewel.
6. RAINBOW CROWN: the metal shifts smoothly through rainbow colours from left to right (red, orange, yellow, green, blue, violet), with a white diamond jewel.

## Rules for this sheet
- Image 1 shows the game's mascot. It is a STYLE REFERENCE ONLY: match its bold even dark plum-black outline (#1a1014), smooth cel shading with soft gradients, glossy highlights and rich saturated colours. Do NOT draw the mascot or any part of it.
- Image 2 is a LAYOUT GUIDE ONLY: it shows how many slots there are, their spacing and the safe area. Do NOT draw any of its boxes, lines or grey background.
- One complete, separate subject per slot, centred in its slot, inside the safe area. Nothing crosses into a neighbouring slot. Nothing is cropped.
- Background: genuinely TRANSPARENT (a real alpha channel). No floor, no ground shadow, no contact shadow, no drop shadow, no glow, no halo.
- Check transparency by MEASURING the alpha channel of the file (for example with Python and Pillow: at least a quarter of the pixels must have alpha 0), not by looking at it. Image viewers may show leftover colour underneath fully transparent pixels; that leftover colour is harmless and is not a failure.
- No motion lines, sparkles, stars, music notes or any other detached effect.
- No text, letters, numbers, kana, kanji, labels, borders, frames or watermark.
- Everything is ORIGINAL. Do not imitate or reference any existing game, anime, film or brand.

## Process
1. Generate the sheet with both images attached.
2. Inspect it: count the slots and check every slot against its description and every rule above. Measure the alpha channel.
3. If anything is wrong, regenerate with ONE targeted correction, keeping both images attached (up to 3 attempts in total).
4. Copy the chosen file into the current working directory as exactly `icons.png`.
5. Final message: pixel size, the measured share of transparent pixels, attempts used, and an honest per-slot pass/fail with a one-line note on any flaw you could not fix. Do not embed images in the final message.
