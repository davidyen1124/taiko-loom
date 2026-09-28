// "Raijin Rush": the thunder god's drum solo. Fast, in A minor pentatonic
// (A C D E G), led by shamisen with a flute joining for the chorus. The
// hardest of the built-in songs.
import { playMelody, rootOf } from './synth.js';

export default {
  id: 'demo-raijin-rush',
  title: 'Raijin Rush',
  artist: 'Taiko Nights',
  colour: '#7a3fd0',
  bpm: 168,
  offset: 0.6,
  steps: 16,
  tail: 1.8,
  stars: { easy: 4, medium: 6, hard: 8 },
  loudness: { intro: 0.6, verse: 0.7, build: 0.82, chorus: 1, bridge: 0.45, outro: 0.8 },
  drums: { intro: 0.9, verse: 0.8, build: 0.9, chorus: 1, bridge: 0.7, outro: 0.95 },
  mix: { flute: 0.3, bass: 0.55 },

  sections: [
    {
      name: 'intro',
      hard: ['D.......D.......', 'D.......D...d.d.', 'd.d.k.k.d.d.k.k.', 'd.dkd.dkD...K...'],
      medium: ['D.......D.......', 'D.......D.......', 'd...k...d...k...', 'd.d.k.k.D...K...'],
      easy: ['D.......D.......', 'D.......D.......', 'd.......d.......', 'd...d...D.......'],
    },
    {
      name: 'verse', repeat: 2,
      hard: ['d.d.k.d.d.k.d.k.', 'd.dkd.k.d.d.k.k.', 'd.d.k.d.d.k.d.k.', 'dkd.k.d.dkd.k...'],
      medium: ['d...k.d.d...k...', 'd.d.k...d...k.k.', 'd...k.d.d...k...', 'd.d.k...d.d.k...'],
      easy: ['d...k...d...k...', 'd...d...k.......', 'd...k...d...k...', 'd...d...k...k...'],
    },
    {
      name: 'build',
      hard: ['d.d.d.d.k.k.k.k.', 'dkd.dkd.kdk.kdk.', 'd.k.d.k.dkdkd.k.', 'D...K...r-----..'],
      medium: ['d.d.d.d.k.k.k.k.', 'd.d.d...k.k.k...', 'd.k.d.k.d.d.k.k.', 'D...K...r-----..'],
      easy: ['d...d...k...k...', 'd...d...k...k...', 'd...k...d...k...', 'D.......r-----..'],
    },
    {
      name: 'chorus', gogo: true,
      hard: [
        'D...k.k.d.dkd.k.', 'd.dkd.k.d.k.d.k.', 'D...k.k.d.dkd.k.', 'dkd.k.d.dkd.K...',
        'D...k.k.d.dkd.k.', 'd.dkd.k.d.k.d.k.', 'D...k.k.dkd.dkd.', 'B-----------....',
      ],
      medium: [
        'D...k...d.d.k...', 'd.d.k...d.k.d...', 'D...k...d.d.k...', 'd.d.k.k.d...K...',
        'D...k...d.d.k...', 'd.d.k...d.k.d...', 'D...k...d.d.k.k.', 'B-----------....',
      ],
      easy: [
        'D...k...d...k...', 'd...d...k...k...', 'D...k...d...k...', 'd...d...D.......',
        'D...k...d...k...', 'd...d...k...k...', 'D...k...d...k...', 'B-----------....',
      ],
      balloon: { easy: 4, medium: 6, hard: 9 },
    },
    {
      name: 'verse', repeat: 2,
      hard: ['d.d.k.k.d.dkd.k.', 'd.k.dkd.k.d.k.k.', 'd.d.k.k.d.dkd.k.', 'dkdkd.k.d.k.d...'],
      medium: ['d...k.k.d.d.k...', 'd.k.d...k.d.k...', 'd...k.k.d.d.k...', 'd.d.k.k.d...d...'],
      easy: ['d...k...d...k...', 'd...k...d.......', 'd...k...d...k...', 'd...d...k...d...'],
    },
    {
      name: 'build',
      hard: ['d.d.d.d.k.k.k.k.', 'dkd.dkd.kdk.kdk.', 'd.k.d.k.dkdkd.k.', 'D...K...R-----..'],
      medium: ['d.d.d.d.k.k.k.k.', 'd.d.d...k.k.k...', 'd.k.d.k.d.d.k.k.', 'D...K...R-----..'],
      easy: ['d...d...k...k...', 'd...d...k...k...', 'd...k...d...k...', 'D.......R-----..'],
    },
    {
      name: 'chorus', gogo: true,
      hard: [
        'D...k.k.d.dkd.k.', 'd.dkd.k.d.k.d.k.', 'D...k.k.d.dkd.k.', 'dkd.k.d.dkd.K...',
        'D...k.k.d.dkd.k.', 'd.dkd.k.d.k.d.k.', 'D...k.k.dkd.dkd.', 'dkd.dkd.d.k.K...',
      ],
      medium: [
        'D...k...d.d.k...', 'd.d.k...d.k.d...', 'D...k...d.d.k...', 'd.d.k.k.d...K...',
        'D...k...d.d.k...', 'd.d.k...d.k.d...', 'D...k...d.d.k.k.', 'd.d.k.k.d.k.K...',
      ],
      easy: [
        'D...k...d...k...', 'd...d...k...k...', 'D...k...d...k...', 'd...d...D.......',
        'D...k...d...k...', 'd...d...k...k...', 'D...k...d...k...', 'd...d...k...K...',
      ],
    },
    {
      // the storm holds its breath
      name: 'bridge',
      hard: ['d.....k.d.....k.', 'd.....k.d...k.k.', 'd..d..k.d..d..k.', 'r-----------....'],
      medium: ['d.......k.......', 'd.......k...k...', 'd..d..k.d..d..k.', 'r-----------....'],
      easy: ['d.......k.......', 'd.......k.......', 'd...d...k...k...', 'r-----------....'],
    },
    {
      name: 'chorus', gogo: true,
      hard: [
        'D...k.k.dkd.dkd.', 'd.dkd.k.dkd.k.k.', 'D...k.k.dkd.dkd.', 'dkd.k.dkd.k.K...',
        'D...k.k.dkd.dkd.', 'd.dkd.k.dkd.k.k.', 'D.k.dkd.k.dkd.k.', 'dkd.dkd.d.k.D...',
      ],
      medium: [
        'D...k...d.d.k.k.', 'd.d.k...d.k.d...', 'D...k...d.d.k.k.', 'd.d.k.k.d...K...',
        'D...k...d.d.k.k.', 'd.d.k...d.k.d...', 'D...k.k.d.d.k.k.', 'd.d.k.k.d.k.D...',
      ],
      easy: [
        'D...k...d...k...', 'd...d...k...k...', 'D...k...d...k...', 'd...d...D.......',
        'D...k...d...k...', 'd...d...k...k...', 'D...k...d...d...', 'd...k...d...D...',
      ],
    },
    {
      name: 'outro',
      hard: ['d.dkd.k.d.dkd.k.', 'R-----------....', 'D...............'],
      medium: ['d.d.k.k.d.d.k.k.', 'R-----------....', 'D...............'],
      easy: ['d...k...d...k...', 'R-----------....', 'D...............'],
    },
  ],

  // [note, eighths] pairs, one list per measure
  melodySteps: 8,
  melody: {
    intro: [
      [['A4', 1], ['A4', 1], ['-', 2], ['A4', 1], ['A4', 1], ['-', 2]],
      [['C5', 1], ['C5', 1], ['-', 2], ['D5', 1], ['D5', 1], ['-', 2]],
      [['E5', 1], ['D5', 1], ['C5', 1], ['D5', 1], ['E5', 1], ['G5', 1], ['E5', 1], ['D5', 1]],
      [['E5', 2], ['G5', 2], ['A5', 4]],
    ],
    verse: [
      [['A4', 1], ['C5', 1], ['D5', 2], ['E5', 1], ['D5', 1], ['C5', 2]],
      [['D5', 1], ['E5', 1], ['G5', 2], ['E5', 2], ['D5', 2]],
      [['A4', 1], ['C5', 1], ['D5', 2], ['E5', 1], ['G5', 1], ['A5', 2]],
      [['G5', 1], ['E5', 1], ['D5', 1], ['C5', 1], ['A4', 3], ['-', 1]],
    ],
    build: [
      [['E5', 1], ['E5', 1], ['G5', 2], ['E5', 1], ['E5', 1], ['G5', 2]],
      [['G5', 1], ['G5', 1], ['A5', 2], ['G5', 1], ['G5', 1], ['A5', 2]],
      [['A5', 1], ['G5', 1], ['A5', 1], ['C6', 1], ['A5', 1], ['G5', 1], ['A5', 1], ['C6', 1]],
      [['D6', 2], ['C6', 2], ['D6', 4]],
    ],
    chorus: [
      [['A5', 2], ['G5', 1], ['A5', 1], ['C6', 2], ['A5', 2]],
      [['G5', 1], ['E5', 1], ['G5', 2], ['E5', 2], ['D5', 2]],
      [['A5', 2], ['G5', 1], ['A5', 1], ['C6', 2], ['D6', 2]],
      [['C6', 1], ['A5', 1], ['G5', 2], ['A5', 3], ['-', 1]],
      [['A5', 2], ['G5', 1], ['A5', 1], ['C6', 2], ['A5', 2]],
      [['G5', 1], ['E5', 1], ['G5', 2], ['A5', 2], ['G5', 2]],
      [['E5', 1], ['G5', 1], ['A5', 1], ['C6', 1], ['D6', 2], ['C6', 2]],
      [['A5', 6], ['-', 2]],
    ],
    bridge: [
      [['A4', 4], ['C5', 4]],
      [['D5', 4], ['E5', 4]],
      [['A4', 3], ['C5', 3], ['D5', 2]],
      [['E5', 8]],
    ],
    outro: [
      [['A5', 1], ['G5', 1], ['E5', 1], ['D5', 1], ['E5', 1], ['G5', 1], ['A5', 2]],
      [['C6', 2], ['D6', 2], ['E6', 4]],
      [['A5', 8]],
    ],
  },

  bass: {
    intro: ['A2', 'A2', 'F2', 'G2'],
    verse: ['A2', 'F2', 'A2', 'G2'],
    build: ['F2', 'G2', 'A2', 'G2'],
    chorus: ['F2', 'G2', 'A2', 'A2', 'F2', 'G2', 'E2', 'A2'],
    bridge: ['A2', 'D2', 'F2', 'E2'],
    outro: ['F2', 'G2', 'A2'],
  },

  arrange(kit, measures, { at, measure }) {
    playMelody(kit, this, measures, kit.shamisen, entry => entry.section.name !== 'bridge');
    // the flute takes the bridge alone and doubles the chorus
    playMelody(kit, this, measures, kit.flute, entry => entry.section.name === 'bridge' || entry.section.name === 'chorus');
    measures.forEach((entry, m) => {
      const { name } = entry.section;
      const root = rootOf(this, entry);
      const last = name === 'outro' && entry.index === 2;
      if (name === 'bridge') {
        kit.pad(at(m), root * 2, measure);
        kit.chime(at(m), root * 8);
        kit.bass(at(m), root, 1.2);
        return;
      }
      if (last) { kit.bass(at(m), root, 1.6); kit.pad(at(m), root * 2, measure); return; }
      // hand bell: quarters, then driving eighths in the chorus
      if (name !== 'intro' || entry.index >= 2) {
        for (let i = 0; i < 16; i += name === 'chorus' ? 2 : 4) kit.bell(at(m, i), i % 8 === 4 ? 1 : 0.5);
      }
      // strings strike the chord on the off-beats
      if (name === 'chorus' || name === 'build') {
        [2, 6, 10, 14].forEach(i => { kit.strings(at(m, i), root * 4); kit.strings(at(m, i), root * 6); });
        kit.pad(at(m), root * 2, measure);
      }
      // the bass runs in eighths, jumping the octave when the song is at full tilt
      const run = name === 'intro' && entry.index < 2 ? [0, 8] : [0, 2, 4, 6, 8, 10, 12, 14];
      run.forEach(i => kit.bass(at(m, i), root * (name === 'chorus' && i % 4 === 2 ? 2 : 1), 0.17));
    });
  },
};
