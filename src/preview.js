// Plays a short loop of the highlighted song on the song select screen.
import { audio } from './game/audio.js';
import { renderDemoAudio } from './game/songs/index.js';
import { audioUrl } from './library.js';

const LENGTH = 14;
let current = null;
let token = 0;

export function stopPreview() {
  token++;
  if (!current) return;
  const { element, source, gain, timer } = current;
  clearTimeout(timer);
  current = null;
  if (element) {
    const fade = setInterval(() => {
      element.volume = Math.max(0, element.volume - 0.12);
      if (element.volume <= 0.01) { clearInterval(fade); element.pause(); element.removeAttribute('src'); element.load(); }
    }, 30);
  }
  if (source && audio.context) {
    const now = audio.context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.25);
    try { source.stop(now + 0.3); } catch { /* already stopped */ }
  }
}

export async function startPreview(song, volume) {
  stopPreview();
  const mine = ++token;
  if (!audio.ready || volume <= 0) return;
  const from = Math.max(0, Math.min(song.gogo ?? song.duration * 0.3, song.duration - LENGTH - 1));
  const level = volume ** 1.6 * 0.8;
  const again = () => setTimeout(() => { if (mine === token) startPreview(song, volume); }, LENGTH * 1000);

  if (song.source !== 'demo') {
    // one of your songs: streamed from the saved file, so a long song is not
    // decoded whole just to hear a few bars
    const address = await audioUrl(song.id).catch(() => null);
    if (mine !== token || !address) return;
    const element = new Audio();
    element.preload = 'auto';
    element.src = address;
    element.volume = 0;
    element.addEventListener('loadedmetadata', () => {
      if (mine !== token) return;
      element.currentTime = from;
      element.play().then(() => {
        if (mine !== token) { element.pause(); return; }
        const rise = setInterval(() => {
          if (mine !== token) { clearInterval(rise); return; }
          element.volume = Math.min(level, element.volume + level / 12);
          if (element.volume >= level) clearInterval(rise);
        }, 30);
      }).catch(() => {});
    }, { once: true });
    current = { element, timer: again() };
    return;
  }

  const buffer = await renderDemoAudio(song.id).catch(() => null);
  if (mine !== token || !buffer) return;
  const context = audio.context;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0, context.currentTime);
  gain.gain.linearRampToValueAtTime(level, context.currentTime + 0.4);
  gain.connect(context.destination);
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(gain);
  source.start(0, from, LENGTH + 1);
  current = { source, gain, timer: again() };
}
