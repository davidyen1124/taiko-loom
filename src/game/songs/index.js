// The built-in songs. Music and charts are written as data and the audio is
// synthesised in the browser, so the game is playable straight after cloning
// with no audio files in the repo.
import { buildSong } from './score.js';
import { render } from './synth.js';
import { FIRST_SONG, SCORES } from './scores.js';

export { FIRST_SONG };
export const DEMO_SONGS = SCORES.map(buildSong);
export const demoSong = id => DEMO_SONGS.find(song => song.id === id);

const KEEP_RENDERS = 2;           // each is tens of megabytes of samples
const renders = new Map();        // id -> Promise of an AudioBuffer, most recent last

// Renders off the main thread, so the menus stay smooth while it works.
const inWorker = id => new Promise((resolve, reject) => {
  const worker = new Worker(new URL('../../songs.worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }) => { worker.terminate(); resolve(data); };
  worker.onerror = () => { worker.terminate(); reject(new Error('The song could not be prepared.')); };
  worker.postMessage({ id });
});

async function prepare(score) {
  const { left, right, sampleRate } = await inWorker(score.id).catch(() => render(score));
  const buffer = new AudioBuffer({ length: left.length, numberOfChannels: 2, sampleRate });
  buffer.copyToChannel(left, 0);
  buffer.copyToChannel(right, 1);
  return buffer;
}

// Renders a song on first use and keeps the last few.
export function renderDemoAudio(id) {
  const score = SCORES.find(entry => entry.id === id);
  if (!score) return Promise.reject(new Error('This song is not built in.'));
  const ready = renders.get(id) || prepare(score).catch(error => { renders.delete(id); throw error; });
  renders.delete(id);
  renders.set(id, ready);
  while (renders.size > KEEP_RENDERS) renders.delete(renders.keys().next().value);
  return ready;
}
