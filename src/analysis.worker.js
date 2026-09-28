// Runs the on-device analyser off the main thread.
import { analyze } from './game/analyze.js';

self.onmessage = ({ data: { samples, sampleRate, title, artist } }) => {
  try {
    self.postMessage({ song: analyze(samples, sampleRate, { title, artist }) });
  } catch (error) {
    self.postMessage({ error: error.message || 'Could not analyse this audio.' });
  }
};
