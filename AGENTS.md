# Taiko Nights: notes for contributors and coding agents

## Working on it

Run the servers yourself and look at the result in a browser. Do not hand the user
start-up instructions when you can run it.

- `npm run api` starts the analysis backend on port 8000 (FastAPI, managed by uv).
- `npm run dev -- --port 4173` starts the game. `/api` is proxied to the backend.
- `npm run build:pages && npm run preview:pages` serves the public site as GitHub
  Pages will, at http://localhost:4174/taiko-nights/. It has no backend.
- `/?gallery` shows every sprite in motion. `/?gallery=sheet` draws every painted
  sprite with its name: the model sheet kept in `docs/art`.
- In development `await __auditText()` lists any text that is cut off on the screen
  you are looking at. Run it on every screen you touch, at more than one window shape.
- In development `window.__taiko` exposes `{ renderer, game, audio }` while a song is
  playing, so a run can be stepped frame by frame. `docs/qa.md` shows how.

## Rules that must hold

1. **Never commit audio.** `.gitignore` excludes audio extensions and `backend/data/`.
   Tests synthesise their own audio. Check `git status` before every commit. The
   Pages workflow refuses to publish a build that contains an audio file.
2. **All artwork and music are original.** Do not add or imitate characters, sprites,
   logos, sounds, songs or charts from any existing game or recording. A new built-in
   song is a new composition, written as a score in `src/game/songs/`. A new picture
   is generated as `docs/art/README.md` describes: from the canonical picture, on a
   sheet, then cut by `tools/art/cut.py`. Generated pixels are never redrawn by hand
   or in code, and pictures carry no writing. New art that shows Yoru must match
   `tools/art/sheets/yoru-canonical.webp`; the checklist is in `docs/art/README.md`.
3. **The stage fills the window. Never letterbox it.** The design grid is 1280 x 720.
   A wider window adds columns, a taller one adds rows (`stageFor` and `setStage` in
   `src/game/layout.js`). Read sizes from `STAGE` at draw time, not at import time. In
   CSS, `--ox` and `--oy` say where the design grid begins and `--foot` is the curtain
   under the festival. One exception: on a phone held sideways, while the touch drum
   is out, the stage sits at the top and leaves a strip free under it (`reserveFor`).
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
7. **Both analysers are the same analyser.** `src/game/features.js` and
   `src/game/charting.js` follow `backend/src/taiko_backend/analysis.py` and
   `charting.py` step for step, and share one chart format (`version: 2`) with
   `src/game/songs/score.js`. Change them together, then compare both on the same
   song.
8. **The game must work with no server.** The public site is static. Anything new has
   to work when `VITE_BACKEND=off`, and no address may start with `/`: use
   `import.meta.env.BASE_URL` for files in `public/`.
9. **Every picture has a stand-in.** Painted sprites and plates load after the first
   frame and may fail to load. Draw through `drawSprite`, which says whether it
   drew, and keep the code-drawn figure behind it.
10. **The touch drum belongs to fingers.** It shows when the device's main pointer
   is a finger, or once the screen has been touched, and never for a mouse. Every
   touch plays something: the skin is don, everything else is ka. Its geometry lives
   in `src/game/touchDrum.js` and is tested; the painted skin is 69% of the drum.
   **The head of the drum never reaches the bottom edge.** A phone keeps a strip
   there for its own gestures (`env(safe-area-inset-bottom)`, read by
   `src/ui/safeArea.js`); the head ends at least 16 px above it. The HUD likewise
   keeps clear of a notch at either end (`STAGE.left`, `STAGE.right`).
11. **Built-in songs are synthesised in plain JavaScript,** not with the Web Audio
   graph, which took 10 to 28 seconds a song in Chrome and Safari. `npm test` renders
   every song and checks its level, its tuning and that it is in time with its chart.

## Before you commit

```bash
npm test && npm run test:backend && npm run build && npm run test:sites
```

Use Conventional Commits (`feat:`, `fix:`, `docs:`), as the history does.

## Hosting hand-off

Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs` and
`tests/sites-worker.test.mjs` intact. `npm run build` must leave
`dist/client/index.html`, `dist/server/index.js` and `dist/.openai/hosting.json`.
A static host serves the whole game, analyser included; the backend is optional.
GitHub Pages is published by `.github/workflows/pages.yml` from `dist/pages`.

## Design decisions on record

- Notes are drum heads seen from above with a three-armed swirl crest. They have no
  faces.
- The mascot is Yoru, a tanuki who drums on a belly drum. Five festival friends
  (daruma, fox, lucky cat, paper lantern, rice dumplings) join as the soul gauge
  fills. All are painted in one style: bold dark outline, soft cel shading.
- Yoru shows what you played: the hand that struck, and skin or rim.
- Score stamps are this game's own: 灯 花 月 祭 天.
- Painted plates carry no text. Stall lettering and lantern glow are drawn in code.
