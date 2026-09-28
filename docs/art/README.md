# Artwork

Everything in Taiko Nights is original. Notes, the mascot, the dancers, the HUD and
all effects are drawn in code (`src/game/art/`). Two background plates are painted
bitmaps in `public/art/`.

## Yoru, the mascot

`yoru-model-sheet.png` is the reference for the character. It is rendered by the
game itself (`/?gallery=sheet` in development), so the sheet and the in-game sprite
can never drift apart. Any new artwork that shows Yoru must match it:

- round brown tanuki with dark brown eye patches, cream muzzle, pink cheeks
- one green leaf on the head
- twisted red and white headband, white bow on the character's left with a red centre
- open indigo happi coat with one white four-point star on each side
- cream belly drum skin with a red swirl crest
- two plain wooden drumsticks, brown tail with a darker tip
- big head, short limbs, no other clothing or accessories

## Painted plates

The prompts below are recorded with the mascot's current name, Yoru (夜, night).

Both were generated with the Codex `imagegen` skill, with the model sheet attached as
the style and character reference, then checked by eye against the list above.

| File | Used for | Source size |
| --- | --- | --- |
| `public/art/festival.webp` | lower half of the play screen and results | 2172 x 724 |
| `public/art/title.webp` | title screen | 1672 x 941 |

Stall sign lettering and lantern glow are added in code on top of the festival plate
(`src/game/art/scenery.js`), so the plate itself carries no text. If a plate fails to
load, the code-drawn festival in the same file is used instead.

### Prompt: festival plate

```text
Use case: stylized-concept. Create festival-backdrop.png, a 3:1 landscape bitmap for the original game Taiko Nights.
Input image: the Yoru model sheet is a STYLE REFERENCE ONLY. Match its thick uniform #1a1014 outlines, rounded shapes and perfectly flat solid-color cartoon fills. Do not reproduce its characters or lettering.
Draw an EMPTY Japanese summer-night festival as a straight-on, flat stage set. Upper 25%: solid indigo night sky, sparse stars, full moon at upper right, dark distant hills and pine silhouettes. Middle 50%: exactly FOUR simple food stalls with striped awnings, two on either side of a wooden yagura at the exact horizontal centre. Each stall has a completely blank colored signboard and a few simple food shapes. The yagura has red-and-white curtains and a large taiko drum on its upper platform. Cream and gold paper lanterns hang in strings from the tower toward both upper corners.
Lower 25%: completely empty warm orange plaza, one solid flat #e0843e fill with only a few simple paving seams. Nothing stands in this quarter. Keep all standalone objects entirely inside the frame horizontally, with small side margins.
Palette: vermilion #f2452b, cyan #4fc0d8, gold #ffd34f, cream #fff6e0, indigo #130d33, plum #35205f, orange #e0843e, brown #b36f3c.
Targeted style correction: make this as simple and graphic as the reference sheet. Use thick dark outlines and flat color regions throughout; at most one hard-edged shade and one hard-edged highlight per object. No gradients, glows, grain, textures, brushwork, realistic lighting or 3D. Convey warm lantern light using solid cream fills. Cheerful, rounded and friendly.
Absolutely NO people, animals, characters, mascots, faces or anthropomorphic objects. NO text, letters, numbers, kana, kanji, logos or watermark anywhere. All signboards must be blank. No existing game, anime or brand imagery. Output only the finished backdrop.

```

### Prompt: title plate

```text
Use case: illustration-story. Generate title-art.png, a single 16:9 landscape title-screen illustration for the original game Taiko Nights.
Input image: Yoru's original character model sheet, the ONLY authoritative character and style reference. Reproduce the HAPPY pose in the middle of its top row extremely faithfully: same face, mouth, big head, squat torso, short capsule arms, tiny oval feet, coat and tail. Do not reproduce the sheet's words or other characters.
Scene: Yoru joyfully plays a large separate taiko drum on a wooden stand, mid-swing, at a summer night festival. Yoru and the drum occupy the lower-right two thirds; the drum stands immediately to Yoru's viewer-left. One short arm holds a stick near the drumhead, the other short arm holds its stick raised. Full Yoru, sticks, tail, drum and stand in frame. Upper-left third is calm open indigo sky reserved for a future logo. Lantern strings across the top. Three simple fireworks at upper middle/right. Simple distant blank festival stalls and orange ground.
Critical corrections: keep the arms as SHORT as in the reference HAPPY pose, approximately one quarter of the head width from shoulder to paw. Match the happy mouth exactly: dark burgundy open smile, pink ring along its bottom, with a small CREAM OVAL INSIDE that pink ring. The cream oval at the bottom of the mouth must be clearly visible. Do not substitute a conventional pink tongue. Follow the reference's facial proportions and clean flat rendering.
All mandatory invariants: round brown tanuki, dark brown eye-mask patches, cream muzzle, small black nose, open smiling mouth, pink cheeks, ONE green leaf atop the head; twisted red-and-white striped headband with WHITE bow on character's LEFT (viewer's RIGHT) and RED round knot centre; open-front indigo happi coat with ONE white FOUR-POINT star on EACH side; cream belly drum skin with the reference's RED SWIRL crest; exactly TWO plain wooden drumsticks, one per paw; brown tail with darker tip; big head, short limbs. No extra clothing or accessories. Keep both stars, belly crest and tail clearly visible.
House style: exactly the model sheet's flat vector cartoon, very thick uniform dark #1a1014 outlines, rounded shapes, flat fills with at most one simple hard-edged shade and one highlight. No painted shading, gradients, texture, airbrush glow or 3D. Palette: vermilion #f2452b, cyan #4fc0d8, gold #ffd34f, cream #fff6e0, indigo #130d33, plum #35205f, orange #e0843e, fur brown #b36f3c. Cheerful warm lantern colors and cool night sky.
NO text, letters, numbers, kana, kanji, logos or watermark. No other people, animals, characters or faces. No existing game, anime or brand imagery.

```
