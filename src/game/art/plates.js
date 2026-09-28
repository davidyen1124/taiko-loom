// Painted background plates. They are optional: every scene has a
// code-drawn fallback, so the game still renders if an image fails to load.
// Addresses follow the build's base, so the game also runs from a sub-folder
// such as a GitHub Pages project site.
const BASE = import.meta.env?.BASE_URL ?? '/';
const SOURCES = { festival: `${BASE}art/festival.webp`, title: `${BASE}art/title.webp` };
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

// The colour along the bottom edge of a plate, used to continue its ground.
const edges = {};
export function plateEdge(name) {
  if (edges[name]) return edges[name];
  const image = images[name];
  if (!image) return '#e0843e';
  try {
    const canvas = Object.assign(document.createElement('canvas'), { width: 8, height: 1 });
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, image.naturalHeight - 3, image.naturalWidth, 2, 0, 0, 8, 1);
    const data = context.getImageData(0, 0, 8, 1).data;
    const mean = channel => Math.round([0, 1, 2, 3, 4, 5, 6, 7].reduce((sum, i) => sum + data[i * 4 + channel], 0) / 8);
    edges[name] = `rgb(${mean(0)},${mean(1)},${mean(2)})`;
  } catch {
    edges[name] = '#e0843e';
  }
  return edges[name];
}
