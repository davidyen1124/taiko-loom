// Short-lived animations: hit bursts, judgement text, notes flying to the
// gauge, fireworks, Go-Go flames and speech bubbles.
import {
  DISPLAY, DON, FONT, GOLD, INK, KA, ROLL, TAU,
  box, clamp, disc, easeBack, easeOut, label, lerp, path, radial, ring, seeded, star,
} from './draw.js';
import { LANE, TARGET } from '../layout.js';

const JUDGE = {
  good: { text: '良', fill: '#ffd23a', stroke: '#c8341e', glow: '#ffb03a' },
  ok: { text: '可', fill: '#ffffff', stroke: '#3f6f9c', glow: '#9fd8ff' },
  bad: { text: '不可', fill: '#b9a6d9', stroke: '#3a2a5c', glow: '#6a5a9c' },
};

export class Effects {
  constructor() {
    this.items = [];
    this.random = seeded(99);
  }

  clear() {
    this.items = [];
  }

  dismiss(type) {
    this.items = this.items.filter(item => item.type !== type);
  }

  add(item) {
    this.items.push(item);
    if (this.items.length > 220) this.items.splice(0, this.items.length - 220);
  }

  burst(now, judgement, big, kind) {
    this.add({ type: 'burst', at: now, life: big ? 0.42 : 0.34, judgement, big, kind, spin: this.random() * TAU });
  }

  judge(now, judgement) {
    this.items = this.items.filter(item => item.type !== 'judge');
    this.add({ type: 'judge', at: now, life: 0.5, judgement });
  }

  fly(now, noteType) {
    this.add({ type: 'fly', at: now, life: 0.46, noteType });
  }

  firework(now, x, y, hue, size = 1) {
    this.add({ type: 'firework', at: now, life: 1.5, x, y, hue, size, seed: Math.floor(this.random() * 1e6) });
  }

  pop(now, x, y) {
    this.add({ type: 'pop', at: now, life: 0.5, x, y, seed: Math.floor(this.random() * 1e6) });
  }

  callout(now, text, sub) {
    this.items = this.items.filter(item => item.type !== 'callout');
    this.add({ type: 'callout', at: now, life: 1.7, text, sub });
  }

  banner(now, text, color) {
    this.items = this.items.filter(item => item.type !== 'banner');
    this.add({ type: 'banner', at: now, life: 1.6, text, color });
  }

  shatter(now, combo) {
    this.add({ type: 'shatter', at: now, life: 0.6, combo });
  }

  prune(now) {
    this.items = this.items.filter(item => now - item.at < item.life);
  }

  // Effects that belong to the lane (drawn above the notes, and kept inside it).
  drawLane(c, now) {
    for (const item of this.items) {
      if (item.type === 'burst') drawBurst(c, item, clamp((now - item.at) / item.life));
    }
  }

  // Effects over the lane that are free to leave it. `banner` is where a
  // banner comes to rest.
  drawOverLane(c, now, banner) {
    for (const item of this.items) {
      if (now < item.at) continue;
      const t = clamp((now - item.at) / item.life);
      if (item.type === 'judge') drawJudge(c, item, t);
      else if (item.type === 'shatter') drawShatter(c, item, t);
      else if (item.type === 'banner') drawBanner(c, item, t, banner);
    }
  }

  drawScene(c, now) {
    for (const item of this.items) {
      if (now < item.at) continue;
      if (item.type === 'firework') drawFirework(c, item, clamp((now - item.at) / item.life));
    }
  }

  // Effects in the sky band, in its units. `bubble` is where the mascot's
  // speech bubble hangs.
  drawBand(c, now, bubble) {
    for (const item of this.items) {
      if (now < item.at) continue;
      const t = clamp((now - item.at) / item.life);
      if (item.type === 'callout') drawCallout(c, item, t, bubble);
      else if (item.type === 'pop') drawPop(c, item, t);
    }
  }
}

