// Painted background plates. They are optional: every scene has a
// code-drawn fallback, so the game still renders if an image fails to load.
const SOURCES = { festival: '/art/festival.webp', title: '/art/title.webp' };
const images = {};
let loading = null;

export function loadPlates() {
  if (loading) return loading;
  if (typeof Image === 'undefined') return Promise.resolve();
  loading = Promise.all(Object.entries(SOURCES).map(([name, source]) => new Promise(resolve => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => { images[name] = image; resolve(); };
    image.onerror = () => resolve();
    image.src = source;
  })));
  return loading;
}

export const plate = name => images[name] || null;
