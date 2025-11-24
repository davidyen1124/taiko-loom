import { useEffect } from "react";
import type { JobResponse } from "@/api";
import { fetchJob } from "@/api";

export function useJobPolling(
  jobId: string | null,
  status: JobResponse["status"] | undefined,
  onJobUpdate: (job: JobResponse) => void,
  onError: (message: string) => void,
) {
  useEffect(() => {
    if (!jobId) {
      return;
    }
    if (status === "completed" || status === "failed") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const current = await fetchJob(jobId);
        onJobUpdate(current);
        if (current.status === "completed" || current.status === "failed") {
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
        onError((err as Error).message);
        clearInterval(interval);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [jobId, status, onJobUpdate, onError]);
}