function drawBurst(c, item, t) {
  const { x, y } = TARGET;
  const look = JUDGE[item.judgement];
  const reach = (item.big ? 96 : 66) * easeOut(t);
  const fade = 1 - t;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = fade * 0.9;
  c.fillStyle = radial(c, x, y, reach + 30, [[0, 'rgba(255,255,255,.9)'], [0.35, look.glow], [1, 'rgba(255,255,255,0)']]);
  c.fillRect(x - reach - 30, y - reach - 30, (reach + 30) * 2, (reach + 30) * 2);
  c.restore();
  c.save();
  c.globalAlpha = fade;
  ring(c, x, y, 30 + reach * 0.75, item.judgement === 'good' ? '#fff3a8' : '#ffffff', 7 * fade + 1);
  const rays = item.big ? 12 : 8;
  c.fillStyle = item.judgement === 'good' ? GOLD : '#e8f6ff';
  c.strokeStyle = INK; c.lineWidth = 2.5; c.lineJoin = 'round';
  for (let i = 0; i < rays; i++) {
    const a = item.spin + (i / rays) * TAU;
    const d = 38 + reach;
    const s = (item.big ? 15 : 11) * (1 - t * 0.6);
    c.save();
    c.translate(x + Math.cos(a) * d, y + Math.sin(a) * d);
    star(c, 0, 0, s, s * 0.36, 4, a);
    c.fill(); c.stroke();
    c.restore();
  }
  c.restore();
}

function drawJudge(c, item, t) {
  const look = JUDGE[item.judgement];
  const rise = easeOut(clamp(t * 2.2)) * 20;
  const scale = item.judgement === 'bad' ? 1 : 0.7 + 0.3 * easeBack(clamp(t * 4));
  const alpha = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
  const shake = item.judgement === 'bad' ? Math.sin(t * 60) * 3 * (1 - t) : 0;
  c.save();
  c.globalAlpha = alpha;
  c.translate(TARGET.x + shake, LANE.y - 12 - rise);
  c.scale(scale, scale);
  label(c, look.text, 0, 0, {
    size: item.judgement === 'bad' ? 32 : 40, align: 'center', baseline: 'middle',
    fill: look.fill, stroke: look.stroke, width: 9, family: DISPLAY, weight: 400, shadow: 3, shadowColor: INK,
  });
  c.restore();
}

function drawPop(c, item, t) {
  const random = seeded(item.seed);
  c.save();
  c.globalAlpha = 1 - t;
  ring(c, item.x, item.y, 30 + easeOut(t) * 90, '#fff', 8 * (1 - t) + 1);
  const colors = ['#ff5f7e', '#ffd34f', '#4fc0d8', '#fff'];
  for (let i = 0; i < 22; i++) {
    const a = random() * TAU;
    const d = (40 + random() * 120) * easeOut(t);
    const x = item.x + Math.cos(a) * d;
    const y = item.y + Math.sin(a) * d + t * t * 60;
    c.save();
    c.translate(x, y); c.rotate(a + t * 8);
    box(c, -6, -3.5, 12, 7, 2, colors[i % colors.length], INK, 2);
    c.restore();
  }
  c.restore();
}

function drawFirework(c, item, t) {
  const random = seeded(item.seed);
  const rise = clamp(t / 0.22);
  c.save();
  if (rise < 1) {
    const y = lerp(330, item.y, easeOut(rise));
    c.globalAlpha = 0.9;
    disc(c, item.x, y, 3, '#fff6c9');
    c.globalAlpha = 0.35;
    c.strokeStyle = '#fff6c9'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(item.x, y); c.lineTo(item.x, y + 26); c.stroke();
    c.restore();
    return;
  }
  const p = (t - 0.22) / 0.78;
  const reach = easeOut(p) * 92 * item.size;
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = (1 - p) * 0.7;
  c.fillStyle = radial(c, item.x, item.y, reach + 50, [[0, `hsla(${item.hue} 100% 80% / .6)`], [1, `hsla(${item.hue} 100% 60% / 0)`]]);
  c.fillRect(item.x - reach - 50, item.y - reach - 50, (reach + 50) * 2, (reach + 50) * 2);
  for (let ringIndex = 0; ringIndex < 2; ringIndex++) {
    const count = ringIndex ? 12 : 20;
    const hue = item.hue + ringIndex * 45;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + random() * 0.2;
      const d = reach * (ringIndex ? 0.55 : 1) * (0.9 + random() * 0.2);
      const x = item.x + Math.cos(a) * d;
      const y = item.y + Math.sin(a) * d + p * p * 34;
      c.globalAlpha = clamp((1 - p) * 1.4) * (0.6 + 0.4 * Math.sin(p * 30 + i));
      disc(c, x, y, (ringIndex ? 3 : 4) * (1 - p * 0.5), `hsl(${hue} 100% ${70 + 20 * (1 - p)}%)`);
      c.globalAlpha *= 0.4;
      c.strokeStyle = `hsl(${hue} 100% 75%)`; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x, y); c.lineTo(lerp(x, item.x, 0.18), lerp(y, item.y, 0.18)); c.stroke();
    }
  }
  c.restore();
}

