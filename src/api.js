// Client for the analysis backend. All paths are relative, so the dev server
// proxy and a same-origin deployment both work. Set VITE_API_BASE_URL to
// point at a backend hosted elsewhere, or VITE_BACKEND=off to build a site
// with no backend at all, where every song is analysed in the browser.
const BASE = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

export const HAS_BACKEND = import.meta.env?.VITE_BACKEND !== 'off';

export const apiUrl = path => `${BASE}${path}`;

async function request(path, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(apiUrl(path), { ...options, signal: controller.signal });
    if (!response.ok) {
      let message = `The server answered ${response.status}.`;
      try { message = (await response.json()).detail || message; } catch { /* not JSON */ }
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }
    return response.status === 204 ? null : response.json();
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The server took too long to answer.');
    if (error instanceof TypeError) {
      const offline = new Error('The analysis server is not running.');
      offline.offline = true;
      throw offline;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function health() {
  if (!HAS_BACKEND) return false;
  try {
    const result = await request('/api/health', {}, 2500);
    return result?.status === 'ok';
  } catch {
    return false;
  }
}

export const listSongs = async () => (await request('/api/songs')).songs;
export const getSong = id => request(`/api/songs/${id}`);
export const getJob = id => request(`/api/jobs/${id}`);
export const deleteSong = id => request(`/api/songs/${id}`, { method: 'DELETE' });
export const renameSong = (id, names) => request(`/api/songs/${id}`, {
  method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(names),
});

// Uploads with progress. Resolves with the analysis job.
export function uploadSong(file, { title = '', artist = '' } = {}, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('title', title);
    form.append('artist', artist);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', apiUrl('/api/songs'));
    xhr.responseType = 'json';
    xhr.upload.onprogress = event => { if (event.lengthComputable) onProgress(event.loaded / event.total); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
      else reject(new Error(xhr.response?.detail || `Upload failed (${xhr.status}).`));
    };
    xhr.onerror = () => {
      const error = new Error('The analysis server is not running.');
      error.offline = true;
      reject(error);
    };
    xhr.send(form);
  });
}

// Polls a job until it finishes. `onUpdate` receives every status.
export async function followJob(id, onUpdate, { interval = 500, signal } = {}) {
  for (;;) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    const job = await getJob(id);
    onUpdate(job);
    if (job.status === 'done') return job;
    if (job.status === 'error') throw new Error(job.error || 'Analysis failed.');
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

export async function fetchAudio(path, onProgress = () => {}) {
  const response = await fetch(apiUrl(path));
  if (!response.ok) throw new Error('The audio for this song is missing.');
  const total = Number(response.headers.get('content-length')) || 0;
  if (!response.body || !total) return response.arrayBuffer();
  const reader = response.body.getReader();
  const bytes = new Uint8Array(total);
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (received + value.length > bytes.length) break;
    bytes.set(value, received);
    received += value.length;
    onProgress(received / total);
  }
  return bytes.buffer;
}
