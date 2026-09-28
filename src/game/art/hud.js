// Heads-up display: soul gauge, player panel, drum, difficulty badges.
import {
  CREAM, CREAM_SHADE, DISPLAY, DON, DON_LIGHT, FONT, INK, KA, KA_LIGHT, TAU,
  box, clamp, disc, ellipse, label, line, path, radial, ring, sprite, stamp, star, vertical,
} from './draw.js';
import { DRUM, GAUGE, PANEL, STAGE } from '../layout.js';
import { COMBO_SHOWN_FROM, LEVELS } from '../rules.js';
import { plate } from './plates.js';
import { drawSprite } from './sprites.js';
import { SKIN } from '../touchDrum.js';

// A difficulty emblem. Painted, it is a whole badge of radius r with its own
// coloured centre; drawn, it is only the symbol, for a badge the caller supplies.
export function drawIcon(c, icon, x, y, r, { badge = false } = {}) {
  if (drawSprite(c, 'hud', icon, x, y, r * (badge ? 2 : 2.5))) return;
  c.save();
  c.translate(x, y);
  if (icon === 'blossom') {
    for (let i = 0; i < 5; i++) {
      c.save();
      c.rotate((i * TAU) / 5);
      c.beginPath();
      c.moveTo(0, 0);
      c.bezierCurveTo(-r * 0.62, -r * 0.35, -r * 0.5, -r * 1.02, -r * 0.1, -r * 0.92);
      c.lineTo(0, -r * 0.74);
      c.lineTo(r * 0.1, -r * 0.92);
      c.bezierCurveTo(r * 0.5, -r * 1.02, r * 0.62, -r * 0.35, 0, 0);
      c.closePath();
      c.fillStyle = '#ffb7c9'; c.fill();
      c.strokeStyle = INK; c.lineWidth = Math.max(2, r * 0.11); c.lineJoin = 'round'; c.stroke();
      c.restore();
    }
    disc(c, 0, 0, r * 0.24, '#ffd34f');
    ring(c, 0, 0, r * 0.24, INK, Math.max(1.5, r * 0.09));
  } else if (icon === 'leaf') {
    c.rotate(0.5);
    c.beginPath();
    c.moveTo(0, r); c.bezierCurveTo(-r * 1.15, r * 0.2, -r * 0.6, -r * 0.95, 0, -r);
    c.bezierCurveTo(r * 0.6, -r * 0.95, r * 1.15, r * 0.2, 0, r);
    c.closePath();
    c.fillStyle = '#7ed04b'; c.fill();
    c.strokeStyle = INK; c.lineWidth = Math.max(2, r * 0.11); c.lineJoin = 'round'; c.stroke();
    line(c, 0, r * 0.82, 0, -r * 0.6, '#2f7a1f', Math.max(1.5, r * 0.1));
    line(c, 0, r * 0.2, -r * 0.36, -r * 0.1, '#2f7a1f', Math.max(1.5, r * 0.08));
    line(c, 0, -r * 0.05, r * 0.34, -r * 0.35, '#2f7a1f', Math.max(1.5, r * 0.08));
  } else {
    const flame = (s, fill, outline) => {
      c.beginPath();
      c.moveTo(0, r * s);
      c.bezierCurveTo(-r * 1.05 * s, r * 0.75 * s, -r * 0.78 * s, -r * 0.2 * s, -r * 0.28 * s, -r * 0.5 * s);
      c.bezierCurveTo(-r * 0.3 * s, -r * 0.1 * s, -r * 0.02 * s, -r * 0.2 * s, r * 0.06 * s, -r * 1.05 * s);
      c.bezierCurveTo(r * 0.5 * s, -r * 0.55 * s, r * 1.0 * s, r * 0.1 * s, r * 0.72 * s, r * 0.62 * s);
      c.bezierCurveTo(r * 0.6 * s, r * 0.85 * s, r * 0.3 * s, r * s, 0, r * s);
      c.closePath();
      c.fillStyle = fill; c.fill();
      if (outline) { c.strokeStyle = INK; c.lineWidth = Math.max(2, r * 0.11); c.lineJoin = 'round'; c.stroke(); }
    };
    flame(1, '#5aa2ff', true);
    c.translate(0, r * 0.32);
    flame(0.56, '#d6f0ff', false);
  }
  c.restore();
}

