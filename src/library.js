// The song shelf: the built-in songs, songs analysed in this browser (saved
// on this device), and songs analysed by the backend when there is one.
import * as api from './api.js';
import * as store from './songStore.js';
import { audio } from './game/audio.js';
import { DEMO_SONGS, demoSong, renderDemoAudio } from './game/songs/index.js';

const local = new Map();          // id -> { song, file }; file is absent until asked for
const buffers = new Map();        // id -> AudioBuffer, most recent last
const KEEP_BUFFERS = 2;
let restored = null;
let link = null;                  // { id, url } the one object URL handed out

const levelsOf = song => Object.fromEntries(
  Object.entries(song.charts).map(([name, chart]) => [name, { stars: chart.stars, ...chart.stats }]),
);

export const summarise = song => ({
  id: song.id, title: song.title, artist: song.artist, bpm: song.bpm, duration: song.duration, colour: song.colour,
  source: song.source || 'server', levels: song.levels || levelsOf(song), gogo: song.gogo?.[0]?.[0] ?? null,
});

// Reads the saved songs once. A browser that refuses storage just has none.
function restore() {
  restored ||= store.savedSongs()
    .then(songs => songs.forEach(song => { if (!local.has(song.id)) local.set(song.id, { song }); }))
    .catch(() => {});
  return restored;
}

export async function loadShelf() {
  await restore();
  const shelf = [...DEMO_SONGS, ...[...local.values()].map(entry => entry.song)].map(summarise);
  if (!api.HAS_BACKEND) return { online: false, backend: false, songs: shelf };
  const online = await api.health();
  if (!online) return { online, backend: true, songs: shelf };
  try {
    const songs = await api.listSongs();
    return { online, backend: true, songs: [...shelf, ...songs.map(song => ({ ...song, source: 'server' }))] };
  } catch {
    return { online: false, backend: true, songs: shelf };
  }
}

export async function loadSong(summary) {
  if (summary.source === 'demo') return demoSong(summary.id);
  if (summary.source === 'device') return local.get(summary.id).song;
  return { ...(await api.getSong(summary.id)), source: 'server' };
}

function remember(id, buffer) {
  buffers.delete(id);
  buffers.set(id, buffer);
  while (buffers.size > KEEP_BUFFERS) buffers.delete(buffers.keys().next().value);
  return buffer;
}

async function fileOf(id) {
  const entry = local.get(id);
  if (entry && !entry.file) entry.file = await store.savedAudio(id).catch(() => null);
  if (!entry?.file) throw new Error('The audio for this song is no longer saved in this browser.');
  return entry.file;
}

export async function loadAudio(song, onProgress = () => {}) {
  if (buffers.has(song.id)) return remember(song.id, buffers.get(song.id));
  if (song.source === 'demo') return renderDemoAudio(song.id);
  if (song.source === 'device') {
    const bytes = await (await fileOf(song.id)).arrayBuffer();
    onProgress(0.5);
    return remember(song.id, await audio.decode(bytes));
  }
  const bytes = await api.fetchAudio(song.audio, fraction => onProgress(fraction * 0.9));
  const buffer = await audio.decode(bytes);
  onProgress(1);
  return remember(song.id, buffer);
}

// An address an <audio> element can play a saved song from.
export async function localAudioUrl(id) {
  if (link?.id === id) return link.url;
  const file = await fileOf(id);
  if (link) URL.revokeObjectURL(link.url);
  link = { id, url: URL.createObjectURL(file) };
  return link.url;
}

// Adds a song analysed in this browser. Resolves with its shelf entry and
// whether it could be saved for next time.
export async function keepLocalSong(song, buffer, file) {
  const kept = { ...song, source: 'device', addedAt: Date.now() };
  local.set(kept.id, { song: kept, file });
  remember(kept.id, buffer);
  const saved = await store.saveSong(kept, file).then(() => true, () => false);
  return { ...summarise(kept), saved };
}

export async function removeSong(summary) {
  buffers.delete(summary.id);
  if (link?.id === summary.id) { URL.revokeObjectURL(link.url); link = null; }
  if (summary.source === 'device') {
    local.delete(summary.id);
    await store.forgetSong(summary.id).catch(() => {});
    return;
  }
  if (summary.source === 'server') await api.deleteSong(summary.id);
}

export const formatTime = seconds => {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};
