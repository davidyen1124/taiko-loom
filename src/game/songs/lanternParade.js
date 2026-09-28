// "Lantern Parade": a festival march for flute and drums, in the D yo scale
// (D E G A B), the five-note scale of festival flutes.
import { playMelody, rootOf } from './synth.js';

export default {
  id: 'demo-lantern-parade',
  title: 'Lantern Parade',
  artist: 'Taiko Nights',
  colour: '#f2452b',
  bpm: 132,
  offset: 0.6,                    // the first downbeat
  steps: 16,
  tail: 1.6,
  stars: { easy: 2, medium: 4, hard: 6 },
  loudness: { intro: 0.45, verse: 0.62, build: 0.78, chorus: 1, outro: 0.7 },
  drums: { chorus: 1, build: 0.9 },

  sections: [
    {
      name: 'intro', repeat: 1,
      hard: ['d...d...d...d.d.', 'd...d...d.k.d...', 'd...d...d...d.d.', 'd.k.d.k.D.......'],
      medium: ['d...d...d...d...', 'd...d...d...d...', 'd...d...d...d.d.', 'd...k...D.......'],
      easy: ['d.......d.......', 'd.......d.......', 'd.......d...d...', 'd...d...D.......'],
    },
    {
      name: 'verse', repeat: 2,
      hard: ['d...k...d.d.k...', 'd.d.k...d...k.k.', 'd...k...d.d.k...', 'd.dkd...k.k.d...'],
      medium: ['d...k...d.d.k...', 'd...k...d...k...', 'd...k...d.d.k...', 'd.d.d...k...d...'],
      easy: ['d...k...d...k...', 'd...d...d.......', 'd...k...d...k...', 'd...d...d.......'],
    },
    {
      name: 'build', repeat: 1,
      hard: ['d.d.d.d.k.k.k.k.', 'd.dkd.k.d.dkd.k.', 'd.d.k.k.d.d.k.k.', 'D...K...r-----..'],
      medium: ['d...d.d.k...k.k.', 'd...d.d.k...k.k.', 'd.d.d...k.k.k...', 'D...K...r-----..'],
      easy: ['d...d...k...k...', 'd...d...k...k...', 'd...d...d...d...', 'D.......r-----..'],
    },
    {
      name: 'chorus', repeat: 1, gogo: true,
      hard: [
        'D...k.k.d.d.k...', 'd.dkd.k.d.d.k...', 'D...k.k.d.d.k.k.', 'd.d.k.d.dkd.K...',
        'D...k.k.d.d.k...', 'd.dkd.k.d.d.k...', 'D...k.k.d.d.k.k.', 'd.d.k...B-----..',
      ],
      medium: [
        'D...k...d.d.k...', 'd.d.d...k...k...', 'D...k...d.d.k...', 'd...k.k.d...K...',
        'D...k...d.d.k...', 'd.d.d...k...k...', 'D...k...d.d.k...', 'd...k...B-----..',
      ],
      easy: [
        'D...k...d...k...', 'd...d...k.......', 'D...k...d...k...', 'd...d...D.......',
        'D...k...d...k...', 'd...d...k.......', 'D...k...d...k...', 'd...d...B-----..',
      ],
      balloon: { easy: 4, medium: 6, hard: 8 },
    },
    {
      name: 'verse', repeat: 2,
      hard: ['d...k...d.d.k.k.', 'd.d.k...d.dkd...', 'd...k...d.d.k.k.', 'd.dkd.k.k.k.d...'],
      medium: ['d...k...d.d.k...', 'd.d.k...d...k...', 'd...k...d.d.k...', 'd.d.d...k.k.d...'],
      easy: ['d...k...d...k...', 'd...d...k...k...', 'd...k...d...k...', 'd...d...d.......'],
    },
    {
      name: 'build', repeat: 1,
      hard: ['d.d.d.d.k.k.k.k.', 'd.dkd.k.d.dkd.k.', 'd.d.k.k.d.d.k.k.', 'D...K...R-----..'],
      medium: ['d...d.d.k...k.k.', 'd...d.d.k...k.k.', 'd.d.d...k.k.k...', 'D...K...R-----..'],
      easy: ['d...d...k...k...', 'd...d...k...k...', 'd...d...d...d...', 'D.......R-----..'],
    },
    {
      name: 'chorus', repeat: 1, gogo: true,
      hard: [
        'D...k.k.d.d.k...', 'd.dkd.k.d.d.k...', 'D...k.k.d.d.k.k.', 'd.d.k.d.dkd.K...',
        'D...k.k.d.d.k...', 'd.dkd.k.d.d.k...', 'D...k.k.d.d.k.k.', 'd.dkd.k.d.dkK...',
      ],
      medium: [
        'D...k...d.d.k...', 'd.d.d...k...k...', 'D...k...d.d.k...', 'd...k.k.d...K...',
        'D...k...d.d.k...', 'd.d.d...k...k...', 'D...k...d.d.k...', 'd.d.k...d.d.K...',
      ],
      easy: [
        'D...k...d...k...', 'd...d...k.......', 'D...k...d...k...', 'd...d...D.......',
        'D...k...d...k...', 'd...d...k.......', 'D...k...d...k...', 'd...d...k...K...',
      ],
    },
    {
      name: 'outro', repeat: 1,
      hard: ['d.d.k.k.d.d.k.k.', 'R-----------....', 'D...............'],
      medium: ['d...k.k.d...k.k.', 'R-----------....', 'D...............'],
      easy: ['d...k...d...k...', 'R-----------....', 'D...............'],
    },
  ],

  // [note, eighths] pairs, one list per measure
  melodySteps: 8,
  melody: {
    intro: [[], [], [], [['A4', 1], ['B4', 1], ['D5', 2], ['-', 4]]],
    verse: [
      [['A4', 2], ['B4', 1], ['A4', 1], ['G4', 2], ['E4', 2]],
      [['G4', 1], ['A4', 1], ['B4', 2], ['D5', 2], ['B4', 2]],
      [['A4', 2], ['B4', 1], ['A4', 1], ['G4', 2], ['E4', 2]],
      [['D4', 2], ['E4', 2], ['G4', 3], ['-', 1]],
    ],
    build: [
      [['E4', 1], ['G4', 1], ['A4', 2], ['E4', 1], ['G4', 1], ['A4', 2]],
      [['G4', 1], ['A4', 1], ['B4', 2], ['G4', 1], ['A4', 1], ['B4', 2]],
      [['A4', 1], ['B4', 1], ['D5', 2], ['A4', 1], ['B4', 1], ['D5', 2]],
      [['E5', 2], ['D5', 2], ['E5', 4]],
    ],
    chorus: [
      [['D5', 1], ['D5', 1], ['B4', 1], ['D5', 1], ['E5', 2], ['D5', 2]],
      [['B4', 1], ['A4', 1], ['B4', 2], ['G4', 2], ['A4', 2]],
      [['D5', 1], ['D5', 1], ['B4', 1], ['D5', 1], ['E5', 2], ['G5', 2]],
      [['E5', 1], ['D5', 1], ['B4', 2], ['D5', 3], ['-', 1]],
      [['D5', 1], ['D5', 1], ['B4', 1], ['D5', 1], ['E5', 2], ['D5', 2]],
      [['B4', 1], ['A4', 1], ['B4', 2], ['G4', 2], ['A4', 2]],
      [['G5', 1], ['G5', 1], ['E5', 1], ['G5', 1], ['A5', 2], ['G5', 2]],
      [['E5', 1], ['D5', 1], ['E5', 2], ['D5', 4]],
    ],
    outro: [
      [['D5', 1], ['B4', 1], ['A4', 1], ['G4', 1], ['A4', 1], ['B4', 1], ['D5', 2]],
      [['E5', 2], ['G5', 2], ['A5', 4]],
      [['D5', 8]],
    ],
  },

  // the root of each measure
  bass: {
    intro: ['D2', 'D2', 'D2', 'A2'],
    verse: ['D2', 'G2', 'D2', 'A2'],
    build: ['E2', 'G2', 'A2', 'A2'],
    chorus: ['G2', 'A2', 'B2', 'D2', 'G2', 'A2', 'B2', 'D2'],
    outro: ['G2', 'A2', 'D2'],
  },

  arrange(kit, measures, { at }) {
    playMelody(kit, this, measures, kit.flute);
    measures.forEach((entry, m) => {
      const { name } = entry.section;
      // hand bell: steady eighths, busier in the chorus
      if (name !== 'intro' || entry.index >= 2) {
        for (let i = 0; i < 16; i += name === 'chorus' ? 2 : 4) kit.bell(at(m, i), i % 8 === 4 ? 1 : 0.55);
      }
      const root = rootOf(this, entry);
      // plucked strings answer on the off-beats
      if (name !== 'intro') {
        for (let i = 0; i < 8; i++) {
          if (i % 2 === 0 && name !== 'chorus') continue;
          kit.strings(at(m, i * 2), root * 2 * (i % 4 === 1 ? 3 : i % 4 === 3 ? 4 : 2));
        }
      }
      const pattern = name === 'chorus' ? [0, 3, 4, 6] : name === 'build' ? [0, 2, 4, 6] : [0, 4];
      pattern.forEach(i => kit.bass(at(m, i * 2), root));
    });
  },
};
