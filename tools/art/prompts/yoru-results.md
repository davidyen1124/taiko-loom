Use the $imagegen skill (built-in image_gen tool) and follow the row-strip method of the $hatch-pet skill (read ~/.codex/skills/hatch-pet/SKILL.md): every pose is grounded on the attached canonical base, a layout guide gives the slots, and the result must be clean enough to cut into sprites. This is for a game, not a Codex pet package: do not prepare a pet run folder, do not run the hatch-pet scripts, do not package anything, and do not write any code.

Attached images:
- Image 1: `yoru-canonical.png`, the canonical character reference (identity authority).
- Image 2: `guide-3x2.png`, layout guide only.

## The one image to make: `yoru-results.png`

Use case: stylized-concept
Asset type: pose sheet for a 2D game character, to be cut into sprites
Primary request: six poses of the character for the results screen of a rhythm game, on a 3 column by 2 row sheet
Size: landscape or square to match the guide's shape, as large as the tool allows.

Character identity (every line is mandatory, and must match Image 1):
Yoru is the original mascot of the browser rhythm game Taiko Nights: a chubby, cheerful festival tanuki (Japanese raccoon dog) cub who drums on a small drum strapped to its round belly.
- Proportions: big round head, about half of the total height; round body; short stubby arms and legs; small oval feet.
- Fur: warm chestnut brown; darker brown eye-mask patches around large sparkling dark eyes; cream muzzle and cream inner ears; small black nose; rosy cheeks; round ears.
- Exactly ONE fresh green leaf on top of the head.
- Twisted red-and-white rope headband (hachimaki) around the forehead, tied in a small white bow with a red knot on the viewer's RIGHT side of the head.
- Open-front indigo blue happi festival coat, short sleeves, with ONE white four-point star on EACH side of the chest.
- Belly drum: a round cream drum skin on the tummy with a red swirl crest in its centre and a thin dark rim.
- Exactly TWO plain wooden drumsticks, one in each paw.
- Fluffy brown tail with a darker brown tip, showing at the viewer's right.
- No other clothing, accessories, weapons or props.

Style/medium (must match Image 1):
Premium 2D mobile-game mascot illustration. Bold, clean, even-weight dark plum-black outline (#1a1014). Smooth cel shading with soft gradients, one soft shadow tone and one highlight tone per material. Glossy highlights on the eyes, nose, drum skin and sticks. Subtle warm rim light. Rich saturated festival colours: chestnut fur, indigo coat, vermilion red, cream, leaf green, gold. Crisp clean edges. Polished, appealing, toy-like and huggable. Not flat clip-art, not pixel art, not photoreal, not a 3D render.

Slots, left to right, top row first:
1. IDLE: exactly the pose of Image 1. Standing facing the viewer, feet planted, both sticks raised and ready at shoulder height, open smile, eyes open.
2. CHEER A: victory. Both sticks raised high above the head in a wide V, standing on tiptoes, eyes closed as happy curves, huge open grin.
3. CHEER B: victory, second beat. The stick on the viewer's left raised high, the other paw pulled in to the chest as a fist pump with its stick, one eye winking, big grin.
4. SAD A: disappointed. Shoulders slumped, head lowered, ears drooping, both sticks hanging down at the sides, large teary eyes looking down, small frown.
5. SAD B: the same slump, eyes shut, one tear on each cheek touching the face, stick tips resting on the ground.
6. WAVE: a friendly hello. The paw on the viewer's left raised and waving while holding its stick, the other stick resting on the shoulder, eyes open, warm smile.

## Rules for every pose sheet (from the hatch-pet skill, adapted to a game)
- Image 1 is the canonical character. It is the ONLY authority for identity: same face, proportions, markings, palette, materials, outline weight, shading style and props in every slot.
- Image 2 is a LAYOUT GUIDE ONLY: it shows how many slots there are, their spacing, the safe area (blue box) and the ground line (orange). Do NOT draw any of its boxes, lines or grey background.
- One complete, separate full-body pose per slot, centred in its slot, inside the safe area, feet on the slot's ground line unless the pose is airborne. Nothing crosses into a neighbouring slot. Nothing is cropped.
- Every pose is drawn at the SAME scale: the head is the same size in every slot as in slot 1.
- Background: genuinely TRANSPARENT (real alpha). No floor, no ground shadow, no contact shadow, no drop shadow, no glow, no halo.
- No motion lines, speed lines, impact bursts, sparkles, stars, music notes, dust or any other detached effect. A tear or sweat drop is allowed only when it touches the character.
- No text, letters, numbers, labels, borders, frames or watermark.
- The character stays asymmetric exactly as in Image 1: bow on the viewer's RIGHT side of the head, tail at the viewer's RIGHT. Never mirror the character.

## Process
1. Generate the sheet with both images attached.
2. Inspect it: count the slots, check every pose against its description, and check every identity line in every slot. Check nothing touches a slot edge and nothing is detached.
3. If anything is wrong, regenerate with ONE targeted correction, keeping both images attached (up to 3 attempts in total). Prefer the attempt with the most consistent character.
4. Copy the chosen file into the current working directory as exactly `yoru-results.png`.
5. Final message: pixel size, real alpha or not, attempts used, and an honest per-slot pass/fail with a one-line note on any flaw you could not fix. Do not embed images in the final message.
