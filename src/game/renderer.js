// Draws the play screen. Reads the game state, turns engine events into
// animation, and paints one frame per call. Holds no rules of its own.
import { INK, box, clamp, clearSprites, easeOut, fitText, label, lerp, line, vertical } from './art/draw.js';
import { Effects, drawCounter, drawFlames, drawTargetFire } from './art/effects.js';
import { drawDancers, DANCERS } from './art/dancers.js';
import { drawGauge, drawPanel } from './art/hud.js';
import { drawMascot } from './art/mascot.js';
import { drawBalloon, drawNote, drawRoll, drawTarget } from './art/notes.js';
import { drawFooter, drawScene, drawTopBand } from './art/scenery.js';
import { BEAT_WIDTH, FRAME, GAUGE, LANE, MASCOT, SAFE, SCENE_Y, STAGE, TARGET, TITLE, TOP_HEIGHT } from './layout.js';
import { GAUGE as GAUGE_RULES, LEVELS, isHit, isRoll } from './rules.js';

const FLASH = 0.13;

// Maps song time to a position measured in beats, so spacing stays even when
// the tempo drifts.
export function beatMapper(beats, bpm) {
  const period = 60 / (bpm || 120);
  if (!beats || beats.length < 2) return time => time / period;
  const last = beats.length - 1;
  return time => {
    if (time <= beats[0]) return (time - beats[0]) / (beats[1] - beats[0]);
    if (time >= beats[last]) return last + (time - beats[last]) / (beats[last] - beats[last - 1]);
    let lo = 0; let hi = last;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (beats[mid] <= time) lo = mid; else hi = mid;
    }
    return lo + (time - beats[lo]) / (beats[hi] - beats[lo]);
  };
}

