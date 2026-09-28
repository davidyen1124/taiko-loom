Use the $imagegen skill (built-in image_gen tool) and follow the row-strip method of the $hatch-pet skill (read ~/.codex/skills/hatch-pet/SKILL.md): a layout guide gives the slots, a reference image gives the style, and the result must be clean enough to cut into sprites. This is for a game, not a Codex pet package: do not prepare a pet run folder, do not run the hatch-pet scripts, do not package anything, and do not write any code other than a one-line alpha measurement.

Attached images:
- Image 1: `yoru-canonical.png`, the game's mascot, as a style reference.
- Image 2: `guide-3x2.png`, layout guide only.

## The one image to make: `friends-1.png`

Use case: stylized-concept
Asset type: sprite sheet for a 2D rhythm game, to be cut into sprites
Primary request: three cute festival characters, two dance poses each, on a 3 column by 2 row sheet
Size: match the guide's shape, as large as the tool allows.

Style/medium (must match Image 1):
Premium 2D mobile-game mascot illustration. Bold, clean, even-weight dark plum-black outline (#1a1014). Smooth cel shading with soft gradients, one soft shadow tone and one highlight tone per material. Glossy highlights on the eyes, nose, drum skin and sticks. Subtle warm rim light. Rich saturated festival colours: chestnut fur, indigo coat, vermilion red, cream, leaf green, gold. Crisp clean edges. Polished, appealing, toy-like and huggable. Not flat clip-art, not pixel art, not photoreal, not a 3D render.

Slots, left to right, top row first:
Column 1, DARUMA: a round red daruma doll come to life. Egg-round body with no neck, a cream face window with big friendly dark eyes, bold dark eyebrows, rosy cheeks and a small smile, gold swirl patterns painted on the red body, two tiny red arms, two tiny dark red feet. It holds a small open gold paper fan in the paw on the viewer's right.
Column 2, FOX: a small orange fox cub. Cream muzzle, chest and tail tip, dark brown ear tips and paws, big amber eyes, rosy cheeks, a twisted red-and-white rope collar with one gold bell, big fluffy tail. No clothes.
Column 3, LUCKY CAT: a plump white lucky cat. One orange patch and one black patch on the head, pink inner ears, big dark eyes, rosy cheeks, red collar with a gold bell, short tail.

1. (top, column 1) DARUMA, dance beat A: leaning toward the viewer's left, fan raised high, the foot on the viewer's right lifted, happy open smile.
2. (top, column 2) FOX, dance beat A: leaning toward the viewer's left, both front paws raised, the foot on the viewer's right lifted, tail swung to the right, happy open smile.
3. (top, column 3) LUCKY CAT, dance beat A: leaning toward the viewer's left, the paw on the viewer's left raised high in a beckoning wave, the foot on the viewer's right lifted, happy open smile.
4. (bottom, column 1) DARUMA, dance beat B: leaning toward the viewer's right, fan swung down to the side, the foot on the viewer's left lifted, eyes closed as happy curves.
5. (bottom, column 2) FOX, dance beat B: leaning toward the viewer's right, both front paws raised, the foot on the viewer's left lifted, tail swung to the left, eyes closed as happy curves.
6. (bottom, column 3) LUCKY CAT, dance beat B: leaning toward the viewer's right, the paw on the viewer's right raised high, the foot on the viewer's left lifted, eyes closed as happy curves.

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
4. Copy the chosen file into the current working directory as exactly `friends-1.png`.
5. Final message: pixel size, the measured share of transparent pixels, attempts used, and an honest per-slot pass/fail with a one-line note on any flaw you could not fix. Do not embed images in the final message.