export function drawBadge(c, difficulty, x, y, width = 96) {
  const level = LEVELS[difficulty];
  const height = 102;
  box(c, x, y + 4, width, height, 12, 'rgba(26,16,20,.35)');
  box(c, x, y, width, height, 12, CREAM, INK, 4);
  box(c, x + 5, y + 5, width - 10, 62, 8, level.color);
  c.save();
  c.globalAlpha = 0.18;
  box(c, x + 5, y + 5, width - 10, 28, 8, '#fff');
  c.restore();
  drawIcon(c, level.icon, x + width / 2, y + 37, 22);
  label(c, level.jp, x + width / 2, y + 85, {
    size: level.jp.length > 4 ? 15 : 19, align: 'center', baseline: 'middle', fill: level.dark, stroke: null, width: 0, weight: 900,
  });
}

function panelBase(scale) {
  return sprite('panel', PANEL.width, PANEL.height, scale, (c, w, h) => {
    c.fillStyle = vertical(c, 0, h, [[0, '#f0522f'], [1, '#c8361c']]);
    c.fillRect(0, 0, w, h);
    // hemp-leaf star lattice, a classic happi-coat pattern
    c.save();
    c.globalAlpha = 0.13;
    c.strokeStyle = '#fff'; c.lineWidth = 2;
    const s = 34;
    for (let row = -1; row < h / (s * 0.866) + 1; row++) {
      for (let col = -1; col < w / s + 1; col++) {
        const x = col * s + (row % 2 ? s / 2 : 0);
        const y = row * s * 0.866;
        for (let k = 0; k < 3; k++) {
          const a = (k * Math.PI) / 3;
          c.beginPath();
          c.moveTo(x - Math.cos(a) * s / 2, y - Math.sin(a) * s / 2);
          c.lineTo(x + Math.cos(a) * s / 2, y + Math.sin(a) * s / 2);
          c.stroke();
        }
      }
    }
    c.restore();
    c.fillStyle = vertical(c, 0, h, [[0, 'rgba(255,255,255,.16)'], [0.25, 'rgba(255,255,255,0)'], [1, 'rgba(26,16,20,.22)']]);
    c.fillRect(0, 0, w, h);
  });
}

function drumBase(scale) {
  const size = DRUM.radius * 2 + 20;
  const painted = plate('drum');
  return sprite(painted ? 'drum-painted' : 'drum', size, size, scale, (c, w) => {
    const m = w / 2;
    const r = DRUM.radius;
    if (painted) {
      c.globalAlpha = 0.3;
      ellipse(c, m, m + 7, r + 2, r + 1, INK);
      c.globalAlpha = 1;
      c.imageSmoothingQuality = 'high';
      c.drawImage(painted, m - r - 3, m - r - 3, (r + 3) * 2, (r + 3) * 2);
      return;
    }
    c.globalAlpha = 0.3;
    ellipse(c, m, m + 7, r + 2, r + 1, INK);
    c.globalAlpha = 1;
    disc(c, m, m, r + 3, INK);
    disc(c, m, m, r, '#8e2f16');
    c.save();
    c.beginPath(); c.arc(m, m, r, 0, TAU); c.clip();
    disc(c, m, m - 5, r, '#b7431f');
    c.restore();
    // tacks around the rim
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * TAU;
      disc(c, m + Math.cos(a) * (r - 6.5), m + Math.sin(a) * (r - 6.5), 3.4, INK);
      disc(c, m + Math.cos(a) * (r - 6.5) - 0.7, m + Math.sin(a) * (r - 6.5) - 0.7, 2, '#ffd98a');
    }
    disc(c, m, m, r - 13, INK);
    disc(c, m, m, r - 16, CREAM_SHADE);
    disc(c, m, m - 3, r - 17, CREAM);
    ring(c, m, m, r - 32, 'rgba(180,140,80,.45)', 2.5);
  });
}

