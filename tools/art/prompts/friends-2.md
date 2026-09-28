Use the $imagegen skill (built-in image_gen tool) and follow the row-strip method of the $hatch-pet skill (read ~/.codex/skills/hatch-pet/SKILL.md): a layout guide gives the slots, a reference image gives the style, and the result must be clean enough to cut into sprites. This is for a game, not a Codex pet package: do not prepare a pet run folder, do not run the hatch-pet scripts, do not package anything, and do not write any code other than a one-line alpha measurement.

Attached images:
- Image 1: `yoru-canonical.png`, the game's mascot, as a style reference.
- Image 2: `guide-2x2.png`, layout guide only.

## The one image to make: `friends-2.png`

Use case: stylized-concept
Asset type: sprite sheet for a 2D rhythm game, to be cut into sprites
Primary request: two cute festival characters, two dance poses each, on a 2 column by 2 row sheet
Size: match the guide's shape, as large as the tool allows.

Style/medium (must match Image 1):
Premium 2D mobile-game mascot illustration. Bold, clean, even-weight dark plum-black outline (#1a1014). Smooth cel shading with soft gradients, one soft shadow tone and one highlight tone per material. Glossy highlights on the eyes, nose, drum skin and sticks. Subtle warm rim light. Rich saturated festival colours: chestnut fur, indigo coat, vermilion red, cream, leaf green, gold. Crisp clean edges. Polished, appealing, toy-like and huggable. Not flat clip-art, not pixel art, not photoreal, not a 3D render.

Slots, left to right, top row first:
Column 1, LANTERN: a round paper festival lantern come to life. Warm cream-yellow ribbed paper body that looks softly lit from inside, a friendly face (big dark eyes, rosy cheeks, small open smile), a black wooden cap on top with a short loop handle, a black wooden base with a small gold tassel, two tiny dark arms and two tiny dark feet. No writing on it.
Column 2, DANGO: three round rice dumplings stacked on one bamboo skewer, moving together as one character: pink on top, white in the middle, green at the bottom. Each dumpling has its own small cheerful face with rosy cheeks. Two tiny feet under the bottom dumpling and two tiny arms on the middle one. The skewer tip shows above the top dumpling.

1. (top, column 1) LANTERN, dance beat A: leaning toward the viewer's left, both arms raised, the foot on the viewer's right lifted, happy open smile.
2. (top, column 2) DANGO, dance beat A: the stack bending toward the viewer's left like a bow, both arms raised, the foot on the viewer's right lifted, all three faces smiling.
3. (bottom, column 1) LANTERN, dance beat B: leaning toward the viewer's right, both arms raised, the foot on the viewer's left lifted, eyes closed as happy curves.
4. (bottom, column 2) DANGO, dance beat B: the stack bending toward the viewer's right, both arms raised, the foot on the viewer's left lifted, all three faces with eyes closed as happy curves.

## Rules for this sheet
- Image 1 shows the game's mascot. It is a STYLE REFERENCE ONLY: match its bold even dark plum-black outline (#1a1014), smooth cel shading with soft gradients, glossy highlights, rich saturated colours and cute toy-like proportions. Do NOT draw the mascot.
- Image 2 is a LAYOUT GUIDE ONLY: slots, spacing, safe area (blue box) and ground line (orange). Do NOT draw any of its boxes, lines or grey background.
- Each COLUMN is one character. The top slot and the bottom slot of a column show the SAME character, identical in design, colours, size and markings; only the pose changes.
- One complete full-body pose per slot, centred, inside the safe area, standing on the slot's ground line. Nothing crosses into a neighbouring slot. Nothing is cropped.
- All characters are about the same height, and each is the same size in both of its slots.
- Background: genuinely TRANSPARENT (a real alpha channel). No floor, no ground shadow, no contact shadow, no drop shadow, no glow, no halo.
- Check transparency by MEASURING the alpha channel of the file (for example with Python and Pillow: at least a quarter of the pixels must have alpha 0), not by looking at it. Image viewers may show leftover colour underneath fully transparent pixels; that leftover colour is harmless and is not a failure.
- No motion lines, sparkles, stars, music notes, dust or any other detached effect.
- No text, letters, numbers, kana, kanji, labels, borders, frames or watermark. No writing on any character.
- Everything is ORIGINAL. Do not imitate or reference any existing game, anime, film or brand mascot.

## Process
1. Generate the sheet with both images attached.
2. Inspect it: count the slots and check every slot against its description and every rule above. Measure the alpha channel.
3. If anything is wrong, regenerate with ONE targeted correction, keeping both images attached (up to 3 attempts in total).
4. Copy the chosen file into the current working directory as exactly `friends-2.png`.
5. Final message: pixel size, the measured share of transparent pixels, attempts used, and an honest per-slot pass/fail with a one-line note on any flaw you could not fix. Do not embed images in the final message.
