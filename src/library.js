// The song shelf: the built-in songs, and the songs you have added. Your
// songs are analysed in this browser and saved on this device; nothing is
// uploaded anywhere.
import * as store from './songStore.js';
import { audio } from './game/audio.js';
import { DEMO_SONGS, demoSong, renderDemoAudio } from './game/songs/index.js';

const mine = new Map();           // id -> { song, file }; file is absent until asked for
const buffers = new Map();        // id -> AudioBuffer, most recent last
const KEEP_BUFFERS = 2;
let restored = null;
let link = null;                  // { id, url } the one object URL handed out

const levelsOf = song => Object.fromEntries(
  Object.entries(song.charts).map(([name, chart]) => [name, { stars: chart.stars, ...chart.stats }]),
);

export const summarise = song => ({
  id: song.id, title: song.title, artist: song.artist, bpm: song.bpm, duration: song.duration, colour: song.colour,
  source: song.source, levels: song.levels || levelsOf(song), gogo: song.gogo?.[0]?.[0] ?? null,
});

// Reads the saved songs once. A browser that refuses storage just has none.
function restore() {
  restored ||= store.savedSongs()
    .then(songs => songs.forEach(song => { if (!mine.has(song.id)) mine.set(song.id, { song }); }))
    .catch(() => {});
  return restored;
}

export async function loadShelf() {
  await restore();
  return [...DEMO_SONGS, ...[...mine.values()].map(entry => entry.song)].map(summarise);
}

export const loadSong = summary => (summary.source === 'demo' ? demoSong(summary.id) : mine.get(summary.id).song);

function remember(id, buffer) {
  buffers.delete(id);
  buffers.set(id, buffer);
  while (buffers.size > KEEP_BUFFERS) buffers.delete(buffers.keys().next().value);
  return buffer;
}

async function fileOf(id) {
  const entry = mine.get(id);
  if (entry && !entry.file) entry.file = await store.savedAudio(id).catch(() => null);
  if (!entry?.file) throw new Error('The audio for this song is no longer saved in this browser.');
  return entry.file;
}

export async function loadAudio(song, onProgress = () => {}) {
  if (buffers.has(song.id)) return remember(song.id, buffers.get(song.id));
  if (song.source === 'demo') return renderDemoAudio(song.id);
  const bytes = await (await fileOf(song.id)).arrayBuffer();
  onProgress(0.5);
  return remember(song.id, await audio.decode(bytes));
}

// An address an <audio> element can play one of your songs from.
export async function audioUrl(id) {
  if (link?.id === id) return link.url;
  const file = await fileOf(id);
  if (link) URL.revokeObjectURL(link.url);
  link = { id, url: URL.createObjectURL(file) };
  return link.url;
}

// Adds a song that has just been analysed. Resolves with its shelf entry and
// whether it could be saved for next time.
export async function keepSong(song, buffer, file) {
  const kept = { ...song, source: 'device', addedAt: Date.now() };
  mine.set(kept.id, { song: kept, file });
  remember(kept.id, buffer);
  const saved = await store.saveSong(kept, file).then(() => true, () => false);
  return { ...summarise(kept), saved };
}

export async function removeSong(summary) {
  buffers.delete(summary.id);
  if (link?.id === summary.id) { URL.revokeObjectURL(link.url); link = null; }
  mine.delete(summary.id);
  await store.forgetSong(summary.id).catch(() => {});
}

export const formatTime = seconds => {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};
