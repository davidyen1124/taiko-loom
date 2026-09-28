# Artwork

Everything in Taiko Nights is original. The characters, notes, drum, emblems, crowns
and backgrounds are painted pictures, made for this game with the Codex CLI. Effects
that move with the music (fire, fireworks, the soul gauge, judgement words) are
drawn in code.

![Every painted sprite, as the game draws them](model-sheet.webp)

The sheet above is drawn by the game itself (`/?gallery=sheet` in development), so
it always shows what players see.

## Yoru, the mascot

Yoru is a festival tanuki cub who drums on a drum strapped to its belly. Any new
picture of Yoru must match `tools/art/sheets/yoru-canonical.webp`:

- big round head, about half the total height; round body; short limbs; small oval feet
- chestnut fur, darker eye-mask patches, large dark eyes, cream muzzle and inner ears,
  small black nose, rosy cheeks, round ears
- exactly one green leaf on the head
- twisted red and white rope headband, white bow with a red knot on the viewer's right
- open indigo happi coat with one white four-point star on each side
- cream belly drum with a red three-armed swirl crest
- exactly two plain wooden drumsticks
- fluffy brown tail with a darker tip, at the viewer's right
- no other clothing or props

Yoru is not symmetrical (bow and tail are on one side), so a pose is never mirrored
to make its opposite. Left-hand and right-hand hits are separate paintings.

## How the pictures are made

The method is the one Codex's `hatch-pet` skill uses for animated pets, adapted to a
game, with its `imagegen` skill doing the painting:

1. **One canonical picture first.** `yoru-canonical` was generated from a written
   description. Every later picture of Yoru is generated with it attached, as the
   only authority on what Yoru looks like.
2. **Poses are generated together, on sheets.** A sheet holds six poses on a 3 by 2
   grid. A layout guide (slots, safe area, ground line) is attached so the poses are
   spaced evenly. Generating poses side by side is what keeps the character the same
   size and style from pose to pose. Each sheet of Yoru opens with the canonical pose
   again, which is how the sheets are matched to one another.
3. **Generated pixels are never redrawn.** `tools/art/cut.py` separates each pose from
   the transparent background, measures it, finds its anchor (the point between the
   feet) and packs the poses into one atlas per subject.
4. **Every result is checked by eye** on a contact sheet (`tools/art/contact.py`)
   with all poses on a common anchor, then in the game.

```bash
tools/art/generate.sh yoru-play tools/art/sheets/yoru-canonical.webp guide-3x2.png
```

```bash
uv run --with pillow --with numpy --with scipy python tools/art/cut.py tools/art/atlases.json
```

```bash
uv run --with pillow python tools/art/contact.py public/art/sprites/yoru.json contact.png
```

The first command needs the Codex CLI with its `imagegen` and `hatch-pet` skills. It
works in a scratch folder and overwrites nothing. Look at the result, and if it is
right, save it into `tools/art/sheets` as WebP at quality 95 with full-quality transparency.

Two things learned the hard way:

- **Measure transparency, do not look for it.** Generated sheets have a real alpha
  channel but keep leftover colour underneath the transparent pixels. Some viewers
  show that colour, and the sheet looks as if it had a murky background. It does not.
- **A picture that holds its subject in one half is easier to lay out.** The first
  title picture had its drum under the logo. The prompt now says which half of the
  picture must stay empty.

## What is where

| In the game | Atlas or picture | Generated as | Prompt |
| --- | --- | --- | --- |
| Yoru: idle, blink, don and ka with either hand | `sprites/yoru` | `yoru-play` | `prompts/yoru-play.md` |
| Yoru: dance, jump, oops, puff | `sprites/yoru` | `yoru-feel` | `prompts/yoru-feel.md` |
| Yoru: cheer, sad, wave | `sprites/yoru` | `yoru-results` | `prompts/yoru-results.md` |
| Daruma, fox, lucky cat: two dance poses each | `sprites/friends` | `friends-1` | `prompts/friends-1.md` |
| Lantern, rice dumplings: two dance poses each | `sprites/friends` | `friends-2` | `prompts/friends-2.md` |
| Don, ka, drumroll and balloon notes; the balloon | `sprites/notes` | `notes` | `prompts/notes.md` |
| Difficulty emblems and crowns | `sprites/hud` | `icons` | `prompts/icons.md` |
| The drum: in the panel, and under your fingers on a touch screen | `drum.webp` | `drum` | `prompts/drum.md` |
| Title screen | `title.webp` | `title-art` | `prompts/title-art.md` |
| Festival behind the dancers, and on the results screen | `festival.webp` | `festival-backdrop` | `prompts/festival.md` |
| Behind the menus | `menu.webp` | `menu-backdrop` | `prompts/menu.md` |

Atlases and pictures are in `public/art`; sheets and prompts are in `tools/art`.

## Rules

- **Original work only.** No character, sprite, logo, sound or chart from any
  existing game, and nothing drawn to resemble one. Notes have a crest, never a face.
- **No writing in a picture.** Stall signs, score stamps and every other word are
  set in code, so they stay sharp and can be translated.
- **The drum is painted from straight above.** The touch drum tilts it by drawing it
  wider than tall, which keeps the hit areas exact: the skin is 69% of the drum's
  width, measured on the painting (`SKIN` in `src/game/touchDrum.js`).
- **The festival keeps its layout.** Sign boards, lanterns, moon and plaza are
  measured on the picture (`src/game/art/scenery.js`). A new festival picture must
  be a repaint of the old one, or those measurements must be taken again.
- **Everything has a stand-in.** If a picture fails to load, the figure drawn in
  code is used. The game never waits on a picture.
