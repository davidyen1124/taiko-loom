# Taiko Nights

A festival taiko rhythm game for the browser. Add any song, the game finds its beat
and writes Easy, Medium and Hard charts, and you play it with four keys.

**Play it now: https://davidyen1124.github.io/taiko-nights/**

![Go-Go Time during a song](docs/screens/play-gogo.webp)

| Drumroll | Balloon |
| --- | --- |
| ![Drumroll with its hit counter](docs/screens/play-drumroll.webp) | ![Balloon note with hits remaining](docs/screens/play-balloon.webp) |

Everything here is original: the code, the mascot (Yoru the tanuki), the festival
friends, the notes and the three built-in songs. The characters, notes, drum and
backgrounds are painted; how they were made is in [docs/art](docs/art/README.md).

![Every painted sprite in the game](docs/art/model-sheet.webp)

![Song select with the three built-in songs](docs/screens/song-select.webp)

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

The game also runs without the backend, which is how the public site works. The
built-in songs are synthesised in the browser and your own songs are analysed there
too. To run it that way locally, skip `npm run api`.

## Built-in songs

| Song | Tempo | Feel | Easy | Medium | Hard |
| --- | --- | --- | --- | --- | --- |
| Moonlit Koi | 100 | shuffle, for koto | ★1 | ★3 | ★5 |
| Lantern Parade | 132 | straight, for festival flute | ★2 | ★4 | ★6 |
| Raijin Rush | 168 | straight, for shamisen | ★4 | ★6 | ★8 |

All three were written for this game. Each is a score in `src/game/songs/`: the
melody, the bass and the three charts as plain data. A small synthesiser in the same
folder plays the score sample by sample in a worker, which takes under a second. The
repo and the site carry no audio files and nothing is sampled from a recording.

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
keys and Enter work too.

### On a phone or tablet

A taiko appears on screen. Tap its skin for ドン and its rim for カッ; the left and
right halves are your two hands, so two fingers together play a big note. Nothing is
wasted: a tap anywhere off the skin counts as the rim.

Held sideways, the stage moves up to make room and the festival friends dance behind
the drum. Held upright, the stage sits at the top and the drum sits under it. Either
way the whole head of the drum stays clear of the bottom edge, where a phone listens
for its own gestures, and the score and the pause button keep clear of the notch.

For the full screen, add the game to your home screen (Share, then Add to Home
Screen on an iPhone). It then opens without the browser's bars.

| Sideways | Upright |
| --- | --- |
| ![The drum on a phone held sideways](docs/screens/touch-sideways.webp) | ![The drum on a phone held upright](docs/screens/touch-upright.webp) |

The drum only appears on devices played with fingers. With a mouse and keyboard it
stays hidden. It can be switched off in Settings; the screen still plays.

Settings hold music and drum volume, note speed, a timing offset with a tap-along
measuring tool, auto play and the on-screen drum. Settings and personal records are kept
in this browser's local storage.

## Your music

Choose **曲をついか / Add your music** on the song shelf and pick a file (MP3, WAV, FLAC,
OGG or M4A, up to 100 MB and 15 minutes). The song is analysed by the backend when
one is running, and in your browser when there is none. Both follow the same steps:

1. decode the song (the backend also converts it to FLAC, the file the browser will
   play, so chart times and playback share one sample-accurate timeline)
2. separate percussive sound and measure attacks overall, in the kick band and in
   the high band
3. track the beat, fit a steady grid to it, and check that grid against tempos the
   tracker commonly confuses (half, double, 3:2, 2:3)
4. find the downbeat from bass attacks and chord changes
5. place notes on the grid: Easy on beats, Medium adds half-beats, Hard adds
   quarter-beats in short runs
6. assign Don to bass-heavy attacks and Ka to bright ones
7. turn the loudest sections into Go-Go Time, lead into them with a drumroll and
   follow the first two with a balloon

Songs analysed by the backend live in `backend/data/`, which is ignored by git.

