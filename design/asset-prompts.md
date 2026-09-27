# Visual assets

Generated with the built-in Image Gen tool, using the supplied screenshot as the visual reference. No API key or fallback CLI was used.

## Complete game concept → `concept.png`

Create a polished complete web rhythm game UI concept, 1536×1024 landscape. Preserve the reference’s playful Japanese festival cartoon look, purple plum patterned header, charcoal single horizontal note highway and colorful lantern festival below. The game is called TAIKO NIGHTS. Show smiling aqua mascot, Janice STFU / Drake, score, soul gauge, red and blue smiling notes, warm red night market stalls, difficulty controls Easy / Medium / Hard, coral Play button, volume, and keyboard instructions. All interactive text and controls are intended as native app UI. No marketing hero or card grid.

## Festival stage → `../public/assets/festival.png`

Production illustration asset extraction from the game concept. Recreate only the full-width Japanese night festival illustration: warm red/orange stalls, central takoyaki chef, red/white counters, goldfish scooping, shaved ice, cherry blossoms, indigo sky, moon, torii, multicolor lanterns, and cheerful dancing yokai. Short panoramic composition, orange paved stage, natural Japanese stall signage, no UI or HUD.

## Transparent sprite atlas → `../public/assets/sprites.png`

Square two-by-two atlas on genuine transparent background. Equal cells containing a circular vermilion Don note, identical cyan Ka note, cheerful aqua barrel-drum mascot, and traditional red-brown playable drum. Cream rims, thick black outlines, smiling faces, crisp Japanese arcade cartoon style. Keep sprites fully inside their cells without labels or external shadows.

## Cloud textile → `../public/assets/pattern.png`

Match only the reference’s ornamental purple background. Wide flat repeating textile with deep burgundy plum base, magenta interlocking diamonds, muted mauve curling cloud outlines and small pale four-petal motifs. No gradients, lighting, perspective, characters, drums, text, UI, or frame.

## Code design system

- Dark plum `#170d1a`; panel `#231827`; coral `#ff5958`; blue `#65c2de`; muted text `#a697ae`; gold `#f4c861`.
- Nunito Sans with Arial/sans-serif fallback, weights 500–1000.
- Wide game bands, 15 px game corner radius, 13 px primary buttons, 5 px keycaps.
- Raster artwork for scenery/sprites; Lucide for utility icons; code-native gauges, canvas targets, beat guides, and roll geometry.
- App shell → game board → controls → progress strip → keyboard guide → footer. Song picker, settings, instructions, and results are modal states.
