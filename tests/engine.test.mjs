import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, freshStats } from '../src/game/engine.js';
import { WINDOWS, accuracy, crownFor, isMilestone, rankFor, scoreUnit } from '../src/game/rules.js';

const song = (notes, extra = {}) => ({ duration: 20, gogo: [], charts: { easy: { notes }, medium: { notes }, hard: { notes } }, ...extra });
const game = (notes, difficulty = 'medium', options) => new Game(song(notes), difficulty, options);
const types = g => g.drain().map(e => e.type);

test('a flawless run scores one million and every 良 pays the same', () => {
  assert.equal(scoreUnit(100), 10000);
  assert.equal(scoreUnit(765), 1310);
  assert.equal(scoreUnit(90, 10), 10000, 'big notes count twice: both sticks can land');
  assert.equal(scoreUnit(0), 0);
  const g = game([{ time: 1, type: 'don' }, { time: 2, type: 'ka' }]);
  g.update(1); assert.equal(g.hit('don', 'right', 1.01), 'good');
  g.update(2); assert.equal(g.hit('ka', 'left', 1.99), 'good');
  assert.equal(g.stats.score, 1000000);
  assert.equal(g.stats.combo, 2);
  assert.deepEqual([g.stats.good, g.stats.ok, g.stats.bad], [2, 0, 0]);
});

test('timing windows: 良 inside, 可 outside it, and a wild swing spends the note', () => {
  const { good, ok, bad } = WINDOWS.medium;
  const g = game([{ time: 1, type: 'don' }, { time: 3, type: 'don' }, { time: 5, type: 'don' }, { time: 7, type: 'don' }]);
  assert.equal(g.hit('don', 'right', 1 + good - 0.001), 'good');
  assert.equal(g.hit('don', 'right', 3 - ok + 0.001), 'ok');
  assert.equal(g.hit('don', 'right', 5 + ok + 0.005), 'bad');
  assert.equal(g.hit('don', 'right', 7 - bad - 0.01), null, 'too early to count at all');
  assert.deepEqual([g.stats.good, g.stats.ok, g.stats.bad], [1, 1, 1]);
  assert.equal(g.stats.combo, 0);
  assert.equal(g.notes[3].state, 'waiting');
});

test('hard uses tighter windows than easy', () => {
  const late = 0.035;
  assert.equal(game([{ time: 1, type: 'don' }], 'easy').hit('don', 'right', 1 + late), 'good');
  assert.equal(game([{ time: 1, type: 'don' }], 'hard').hit('don', 'right', 1 + late), 'ok');
});

test('the wrong face of the drum is ignored and the note can still be hit', () => {
  const g = game([{ time: 1, type: 'don' }]);
  g.stats.combo = 4;
  assert.equal(g.hit('ka', 'left', 1), null);
  assert.equal(g.stats.bad, 0);
  assert.equal(g.stats.combo, 4);
  assert.equal(g.hit('don', 'right', 1.02), 'good');
});

test('notes are judged in order and a hit cannot land twice', () => {
  const g = game([{ time: 1, type: 'don' }, { time: 1.1, type: 'don' }]);
  assert.equal(g.hit('don', 'right', 1.0), 'good');
  assert.equal(g.notes[1].state, 'waiting');
  assert.equal(g.hit('don', 'left', 1.09), 'good');
  assert.equal(g.hit('don', 'right', 1.1), null);
  assert.equal(g.stats.good, 2);
});

test('a note that scrolls past is a miss, judged once, and breaks the combo', () => {
  const g = game([{ time: 1, type: 'don' }, { time: 5, type: 'don' }]);
  g.stats.combo = 12;
  g.update(1.05); assert.equal(g.stats.bad, 0);
  g.update(1.2); g.update(1.3);
  assert.equal(g.stats.bad, 1);
  assert.equal(g.stats.combo, 0);
  assert.deepEqual(types(g), ['comboBreak', 'miss']);
});

