# Taiko Loom Repository Guidelines

## Project Structure & Module Organization
Mono-repo for Taiko Loom with `backend/` (FastAPI) and `frontend/` (Vite + React). Core API modules live in `backend/src/taiko_backend/` (`audio.py`, `jobs.py`, `schemas.py`, `main.py`). UI code sits in `frontend/src/` (`api.ts`, `App.tsx`) and static assets in `frontend/public/`. Add your own short MP3 at the project root when manually testing.

## Build, Test, and Development Commands
- `cd backend && uv python install 3.11 && uv sync` — bootstrap the Python toolchain (first run).
- `cd backend && uv run fastapi dev taiko_backend.main:app --host 0.0.0.0 --port 8000` — start the API with hot reload.
- `cd frontend && npm install` — install Node dependencies.
- `cd frontend && npm run dev` — launch Vite dev server (defaults to http://localhost:5173).
- `cd frontend && npm run build` / `npm run preview` — build and smoke-test production bundles.
- `cd frontend && npm run lint` — lint UI before committing.

## Coding Style & Naming Conventions
Python modules use 4-space indentation, type hints, and snake_case functions. Keep Pydantic models in `schemas.py` singular (`ChartResponse`, etc.) and validate inputs at route boundaries. React components belong in PascalCase files (`App.tsx`), hooks/utilities in camelCase exports (`api.ts`), and styling centralized in `App.css`/`index.css`. Run `npm run lint` to enforce ESLint + TypeScript rules and model chart modes with explicit union types instead of loose strings.
TypeScript: prefer `import type { … }` and named hooks (no default `React` import). Use `RefObject`, `FormEvent`, `DragEventHandler`, etc., directly from `react`.

## Quality Checks & Manual Verification
There are no automated tests yet, so validate changes manually. Run both services (`uv run fastapi dev ...` and `npm run dev`), upload a short MP3 (<30s), and confirm `/audio/{job}` reaches a playable lane. When tweaking chart heuristics, inspect `/audio` JSON payloads and compare note density across modes. On the UI, rely on `npm run lint` plus smoke tests in the browser before pushing.

## Commit & Pull Request Guidelines
Use Conventional Commits (`fix(frontend): ...`) with scopes that map to repo directories. PRs must summarize user impact, list validation steps, link issues, and include screenshots or terminal output for UI/API changes. Document the manual scenarios you exercised (e.g., which MP3, which density mode) and ensure `npm run lint` passes before asking for review.

## Environment & Configuration Tips
Keep FFmpeg on your PATH so `librosa` can decode MP3 uploads. Set API overrides for `frontend/src/api.ts` by defining `VITE_API_BASE_URL` in `frontend/.env.local` (or the appropriate Vite env file) and keep secrets out of Git. Use a short MP3 for smoke tests (15–30 second snippets keep processing quick).
