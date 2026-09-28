// Game logic only: no audio, no drawing, no timers. The caller supplies the
// song time, which keeps every rule testable with plain numbers.
import {
  AUTO_BALLOON_RATE, AUTO_ROLL_RATE, BALLOON_POINTS, BALLOON_POP_POINTS, BIG_PAIR_WINDOW, BIG_ROLL_POINTS, GAUGE,
  ROLL_POINTS, WINDOWS, isBig, isHit, isMilestone, kindOf, scoreUnit,
} from './rules.js';

export const freshStats = () => ({
  score: 0, combo: 0, maxCombo: 0, good: 0, ok: 0, bad: 0, rolls: 0, balloons: 0, gauge: 0,
});

export class Game {
  constructor(song, difficulty, { auto = false } = {}) {
    const chart = song.charts[difficulty];
    this.song = song;
    this.difficulty = difficulty;
    this.auto = auto;
    this.windows = WINDOWS[difficulty];
    this.gaugeRule = GAUGE[difficulty];
    this.notes = chart.notes.map((note, index) => ({
      ...note, index, state: 'waiting', count: 0, judgement: null, hitAt: null,
    }));
    this.hits = this.notes.filter(isHit);
    this.unit = scoreUnit(this.hits.length, this.hits.filter(isBig).length);
    this.gaugeStep = 100 / Math.max(1, this.hits.length * this.gaugeRule.fill);
    this.gogo = song.gogo || [];
    this.stats = freshStats();
    this.events = [];
    this.cursor = 0;            // first note that is not resolved yet
    this.hold = null;           // the roll or balloon currently under the player's sticks
    this.lastBig = null;
    this.inGogo = false;
    this.cleared = false;
    this.finished = false;
    this.autoHand = 0;
    this.endTime = Math.max(song.duration || 0, ...this.notes.map(n => (n.end ?? n.time) + 1));
  }

  emit(type, detail = {}) {
    this.events.push({ type, ...detail });
  }

  // Hands the queued events to the caller and clears the queue.
  drain() {
    const events = this.events;
    this.events = [];
    return events;
  }

  isGogo(time) {
    return this.gogo.some(([start, end]) => time >= start && time < end);
  }

  result() {
    const { stats } = this;
    return {
      ...stats, gauge: Math.round(stats.gauge * 10) / 10,
      cleared: stats.gauge >= this.gaugeRule.clear,
      total: this.hits.length,
      difficulty: this.difficulty, auto: this.auto,
    };
  }

  // Advance the song clock: expire notes, open and close holds, auto-play.
  update(time) {
    if (this.finished) return;
    const gogo = this.isGogo(time);
    if (gogo !== this.inGogo) {
      this.inGogo = gogo;
      this.emit('gogo', { on: gogo, time });
    }

    for (let i = this.cursor; i < this.notes.length; i++) {
      const note = this.notes[i];
      if (note.time - this.windows.bad > time) break;
      if (note.state === 'waiting' && !isHit(note) && time >= note.time) {
        note.state = 'active';
        this.hold = note;
        this.emit('holdStart', { note, time });
      }
      if (note.state === 'active' && time > note.end) this.closeHold(note, time, false);
      if (this.auto && note.state === 'waiting' && isHit(note) && time >= note.time) {
        this.autoHit(note);
      }
      if (note.state === 'waiting' && isHit(note) && time > note.time + this.windows.ok) {
        this.miss(note, time);
      }
    }
    if (this.auto && this.hold) this.autoRoll(time);
    while (this.cursor < this.notes.length && this.resolved(this.notes[this.cursor])) this.cursor++;

    if (time >= this.endTime) {
      this.finished = true;
      this.emit('finish', { result: this.result(), time });
    }
  }

  resolved(note) {
    return note.state === 'hit' || note.state === 'missed' || note.state === 'done';
  }

  // A drum strike from the player. `kind` is 'don' or 'ka', `hand` is 'left' or 'right'.
  hit(kind, hand, time) {
    if (this.finished || this.auto) return null;
    return this.strike(kind, hand, time);
  }

