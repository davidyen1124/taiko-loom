import { useState, type DragEventHandler, type FormEventHandler } from "react";
import type { JobResponse } from "@/api";

interface UploadScreenProps {
  file: File | null;
  isUploading: boolean;
  jobStatus?: JobResponse["status"];
  error: string | null;
  onFileChange: (file: File | null) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export function UploadScreen({
  file,
  isUploading,
  jobStatus,
  error,
  onFileChange,
  onSubmit,
}: UploadScreenProps) {
  const [isDragging, setIsDragging] = useState(false);
  const isLocked = isUploading || jobStatus === "processing" || jobStatus === "queued";
  const buttonLabel = (() => {
    switch (jobStatus) {
      case "processing":
        return "Analyzing...";
      case "queued":
        return "Queued";
      default:
        return "Generate";
    }
  })();

  const handleDrop: DragEventHandler<HTMLLabelElement> = (event) => {
    if (isLocked) return;
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const droppedFile = event.dataTransfer?.files?.[0];
    if (!droppedFile) return;
    if (!droppedFile.type.startsWith("audio/")) return;
    onFileChange(droppedFile);
  };

  const handleDragOver: DragEventHandler<HTMLLabelElement> = (event) => {
    if (isLocked) return;
    event.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave: DragEventHandler<HTMLLabelElement> = (event) => {
    // Only reset when leaving the label, not when moving between children.
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  return (
    <section className="setup-screen">
      <div className="panel setup-card">
        <form onSubmit={onSubmit}>
          <label
            className={`dropzone${isDragging ? " dragging" : ""}`}
            aria-disabled={isLocked}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              accept="audio/mpeg"
              onChange={(event) => {
                const target = event.target as HTMLInputElement;
                onFileChange(target.files?.[0] ?? null);
              }}
              disabled={isLocked}
            />
            <div className="dropzone-label">
              <strong>{file ? file.name : "Drop or select an MP3"}</strong>
            </div>
          </label>

          <button type="submit" disabled={!file || isLocked} data-busy={isLocked}>
            {buttonLabel}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </section>
  );
}
