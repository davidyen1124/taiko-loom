import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { JobResponse, TaikoNote } from "@/api";
import { uploadAudio } from "@/api";
import "@/App.css";
import { DEFAULT_APPROACH_TIME_SECONDS, MIN_TRAVEL_PX, TRAVEL_FRACTION, WINDOW_PADDING_SECONDS } from "@/constants";
import { IconArrowLeft } from "@/components/IconArrowLeft";
import { useJobPolling } from "@/hooks/useJobPolling";
import { usePlayback } from "@/hooks/usePlayback";
import { PlayScreen, type NoteMarker } from "@/screens/PlayScreen";
import { UploadScreen } from "@/screens/UploadScreen";

type AppView = "setup" | "play";
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [job, setJob] = useState<JobResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [lanePxPerSecond, setLanePxPerSecond] = useState<number | null>(null);

  const pxPerSecond = lanePxPerSecond ?? MIN_TRAVEL_PX / DEFAULT_APPROACH_TIME_SECONDS;
  const noteWindowSeconds = DEFAULT_APPROACH_TIME_SECONDS + WINDOW_PADDING_SECONDS;
  const viewMode: AppView = useMemo(() => {
    if (job?.status === "completed" && job?.payload && audioUrl) {
      return "play";
    }
    return "setup";
  }, [audioUrl, job?.payload, job?.status]);

  const { audioRef, trackRef, displayTime, duration, isPlaying, togglePlayback, handleScrub, resetPlayback } =
    usePlayback(audioUrl, pxPerSecond, viewMode === "play");

  useJobPolling(job?.job_id ?? null, job?.status, setJob, setError);

  useEffect(() => {
    const computeLaneSpeed = () => {
      if (typeof window === "undefined") {
        return;
      }
      const width = window.innerWidth || 900;
      const travelPx = Math.max(MIN_TRAVEL_PX, width * TRAVEL_FRACTION);
      setLanePxPerSecond(travelPx / DEFAULT_APPROACH_TIME_SECONDS);
    };
    computeLaneSpeed();
    window.addEventListener("resize", computeLaneSpeed);
    return () => window.removeEventListener("resize", computeLaneSpeed);
  }, []);

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
    resetPlayback();
  }, [job?.payload, resetPlayback]);

  const handleFileChange = (next: File | null) => {
    if (next && next.size > MAX_FILE_BYTES) {
      setError("File is too large (max 20 MB).");
      setFile(null);
      return;
    }
    setError(null);
    setFile(next);
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!file) {
      setError("Pick an MP3 first.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("File is too large (max 20 MB).");
      return;
    }
    if (job?.status === "processing" || job?.status === "queued") {
      setError("Hang tight—your chart is still processing.");
      return;
    }
    setIsUploading(true);
    try {
      const response = await uploadAudio(file);
      setJob(response);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const preparedNotes = useMemo(() => {
    const notes = job?.payload?.notes ?? [];
    return notes.map((note: TaikoNote, idx) => ({
      idx,
      note,
      absoluteOffset: note.time * pxPerSecond,
    }));
  }, [job?.payload?.notes, pxPerSecond]);

  const noteMarkers = useMemo<NoteMarker[]>(() => {
    const windowed: NoteMarker[] = [];
    preparedNotes.forEach((entry) => {
      if (Math.abs(entry.note.time - displayTime) <= noteWindowSeconds) {
        windowed.push({
          ...entry,
          passed: entry.note.time < displayTime,
        });
      }
    });
    return windowed;
  }, [preparedNotes, displayTime, noteWindowSeconds]);

  const displayDuration = duration || job?.payload?.stats.duration || 0;
  const trackTitle = file?.name ?? "Uploaded track";

  const handleReset = () => {
    setJob(null);
    setFile(null);
    setError(null);
    setAudioUrl(null);
    resetPlayback();
  };

  return (
    <div className={`app-shell ${viewMode === "play" ? "play-mode" : "setup-mode"}`}>
      <header className={`app-header ${viewMode === "play" ? "app-header-play" : ""}`}>
        {viewMode === "play" ? (
          <div className="app-header-row">
            <button type="button" className="back-button" onClick={handleReset} aria-label="Upload another song">
              <IconArrowLeft />
            </button>
            <span className="brand-mark">Taiko Loom</span>
            <span className="header-divider" aria-hidden="true" />
            <span className="track-title" title={trackTitle}>
              {trackTitle}
            </span>
          </div>
        ) : (
          <div>
            <h1>Taiko Loom</h1>
            <p>Drop an MP3, let the backend weave the rhythms, and watch the Taiko lane unfold.</p>
          </div>
        )}
      </header>

      {viewMode === "setup" ? (
        <UploadScreen
          file={file}
          isUploading={isUploading}
          jobStatus={job?.status}
          error={error}
          onFileChange={handleFileChange}
          onSubmit={handleUpload}
        />
      ) : (
        audioUrl && (
          <PlayScreen
            audioUrl={audioUrl}
            displayTime={displayTime}
            displayDuration={displayDuration}
            isPlaying={isPlaying}
            noteMarkers={noteMarkers}
            onTogglePlayback={togglePlayback}
            onScrub={handleScrub}
            audioRef={audioRef}
            trackRef={trackRef}
          />
        )
      )}
    </div>
  );
}

export default App;
