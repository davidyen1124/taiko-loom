// Keyboard and touch mapping. Four pads, like sticks on a real drum:
// the outer keys strike the rim (ka), the inner keys strike the face (don).
export const KEYS = {
  d: { kind: 'ka', hand: 'left' },
  f: { kind: 'don', hand: 'left' },
  j: { kind: 'don', hand: 'right' },
  k: { kind: 'ka', hand: 'right' },
};

export const PADS = [
  { key: 'D', kind: 'ka', hand: 'left' },
  { key: 'F', kind: 'don', hand: 'left' },
  { key: 'J', kind: 'don', hand: 'right' },
  { key: 'K', kind: 'ka', hand: 'right' },
];

export function padForKey(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  return KEYS[event.key.toLowerCase()] || null;
}

// Touch: the screen is a drum. Outer fifths are the rim, the middle is the face.
export function padForPoint(x, width) {
  const ratio = x / width;
  if (ratio < 0.2) return PADS[0];
  if (ratio < 0.5) return PADS[1];
  if (ratio < 0.8) return PADS[2];
  return PADS[3];
}

// Menus are driven like the drum too: rim moves, face confirms.
export function menuAction(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  const key = event.key;
  if (key === 'ArrowLeft' || key === 'd' || key === 'D') return 'left';
  if (key === 'ArrowRight' || key === 'k' || key === 'K') return 'right';
  if (key === 'ArrowUp') return 'up';
  if (key === 'ArrowDown') return 'down';
  if (key === 'Enter' || key === ' ' || key === 'f' || key === 'F' || key === 'j' || key === 'J') return 'confirm';
  if (key === 'Escape' || key === 'Backspace') return 'back';
  return null;
}
