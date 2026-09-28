# Taiko Nights: notes for contributors and coding agents

## Working on it

Run the servers yourself and look at the result in a browser. Do not hand the user
start-up instructions when you can run it.

- `npm run api` starts the analysis backend on port 8000 (FastAPI, managed by uv).
- `npm run dev -- --port 4173` starts the game. `/api` is proxied to the backend.
- `/?gallery` shows every sprite. `/?gallery=sheet` renders the character model sheet.
- In development `await __auditText()` lists any text that is cut off on the screen
  you are looking at. Run it on every screen you touch, at more than one window shape.
- In development `window.__taiko` exposes `{ renderer, game, audio }` while a song is
  playing, so a run can be stepped frame by frame. `docs/qa.md` shows how.

## Rules that must hold

1. **Never commit audio.** `.gitignore` excludes audio extensions and `backend/data/`.
   Tests synthesise their own audio. Check `git status` before every commit.
2. **All artwork is original.** Do not add or imitate characters, sprites, logos,
   sounds or charts from any existing game. New art that shows Yoru must match
   `docs/art/yoru-model-sheet.png`; the checklist is in `docs/art/README.md`.
3. **The stage fills the window. Never letterbox it.** The design grid is 1280 x 720.
   A wider window adds columns, a taller one adds rows (`stageFor` and `setStage` in
   `src/game/layout.js`). Read sizes from `STAGE` at draw time, not at import time. In
   CSS, `--ox` and `--oy` say where the design grid begins and `--foot` is the curtain
   under the festival.
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
7. **Both analysers share one chart format** (`version: 2`). If you change it, change
   `backend/src/taiko_backend/charting.py`, `src/game/analyze.js` and
   `src/game/demoSong.js` together.

## Before you commit

```bash
npm test && npm run test:backend && npm run build && npm run test:sites
```

Use Conventional Commits (`feat:`, `fix:`, `docs:`), as the history does.

## Hosting hand-off

Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs` and
`tests/sites-worker.test.mjs` intact. `npm run build` must leave
`dist/client/index.html`, `dist/server/index.js` and `dist/.openai/hosting.json`.
A static host serves the game with the on-device analyser; the backend is separate.

## Design decisions on record

- Notes are drum heads seen from above with a painted swirl. They have no faces.
- The mascot is Yoru, a tanuki who drums on a belly drum. Five festival friends
  (daruma, fox, lucky cat, paper lantern, rice cakes) join as the soul gauge fills.
- Score stamps are this game's own: 灯 花 月 祭 天.
- Painted plates carry no text. Stall lettering and lantern glow are drawn in code.