// The word written under each note. Notes inside a quick run use the short
// form so the words never collide.
export function syllables(notes, toBeat) {
  return notes.map((note, i) => {
    if (note.type === 'balloon') return 'ふうせん';
    if (isRoll(note)) return note.type === 'bigRoll' ? '連打(大)' : '連打';
    const next = notes.slice(i + 1).find(isHit);
    const quick = next && toBeat(next.time) - toBeat(note.time) < 0.55;
    const ka = note.type === 'ka' || note.type === 'bigKa';
    const big = note.type === 'bigDon' || note.type === 'bigKa';
    if (big) return ka ? 'カッ(大)' : 'ドン(大)';
    if (ka) return quick ? 'カ' : 'カッ';
    return quick ? 'ド' : 'ドン';
  });
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d', { alpha: false });
    this.effects = new Effects();
    this.scale = 1;
    this.resize();
  }

  // The canvas covers the whole stage, whatever shape the window gave it.
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(width * (STAGE.height / STAGE.width)));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      clearSprites();
    }
    this.scale = width / STAGE.width;
  }

  // Spreads a row of positions laid out on the design grid across the stage.
  across(x) {
    return (x / SAFE.width) * STAGE.width;
  }

  start(game, song, { speed = 1 } = {}) {
    this.game = game;
    this.song = song;
    this.speed = speed;
    this.toBeat = beatMapper(song.beats, song.bpm);
    this.words = syllables(game.notes, this.toBeat);
    this.positions = game.notes.map(note => ({ at: this.toBeat(note.time), end: note.end ? this.toBeat(note.end) : null }));
    this.bars = (song.measures || []).map(this.toBeat);
    this.effects.clear();
    this.press = { leftDon: -9, rightDon: -9, leftKa: -9, rightKa: -9 };
    this.lane = { at: -9, kind: 'don', hit: false };
    this.target = { at: -9, kind: 'don' };
    this.comboAt = -9;
    this.gaugeAt = -9;
    this.punchAt = -9;
    this.arms = { left: -9, right: -9 };
    this.kinds = { left: 'don', right: 'don' };
    this.mood = { name: 'idle', until: 0 };
    this.jumpAt = -9;
    this.gogo = 0;
    this.cleared = 0;
    this.counter = null;
    this.entered = {};
    this.first = 0;
    this.last = performance.now() / 1000;
    this.effects.banner(this.last + 0.3, 'はじまるよ!', LEVELS[game.difficulty].color);
  }

  setMood(name, now, seconds) {
    this.mood = { name, until: now + seconds };
  }

  // A drum key went down. Lights the drum whether or not a note was there.
  strike(kind, hand, now) {
    this.press[`${hand}${kind === 'ka' ? 'Ka' : 'Don'}`] = now;
    this.lane = { at: now, kind, hit: false };
    this.arms[hand] = now;
    this.kinds[hand] = kind;
    this.punchAt = now;
  }

  handle(events, now) {
    const { effects } = this;
    for (const event of events) {
      switch (event.type) {
        case 'auto':
          this.strike(event.kind, event.hand, now);
          if (event.big) this.strike(event.kind, event.hand === 'left' ? 'right' : 'left', now);
          break;
        case 'hit':
          effects.burst(now, event.judgement, event.big && event.both, event.note.type.endsWith('Ka') || event.note.type === 'ka' ? 'ka' : 'don');
          effects.judge(now, event.judgement);
          effects.fly(now, event.note.type);
          this.target = { at: now, kind: event.note.type === 'ka' || event.note.type === 'bigKa' ? 'ka' : 'don' };
          this.lane.hit = true;
          this.comboAt = now;
          this.gaugeAt = now;
          break;
        case 'bigBonus':
          effects.burst(now, event.note.judgement, true, 'don');
          break;
        case 'miss':
          effects.judge(now, 'bad');
          this.setMood('oops', now, 0.7);
          this.gaugeAt = now;
          break;
        case 'comboBreak':
          effects.shatter(now, event.combo);
          break;
        case 'milestone':
          if (!this.counter || now >= this.counter.until) effects.callout(now, String(event.combo), 'コンボ!');
          this.setMood('happy', now, 1.1);
          this.jumpAt = now;
          break;
        case 'roll':
          effects.dismiss('callout');      // the counter takes the mascot's speech bubble
          this.counter = { kind: 'roll', value: event.count, shownAt: this.counter?.kind === 'roll' ? this.counter.shownAt : now, until: now + 1.1 };
          effects.fly(now, event.kind === 'ka' ? (event.note.type === 'bigRoll' ? 'bigKa' : 'ka') : (event.note.type === 'bigRoll' ? 'bigDon' : 'don'));
          this.target = { at: now, kind: event.kind };
          this.lane.hit = true;
          break;
        case 'holdStart':
          if (event.note.type === 'balloon') {
            effects.dismiss('callout');
            this.counter = { kind: 'balloon', value: event.note.hits, shownAt: now, until: Infinity, note: event.note };
          }
          break;
        case 'balloon':
          this.counter = { kind: 'balloon', value: Math.max(0, event.remaining), shownAt: this.counter?.shownAt ?? now, until: Infinity, note: event.note, puffAt: now };
          this.target = { at: now, kind: 'don' };
          this.lane.hit = true;
          break;
        case 'holdEnd':
          if (event.note.type === 'balloon') {
            this.counter = null;
            if (event.popped) {
              effects.pop(now, (TARGET.x + 30) / STAGE.band, 96);
              effects.burst(now, 'good', true, 'don');
              effects.fly(now, 'bigDon');
              this.setMood('happy', now, 1);
              this.jumpAt = now;
            }
          } else if (this.counter?.kind === 'roll') {
            this.counter.until = now + 0.9;
          }
          break;
        case 'gogo':
          if (event.on) {
            effects.banner(now, 'GO-GO TIME!', '#f2452b');
            [120, 300, 520, 760, 980, 1160].forEach((x, i) => {
              effects.firework(now + i * 0.09, this.across(x), 70 + ((i * 53) % 90), (i * 67) % 360, 0.9 + (i % 3) * 0.2);
            });
          }
          break;
        case 'clear':
          if (event.on) effects.banner(now, 'クリア!', '#f4a81e');
          break;
        case 'finish':
          if (event.result.bad === 0 && event.result.total > 0) {
            effects.banner(now, event.result.ok === 0 ? 'パーフェクト!' : 'フルコンボ!', '#f4a81e');
            [200, 440, 640, 840, 1080].forEach((x, i) => effects.firework(now + i * 0.08, this.across(x), 60 + ((i * 47) % 80), (i * 71) % 360, 1.1));
            this.setMood('happy', now, 2);
            this.jumpAt = now;
          }
          break;
        case 'full':
          [300, 640, 980].forEach((x, i) => effects.firework(now + i * 0.12, this.across(x), 80 + i * 20, 40 + i * 20, 1.2));
          break;
        default:
      }
    }
  }

  x(position, current) {
    return TARGET.x + (position - current) * BEAT_WIDTH * this.speed;
  }

  draw(time, now) {
    const c = this.context;
    const { game, scale, effects } = this;
    const delta = Math.min(0.1, Math.max(0, now - this.last));
    this.last = now;
    c.setTransform(scale, 0, 0, scale, 0, 0);
    c.imageSmoothingQuality = 'high';
    if (!game) {
      c.fillStyle = INK; c.fillRect(0, 0, STAGE.width, STAGE.height);
      return;
    }

    const { stats } = game;
    const rule = GAUGE_RULES[game.difficulty];
    const current = this.toBeat(time);
    const phase = ((current % 1) + 1) % 1;
    const step = Math.floor(current);
    const gogo = game.inGogo;
    this.gogo = clamp(this.gogo + (gogo ? delta : -delta) / 0.25);
    this.cleared = clamp(this.cleared + (stats.gauge >= rule.clear ? delta : -delta) / 0.5);
    effects.prune(now);

    // dancers hop in as the gauge climbs and step out if it falls away
    for (const dancer of DANCERS) {
      const here = stats.gauge >= dancer.joins && (dancer.joins > 0 || time > -1.2);
      if (here && this.entered[dancer.id] === undefined) this.entered[dancer.id] = now;
      if (!here && stats.gauge < dancer.joins - 4) delete this.entered[dancer.id];
    }

    // Rows added above the design grid push the HUD, lane and scene down. A
    // sky band drawn smaller (see layout.js) lets the lane and the scene rise.
    const { width, height, top, foot, left, band, rise } = STAGE;
    const sceneTop = SCENE_Y + top - rise;
    const sceneHeight = height - foot - sceneTop;

    // ---- bottom: the festival ------------------------------------------
    c.save();
    c.translate(0, sceneTop);
    c.beginPath(); c.rect(0, 0, width, sceneHeight); c.clip();
    drawScene(c, scale, now, { gogo: this.gogo, cleared: this.cleared, width, height: sceneHeight });
    effects.drawScene(c, now);
    c.restore();
    c.save();
    c.translate(0, height - foot);
    drawFooter(c, width, foot);
    c.restore();
    drawDancers(c, scale, height - foot - 22, {
      time: now, beat: phase, step, entered: this.entered, gogo,
      centre: width / 2, spread: Math.min(1.3, width / SAFE.width),
    });

    // ---- top band --------------------------------------------------------
    // Two sets of units from here on. The sky band is drawn in its own, which
    // shrink with it; the lane keeps stage units.
    const inBand = draw => { c.save(); c.translate(left, top); c.scale(band, band); draw(); c.restore(); };
    const inLane = draw => { c.save(); c.translate(left, top - rise); draw(); c.restore(); };
    const mood = this.gogo > 0 ? 'gogo' : 'clear';
    drawTopBand(c, scale, now, mood, Math.max(this.gogo, this.cleared), width, TOP_HEIGHT * band + top, band);
    inLane(() => {
      c.fillStyle = '#0d090c';
      c.fillRect(-left, FRAME.y, width, FRAME.height);
    });
    // the gauge stands on the frame, and notes on their way to it pass in front
    inBand(() => drawGauge(c, { value: stats.gauge, clear: rule.clear, time: now, pulse: 1 - (now - this.gaugeAt) / 0.25 }));

    // ---- panel and lane ---------------------------------------------------
    // The HUD keeps clear of a notch: it is drawn from the first free column.
    const swing = at => clamp(1 - (now - at) / 0.16);
    inLane(() => {
      drawPanel(c, scale, {
        difficulty: game.difficulty,
        score: stats.score,
        combo: stats.combo,
        comboPop: 1 - (now - this.comboAt) / 0.12,
        flashes: {
          leftDon: 1 - (now - this.press.leftDon) / FLASH,
          rightDon: 1 - (now - this.press.rightDon) / FLASH,
          leftKa: 1 - (now - this.press.leftKa) / FLASH,
          rightKa: 1 - (now - this.press.rightKa) / FLASH,
        },
        punch: clamp(1 - (now - this.punchAt) / 0.1),
      });
      this.drawLane(c, time, current, now);
    });

    // ---- title, mascot and overlays -------------------------------------
    const name = now < this.mood.until ? this.mood.name
      : this.counter?.kind === 'balloon' ? 'balloon'
        : gogo ? 'gogo' : 'idle';
    const jump = Math.sin(clamp((now - this.jumpAt) / 0.5) * Math.PI) * MASCOT.jump;
    inBand(() => {
      this.drawTitle(c);        // after the lane, so notes flying to the gauge pass behind it
      drawMascot(c, MASCOT.x, MASCOT.y, MASCOT.size, {
        bob: Math.max(0, 1 - phase * 2.6),
        left: swing(this.arms.left),
        right: swing(this.arms.right),
        kinds: this.kinds,
        mood: name,
        blink: (now % 3.7) < 0.12,
        jump: now - this.jumpAt < 0.5 ? jump : 0,
        leap: now - this.jumpAt < 0.5,
        beats: current,
        time: now,
      });
      if (this.counter && now < this.counter.until) {
        drawCounter(c, this.counter.kind, this.counter.value, now - this.counter.shownAt, now, (TARGET.x + 30) / band);
      } else if (this.counter && now >= this.counter.until) {
        this.counter = null;
      }
      effects.drawBand(c, now, MASCOT.x + 174);
    });
    // Banners cross the sky above the festival, where they cover no text.
    inLane(() => effects.drawOverLane(c, now, { x: width / 2 - left, y: SCENE_Y + 58 }));
    if (game.auto) {
      box(c, width / 2 - 80, 8, 160, 30, 15, INK);
      label(c, 'オート  AUTO', width / 2, 24, { size: 15, align: 'center', baseline: 'middle', fill: '#ffe36a', stroke: null, width: 0, weight: 900, spacing: 1.5 });
    }
  }

  drawTitle(c) {
    const { song, game } = this;
    const level = LEVELS[game.difficulty];
    // long names step down in size, then end in an ellipsis; never squeezed
    label(c, song.title || 'Untitled', TITLE.x - 5, TITLE.y, {
      size: 36, minSize: 24, align: 'right', baseline: 'middle', fill: '#fff', stroke: INK, width: 9, weight: 900, maxWidth: TITLE.maxWidth, shadow: 2,
    });
    if (song.artist) {
      const artist = fitText(c, song.artist, 420, { size: 15, minSize: 13, weight: 800 });
      c.font = `800 ${artist.size}px "M PLUS Rounded 1c", sans-serif`;
      const width = Math.max(120, c.measureText(artist.text).width + 34);
      box(c, TITLE.x - width, TITLE.y + 28, width, 25, 12.5, level.color, INK, 3);
      label(c, artist.text, TITLE.x - width / 2, TITLE.y + 41, {
        size: artist.size, align: 'center', baseline: 'middle', fill: '#fff', stroke: null, width: 0, weight: 800,
      });
    }
  }

  drawLane(c, time, current, now) {
    const { game, scale } = this;
    const notes = game.notes;
    const centre = TARGET.y;
    c.save();
    c.beginPath(); c.rect(LANE.x, LANE.y, LANE.width, LANE.stripY + LANE.stripHeight - LANE.y); c.clip();

    // lane and syllable strip
    c.fillStyle = vertical(c, LANE.y, LANE.y + LANE.height, [[0, '#343136'], [0.08, '#2c2a2e'], [1, '#262428']]);
    c.fillRect(LANE.x, LANE.y, LANE.width, LANE.height);
    c.fillStyle = '#0d090c';
    c.fillRect(LANE.x, LANE.y + LANE.height, LANE.width, LANE.stripY - LANE.y - LANE.height);
    c.fillStyle = vertical(c, LANE.stripY, LANE.stripY + LANE.stripHeight, [[0, '#8e8890'], [1, '#79737b']]);
    c.fillRect(LANE.x, LANE.stripY, LANE.width, LANE.stripHeight);

    drawFlames(c, now, this.gogo);

    // the drum key just pressed washes the lane with its colour
    const wash = 1 - (now - this.lane.at) / FLASH;
    if (wash > 0) {
      const tint = this.lane.kind === 'ka' ? '70,170,255' : '255,70,40';
      const gradient = c.createLinearGradient(LANE.x, 0, LANE.x + LANE.width, 0);
      gradient.addColorStop(0, `rgba(${tint},${0.22 * wash})`);
      gradient.addColorStop(1, `rgba(${tint},0)`);
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = gradient;
      c.fillRect(LANE.x, LANE.y, LANE.width, LANE.height);
      if (this.lane.hit) {
        const gold = c.createLinearGradient(LANE.x, 0, LANE.x + LANE.width * 0.7, 0);
        gold.addColorStop(0, `rgba(255,225,60,${0.18 * wash})`);
        gold.addColorStop(1, 'rgba(255,225,60,0)');
        c.fillStyle = gold;
        c.fillRect(LANE.x, LANE.y, LANE.width, LANE.height);
      }
      c.restore();
    }

    // bar lines
    for (const bar of this.bars) {
      const x = this.x(bar, current);
      if (x < LANE.x - 4) continue;
      if (x > STAGE.width + 4) break;
      line(c, x, LANE.y, x, LANE.y + LANE.height, 'rgba(210,205,214,.7)', 2.5, 'butt');
    }

    drawTargetFire(c, now, this.gogo);
    drawTarget(c, TARGET.x, centre, clamp(1 - (now - this.target.at) / 0.2), this.target.kind, this.gogo > 0.5);

    // find the visible window, then paint right to left so the next note to
    // hit is always on top
    while (this.first < notes.length) {
      const note = notes[this.first];
      const tail = this.positions[this.first].end ?? this.positions[this.first].at;
      const gone = note.state === 'hit' || (note.state === 'done' && note.popped) || this.x(tail, current) < LANE.x - 140;
      if (!gone) break;
      this.first++;
    }
    let end = this.first;
    while (end < notes.length && this.x(this.positions[end].at, current) < STAGE.width + 120) end++;

    for (let i = end - 1; i >= this.first; i--) {
      const note = notes[i];
      if (note.state === 'hit') continue;
      const position = this.positions[i];
      let x = this.x(position.at, current);
      if (note.type === 'balloon') {
        if (note.state === 'done' && note.popped) continue;
        if (note.state === 'active') x = TARGET.x;
        else if (note.state === 'done') x = this.x(position.end, current);
        const puff = this.counter?.puffAt ? clamp(1 - (now - this.counter.puffAt) / 0.12) : 0;
        drawBalloon(c, x, centre, scale, note.state === 'active' ? puff : 0);
      } else if (isRoll(note)) {
        drawRoll(c, note.type, x, this.x(position.end, current), centre, scale);
      } else {
        drawNote(c, note.type, x, centre, scale, note.state === 'missed' ? 0.45 : 1);
      }
      this.drawWord(c, i, x, position, current);
    }

    this.effects.drawLane(c, now);
    c.restore();

    // Notes that were hit leave the lane for the soul orb, so their flight is
    // drawn unclipped. The orb is in the sky band: this is where it is from here.
    const { band, rise } = STAGE;
    const orb = { x: GAUGE.orbX * band, y: GAUGE.orbY * band + rise };
    const above = STAGE.top - rise;
    c.save();
    c.beginPath(); c.rect(-STAGE.left, -above, STAGE.width, above + LANE.y + LANE.height); c.clip();
    for (const item of this.effects.items) {
      if (item.type !== 'fly') continue;
      const t = clamp((now - item.at) / item.life);
      const p = easeOut(t) * 0.35 + t * 0.65;
      const x = lerp(TARGET.x, orb.x, p);
      const y = lerp(TARGET.y, orb.y, p) - Math.sin(p * Math.PI) * 190 * band;
      drawNote(c, item.noteType, x, y, scale, t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1, lerp(1, 0.5 * band, p));
    }
    c.restore();
  }

  drawWord(c, index, x, position, current) {
    const note = this.game.notes[index];
    if (note.state === 'missed' || x < LANE.x - 60) return;
    const y = LANE.stripY + LANE.stripHeight / 2 + 1;
    const word = this.words[index];
    if (position.end !== null) {
      const endX = this.x(position.end, current);
      line(c, x + 26, y, Math.max(x + 26, endX), y, INK, 7, 'round');
      line(c, x + 26, y, Math.max(x + 26, endX), y, '#fff', 3, 'round');
    }
    label(c, word, x, y, {
      size: word.length > 3 ? 16 : 18.5, align: 'center', baseline: 'middle', fill: '#fff', stroke: INK, width: 5, weight: 900,
    });
  }
}