function bubble(c, x, y, w, h, tailX, fill = '#fff') {
  c.save();
  c.beginPath();
  const r = Math.min(24, h / 2);
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.lineTo(tailX + 22, y + h);
  c.lineTo(tailX - 6, y + h + 24);
  c.lineTo(tailX - 4, y + h);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
  c.fillStyle = fill; c.fill();
  c.strokeStyle = INK; c.lineWidth = 4.5; c.lineJoin = 'round'; c.stroke();
  c.restore();
}

function drawCallout(c, item, t, x) {
  const enter = easeBack(clamp(t * 5));
  const alpha = t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1;
  c.save();
  c.globalAlpha = alpha;
  c.translate(x, 84);
  c.scale(enter, enter);
  c.rotate(-0.04);
  bubble(c, -88, -54, 236, 92, -40);
  label(c, item.text, 30, -18, { size: 40, align: 'center', baseline: 'middle', fill: DON, stroke: INK, width: 7, family: DISPLAY, weight: 400 });
  label(c, item.sub, 30, 17, { size: 19, align: 'center', baseline: 'middle', fill: INK, stroke: null, width: 0, weight: 900, spacing: 1 });
  c.restore();
}

function drawBanner(c, item, t, rest) {
  const enter = easeOut(clamp(t * 4));
  const leave = t > 0.8 ? (t - 0.8) / 0.2 : 0;
  c.save();
  c.globalAlpha = 1 - leave;
  c.translate(lerp(rest.x * 2 + 280, rest.x, enter) - leave * 260, rest.y);
  c.transform(1, 0, -0.18, 1, 0, 0);
  box(c, -250, -30, 500, 60, 10, INK);
  box(c, -244, -24, 488, 48, 7, item.color);
  c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(-244, -24, 488, 18);
  label(c, item.text, 0, 1, { size: 33, align: 'center', baseline: 'middle', fill: '#fff', stroke: INK, width: 7, family: DISPLAY, weight: 400, spacing: 3 });
  c.restore();
}

function drawShatter(c, item, t) {
  const random = seeded(item.combo * 7 + 3);
  c.save();
  c.globalAlpha = 1 - t;
  for (let i = 0; i < 9; i++) {
    const a = random() * TAU;
    const d = easeOut(t) * (30 + random() * 50);
    c.save();
    c.translate(250 + Math.cos(a) * d, 272 + Math.sin(a) * d + t * t * 50);
    c.rotate(a + t * 5);
    path(c, [[-7, -5], [8, -2], [2, 8]], { fill: '#fff', stroke: INK, width: 2.5 });
    c.restore();
  }
  c.restore();
}

