import type { RefObject } from "react";
import type { TaikoNote } from "@/api";
import { IconPause } from "@/components/IconPause";
import { IconPlay } from "@/components/IconPlay";
import { formatTime } from "@/utils/time";

export type NoteMarker = {
  idx: number;
  note: TaikoNote;
  absoluteOffset: number;
  passed: boolean;
};

interface PlayScreenProps {
  audioUrl: string;
  displayTime: number;
  displayDuration: number;
  isPlaying: boolean;
  noteMarkers: NoteMarker[];
  onTogglePlayback: () => void;
  onScrub: (value: number) => void;
  audioRef: RefObject<HTMLAudioElement | null>;
  trackRef: RefObject<HTMLDivElement | null>;
}

export function PlayScreen({
  audioUrl,
  displayTime,
  displayDuration,
  isPlaying,
  noteMarkers,
  onTogglePlayback,
  onScrub,
  audioRef,
  trackRef,
}: PlayScreenProps) {
  return (
    <section className="play-screen">
      <div className="panel play-panel">
        <div className="play-controls">
          <audio ref={audioRef} src={audioUrl} preload="metadata" className="audio-element" />
          <div className="transport">
            <button type="button" onClick={onTogglePlayback} aria-label={isPlaying ? "Pause" : "Play"} className="transport-button">
              {isPlaying ? <IconPause className="transport-icon" /> : <IconPlay className="transport-icon" />}
              <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
            </button>
            <div className="timeline">
              <span>{formatTime(displayTime)}</span>
              <input
                type="range"
                min={0}
                max={displayDuration || 1}
                step="0.01"
                value={Math.min(displayTime, displayDuration || 1)}
                onChange={(event) => onScrub(Number(event.target.value))}
              />
              <span>{formatTime(displayDuration)}</span>
            </div>
          </div>
        </div>

        <div className="note-track" ref={trackRef}>
          <div className="note-track-inner">
            {noteMarkers.map((marker) => (
              <span
                key={`${marker.note.time}-${marker.idx}`}
                className={`note ${marker.note.note_type} ${marker.passed ? "passed" : ""}`}
                style={{ left: `${marker.absoluteOffset}px` }}
              />
            ))}
          </div>
          <div className="playhead" />
        </div>
      </div>
    </section>
  );
}
