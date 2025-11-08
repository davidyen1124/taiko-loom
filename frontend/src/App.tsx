import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ChartMode, JobResponse } from "./api";
import { fetchJob, uploadChart } from "./api";
import "./App.css";

const MODE_OPTIONS: { value: ChartMode; label: string; copy: string }[] = [
  { value: "balanced", label: "Balanced", copy: "Best of both worlds." },
  { value: "dense", label: "Dense", copy: "Adds extra syncopation when the music is intense." },
  { value: "sparse", label: "Sparse", copy: "Keeps only the strongest beats for practice." },
];

const NOTE_WINDOW_SECONDS = 4;
const LANE_PX_PER_SECOND = 140;

const formatTime = (value: number) => {
  if (!Number.isFinite(value) || value < 0) {
    return "0:00";
  }
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

function App() {
  const [selectedMode, setSelectedMode] = useState<ChartMode>("balanced");
  const [file, setFile] = useState<File | null>(null);
  const [job, setJob] = useState<JobResponse | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [displayTime, setDisplayTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const activeTimeRef = useRef(0);
  const lastUiUpdateRef = useRef(0);

  useEffect(() => {
    if (!file) {
      setAudioUrl(null);
      return () => {};
    }

    const nextUrl = URL.createObjectURL(file);
    setAudioUrl(nextUrl);
    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [file]);

useEffect(() => {
  lastUiUpdateRef.current = 0;
  let frame: number;
  const update = (timestamp: number) => {
    const audio = audioRef.current;
    const current = audio?.currentTime ?? 0;
    activeTimeRef.current = current;
    if (trackRef.current) {
      trackRef.current.style.setProperty("--active-shift", `${current * LANE_PX_PER_SECOND}px`);
    }
    if (timestamp - lastUiUpdateRef.current > 80) {
      lastUiUpdateRef.current = timestamp;
      setDisplayTime(current);
    }
    frame = requestAnimationFrame(update);
  };
  frame = requestAnimationFrame(update);
  return () => cancelAnimationFrame(frame);
}, [audioUrl]);

  useEffect(() => {
    if (!jobId) {
      return;
    }
    if (job?.status === "completed" || job?.status === "failed") {
      return;
    }
    const interval = setInterval(async () => {
      try {
        const current = await fetchJob(jobId);
        setJob(current);
        if (current.status === "completed" || current.status === "failed") {
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
        setError((err as Error).message);
        clearInterval(interval);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [jobId, job?.status]);

  useEffect(() => {
    setDisplayTime(0);
    activeTimeRef.current = 0;
    setDuration(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
    }
    if (trackRef.current) {
      trackRef.current.style.setProperty("--active-shift", "0px");
    }
  }, [job?.payload]);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!file) {
      setError("Pick an MP3 first.");
      return;
    }
    setIsUploading(true);
    try {
      const response = await uploadChart(file, selectedMode);
      setJob(response);
      setJobId(response.job_id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const preparedNotes = useMemo(() => {
    const notes = job?.payload?.notes ?? [];
    return notes.map((note, idx) => ({
      idx,
      note,
      absoluteOffset: note.time * LANE_PX_PER_SECOND,
    }));
  }, [job?.payload?.notes]);

  const noteMarkers = useMemo(
    () =>
      preparedNotes
        .map((entry) => ({
          ...entry,
          passed: entry.note.time < displayTime,
          visible: Math.abs(entry.note.time - displayTime) <= NOTE_WINDOW_SECONDS,
        }))
        .filter((entry) => entry.visible),
    [preparedNotes, displayTime],
  );

  const displayDuration = duration || job?.payload?.stats.duration || 0;
  const isReadyToPlay = Boolean(job?.status === "completed" && job?.payload && audioUrl);
  const showSetup = !isReadyToPlay;

  const handleReset = () => {
    setJob(null);
    setJobId(null);
    setFile(null);
    setError(null);
    setDisplayTime(0);
    activeTimeRef.current = 0;
    setDuration(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (trackRef.current) {
      trackRef.current.style.setProperty("--active-shift", "0px");
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    const handleLoaded = () => setDuration(audio.duration || 0);
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error(err);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleScrub = (value: number) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.currentTime = value;
    setDisplayTime(value);
    activeTimeRef.current = value;
    if (trackRef.current) {
      trackRef.current.style.setProperty("--active-shift", `${value * LANE_PX_PER_SECOND}px`);
    }
  };

  return (
    <div className={`app-shell ${isReadyToPlay ? "play-mode" : "setup-mode"}`}>
      <header className="app-header">
        <div>
          <h1>Taiko Forge</h1>
          <p>Drop an MP3, let the backend shape the beats, and watch the Taiko lane unfold.</p>
        </div>
      </header>

      {showSetup ? (
        <section className="setup-screen">
          <div className="panel setup-card">
            <form onSubmit={handleUpload}>
              <label className="dropzone">
                <input
                  type="file"
                  accept="audio/mpeg"
                  onChange={(event) => {
                    const target = event.target as HTMLInputElement;
                    setFile(target.files?.[0] ?? null);
                  }}
                  disabled={isUploading}
                />
                <div>
                  <strong>{file ? file.name : "Drop or select an MP3"}</strong>
                </div>
              </label>

              <div className="mode-picker">
                {MODE_OPTIONS.map((option) => (
                  <label key={option.value} className={selectedMode === option.value ? "active" : ""}>
                    <input
                      type="radio"
                      name="mode"
                      value={option.value}
                      checked={selectedMode === option.value}
                      onChange={() => setSelectedMode(option.value)}
                    />
                    <span>{option.label}</span>
                    <small>{option.copy}</small>
                  </label>
                ))}
              </div>

              <button type="submit" disabled={isUploading}>
                {job?.status === "processing"
                  ? "Analyzing..."
                  : job?.status === "queued"
                    ? "Queued"
                    : "Generate chart"}
              </button>
            </form>
            {error && <p className="error">{error}</p>}
          </div>
        </section>
      ) : (
        <section className="play-screen">
          <div className="play-top">
            <button type="button" className="ghost-button" onClick={handleReset}>
              Upload another song
            </button>
          </div>

          <div className="panel play-panel">
            <div className="play-controls">
              {audioUrl && (
                <>
                  <audio ref={audioRef} src={audioUrl} preload="metadata" className="audio-element" />
                  <div className="transport">
                    <button type="button" onClick={togglePlayback} aria-label={isPlaying ? "Pause" : "Play"}>
                      {isPlaying ? "❚❚" : "▶"}
                    </button>
                    <div className="timeline">
                      <span>{formatTime(displayTime)}</span>
                      <input
                        type="range"
                        min={0}
                        max={displayDuration || 1}
                        step="0.01"
                        value={Math.min(displayTime, displayDuration || 1)}
                        onChange={(event) => handleScrub(Number(event.target.value))}
                      />
                      <span>{formatTime(displayDuration)}</span>
                    </div>
                  </div>
                </>
              )}
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
      )}
    </div>
  );
}

export default App;
