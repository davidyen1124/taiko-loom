# Taiko Nights

A playable, keyboard-driven festival rhythm game inspired by the supplied screenshot. React + Vite, Canvas note rendering, and Web Audio playback. No API key or external AI service is needed to play or analyze music.

## Play

```sh
cd /Users/david/Projects/taiko-nights
npm install
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
```

Open http://localhost:4173. The supplied Drake track is already prepared locally, so the Raspberry Pi does not need to stay online for playback.

| Control | Action |
| --- | --- |
| F / J | Red center notes (Don) |
| D / K | Blue rim notes (Ka) |
| Both matching keys within 50 ms | Double score on large notes |
| Any drum key repeatedly | Yellow drumrolls |
| Space | Play, pause, resume |
| R | Restart with a count-in |
| Esc | Pause |

Choose Easy, Medium, or Hard before playing. Changing difficulty resets the run. Touch the labeled key pads on mobile. Scores and settings are saved in localStorage; imported audio stays in memory until the page reloads. The game pauses when its tab is hidden or window loses focus.

The score uses Perfect (±45 ms), Good (±95 ms), and Miss (outside the Good window). Correct hits build combo and soul; misses break combo and reduce soul. Finish with at least 80% soul to clear. Scroll speed and timing offset are available in Settings. Positive offset accommodates later hits, including output-device latency.

## Analyze the supplied FLAC again

The command-line script downloads the exact Raspberry Pi URL from the request, decodes it with FFmpeg, detects beats, creates all three charts, and writes a browser-friendly local MP3.

```sh
# Prerequisites: Python 3.11+ and ffmpeg on PATH
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
npm run analyze
```

It writes `public/charts/default.json` and `public/audio/default.mp3`. Audio is excluded from git. Refresh the game after regenerating the default track. The environment used to verify this project had Python 3.14 and FFmpeg installed.

Use another URL or local file:

```sh
.venv/bin/python scripts/analyze_track.py 'https://example.com/song.flac' --title 'My song' --artist 'Artist'
.venv/bin/python scripts/analyze_track.py '/absolute/path/song.wav' --title 'My song' --artist 'Artist'
```

The script accepts downloads up to 250 MB and analyzes up to the first 20 minutes. Its default output paths replace the default track. `--output` and `--audio-output` support other output files; custom chart JSON files must be loaded by the app explicitly to become selectable.

## How the charts are generated

The Python path uses [librosa’s onset-strength and dynamic-programming beat tracker](https://librosa.org/doc/0.10.2/generated/librosa.beat.beat_track.html). Easy uses alternate detected beats. Medium uses the beat sequence with spectral-energy-based rim assignments. Hard adds detected offbeat onsets, large notes, and occasional roll phrases. Silent passages are suppressed. This creates playable, deterministic charts rather than random note streams.

For the provided file, the final analysis produced:

| Duration | Estimated tempo | Easy | Medium | Hard |
| --- | --- | --- | --- | --- |
| 3:57.344 | 126 BPM | 248 | 495 | 803 |

`Change song` also accepts local audio or CORS-enabled audio URLs. These are decoded with Web Audio and analyzed in a Web Worker using energy flux, tempo autocorrelation, and a locally corrected beat grid. This lightweight browser analyzer is less precise than the Python script. Files are not uploaded to a server. Browser import is limited to 100 MB and 15 minutes; supported codecs depend on the browser.

Beat detection is an estimate, especially for sparse introductions, tempo changes, or syncopated music. Use timing calibration for device latency; use the Python script for the better analysis path. Automatic charts are not equivalent to hand-authored charts for every song.

## Validate / build

```sh
npm test
npm run build
npm run preview -- --port 4173
```

The 11 tests cover hit windows, wrong-color hits, closest-note selection, large-note bonuses, rolls, count-in pause/resume, misses, completion, restart, chart ordering, silent-audio rejection, and known-tempo detection. The production frontend is in `dist/client`.

Browser QA was performed in the Codex in-app browser at 1536×1024, 1280×720, and 390×844. See `design-qa.md` for evidence and intentional visual adaptations. No hosting deployment was performed.

## Project layout

- `src/engine.js`: audio clock, scoring, note rendering, and game lifecycle.
- `src/App.jsx`: orchestration, keyboard controls, track import, and persistence.
- `src/components.jsx`: song picker, settings, instructions, controls, and results.
- `src/analysis.worker.js`: browser audio analysis.
- `scripts/analyze_track.py`: reusable URL/file analysis script.
- `public/assets`: generated festival, sprite atlas, and patterned header artwork.
- `design`: supplied reference, visual concept, asset prompts, and final browser captures.

The artwork uses generated festival scenery and sprites; the text, controls, score, soul gauge, note movement, and interactions are live code. This is a standalone recreation of the visible single-player experience, not the original Taiko Web codebase or an implementation of its online modes/song catalog.
