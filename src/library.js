// The song shelf: the built-in demo, songs analysed by the backend, and
// songs analysed on this device while the backend is offline.
import * as api from './api.js';
import { audio } from './game/audio.js';
import { buildDemoSong, renderDemoAudio } from './game/demoSong.js';

const demo = buildDemoSong();
const local = new Map();          // id -> { song, buffer }
const buffers = new Map();        // id -> AudioBuffer, most recent last
const KEEP_BUFFERS = 2;

const levelsOf = song => Object.fromEntries(
  Object.entries(song.charts).map(([name, chart]) => [name, { stars: chart.stars, ...chart.stats }]),
);

export const summarise = song => ({
  id: song.id, title: song.title, artist: song.artist, bpm: song.bpm, duration: song.duration,
  source: song.source || 'server', levels: song.levels || levelsOf(song), gogo: song.gogo?.[0]?.[0] ?? null,
});

export async function loadShelf() {
  const shelf = [summarise(demo), ...[...local.values()].map(entry => summarise(entry.song))];
  const online = await api.health();
  if (!online) return { online, songs: shelf };
  try {
    const songs = await api.listSongs();
    return { online, songs: [...shelf, ...songs.map(song => ({ ...song, source: 'server' }))] };
  } catch {
    return { online: false, songs: shelf };
  }
}

export async function loadSong(summary) {
  if (summary.source === 'demo') return demo;
  if (summary.source === 'device') return local.get(summary.id).song;
  return { ...(await api.getSong(summary.id)), source: 'server' };
}

function remember(id, buffer) {
  buffers.delete(id);
  buffers.set(id, buffer);
  while (buffers.size > KEEP_BUFFERS) buffers.delete(buffers.keys().next().value);
  return buffer;
}

export async function loadAudio(song, onProgress = () => {}) {
  if (buffers.has(song.id)) return remember(song.id, buffers.get(song.id));
  if (song.source === 'demo') return remember(song.id, await renderDemoAudio());
  if (song.source === 'device') return local.get(song.id).buffer;
  const bytes = await api.fetchAudio(song.audio, fraction => onProgress(fraction * 0.9));
  const buffer = await audio.decode(bytes);
  onProgress(1);
  return remember(song.id, buffer);
}

export function keepLocalSong(song, buffer) {
  local.set(song.id, { song: { ...song, source: 'device' }, buffer });
  return summarise(local.get(song.id).song);
}

export async function removeSong(summary) {
  buffers.delete(summary.id);
  if (summary.source === 'device') { local.delete(summary.id); return; }
  if (summary.source === 'server') await api.deleteSong(summary.id);
}

export const formatTime = seconds => {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};
