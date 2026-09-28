import { Dialog } from './Dialog.jsx';
import { NoteIcon } from './icons.jsx';

const NOTES = [
  { type: 'don', name: 'ドン Don', how: <>Strike the skin: <kbd>F</kbd> or <kbd>J</kbd></> },
  { type: 'ka', name: 'カッ Ka', how: <>Strike the rim: <kbd>D</kbd> or <kbd>K</kbd></> },
  { type: 'bigDon', name: '大 Big notes', how: <><kbd>F</kbd>+<kbd>J</kbd> or <kbd>D</kbd>+<kbd>K</kbd> pay double</> },
  { type: 'roll', name: '連打 Drumroll', how: <>Hit any key as fast as you can until it ends</> },
  { type: 'balloon', name: 'ふうせん Balloon', how: <>Hit the skin the number of times shown</> },
];

export function HelpDialog({ onClose }) {
  return (
    <Dialog title="How to play" kana="あそびかた" onClose={onClose} className="help">
      <p className="help-lead">Notes ride in from the right. Strike the drum as each one reaches the circle.</p>
      <div className="help-columns">
        <ul className="help-notes">
          {NOTES.map(note => (
            <li key={note.type}><NoteIcon type={note.type} size={note.type === 'bigDon' ? 56 : 44} /><strong>{note.name}</strong><span>{note.how}</span></li>
          ))}
        </ul>
        <div className="help-tips">
          <div><h3>Timing</h3><p><b className="good">良</b> right on the beat · <b className="ok">可</b> close · <b className="bad">不可</b> missed, and your combo breaks.</p></div>
          <div><h3>Soul gauge</h3><p>Good hits fill it. Finish past the <b>クリア</b> line to clear the song.</p></div>
          <div><h3>Go-Go Time</h3><p>The loudest part of the song. The lane catches fire.</p></div>
          <div><h3>Your music</h3><p>Add any song. The game finds its beat and writes three charts.</p></div>
        </div>
      </div>
      <footer className="dialog-foot help-foot">
        <p className="help-keys"><kbd>Esc</kbd> pause · <kbd>D</kbd><kbd>K</kbd> move in menus · <kbd>F</kbd><kbd>J</kbd> confirm · on a touch screen, tap the drum</p>
        <button className="button primary" onClick={onClose}>Got it</button>
      </footer>
    </Dialog>
  );
}
