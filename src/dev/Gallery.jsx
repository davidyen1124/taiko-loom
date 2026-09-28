// Developer-only sprite sheets, opened with ?gallery or ?gallery=sheet.
// Used for visual QA. ?gallery=sheet is the model sheet kept in docs/art.
import { useEffect, useRef } from 'react';
import { loadFonts } from '../fonts.js';
import { drawBalloon, drawNote, drawRoll, drawTarget } from '../game/art/notes.js';
import { drawMascot } from '../game/art/mascot.js';
import { dancerSprite, DANCERS } from '../game/art/dancers.js';
import { drawBadge } from '../game/art/hud.js';
import { label, stamp } from '../game/art/draw.js';
import { loadPlates } from '../game/art/plates.js';
import { drawSprite, loadSprites } from '../game/art/sprites.js';

const WIDTH = 1536;
const HEIGHT = 1024;

const YORU = ['idle', 'blink', 'don-left', 'don-right', 'ka-left', 'ka-right', 'dance-a', 'dance-b', 'jump', 'oops', 'puff', 'cheer-a', 'cheer-b', 'sad-a', 'sad-b', 'wave'];
const ink = { fill: '#1a1014', stroke: null, width: 0 };

// The model sheet: every painted sprite, each with the name the game calls it by.
function sheet(c) {
  c.fillStyle = '#fff6e0'; c.fillRect(0, 0, WIDTH, HEIGHT);
  label(c, 'YORU  the festival tanuki', 40, 52, { size: 34, ...ink });
  YORU.forEach((id, i) => {
    const x = 104 + (i % 8) * 190;
    const y = 262 + Math.floor(i / 8) * 250;
    drawSprite(c, 'yoru', id, x, y, 176);
    label(c, id, x, y + 26, { size: 17, align: 'center', ...ink });
  });
  label(c, 'Festival friends', 40, 606, { size: 28, ...ink });
  DANCERS.forEach((dancer, i) => {
    ['a', 'b'].forEach((pose, k) => drawSprite(c, 'friends', `${dancer.id}-${pose}`, 90 + i * 300 + k * 144, 800, 150));
    label(c, dancer.id, 162 + i * 300, 826, { size: 17, align: 'center', ...ink });
  });
  label(c, 'Notes, emblems and crowns', 40, 880, { size: 28, ...ink });
  ['don', 'ka', 'roll', 'balloon'].forEach((id, i) => drawSprite(c, 'notes', id, 90 + i * 110, 950, 92));
  drawSprite(c, 'notes', 'float', 540, 950, 70);
  ['blossom', 'leaf', 'flame'].forEach((id, i) => drawSprite(c, 'hud', id, 680 + i * 110, 950, 92));
  ['crown-silver', 'crown-gold', 'crown-rainbow'].forEach((id, i) => drawSprite(c, 'hud', id, 1040 + i * 130, 950, 110));
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
  DANCERS.forEach((dancer, i) => stamp(c, dancerSprite(dancer.id, scale), 30 + i * 230, 780));
}

export function Gallery() {
  const ref = useRef();
  const mode = new URLSearchParams(location.search).get('gallery');
  useEffect(() => {
    let frame;
    const canvas = ref.current;
    const ratio = mode === 'sheet' ? 2 : window.devicePixelRatio || 1;
    canvas.width = WIDTH * ratio; canvas.height = HEIGHT * ratio;
    const c = canvas.getContext('2d');
    const started = performance.now();
    const paint = now => {
      c.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (mode === 'sheet') sheet(c);
      else sprites(c, ratio, (now - started) / 1000);
      if (mode !== 'sheet') frame = requestAnimationFrame(paint);
    };
    Promise.all([loadFonts('YORUthefestivaltanukiFestivalfriends'), loadSprites(), loadPlates()]).then(() => { paint(performance.now()); window.galleryReady = true; });
    return () => cancelAnimationFrame(frame);
  }, [mode]);
  return <canvas ref={ref} id="gallery" style={{ width: WIDTH, height: HEIGHT, display: 'block' }} />;
}
