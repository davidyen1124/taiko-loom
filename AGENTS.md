# Taiko Nights: notes for contributors and coding agents

## Working on it

The game is a static site. There is no server: songs are analysed in the player's
browser. Run it yourself and look at the result in a browser. Do not hand the user
start-up instructions when you can run it.

- `npm run dev -- --port 4173` starts the game.
- `npm run build && npm run preview:pages` serves the build as GitHub Pages will, at
  http://localhost:4174/taiko-nights/.
- `/?gallery` shows every sprite in motion. `/?gallery=sheet` draws every painted
  sprite with its name: the model sheet kept in `docs/art`.
- In development `await __auditText()` lists any text that is cut off on the screen
  you are looking at. Run it on every screen you touch, at more than one window shape.
- In development `window.__taiko` exposes `{ renderer, game, audio }` while a song is
  playing, so a run can be stepped frame by frame. `docs/qa.md` shows how.

## Rules that must hold

1. **Never commit audio.** `.gitignore` excludes audio extensions. Tests synthesise
   their own audio. Check `git status` before every commit. The
   Pages workflow refuses to publish a build that contains an audio file.
2. **All artwork and music are original.** Do not add or imitate characters, sprites,
   logos, sounds, songs or charts from any existing game or recording. A new built-in
   song is a new composition, written as a score in `src/game/songs/`. A new picture
   is generated as `docs/art/README.md` describes: from the canonical picture, with
   poses side by side on one sheet. Generated pixels are never redrawn by hand or in
   code, and pictures carry no writing. New art that shows Yoru must match
   `docs/art/yoru-canonical.webp`; the checklist is in `docs/art/README.md`.
3. **The stage fills the window. Never letterbox it.** The design grid is 1280 x 720.
   A wider window adds columns, a taller one adds rows (`stageFor` and `setStage` in
   `src/game/layout.js`). Read sizes from `STAGE` at draw time, not at import time. In
   CSS, `--ox` and `--oy` say where the design grid begins and `--foot` is the curtain
   under the festival. On a device played with fingers the play screen may be as
   short as 560 rows, not 720, so that a phone draws the lane larger. The sky band is
   then drawn smaller: `STAGE.band` is its size and `STAGE.rise` how far the lane and
   the festival move up. The sky band is drawn in its own units (`inBand` in the
   renderer); what is anchored to the lane but drawn in the band divides by
   `STAGE.band`. A desktop window is never affected.
   **The game is played sideways.** A phone or tablet held upright is asked to turn;
   there is no upright layout to keep working.
4. **Nothing may be cut off.** Outlined text that is also clipped needs padding equal
   to its outline (see the note at the top of `src/styles.css`). Canvas text that can
   be long uses `minSize` in `label()`, which shrinks and then shortens it; it is never
   squeezed. Sprites need room for whatever sticks out of the figure. Pictures are
   never zoomed in a way that crops their subject.
5. **Rules stay out of the renderer.** `src/game/engine.js` takes the song time as an
   argument and has no timers, audio or drawing, which is what makes it testable.
   Numbers belong in `src/game/rules.js`.
6. **Menus read live state.** Key handlers read from a ref updated during render, so
   two keys pressed in quick succession never act on a stale screen. Hover selection
   follows real pointer movement only.
7. **One analyser, one chart format.** `src/game/features.js` listens and
   `src/game/charting.js` writes charts in the format the built-in songs use
   (`version: 2`, `src/game/songs/score.js`). A change to how tempo is chosen must
   hold from a wrong first guess as well as a right one: the tests start the analyser
   from a tempo's look-alikes on purpose.
8. **There is no server, and a song never leaves the device.** Nothing may send a
   player's audio, or anything made from it, anywhere. The game is static files: no
   address may start with `/`; use `import.meta.env.BASE_URL` for files in `public/`.
9. **Every picture has a stand-in.** Painted sprites and plates load after the first
   frame and may fail to load. Draw through `drawSprite`, which says whether it
   drew, and keep the code-drawn figure behind it.
10. **On a touch screen the whole display is the drum.** Four equal zones from left
   to right: ka, don, don, ka (`padForPoint` in `src/game/input.js`). Every touch
   plays something, at any height; only buttons are left alone. The zones are
   coloured for fingers only: when the device's main pointer is a finger, or once the
   screen has been touched, and never for a mouse. **They are only light.** Their
   colour stays under the lane and never over the notes or the HUD, and there is no
   picture of a drum to tap. The words in them sit above the strip a phone keeps for
   its own gestures (`env(safe-area-inset-bottom)`, read by `src/ui/safeArea.js`).
   The HUD keeps clear of a notch at either end (`STAGE.left`, `STAGE.right`).
11. **Built-in songs are synthesised in plain JavaScript,** not with the Web Audio
   graph, which took 10 to 28 seconds a song in Chrome and Safari. `npm test` renders
   every song and checks its level, its tuning and that it is in time with its chart.

12. **Every frame is on time, on a phone too.** The play screen draws one canvas and
   almost no DOM. Pictures that are drawn every frame are scaled once and kept
   (`sprite` in `src/game/art/draw.js`). How many pixels are drawn is decided in
   `src/game/pacer.js`, nowhere else: at most two device pixels for each CSS pixel on
   a device played with fingers, three with a mouse, and fewer when frames keep
   arriving late. Menu backdrops are painted 30 times a second on a phone. Read song
   time from `audio.time()`, which is steadied, never from `context.currentTime`.
   Check a change with `?fps` in the address.

## Before you commit

```bash
npm test && npm run build
```

Use Conventional Commits (`feat:`, `fix:`, `docs:`), as the history does.

## What belongs in the repository

The game, its tests and its documents. Nothing that the game does not need to be
built, tested or understood: no second language, no packaging for a host that is not
used, no scratch files. `npm run build` writes the site to `dist/`, and
`.github/workflows/pages.yml` publishes that folder to GitHub Pages.

## Design decisions on record

- Notes are drum heads seen from above with a three-armed swirl crest. They have no
  faces.
- The mascot is Yoru, a tanuki who drums on a belly drum. Five festival friends
  (daruma, fox, lucky cat, paper lantern, rice dumplings) join as the soul gauge
  fills. All are painted in one style: bold dark outline, soft cel shading.
- Yoru shows what you played: the hand that struck, and skin or rim.
- Score stamps are this game's own: 灯 花 月 祭 天.
- Painted plates carry no text. Stall lettering and lantern glow are drawn in code.