// flashes: { leftDon, rightDon, leftKa, rightKa } each 0..1
export function drawDrum(c, scale, flashes, punch = 0) {
  const { x, y, radius: r } = DRUM;
  const base = drumBase(scale);
  const grow = 1 - punch * 0.04;
  c.save();
  c.translate(x, y);
  c.scale(grow, grow);
  stamp(c, base, -base.width / 2, -base.height / 2);
  const half = (side, inner, outer, color, amount) => {
    if (amount <= 0) return;
    const start = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
    c.save();
    c.globalAlpha = clamp(amount);
    c.beginPath();
    c.arc(0, 0, outer, start, start + Math.PI);
    c.arc(0, 0, inner, start + Math.PI, start, true);
    c.closePath();
    c.fillStyle = color; c.fill();
    c.restore();
  };
  // the painted drum's skin is a set share of its width
  const skin = plate('drum') ? (r + 3) * SKIN : r - 17;
  half('left', 0, skin, DON_LIGHT, flashes.leftDon * (plate('drum') ? 0.85 : 1));
  half('right', 0, skin, DON_LIGHT, flashes.rightDon * (plate('drum') ? 0.85 : 1));
  half('left', skin + 5, r + 1, KA_LIGHT, flashes.leftKa * (plate('drum') ? 0.8 : 1));
  half('right', skin + 5, r + 1, KA_LIGHT, flashes.rightKa * (plate('drum') ? 0.8 : 1));
  if (flashes.leftDon > 0 || flashes.rightDon > 0) {
    c.globalAlpha = clamp(Math.max(flashes.leftDon, flashes.rightDon));
    ring(c, 0, 0, skin, DON, 3);
  }
  c.restore();
}

export function drawPanel(c, scale, { difficulty, score, combo, comboPop, flashes, punch }) {
  stamp(c, panelBase(scale), PANEL.x, PANEL.y);
  // score tab, top left
  c.beginPath();
  c.moveTo(0, PANEL.y); c.lineTo(178, PANEL.y); c.lineTo(178, PANEL.y + 24);
  c.arcTo(178, PANEL.y + 40, 162, PANEL.y + 40, 16); c.lineTo(0, PANEL.y + 40); c.closePath();
  c.fillStyle = '#0d090c'; c.fill();
  label(c, String(score), 164, PANEL.y + 21, {
    size: 27, align: 'right', baseline: 'middle', fill: '#fff', stroke: null, width: 0, family: DISPLAY, weight: 400, spacing: 1.5, maxWidth: 150,
  });
  drawBadge(c, difficulty, 18, PANEL.y + 50, 92);
  drawDrum(c, scale, flashes, punch);
  if (combo >= COMBO_SHOWN_FROM) {
    const stretch = 1 + 0.16 * clamp(comboPop);
    const size = combo >= 1000 ? 35 : combo >= 100 ? 47 : 54;
    let fill = '#fff';
    if (combo >= 100) fill = vertical(c, -size / 2, size / 2, [[0, '#fff1b8'], [0.5, '#ffc321'], [1, '#ff5a1e']]);
    else if (combo >= 50) fill = vertical(c, -size / 2, size / 2, [[0, '#ffffff'], [1, '#c9d3e6']]);
    c.save();
    c.translate(DRUM.x, DRUM.y - 6);
    c.scale(1, stretch);
    label(c, String(combo), 0, 0, {
      size, align: 'center', baseline: 'middle', fill, stroke: INK, width: combo >= 1000 ? 8 : 9, family: DISPLAY, weight: 400, shadow: 3,
      spacing: combo >= 1000 ? -1.5 : 0, maxWidth: DRUM.radius * 2 - 8,
    });
    c.restore();
    label(c, 'コンボ', DRUM.x, DRUM.y + 38, {
      size: 17, align: 'center', baseline: 'middle', fill: combo >= 100 ? '#ffe36a' : '#fff', stroke: INK, width: 6, weight: 900,
    });
  }
}

