# Taiko Beat Analyzer API

FastAPI service that accepts an MP3 upload, detects musical beats via `librosa`, and generates Taiko-friendly notes with half/full red & blue hits.

## Requirements

- Python 3.11 (managed by `uv`)
- FFmpeg (recommended for reliable MP3 decoding through `librosa`)

## Setup

```bash
cd backend
uv python install 3.11      # only needed once
uv sync                     # install dependencies into .venv
```

## Run the server

```bash
cd backend
uv run fastapi dev taiko_backend.main:app --host 0.0.0.0 --port 8000
```

Endpoint summary:

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/health` | Basic readiness probe |
| `POST` | `/charts` | Accepts multipart upload (`file`) plus optional `mode` (`balanced`/`dense`/`sparse`). Returns a job id immediately while the analysis runs in the background. |
| `GET` | `/charts/{job_id}` | Poll for job status. When finished, the payload contains beat times, Taiko notes, and helpful stats. |

## How charting works

1. MP3 is decoded with `librosa`.
2. `beat_track` + spectral features derive tempo, beat timestamps, and energy/brightness envelopes.
3. Each beat becomes a Taiko note (`red` vs `blue` from spectral brightness, `half` vs `full` from RMS energy).
4. Dense mode adds mid-beat ghost notes, Sparse mode filters out weak beats.

Adjust the heuristics in `taiko_backend/audio.py` if you want different behaviors.
