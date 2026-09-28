Use the $imagegen skill (built-in image_gen tool) and follow the base-image step of the $hatch-pet skill (read ~/.codex/skills/hatch-pet/SKILL.md: one canonical full-body reference that every later pose will be grounded on). This is for a game, not a Codex pet package, so do not prepare a pet run folder and do not package anything. Do not write any code.

## The one image to make: `yoru-base.png`

Use case: stylized-concept
Asset type: canonical character reference sprite for a 2D game; every animation pose will be generated from it later
Primary request: one clean full-body picture of the character described below, square image, as large as the tool allows

Character identity (every line is mandatory):
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

Pose: standing and facing the viewer straight on, feet planted, both drumsticks raised and ready at shoulder height, confident friendly open smile.

Style/medium:
Premium 2D mobile-game mascot illustration. Bold, clean, even-weight dark plum-black outline (#1a1014). Smooth cel shading with soft gradients, one soft shadow tone and one highlight tone per material. Glossy highlights on the eyes, nose, drum skin and sticks. Subtle warm rim light. Rich saturated festival colours: chestnut fur, indigo coat, vermilion red, cream, leaf green, gold. Crisp clean edges. Polished, appealing, toy-like and huggable. Not flat clip-art, not pixel art, not photoreal, not a 3D render.

Background: genuinely TRANSPARENT (real alpha channel). No ground shadow, no contact shadow, no glow, no halo, no scenery, no floor, no text, no border, no watermark.
Composition: the whole character, including ears, leaf, both sticks and the tail, is inside the frame with a clear margin on every side. Centred.
Constraints: an ORIGINAL character. Do not imitate or reference any existing game, anime, film or brand mascot.

## Process
1. Generate the image. Inspect it against every identity line above.
2. If any identity line is wrong, or the background is not transparent, or anything is cropped, regenerate with one targeted correction (up to 3 attempts in total).
3. If the tool cannot return real transparency, generate on a perfectly flat pure magenta #FF00FF background instead and say so.
4. Copy the chosen file into the current working directory as exactly `yoru-base.png`.
5. Final message: the exact final prompt, pixel size, whether the background is real alpha or magenta, attempts used, and an honest pass/fail for each identity line. Do not embed images in the final message.
