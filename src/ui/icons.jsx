// Small pieces of artwork used by the menus.
import { useCallback } from 'react';
import { Art } from './Art.jsx';
import { drawIcon } from '../game/art/hud.js';
import { drawNote } from '../game/art/notes.js';
import { drawMascot } from '../game/art/mascot.js';
import { LEVELS } from '../game/rules.js';

export function LevelIcon({ level, size = 44 }) {
  const draw = useCallback(c => drawIcon(c, LEVELS[level].icon, size / 2, size / 2, size * 0.42), [level, size]);
  return <Art width={size} height={size} draw={draw} />;
}

export function NoteIcon({ type, size = 64 }) {
  const draw = useCallback((c, time, scale) => {
    const natural = type.startsWith('big') ? 110 : 76;
    c.save();
    c.translate(size / 2, size / 2);
    c.scale(size / natural, size / natural);
    drawNote(c, type, 0, 0, scale * (size / natural));
    c.restore();
  }, [type, size]);
  return <Art width={size} height={size} draw={draw} />;
}

// Loomi in a box of his own. The figure is drawn at 1/300 of the box per
// unit, which leaves room for raised sticks, the tail and a jump.
export function Mascot({ size = 200, mood = 'idle', bpm = 120, drumming = false }) {
  const draw = useCallback((c, time) => {
    const beats = time * (bpm / 60);
    const beat = beats % 1;
    const left = drumming ? Math.max(0, 1 - ((beats % 2) * 3)) : 0;
    const right = drumming ? Math.max(0, 1 - (((beats + 1) % 2) * 3)) : 0;
    drawMascot(c, size * 0.49, size * 0.97, size / 300, {
      bob: Math.max(0, 1 - beat * 2.6), left, right, mood, time, blink: time % 3.7 < 0.12,
      jump: mood === 'happy' ? Math.abs(Math.sin(beats * Math.PI)) * size * 0.06 : 0,
    });
  }, [size, mood, bpm, drumming]);
  return <Art width={size} height={size} draw={draw} animate label="Loomi the tanuki" />;
}

const CROWNS = {
  silver: ['#f4f7fb', '#9aa7ba', '#5d6a7d'],
  gold: ['#fff1a8', '#f4b52e', '#a86a0a'],
  rainbow: ['#fff', '#ff7ad1', '#6a3fd1'],
};

export function Crown({ kind, size = 40 }) {
  if (!kind) return <span className="crown crown-empty" style={{ width: size, height: size * 0.8 }} aria-label="No crown yet" />;
  const [light, base, dark] = CROWNS[kind];
  const id = `crown-${kind}`;
  return (
    <svg className={`crown crown-${kind}`} width={size} height={size * 0.8} viewBox="0 0 50 40" role="img" aria-label={`${kind} crown`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          {kind === 'rainbow'
            ? ['#ff5a5a', '#ffb03a', '#ffe14a', '#6ad66a', '#4fc0d8', '#a06aff'].map((color, i) => <stop key={color} offset={i / 5} stopColor={color} />)
            : [<stop key="a" offset="0" stopColor={light} />, <stop key="b" offset="0.55" stopColor={base} />, <stop key="c" offset="1" stopColor={dark} />]}
        </linearGradient>
      </defs>
      <path d="M5 33 L3 11 L15 21 L25 5 L35 21 L47 11 L45 33 Z" fill={`url(#${id})`} stroke="#1a1014" strokeWidth="3.5" strokeLinejoin="round" />
      <rect x="5" y="30" width="40" height="7" rx="2" fill={base} stroke="#1a1014" strokeWidth="3.5" />
      <circle cx="25" cy="22" r="3.6" fill={kind === 'gold' ? '#f2452b' : '#4fc0d8'} stroke="#1a1014" strokeWidth="2" />
    </svg>
  );
}

export function Stars({ count, max, color }) {
  return (
    <span className="stars" aria-label={`${count} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => <i key={i} className={i < count ? 'on' : ''} style={i < count ? { color } : undefined}>★</i>)}
    </span>
  );
}
