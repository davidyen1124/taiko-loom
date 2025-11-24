export type NoteType = "red_half" | "red_full" | "blue_half" | "blue_full";
export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface TaikoNote {
  time: number;
  note_type: NoteType;
  intensity: number;
  brightness: number;
}

export interface ChartStats {
  bpm: number;
  duration: number;
  total_beats: number;
  total_notes: number;
  notes_per_second: number;
  red_ratio: number;
  blue_ratio: number;
}

export interface ChartPayload {
  notes: TaikoNote[];
  beat_times: number[];
  stats: ChartStats;
}

export interface JobResponse {
  job_id: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  payload?: ChartPayload;
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

/**
 * Upload an audio file to kick off chart generation and return the job metadata.
 */
export async function uploadAudio(file: File): Promise<JobResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/audio`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Upload failed");
  }
  return res.json();
}

export async function fetchJob(jobId: string): Promise<JobResponse> {
  const res = await fetch(`${API_BASE_URL}/audio/${jobId}`);
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Unable to fetch job");
  }
  return res.json();
}
