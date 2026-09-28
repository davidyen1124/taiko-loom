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
picture of Yoru must match [`yoru-canonical.webp`](yoru-canonical.webp):

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

## How the pictures were made

With the Codex CLI: its `imagegen` skill does the painting, and the method is the one
its `hatch-pet` skill uses for animated pets, adapted to a game.

1. **One canonical picture first.** `yoru-canonical.webp` was generated from a written
   description. Every later picture of Yoru is generated with it attached, as the
   only authority on what Yoru looks like.
2. **Poses are generated together, on sheets.** A sheet holds six poses on a 3 by 2
   grid, with a layout guide attached so the poses are spaced evenly. Generating
   poses side by side is what keeps the character the same size and style from pose
   to pose. Each sheet of Yoru opens with the canonical pose again, which is how the
   sheets are matched to one another.
3. **Generated pixels are never redrawn.** Each pose is separated from the
   transparent background, measured, given its anchor (the point between the feet)
   and packed into one atlas per subject, with a list of where each sprite sits.
4. **Every result is checked by eye,** with all poses on a common anchor, then in
   the game.

The prompts, the generated sheets and the tools that cut them are not kept in the
repository, since the game does not need them to be built or run. They are in its
history: `git show 30f909d:tools/art/cut.py`, and `git checkout 30f909d -- tools` brings
the whole folder back.

Two things learned the hard way:

- **Measure transparency, do not look for it.** Generated sheets have a real alpha
  channel but keep leftover colour underneath the transparent pixels. Some viewers
  show that colour, and the sheet looks as if it had a murky background. It does not.
- **A picture that holds its subject in one half is easier to lay out.** The first
  title picture had its drum under the logo. The prompt now says which half of the
  picture must stay empty.

## What is where

| In the game | Atlas or picture |
| --- | --- |
| Yoru: idle, blink, don and ka with either hand | `sprites/yoru` |
| Yoru: dance, jump, oops, puff | `sprites/yoru` |
| Yoru: cheer, sad, wave | `sprites/yoru` |
| Daruma, fox, lucky cat: two dance poses each | `sprites/friends` |
| Lantern, rice dumplings: two dance poses each | `sprites/friends` |
| Don, ka, drumroll and balloon notes; the balloon | `sprites/notes` |
| Difficulty emblems and crowns | `sprites/hud` |
| The drum in the player's panel | `drum.webp` |
| Title screen | `title.webp` |
| Festival behind the dancers, and on the results screen | `festival.webp` |
| Behind the menus | `menu.webp` |

Atlases and pictures are in `public/art`.

## Rules

- **Original work only.** No character, sprite, logo, sound or chart from any
  existing game, and nothing drawn to resemble one. Notes have a crest, never a face.
- **No writing in a picture.** Stall signs, score stamps and every other word are
  set in code, so they stay sharp and can be translated.
- **The drum is painted from straight above,** and drawn as a true circle. Its skin
  is 69% of its width, measured on the painting (`SKIN` in `src/game/art/hud.js`), so
  the halves that light up when it is played sit exactly on the skin and the rim.
- **The festival keeps its layout.** Sign boards, lanterns, moon and plaza are
  measured on the picture (`src/game/art/scenery.js`). A new festival picture must
  be a repaint of the old one, or those measurements must be taken again.
- **Everything has a stand-in.** If a picture fails to load, the figure drawn in
  code is used. The game never waits on a picture.
