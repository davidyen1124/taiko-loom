#!/usr/bin/env python3
"""Analyse one song from the command line and print or save its charts.

This runs the same code as the backend, without the server:

    uv run --project backend python scripts/analyze_track.py path/to/song.mp3
    uv run --project backend python scripts/analyze_track.py song.flac --output chart.json

Requires FFmpeg on PATH. The audio file is only read, never copied or uploaded.
"""
import argparse
import json
import sys
import tempfile
from pathlib import Path

from taiko_backend import analysis, charting, library


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate Easy, Medium and Hard taiko charts for a song.")
    parser.add_argument("source", type=Path, help="audio file (MP3, WAV, FLAC, OGG, M4A)")
    parser.add_argument("--title", default="")
    parser.add_argument("--artist", default="")
    parser.add_argument("--output", type=Path, help="write the chart JSON here instead of printing a summary")
    args = parser.parse_args()
    if not args.source.is_file():
        print(f"Audio not found: {args.source}", file=sys.stderr)
        return 1
    try:
        info = analysis.probe(args.source)
        title, artist = library.guess_names(args.source.name, info)
        with tempfile.TemporaryDirectory(prefix="taiko-analysis-") as folder:
            playable = Path(folder) / library.AUDIO_NAME
            analysis.transcode_for_playback(args.source, playable)
            features = analysis.extract(playable, lambda stage, _: print(f"  {stage}…", file=sys.stderr))
        chart = charting.generate(features)
    except analysis.AnalysisError as error:
        print(str(error), file=sys.stderr)
        return 1
    chart.update(title=args.title or title, artist=args.artist or artist)
    if args.output:
        args.output.write_text(json.dumps(chart, separators=(",", ":")))
        print(f"Wrote {args.output}")
    summary = {
        "title": chart["title"], "artist": chart["artist"], "bpm": chart["bpm"], "duration": chart["duration"],
        "steadyTempo": chart["steadyTempo"], "feel": chart["feel"], "goGoSections": len(chart["gogo"]),
        "charts": {name: {"stars": c["stars"], **c["stats"]} for name, c in chart["charts"].items()},
    }
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