### In the browser

`src/game/features.js` and `src/game/charting.js` are the backend's `analysis.py` and
`charting.py` rewritten in JavaScript, step for step. They run in a worker. The song
never leaves your device: nothing is uploaded, and the chart and the file are saved in
the browser's own storage (IndexedDB) so the song is still on the shelf next time.
Removing a song deletes both.

The same 3:57 song through both analysers:

| | Backend | Browser |
| --- | --- | --- |
| Tempo | 126.0 | 126.0 |
| Beats | 499 | 499, each within 3 ms of the backend's |
| First bar line | 0.005 s | 0.005 s |
| Go-Go sections | 4 | the same 4 |
| Notes, Easy / Medium / Hard | 264 / 469 / 765 | 264 / 469 / 768 |
| Notes in the same place | | 88% / 95% / 92% |
| Time taken | 12 s | 1.4 to 3 s |

**Audio is never committed.** `.gitignore` excludes every common audio extension and
the backend's data folder. Tests synthesise their own audio.

### Accuracy

Measured on synthetic drum loops of known tempo (`npm run test:backend` and
`npm test`):

| Check | Backend | Browser |
| --- | --- | --- |
| Tempo at 96 to 165 BPM | within 0.05 BPM | within 0.3 BPM |
| Beat placement | within 8 ms of the real attack | within 6 ms, 4 ms on average |
| Shuffle rhythm | detected, keeps its own tempo | detected |
| 70 BPM song | charted at 140 so the grid stays playable | the same rule |
| Audio at 22.05, 32, 44.1, 48 and 96 kHz | converted to one rate | same timing at each |

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

54 engine, analyser, song, layout and artwork tests, 29 backend tests, 4 hosting tests. What was
checked in real browsers is recorded in [docs/qa.md](docs/qa.md).

## Publish

Every push to `main` builds the static site and publishes it to GitHub Pages
(`.github/workflows/pages.yml`). The workflow runs the tests first and refuses to
publish if the build contains an audio file.

```bash
npm run build:pages
```

```bash
npm run preview:pages
```

The second command serves the build at http://localhost:4174/taiko-nights/, under the
same path GitHub Pages uses. The build uses relative addresses, so it runs from any
folder. `VITE_BACKEND=off` is what tells the game there is no server to look for.

## Layout

| Path | What lives there |
| --- | --- |
| `src/game/engine.js` | Rules: judging, scoring, gauge, drumrolls, balloons, auto play |
| `src/game/rules.js` | Every number the rules use |
| `src/game/renderer.js` | The play screen |
| `src/game/layout.js` | Where everything sits, and how the stage fills a window |
| `src/game/art/` | Everything drawn: painted sprites (`sprites.js`), effects, scenery, stand-ins |
| `src/game/touchDrum.js`, `src/ui/TouchDrum.jsx` | The drum on touch screens: where it sits, what a touch plays |
| `src/game/audio.js` | Song clock and synthesised drum sounds |
| `src/game/songs/` | The built-in songs as scores, and the synthesiser that plays them |
| `src/game/features.js` | The browser analyser: tempo, beat grid, attacks per band |
| `src/game/charting.js` | The browser chart writer, matching the backend's |
| `src/library.js`, `src/songStore.js` | The song shelf, and songs saved in this browser |
| `src/screens/`, `src/ui/` | Title, song select, play, results, dialogs |
| `backend/src/taiko_backend/` | `analysis.py` listens, `charting.py` writes charts, `main.py` serves |
| `public/art/` | Painted backgrounds, the drum, and the sprite atlases |
| `tools/art/` | How the pictures were made: prompts, generated sheets, the cutter |
| `src/dev/` | Development tools: sprite gallery and the cut-off text audit |
| `docs/` | Art notes, genre references, QA record, screenshots |

`worker/`, `.openai/` and `scripts/prepare-sites-build.mjs` package the static build
for hosting. A static host serves the whole game, analyser included; the backend is
optional and needs its own host.