// Flames licking along the bottom of the lane during Go-Go Time.
export function drawFlames(c, time, strength) {
  if (strength <= 0) return;
  const { x, y, width, height } = LANE;
  c.save();
  c.beginPath(); c.rect(x, y, width, height); c.clip();
  c.globalAlpha = strength;
  c.fillStyle = radial(c, TARGET.x, TARGET.y, 520, [[0, 'rgba(255,120,40,.55)'], [0.5, 'rgba(210,50,30,.35)'], [1, 'rgba(120,20,30,.18)']]);
  c.fillRect(x, y, width, height);
  c.globalCompositeOperation = 'lighter';
  for (let layer = 0; layer < 2; layer++) {
    c.beginPath();
    c.moveTo(x, y + height);
    for (let px = 0; px <= width; px += 14) {
      const n = Math.sin(px * 0.035 + time * (5 + layer * 2)) * 0.5 + Math.sin(px * 0.081 - time * (7 + layer)) * 0.5;
      const tall = (layer ? 20 : 34) + n * (layer ? 10 : 16);
      c.lineTo(x + px, y + height - tall * strength);
    }
    c.lineTo(x + width, y + height);
    c.closePath();
    c.fillStyle = layer ? 'rgba(255,230,120,.5)' : 'rgba(255,110,30,.45)';
    c.fill();
  }
  c.restore();
}

// The ring of fire around the target during Go-Go Time.
export function drawTargetFire(c, time, strength) {
  if (strength <= 0) return;
  const { x, y } = TARGET;
  c.save();
  c.globalAlpha = strength;
  c.translate(x, y);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU - time * 0.9;
    const len = 60 + 10 * Math.sin(time * 11 + i * 1.9);
    c.beginPath();
    c.moveTo(Math.cos(a - 0.2) * 46, Math.sin(a - 0.2) * 46);
    c.quadraticCurveTo(Math.cos(a + 0.05) * len * 1.04, Math.sin(a + 0.05) * len * 1.04, Math.cos(a + 0.3) * len, Math.sin(a + 0.3) * len);
    c.lineTo(Math.cos(a + 0.2) * 46, Math.sin(a + 0.2) * 46);
    c.closePath();
    c.fillStyle = i % 2 ? '#ffc42e' : '#ff5a2a';
    c.fill();
    c.strokeStyle = INK; c.lineWidth = 2.5; c.lineJoin = 'round'; c.stroke();
  }
  c.restore();
}

// Counter shown above the target while a drumroll or balloon is being played.
export function drawCounter(c, kind, value, t, time, x = TARGET.x + 30) {
  const enter = easeBack(clamp(t * 6));
  const y = 92;
  c.save();
  c.translate(x, y);
  c.scale(enter, enter);
  if (kind === 'roll') {
    bubble(c, -84, -46, 176, 84, -30, '#fff6c9');
    label(c, String(value), -14, -2, { size: 46, align: 'center', baseline: 'middle', fill: ROLL, stroke: INK, width: 8, family: DISPLAY, weight: 400 });
    label(c, '連打', 56, 6, { size: 22, align: 'center', baseline: 'middle', fill: INK, stroke: null, width: 0, weight: 900 });
  } else {
    // a paper balloon that swells as the hits land
    const swell = 1 + Math.sin(time * 14) * 0.02;
    c.save();
    c.scale(swell, swell);
    c.beginPath(); c.ellipse(0, -8, 78, 58, 0, 0, TAU);
    c.fillStyle = '#ff5f7e'; c.fill();
    c.save(); c.clip();
    c.fillStyle = '#ffd34f'; c.fillRect(-40, -80, 22, 160);
    c.fillStyle = '#4fc0d8'; c.fillRect(18, -80, 22, 160);
    c.fillStyle = 'rgba(26,16,20,.14)'; c.beginPath(); c.ellipse(0, 36, 84, 30, 0, 0, TAU); c.fill();
    c.restore();
    c.beginPath(); c.ellipse(0, -8, 78, 58, 0, 0, TAU);
    c.strokeStyle = INK; c.lineWidth = 4.5; c.stroke();
    path(c, [[-9, 50], [9, 50], [13, 64], [-13, 64]], { fill: '#ff5f7e', stroke: INK, width: 4 });
    c.restore();
    label(c, String(value), 0, -8, { size: 54, align: 'center', baseline: 'middle', fill: '#fff', stroke: INK, width: 9, family: DISPLAY, weight: 400 });
  }
  c.restore();
}

export { DON, KA, FONT };
