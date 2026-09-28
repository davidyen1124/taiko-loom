// Turns decoded audio into a playable song, entirely in the browser.
//
// features.js listens (tempo, beat grid, attacks per band) and charting.js
// writes the charts. Both follow backend/src/taiko_backend step for step, so a
// song analysed here plays like one analysed by the server.

import { AnalysisError, extract } from './features.js';
import { generate } from './charting.js';

export { AnalysisError };

function fingerprint(samples) {
  let hash = 0;
  for (let i = 0; i < samples.length; i += 997) hash = (hash * 31 + Math.round(samples[i] * 32767)) | 0;
  return `${(hash >>> 0).toString(16).padStart(8, '0')}-${samples.length.toString(16)}`;
}

export function analyze(samples, sampleRate, { title = 'Untitled', artist = 'Unknown artist' } = {}) {
  const features = extract(samples, sampleRate);
  const chart = generate(features);
  if (chart.charts.medium.stats.hits < 8) throw new AnalysisError('No clear beat found. Try a more rhythmic song.');
  return {
    version: chart.version,
    id: `device-${fingerprint(samples)}`,
    source: 'device',
    title,
    artist,
    ...chart,
    analysis: 'Spectral flux, tracked beat grid and band-split notes, analysed in the browser',
  };
}
