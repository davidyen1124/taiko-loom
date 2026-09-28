// Synthesises a built-in song off the main thread.
import { render } from './game/songs/synth.js';
import { SCORES } from './game/songs/scores.js';

self.onmessage = ({ data: { id } }) => {
  const { left, right, sampleRate } = render(SCORES.find(score => score.id === id));
  self.postMessage({ left, right, sampleRate }, [left.buffer, right.buffer]);
};