  strike(kind, hand, time) {
    const pair = this.lastBig;
    if (pair && pair.kind === kind && pair.hand !== hand && time - pair.time <= BIG_PAIR_WINDOW) {
      this.lastBig = null;
      return this.completeBig(pair.note, time);
    }

    const hold = this.hold;
    if (hold && hold.state === 'active' && time <= hold.end) {
      return hold.type === 'balloon' ? this.hitBalloon(hold, kind, time) : this.hitRoll(hold, time, kind);
    }

    const note = this.notes.slice(this.cursor).find(n => n.state === 'waiting' && isHit(n));
    if (!note || Math.abs(note.time - time) > this.windows.bad) return null;
    if (kindOf(note) !== kind) return null;     // wrong face of the drum: nothing happens

    const distance = Math.abs(note.time - time);
    if (distance > this.windows.ok) {
      this.miss(note, time, time < note.time ? 'early' : 'late');
      return 'bad';
    }
    const judgement = distance <= this.windows.good ? 'good' : 'ok';
    this.land(note, judgement, time, hand, false);
    return judgement;
  }

  land(note, judgement, time, hand, both) {
    const { stats } = this;
    note.state = 'hit';
    note.judgement = judgement;
    note.hitAt = time;
    stats[judgement]++;
    stats.combo++;
    stats.maxCombo = Math.max(stats.maxCombo, stats.combo);
    const points = judgement === 'good' ? this.unit : Math.floor(this.unit / 20) * 10;
    note.points = points;
    stats.score += points;
    const gain = this.gaugeStep * (judgement === 'good' ? 1 : this.gaugeRule.ok);
    this.setGauge(stats.gauge + gain, time);
    this.emit('hit', { note, judgement, time, big: isBig(note), both, delta: time - note.time, combo: stats.combo });
    if (isMilestone(stats.combo)) this.emit('milestone', { combo: stats.combo, time });
    if (isBig(note)) {
      if (both) this.completeBig(note, time);
      else this.lastBig = { note, kind: kindOf(note), hand, time };
    }
  }

  // The second stick arrived in time: the big note pays double.
  completeBig(note, time) {
    this.stats.score += note.points;
    this.emit('bigBonus', { note, time, points: note.points });
    return 'big';
  }

  miss(note, time, reason = 'passed') {
    const { stats } = this;
    note.state = 'missed';
    note.judgement = 'bad';
    stats.bad++;
    if (stats.combo >= 10) this.emit('comboBreak', { combo: stats.combo, time });
    stats.combo = 0;
    this.setGauge(stats.gauge - this.gaugeStep * this.gaugeRule.bad, time);
    this.emit('miss', { note, time, reason });
  }

  setGauge(value, time) {
    const gauge = Math.max(0, Math.min(100, value));
    const before = this.stats.gauge;
    this.stats.gauge = gauge;
    const cleared = gauge >= this.gaugeRule.clear;
    if (cleared !== this.cleared) {
      this.cleared = cleared;
      this.emit('clear', { on: cleared, time });
    }
    if (gauge >= 100 && before < 100) this.emit('full', { time });
  }

  hitRoll(note, time, kind = 'don') {
    note.count++;
    this.stats.rolls++;
    this.stats.score += isBig(note) ? BIG_ROLL_POINTS : ROLL_POINTS;
    this.emit('roll', { note, count: note.count, time, kind });
    return 'roll';
  }

  hitBalloon(note, kind, time) {
    if (kind !== 'don') return null;
    note.count++;
    const remaining = note.hits - note.count;
    this.stats.score += remaining <= 0 ? BALLOON_POP_POINTS : BALLOON_POINTS;
    this.emit('balloon', { note, remaining, time });
    if (remaining <= 0) {
      this.stats.balloons++;
      this.closeHold(note, time, true);
    }
    return 'balloon';
  }

  closeHold(note, time, popped) {
    note.state = 'done';
    note.popped = popped;
    if (this.hold === note) this.hold = null;
    this.emit('holdEnd', { note, time, popped, count: note.count });
  }

  autoHit(note) {
    const hand = this.autoHand++ % 2 ? 'left' : 'right';
    this.emit('auto', { kind: kindOf(note), hand, big: isBig(note), time: note.time });
    this.land(note, 'good', note.time, hand, isBig(note));
  }

  autoRoll(time) {
    const note = this.hold;
    const rate = note.type === 'balloon' ? AUTO_BALLOON_RATE : AUTO_ROLL_RATE;
    const due = Math.floor((Math.min(time, note.end) - note.time) * rate) + 1;
    while (this.hold === note && note.count < due) {
      const hand = this.autoHand++ % 2 ? 'left' : 'right';
      const at = note.time + note.count / rate;
      this.emit('auto', { kind: 'don', hand, big: false, time: at });
      if (note.type === 'balloon') this.hitBalloon(note, 'don', at);
      else this.hitRoll(note, at);
    }
  }
}
