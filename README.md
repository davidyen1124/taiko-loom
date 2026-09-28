# Taiko Nights

A festival taiko rhythm game for the browser. Upload any song, the backend finds its
beat and writes Easy, Medium and Hard charts, and you play it with four keys.

![Go-Go Time during a song](docs/screens/play-gogo.webp)

| Drumroll | Balloon |
| --- | --- |
| ![Drumroll with its hit counter](docs/screens/play-drumroll.webp) | ![Balloon note with hits remaining](docs/screens/play-balloon.webp) |

Everything here is original: the code, the mascot (Loomi the tanuki), the festival
friends, the notes and the built-in song. See [docs/art](docs/art/README.md).

The game fills the window at any shape, with no bars. A wider window makes the lane
longer; a taller one adds sky above and a festival curtain below.

![The same song in a 4:3 window](docs/screens/play-4x3.webp)

## Run it

You need Node 20+, [uv](https://github.com/astral-sh/uv) and FFmpeg on your PATH.

```bash
npm install
```

```bash
npm run api
```

```bash
npm run dev -- --port 4173
```

Open http://localhost:4173. The first `npm run api` installs the Python dependencies.

The game also runs without the backend. The built-in song "Lantern Parade" is
synthesised in the browser, and uploads fall back to a lighter analyser that runs on
your device.

## Play

| Key | Drum |
| --- | --- |
| `F` `J` | ドン Don, the face (red notes) |
| `D` `K` | カッ Ka, the rim (blue notes) |
| `F`+`J` or `D`+`K` | Big notes pay double when both sticks land together |
| any drum key, fast | Drumrolls (yellow) |
| `F` `J`, fast | Balloons: hit the face the number of times shown |
| `Esc` | Pause |

Menus are played like the drum: `D` `K` move, `F` `J` confirm, `Esc` goes back. Arrow
keys and Enter work too. On a touch screen the whole display is the drum: the outer
fifths are the rim, the middle is the face.

Settings hold music and drum volume, note speed, a timing offset with a tap-along
measuring tool, auto play and the touch guide. Settings and personal records are kept
in this browser's local storage.

## Your music

Choose **曲をついか / Add your music** on the song shelf and pick a file (MP3, WAV, FLAC,
OGG or M4A, up to 100 MB and 15 minutes). The backend:

1. converts the upload to FLAC, the file the browser will play, so chart times and
   playback share one sample-accurate timeline
2. separates percussive sound and measures attacks overall, in the kick band and in
   the high band
3. tracks the beat, fits a steady grid to it, and checks that grid against tempos the
   tracker commonly confuses (half, double, 3:2, 2:3)
4. finds the downbeat from bass attacks and chord changes
5. places notes on the grid: Easy on beats, Medium adds half-beats, Hard adds
   quarter-beats in short runs
6. assigns Don to bass-heavy attacks and Ka to bright ones
7. turns the loudest sections into Go-Go Time, leads into them with a drumroll and
   follows the first two with a balloon

Songs live in `backend/data/`, which is ignored by git.

**Audio is never committed.** `.gitignore` excludes every common audio extension and
the backend's data folder. Tests synthesise their own audio.

### Accuracy

Measured on synthetic drum loops of known tempo (`npm run test:backend`):

| Check | Result |
| --- | --- |
| Tempo at 96, 110, 120, 138, 150 and 165 BPM | within 0.05 BPM |
| Beat placement | within 8 ms of the real attack |
| Shuffle rhythm | detected, keeps its own tempo |
| 70 BPM song | charted at 140 so the grid stays playable |

Real music is harder than drum loops. Songs with a tempo that drifts fall back to the
tracked beats instead of a fixed grid. Songs with no clear pulse are rejected with a
message rather than given invented notes. If a chart feels early or late on your
speakers, use the timing offset in Settings.

### Command line

```bash
npm run analyze -- path/to/song.mp3 --output chart.json
```

### API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Status and chart version |
| `GET` | `/api/songs` | The library |
| `POST` | `/api/songs` | Upload `file` (and optional `title`, `artist`). Returns a job. |
| `GET` | `/api/jobs/{id}` | Job status, stage and progress |
| `GET` | `/api/songs/{id}` | Charts, beats, bar lines, Go-Go sections |
| `GET` | `/api/songs/{id}/audio` | The playable FLAC, with range requests |
| `PATCH` | `/api/songs/{id}` | Rename |
| `DELETE` | `/api/songs/{id}` | Remove the song and its audio |

Set `VITE_API_BASE_URL` to use a backend on another origin, `TAIKO_DATA_DIR` to move
the library, and `TAIKO_CORS_ORIGINS` to restrict who may call the API.

## Rules

| | Easy かんたん | Medium ふつう | Hard むずかしい |
| --- | --- | --- | --- |
| 良 Good window | ±42 ms | ±42 ms | ±25 ms |
| 可 OK window | ±108 ms | ±108 ms | ±75 ms |
| Clear line on the soul gauge | 60% | 70% | 70% |
| A miss costs | half a Good | one Good | 1.25 Goods |

- Scoring is fixed per note: every 良 pays the same and 可 pays half. A flawless run
  with every big note struck two-handed totals 1,000,000 before drumrolls.
- Drumrolls pay 100 a hit (200 for big ones). Balloons pay 300 a hit and 5,000 on the pop.
- Hitting the wrong face of the drum is ignored, not punished.
- Crowns: silver for a clear, gold for a full combo, rainbow for all 良.
- Score stamps: 灯 500k, 花 700k, 月 850k, 祭 950k, 天 1,000,000.

These follow the conventions of the genre, researched in
[docs/references.md](docs/references.md). The score stamps, the artwork and the chart
generator are this game's own.

## Test

```bash
npm test
```

```bash
npm run test:backend
```

```bash
npm run build && npm run test:sites
```

29 engine, analyser and layout tests, 29 backend tests, 4 hosting tests. What was checked by
hand in the browser is recorded in [docs/qa.md](docs/qa.md).

## Layout

| Path | What lives there |
| --- | --- |
| `src/game/engine.js` | Rules: judging, scoring, gauge, drumrolls, balloons, auto play |
| `src/game/rules.js` | Every number the rules use |
| `src/game/renderer.js` | The play screen |
| `src/game/layout.js` | Where everything sits, and how the stage fills a window |
| `src/game/art/` | All drawing code: notes, mascot, dancers, HUD, effects, scenery |
| `src/game/audio.js` | Song clock and synthesised drum sounds |
| `src/game/demoSong.js` | The built-in song and its charts, as data |
| `src/game/analyze.js` | The on-device fallback analyser |
| `src/screens/`, `src/ui/` | Title, song select, play, results, dialogs |
| `backend/src/taiko_backend/` | `analysis.py` listens, `charting.py` writes charts, `main.py` serves |
| `public/art/` | Two painted background plates |
| `src/dev/` | Development tools: sprite gallery and the cut-off text audit |
| `docs/` | Art notes, genre references, QA record, screenshots |

`worker/`, `.openai/` and `scripts/prepare-sites-build.mjs` package the static build
for hosting. A static host serves the game and the on-device analyser; the backend
needs its own host.