test('big notes pay double when both hands land together', () => {
  const g = game([{ time: 1, type: 'bigDon' }, { time: 3, type: 'bigKa' }, { time: 5, type: 'bigDon' }]);
  const unit = g.unit;
  assert.equal(unit * 6 >= 1000000 && unit * 6 < 1000100, true, 'two-handed perfection reaches one million');
  assert.equal(g.hit('don', 'right', 1.0), 'good');
  assert.equal(g.hit('don', 'left', 1.02), 'big');
  assert.equal(g.stats.score, unit * 2);
  assert.equal(g.stats.good, 1, 'the second stick is not a second note');
  assert.equal(g.hit('ka', 'right', 3.0), 'good');
  assert.equal(g.hit('ka', 'right', 3.01), null, 'same hand twice is not a pair');
  assert.equal(g.hit('don', 'left', 5.0), 'good');
  assert.equal(g.hit('don', 'right', 5.09), null, 'too slow to pair');
  assert.equal(g.stats.score, unit * 4);
});

test('drumrolls count every stroke of either colour without touching accuracy', () => {
  const g = game([{ time: 1, end: 2, type: 'roll' }, { time: 3, end: 4, type: 'bigRoll' }]);
  g.update(1.0);
  assert.equal(g.hit('don', 'right', 1.1), 'roll');
  assert.equal(g.hit('ka', 'left', 1.2), 'roll');
  g.update(2.1);
  assert.equal(g.hit('don', 'right', 2.2), null, 'the roll has ended');
  g.update(3.0);
  assert.equal(g.hit('don', 'right', 3.5), 'roll');
  assert.equal(g.stats.rolls, 3);
  assert.equal(g.stats.score, 100 + 100 + 200);
  assert.deepEqual([g.stats.good, g.stats.ok, g.stats.bad, g.stats.combo], [0, 0, 0, 0]);
});

test('balloons need centre hits and pop on the last one', () => {
  const g = game([{ time: 1, end: 3, type: 'balloon', hits: 3 }, { time: 4, type: 'don' }]);
  g.update(1.0);
  assert.equal(g.hit('ka', 'left', 1.1), null);
  g.hit('don', 'right', 1.2); g.hit('don', 'left', 1.3);
  assert.equal(g.notes[0].state, 'active');
  assert.equal(g.hit('don', 'right', 1.4), 'balloon');
  assert.equal(g.notes[0].state, 'done');
  assert.equal(g.notes[0].popped, true);
  assert.equal(g.stats.balloons, 1);
  assert.equal(g.stats.score, 300 + 300 + 5000);
  assert.ok(types(g).includes('holdEnd'));
  assert.equal(g.hit('don', 'right', 1.5), null, 'nothing left to hit until the next note');
});

test('an unfinished balloon simply floats away', () => {
  const g = game([{ time: 1, end: 2, type: 'balloon', hits: 5 }]);
  g.update(1); g.hit('don', 'right', 1.5); g.update(2.1);
  assert.equal(g.notes[0].popped, false);
  assert.equal(g.stats.balloons, 0);
  assert.equal(g.stats.bad, 0);
});

test('the soul gauge fills with good hits, drains on misses and reports clearing', () => {
  const notes = Array.from({ length: 10 }, (_, i) => ({ time: 1 + i, type: 'don' }));
  const g = game(notes, 'medium');
  for (let i = 0; i < 5; i++) g.hit('don', 'right', 1 + i);
  assert.ok(g.stats.gauge >= 70 && g.stats.gauge < 80, `gauge ${g.stats.gauge}`);
  assert.ok(types(g).includes('clear'));
  g.update(6.2);
  assert.ok(g.stats.gauge < 70);
  assert.deepEqual(g.drain().filter(e => e.type === 'clear').map(e => e.on), [false]);
  for (let i = 6; i < 10; i++) g.hit('don', 'right', 1 + i);
  assert.equal(g.stats.gauge, 100);
  assert.equal(g.result().cleared, true);
  const empty = game([{ time: 1, type: 'don' }]);
  empty.update(2);
  assert.equal(empty.stats.gauge, 0, 'never below zero');
});

