// Developer-only sprite sheets, opened with ?gallery or ?gallery=sheet.
// Used for visual QA and as the character reference for generated artwork.
import { useEffect, useRef } from 'react';
import { loadFonts } from '../fonts.js';
import { drawBalloon, drawNote, drawRoll, drawTarget } from '../game/art/notes.js';
import { drawMascot } from '../game/art/mascot.js';
import { dancerSprite, DANCERS } from '../game/art/dancers.js';
import { drawBadge } from '../game/art/hud.js';
import { label, stamp } from '../game/art/draw.js';

const WIDTH = 1536;
const HEIGHT = 1024;

function sheet(c, scale) {
  c.fillStyle = '#fff6e0'; c.fillRect(0, 0, WIDTH, HEIGHT);
  label(c, 'LOOMI  the festival tanuki', 60, 70, { size: 40, fill: '#1a1014', stroke: null, width: 0 });
  const poses = [
    ['idle', { mood: 'idle' }], ['strike', { mood: 'idle', right: 1 }], ['happy', { mood: 'happy', jump: 30 }],
    ['sad', { mood: 'sad' }], ['go-go', { mood: 'gogo', left: 1 }],
  ];
  poses.forEach(([name, pose], i) => {
    drawMascot(c, 170 + i * 300, 560, 1.55, { time: 0.4, ...pose });
    label(c, name, 170 + i * 300, 620, { size: 26, align: 'center', fill: '#1a1014', stroke: null, width: 0 });
  });
  label(c, 'Festival friends', 60, 720, { size: 32, fill: '#1a1014', stroke: null, width: 0 });
  DANCERS.forEach((dancer, i) => {
    const entry = dancerSprite(dancer.id, scale * 1.6);
    stamp(c, entry, 70 + i * 230, 750, 130 * 1.6, 150 * 1.6);
  });
  ['don', 'ka', 'bigDon', 'bigKa'].forEach((type, i) => drawNote(c, type, 1260 + (i % 2) * 140, 800 + Math.floor(i / 2) * 130, scale));
}

function sprites(c, scale, t) {
  c.fillStyle = '#2b282d'; c.fillRect(0, 0, WIDTH, HEIGHT);
  ['don', 'ka', 'bigDon', 'bigKa'].forEach((type, i) => drawNote(c, type, 80 + i * 130, 80, scale));
  drawRoll(c, 'roll', 620, 820, 80, scale);
  drawRoll(c, 'bigRoll', 960, 1200, 80, scale);
  drawBalloon(c, 80, 210, scale, (Math.sin(t * 3) + 1) / 2);
  drawTarget(c, 320, 210, 0, 'don', false);
  drawTarget(c, 460, 210, (Math.sin(t * 6) + 1) / 2, 'don', false);
  drawTarget(c, 600, 210, (Math.sin(t * 6) + 1) / 2, 'ka', true);
  ['easy', 'medium', 'hard'].forEach((level, i) => drawBadge(c, level, 760 + i * 120, 150, 92));
  const beat = (t * 2.2) % 1;
  const bob = Math.max(0, 1 - beat * 3);
  const swing = Math.max(0, 1 - ((t * 2.2) % 2) * 4);
  ['idle', 'happy', 'sad', 'gogo', 'balloon'].forEach((mood, i) => {
    drawMascot(c, 150 + i * 290, 640, 1.3, { bob, left: i % 2 ? swing : 0, right: i % 2 ? 0 : swing, mood, time: t, blink: t % 3 < 0.12, jump: mood === 'happy' ? Math.abs(Math.sin(t * 4)) * 40 : 0 });
    label(c, mood, 150 + i * 290, 700, { size: 20, align: 'center', width: 5 });
  });
  DANCERS.forEach((dancer, i) => stamp(c, dancerSprite(dancer.id, scale), 60 + i * 180, 780));
}

export function Gallery() {
  const ref = useRef();
  const mode = new URLSearchParams(location.search).get('gallery');
  useEffect(() => {
    let frame;
    const canvas = ref.current;
    const ratio = mode === 'sheet' ? 1 : window.devicePixelRatio || 1;
    canvas.width = WIDTH * ratio; canvas.height = HEIGHT * ratio;
    const c = canvas.getContext('2d');
    const started = performance.now();
    const paint = now => {
      c.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (mode === 'sheet') sheet(c, ratio);
      else sprites(c, ratio, (now - started) / 1000);
      if (mode !== 'sheet') frame = requestAnimationFrame(paint);
    };
    loadFonts('LOOMIthefestivaltanukiFestivalfriends').then(() => { paint(performance.now()); window.galleryReady = true; });
    return () => cancelAnimationFrame(frame);
  }, [mode]);
  return <canvas ref={ref} id="gallery" style={{ width: WIDTH, height: HEIGHT, display: 'block' }} />;
}
