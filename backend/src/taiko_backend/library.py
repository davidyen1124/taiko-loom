"""On-disk song library: one folder per song holding audio, chart and metadata.

The folder lives outside version control (see .gitignore). Audio is only ever
stored here, never in the repository.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path

AUDIO_NAME = "audio.flac"
SONG_ID = re.compile(r"^[0-9a-f]{16}$")


def data_dir() -> Path:
    default = Path(__file__).resolve().parents[2] / "data"
    return Path(os.environ.get("TAIKO_DATA_DIR", default))


def songs_dir() -> Path:
    path = data_dir() / "songs"
    path.mkdir(parents=True, exist_ok=True)
    return path


def song_id_for(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()[:16]


def song_dir(song_id: str) -> Path | None:
    if not SONG_ID.match(song_id):
        return None
    path = songs_dir() / song_id
    return path if (path / "meta.json").is_file() else None


def clean_text(value: str, limit: int = 120) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[\x00-\x1f\x7f]", " ", value or "")).strip()[:limit]


def guess_names(filename: str, tags: dict) -> tuple[str, str]:
    """Prefer embedded tags, then an 'Artist - Title' file name."""
    stem = clean_text(re.sub(r"[_]+", " ", Path(filename or "").stem))
    stem = re.sub(r"^\d{1,3}[\s.\-]+(?=\S)", "", stem)          # leading track number
    title, artist = clean_text(tags.get("title", "")), clean_text(tags.get("artist", ""))
    if not title and " - " in stem:
        left, right = stem.split(" - ", 1)
        artist, title = artist or left.strip(), right.strip()
    return title or stem or "Untitled", artist or "Unknown artist"


def summary(meta: dict) -> dict:
    return {key: meta[key] for key in ("id", "title", "artist", "bpm", "duration", "createdAt", "levels")}


def save(song_id: str, audio: Path, chart: dict, title: str, artist: str) -> dict:
    target = songs_dir() / song_id
    target.mkdir(parents=True, exist_ok=True)
    shutil.move(str(audio), target / AUDIO_NAME)
    meta = {
        "id": song_id, "title": title, "artist": artist,
        "bpm": chart["bpm"], "duration": chart["duration"],
        "createdAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "levels": {name: {"stars": c["stars"], **c["stats"]} for name, c in chart["charts"].items()},
    }
    (target / "chart.json").write_text(json.dumps(chart, separators=(",", ":")))
    (target / "meta.json").write_text(json.dumps(meta, indent=2))
    return meta


def list_songs() -> list[dict]:
    songs = []
    for meta_path in songs_dir().glob("*/meta.json"):
        try:
            songs.append(summary(json.loads(meta_path.read_text())))
        except (json.JSONDecodeError, KeyError, OSError):
            continue
    return sorted(songs, key=lambda s: s["createdAt"], reverse=True)


def load(song_id: str) -> dict | None:
    folder = song_dir(song_id)
    if folder is None:
        return None
    meta = json.loads((folder / "meta.json").read_text())
    chart = json.loads((folder / "chart.json").read_text())
    return {**chart, **summary(meta), "audio": f"/api/songs/{song_id}/audio"}


def rename(song_id: str, title: str | None, artist: str | None) -> dict | None:
    folder = song_dir(song_id)
    if folder is None:
        return None
    meta = json.loads((folder / "meta.json").read_text())
    if title is not None and clean_text(title):
        meta["title"] = clean_text(title)
    if artist is not None and clean_text(artist):
        meta["artist"] = clean_text(artist)
    (folder / "meta.json").write_text(json.dumps(meta, indent=2))
    return summary(meta)


def delete(song_id: str) -> bool:
    folder = song_dir(song_id)
    if folder is None:
        return False
    shutil.rmtree(folder)
    return True
