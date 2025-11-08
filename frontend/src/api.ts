export type NoteType = "red_half" | "red_full" | "blue_half" | "blue_full";
export type JobStatus = "queued" | "processing" | "completed" | "failed";
export type ChartMode = "balanced" | "dense" | "sparse";

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
  mode: ChartMode;
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

export async function uploadChart(file: File, mode: ChartMode): Promise<JobResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mode", mode);

  const res = await fetch(`${API_BASE_URL}/charts`, {
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
  const res = await fetch(`${API_BASE_URL}/charts/${jobId}`);
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Unable to fetch job");
  }
  return res.json();
}
