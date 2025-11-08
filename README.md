# Taiko Project

This workspace contains two pieces:

- `backend/`: FastAPI + `librosa` service that turns MP3 uploads into Taiko-friendly note charts.
- `frontend/`: Vite + React experience where you upload a song, wait for analysis, and then drum along with your keyboard.

## Prerequisites

- `uv` (already in this repo’s tooling)
- Node.js 18+
- FFmpeg on your PATH for best MP3 decoding results

## Backend

```bash
cd backend
uv python install 3.11      # first-run only
uv sync                     # install deps into .venv
uv run fastapi dev taiko_backend.main:app --host 0.0.0.0 --port 8000
```

The API exposes `/charts` (POST upload) plus `/charts/{job}` for polling results. See `backend/README.md` for more detail.

## Frontend

```bash
cd frontend
npm install
npm run dev   # launches Vite on http://localhost:5173
```

Set `VITE_API_BASE_URL` in `frontend/.env` if your backend is not running on `http://localhost:8000`.

Once both sides are up:

1. Open the frontend, choose one of the chart density modes, and upload an MP3.
2. The UI shows server status; when the chart is ready you’ll see note stats and an interactive lane.
3. Press `F/J` for red (half/full) and `D/K` for blue (half/full) while the audio preview plays.