test('combo milestones and Go-Go Time are announced', () => {
  assert.deepEqual([9, 10, 30, 50, 99, 100, 150, 200].map(isMilestone), [false, true, true, true, false, true, false, true]);
  const notes = Array.from({ length: 10 }, (_, i) => ({ time: 1 + i * 0.5, type: 'don' }));
  const g = new Game(song(notes, { gogo: [[2, 4]] }), 'easy');
  notes.forEach(n => { g.update(n.time); g.hit('don', 'right', n.time); });
  const events = g.drain();
  assert.deepEqual(events.filter(e => e.type === 'gogo').map(e => e.on), [true, false]);
  assert.deepEqual(events.filter(e => e.type === 'milestone').map(e => e.combo), [10]);
});

test('auto-play clears every chart perfectly, including rolls and balloons', () => {
  const notes = [
    { time: 1, type: 'don' }, { time: 1.5, type: 'bigKa' }, { time: 2, end: 3, type: 'roll' },
    { time: 4, end: 5, type: 'balloon', hits: 6 }, { time: 6, type: 'ka' },
  ];
  const g = game(notes, 'hard', { auto: true });
  assert.equal(g.hit('don', 'right', 1), null, 'player input is ignored while the game plays itself');
  for (let t = 0; t <= 21; t += 1 / 60) g.update(t);
  assert.deepEqual([g.stats.good, g.stats.ok, g.stats.bad], [3, 0, 0]);
  assert.equal(g.stats.maxCombo, 3);
  assert.ok(g.stats.rolls >= 14 && g.stats.rolls <= 16, `rolls ${g.stats.rolls}`);
  assert.equal(g.stats.balloons, 1);
  assert.equal(g.finished, true);
  const result = g.drain().find(e => e.type === 'finish').result;
  assert.equal(result.cleared, true);
  assert.equal(crownFor(result), 'rainbow');
});

test('results: crowns, ranks and accuracy', () => {
  assert.equal(crownFor({ cleared: false, bad: 0, ok: 0 }), null);
  assert.equal(crownFor({ cleared: true, bad: 2, ok: 5 }), 'silver');
  assert.equal(crownFor({ cleared: true, bad: 0, ok: 5 }), 'gold');
  assert.equal(rankFor(1000000).id, 'heaven');
  assert.equal(rankFor(960000).id, 'festival');
  assert.equal(rankFor(860000).id, 'moon');
  assert.equal(rankFor(760000).id, 'blossom');
  assert.equal(rankFor(500000).id, 'lantern');
  assert.equal(rankFor(100000), null);
  assert.equal(accuracy({ ...freshStats(), good: 2, ok: 2, bad: 1 }), 60);
  assert.equal(accuracy(freshStats()), 0);
});

test('the run finishes once, after the song and the last note are over', () => {
  const g = new Game({ duration: 3, gogo: [], charts: { easy: { notes: [{ time: 1, type: 'don' }] } } }, 'easy');
  g.update(2.9); assert.equal(g.finished, false);
  g.update(3.0); g.update(3.5);
  assert.equal(g.drain().filter(e => e.type === 'finish').length, 1);
  assert.equal(g.hit('don', 'right', 3.6), null);
});

test('a hit is judged correctly even when no frame ran since the previous note', () => {
  const g = game([{ time: 1, type: 'don' }, { time: 1.5, type: 'don' }, { time: 2, end: 3, type: 'roll' }, { time: 4, type: 'ka' }]);
  // the first note is never hit and no update runs until the player strikes the second
  g.update(1.5); assert.equal(g.hit('don', 'right', 1.5), 'good');
  assert.deepEqual([g.stats.good, g.stats.bad], [1, 1], 'the skipped note became a miss, the struck one landed');
  g.update(2.4); assert.equal(g.hit('don', 'left', 2.4), 'roll', 'the roll opened without waiting for a frame');
  g.update(4.0); assert.equal(g.hit('ka', 'left', 4.0), 'good');
});