export function drawGauge(c, { value, clear, time, pulse = 0 }) {
  const { x, y, width, height, tall, segments, orbX, orbY, orbRadius } = GAUGE;
  const step = width / segments;
  const bottom = y + tall;
  const clearAt = Math.round((clear / 100) * segments);
  const filled = Math.floor((clamp(value, 0, 100) / 100) * segments + 1e-6);
  const splitX = x + clearAt * step;
  const cleared = value >= clear;
  const full = value >= 100;

  c.save();
  // frame: a low bar up to the clear line, then a tall tab to the right edge
  box(c, x - 8, bottom - height - 6, width + 16, height + 12, 8, INK);
  box(c, splitX - 7, y - 6, STAGE.width - (splitX - 7) + 12, tall + 12, 10, INK);

  for (let i = 0; i < segments; i++) {
    const past = i >= clearAt;
    const sx = x + i * step + 1.5;
    const sh = past ? tall : height;
    const sy = bottom - sh;
    const on = i < filled;
    if (!on) c.fillStyle = past ? '#5a4410' : '#5c1a12';
    else if (past) c.fillStyle = full ? `hsl(${(i * 16 + time * 260) % 360} 96% 62%)` : '#ffe14a';
    else c.fillStyle = vertical(c, sy, sy + sh, [[0, '#ff6a3c'], [1, '#ee3a1e']]);
    c.fillRect(sx, sy, step - 3, sh);
    if (on) {
      c.fillStyle = past ? 'rgba(255,255,255,.7)' : 'rgba(255,190,170,.75)';
      c.fillRect(sx, sy, step - 3, 3.5);
    }
  }
  if (pulse > 0 && filled > 0) {
    const i = filled - 1;
    const sh = i >= clearAt ? tall : height;
    c.globalAlpha = clamp(pulse) * 0.85;
    c.fillStyle = '#fff';
    c.fillRect(x + i * step + 1.5, bottom - sh, step - 3, sh);
    c.globalAlpha = 1;
  }

  label(c, 'クリア', splitX - 12, bottom - height - 17, {
    size: 17, align: 'right', baseline: 'middle', fill: cleared ? '#fff' : '#a59aa2', stroke: INK, width: 5, weight: 900, spacing: 1,
  });

  // soul orb
  if (cleared) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const glow = orbRadius * (1.8 + 0.15 * Math.sin(time * 6));
    c.fillStyle = radial(c, orbX, orbY, glow, [[0, full ? 'rgba(255,230,120,.9)' : 'rgba(255,190,80,.6)'], [1, 'rgba(255,160,40,0)']]);
    c.fillRect(orbX - glow, orbY - glow, glow * 2, glow * 2);
    c.restore();
  }
  if (full) {
    c.save();
    c.translate(orbX, orbY);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + time * 1.2;
      const len = orbRadius + 11 + 6 * Math.sin(time * 9 + i * 2.1);
      c.beginPath();
      c.moveTo(Math.cos(a - 0.22) * orbRadius, Math.sin(a - 0.22) * orbRadius);
      c.quadraticCurveTo(Math.cos(a) * len * 1.05, Math.sin(a) * len * 1.05, Math.cos(a + 0.12) * len, Math.sin(a + 0.12) * len);
      c.lineTo(Math.cos(a + 0.22) * orbRadius, Math.sin(a + 0.22) * orbRadius);
      c.closePath();
      c.fillStyle = i % 2 ? '#ffb03a' : '#ff5a2a'; c.fill();
      c.strokeStyle = INK; c.lineWidth = 2.5; c.lineJoin = 'round'; c.stroke();
    }
    c.restore();
  }
  disc(c, orbX, orbY, orbRadius + 3, INK);
  disc(c, orbX, orbY, orbRadius, cleared ? (full ? '#ff4a2a' : '#ff7a2a') : '#4a3a44');
  c.save();
  c.beginPath(); c.arc(orbX, orbY, orbRadius, 0, TAU); c.clip();
  c.globalAlpha = 0.3;
  disc(c, orbX - 6, orbY - 13, orbRadius * 0.85, '#fff');
  c.restore();
  label(c, '魂', orbX, orbY + 1, {
    size: 33, align: 'center', baseline: 'middle', fill: cleared ? '#fff6c9' : '#9c8f98', stroke: INK, width: 5, family: DISPLAY, weight: 400,
  });
  c.restore();
}

export function drawSparkle(c, x, y, size, rotation, fill = '#fff6c9') {
  c.save();
  c.translate(x, y);
  star(c, 0, 0, size, size * 0.34, 4, rotation);
  c.fillStyle = fill; c.fill();
  c.restore();
}

export { DON, KA };
