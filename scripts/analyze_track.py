#!/usr/bin/env python3
"""Download/decode a song and create deterministic, audio-derived Taiko charts.

Usage: .venv/bin/python scripts/analyze_track.py [URL_OR_FILE] --title 'Title' --artist 'Artist'
Requires ffmpeg and requirements.txt.
"""
import argparse
import hashlib
import json
import subprocess
import tempfile
import urllib.request
from pathlib import Path

import librosa
import numpy as np

DEFAULT_URL = None
ROOT = Path(__file__).resolve().parents[1]


def analyze(path, title, artist):
    y, sr = librosa.load(str(path), sr=22050, mono=True)
    if len(y) < sr or not np.isfinite(y).all() or np.max(np.abs(y)) < 1e-5:
        raise ValueError('Audio is too short, silent, or invalid.')
    hop = 256
    onset = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    tempo, frames = librosa.beat.beat_track(onset_envelope=onset, sr=sr, hop_length=hop, trim=True)
    bpm = float(np.asarray(tempo).flat[0])
    beats = librosa.frames_to_time(frames, sr=sr, hop_length=hop)
    if len(beats) < 4:
        raise ValueError('Could not find a stable beat in this audio.')
    onset_frames = librosa.onset.onset_detect(onset_envelope=onset, sr=sr, hop_length=hop)
    onsets = librosa.frames_to_time(onset_frames, sr=sr, hop_length=hop)
    spectrum = np.abs(librosa.stft(y, n_fft=1024, hop_length=hop))
    low_energy = spectrum[:12].sum(axis=0)
    high_energy = spectrum[40:300].sum(axis=0)
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    active_floor = float(np.percentile(rms, 65)) * .18
    duration = len(y) / sr
    strong = float(np.percentile(onset[onset > 0], 78))

    def note(t, i, difficulty, subdivision=False):
        frame = min(len(onset)-1, round(t * sr / hop))
        if t < .15 or t > duration - .4 or rms[min(frame, len(rms)-1)] < active_floor:
            return None
        # Snare/high frequency attacks become rim notes; retain a playable balance.
        spectral = high_energy[min(frame, len(high_energy)-1)] / (low_energy[min(frame, len(low_energy)-1)] + 1e-5)
        ka = difficulty != 'easy' and (subdivision or (spectral > 1.65 and i % 4 in (1, 3)))
        big = difficulty == 'hard' and not subdivision and onset[frame] > strong and i % 8 == 0
        return {'time': round(float(t), 4), 'type': 'ka' if ka else 'don', 'big': bool(big)}

    charts = {}
    for difficulty in ('easy', 'medium', 'hard'):
        notes = []
        for i, beat in enumerate(beats):
            if difficulty == 'easy' and i % 2:
                continue
            n = note(beat, i, difficulty)
            if n:
                notes.append(n)
            if difficulty == 'hard' and i + 1 < len(beats):
                midpoint = (beat + beats[i + 1]) / 2
                nearest = onsets[np.argmin(np.abs(onsets - midpoint))] if len(onsets) else -1
                if abs(nearest - midpoint) < .11:
                    extra = note(nearest, i, difficulty, True)
                    if extra:
                        notes.append(extra)
        notes.sort(key=lambda n: n['time'])
        # Add occasional sustained roll phrases on Hard, replacing notes in that phrase.
        if difficulty == 'hard':
            for i in range(28, len(beats) - 4, 64):
                start, end = float(beats[i]), float(beats[i+2])
                if any(start <= n['time'] <= end for n in notes):
                    notes = [n for n in notes if not start - .01 <= n['time'] <= end + .01]
                    notes.append({'time': round(start, 4), 'end': round(end, 4), 'type': 'roll', 'big': False})
            notes.sort(key=lambda n: n['time'])
        charts[difficulty] = notes
    waveform = [round(float(np.sqrt(np.mean(block ** 2))), 4) for block in np.array_split(y, 180)]
    peak = max(waveform) or 1
    return {'version': 1, 'id': hashlib.sha256(Path(path).read_bytes()).hexdigest()[:12],
            'title': title, 'artist': artist, 'bpm': round(bpm, 1), 'duration': round(duration, 3),
            'analysis': 'librosa onset strength + dynamic-programming beat tracking',
            'estimated': True, 'waveform': [round(x / peak, 3) for x in waveform],
            'beats': [round(float(t), 4) for t in beats], 'charts': charts}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source')
    parser.add_argument('--title', default='Janice STFU')
    parser.add_argument('--artist', default='Drake')
    parser.add_argument('--output', type=Path, default=ROOT / 'public/charts/default.json')
    parser.add_argument('--audio-output', type=Path, default=ROOT / 'public/audio/default.mp3')
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.audio_output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='taiko-analysis-') as tmp:
        source = Path(args.source)
        if args.source.startswith(('http://', 'https://')):
            print('Downloading audio…', flush=True)
            source = Path(tmp) / 'source.audio'
            with urllib.request.urlopen(args.source, timeout=60) as response, source.open('wb') as out:
                total = 0
                while chunk := response.read(1024 * 1024):
                    total += len(chunk)
                    if total > 250 * 1024 * 1024:
                        raise ValueError('Audio exceeds the 250 MB limit.')
                    out.write(chunk)
        if not source.is_file():
            raise FileNotFoundError(f'Audio not found: {source}')
        wav = Path(tmp) / 'analysis.wav'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(source), '-t', '1200', '-ac', '1', '-ar', '22050', str(wav)], check=True)
        print('Detecting beats and building Easy / Medium / Hard…', flush=True)
        result = analyze(wav, args.title, args.artist)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(source), '-t', '1200', '-codec:a', 'libmp3lame', '-q:a', '2', str(args.audio_output)], check=True)
        result['audio'] = '/audio/' + args.audio_output.name
        args.output.write_text(json.dumps(result, separators=(',', ':')))
        print(json.dumps({'bpm': result['bpm'], 'duration': result['duration'], 'notes': {k:len(v) for k,v in result['charts'].items()}, 'chart': str(args.output), 'audio': str(args.audio_output)}, indent=2))


if __name__ == '__main__':
    main()
