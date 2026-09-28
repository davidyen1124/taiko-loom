// Song select. A shelf of upright song banners; the chosen one opens into a
// panel with its three difficulties. Driven like the drum: rim keys move,
// face keys confirm.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Settings2, CircleHelp, Trash2, ChevronLeft, ChevronRight, Bot } from 'lucide-react';
import { Backdrop } from '../ui/Backdrop.jsx';
import { Crown, LevelIcon, Stars } from '../ui/icons.jsx';
import { audio } from '../game/audio.js';
import { menuAction } from '../game/input.js';
import { DIFFICULTIES, LEVELS, rankFor, RANKS } from '../game/rules.js';
import { formatTime } from '../library.js';
import { recordKey } from '../storage.js';
import { startPreview, stopPreview } from '../preview.js';

const HUES = ['#e8548e', '#2e7fd1', '#2fa36b', '#8a5bd6', '#e07a1f', '#1fa3a3', '#c8402f'];
const hueFor = song => {
  if (song.source === 'demo') return '#f2452b';
  let sum = 0;
  for (const char of song.id) sum = (sum * 31 + char.charCodeAt(0)) >>> 0;
  return HUES[sum % HUES.length];
};

const BAR = 92;          // closed banner width
const GAP = 14;
const OPEN = 560;        // open banner width

export function SongSelect({ songs, records, settings, online, busy, initial, onPlay, onAdd, onDelete, onSettings, onHelp, onBack }) {
  const items = [{ id: 'add', add: true }, ...songs];
  const [index, setIndex] = useState(() => Math.max(1, items.findIndex(item => item.id === initial)));
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const current = items[Math.min(index, items.length - 1)];
  const shelf = useRef();

  useEffect(() => { if (index > items.length - 1) setIndex(items.length - 1); }, [index, items.length]);
  useEffect(() => {
    const at = items.findIndex(item => item.id === initial);
    if (at > 0) { setIndex(at); setOpen(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, songs.length]);

  // preview the highlighted song after a short pause
  useEffect(() => {
    if (!current || current.add || busy) { stopPreview(); return undefined; }
    const timer = setTimeout(() => startPreview(current, settings.music), 650);
    return () => { clearTimeout(timer); stopPreview(); };
  }, [current?.id, settings.music, busy]);   // eslint-disable-line react-hooks/exhaustive-deps

  // Key handlers read the latest state from here, so two keys pressed in
  // quick succession never act on a stale screen.
  const live = useRef({});
  live.current = { index: Math.min(index, items.length - 1), open: open && !current.add, level, items, busy, current };

  const move = useCallback(step => {
    const now = live.current;
    setConfirming(false);
    if (now.open) {
      const next = (now.level + step + 3) % 3;
      live.current = { ...now, level: next };
      setLevel(next);
    } else {
      const next = (now.index + step + now.items.length) % now.items.length;
      live.current = { ...now, index: next, current: now.items[next], open: false };
      setIndex(next);
      setOpen(false);
    }
    audio.jingle('move');
  }, []);

  const confirm = useCallback(() => {
    const now = live.current;
    if (now.busy) return;
    if (now.current.add) { audio.jingle('confirm'); onAdd(); return; }
    if (!now.open) {
      audio.jingle('confirm');
      live.current = { ...now, open: true };
      setOpen(true);
      return;
    }
    audio.don(true);
    stopPreview();
    live.current = { ...now, busy: true };
    onPlay(now.current, DIFFICULTIES[now.level]);
  }, [onAdd, onPlay]);

  const back = useCallback(() => {
    const now = live.current;
    if (now.busy) return;
    audio.jingle('back');
    setConfirming(false);
    if (now.open) { live.current = { ...now, open: false }; setOpen(false); } else onBack();
  }, [onBack]);

  const pick = useCallback(i => {
    const now = live.current;
    if (now.busy) return;
    if (i === now.index) { confirm(); return; }
    live.current = { ...now, index: i, current: now.items[i], open: false };
    setIndex(i);
    setOpen(false);
    setConfirming(false);
    audio.jingle('move');
  }, [confirm]);

  useEffect(() => {
    const down = event => {
      if (event.repeat && !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      if (event.target.closest?.('input, textarea')) return;
      if (live.current.busy) return;
      const action = menuAction(event);
      if (!action) return;
      event.preventDefault();
      if (action === 'left' || action === 'up') move(-1);
      else if (action === 'right' || action === 'down') move(1);
      else if (action === 'confirm') confirm();
      else back();
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [move, confirm, back]);

  // slide the shelf so the chosen banner sits in the middle of the stage
  const before = index * (BAR + GAP);
  const isOpen = open && !current.add;
  const width = isOpen ? OPEN : BAR;
  const shift = 640 - before - width / 2;

  return (
    <section className="select" aria-label="Song select">
      <Backdrop variant="select" />
      <header className="select-head">
        <h1><span>曲をえらぶ</span>Song select</h1>
        <div className="select-tools">
          {settings.auto && <span className="chip auto"><Bot size={18} strokeWidth={2.8} />Auto play</span>}
          <span className={`chip ${online ? 'online' : 'offline'}`}><i />{online ? 'Server connected' : 'Server offline'}</span>
          <button className="tool" aria-label="How to play" onClick={onHelp}><CircleHelp size={26} strokeWidth={2.6} /></button>
          <button className="tool" aria-label="Settings" onClick={onSettings}><Settings2 size={26} strokeWidth={2.6} /></button>
        </div>
      </header>

      <div className="shelf" ref={shelf} style={{ transform: `translateX(${shift}px)` }} role="listbox" aria-label="Songs" aria-activedescendant={`song-${current.id}`}>
        {items.map((item, i) => {
          const selected = i === index;
          if (item.add) {
            return (
              <button key="add" id="song-add" role="option" aria-selected={selected} className={`banner add ${selected ? 'selected' : ''}`} style={{ '--hue': '#f4a81e' }}
                onClick={() => pick(i)}>
                <span className="banner-plus"><Plus size={40} strokeWidth={3.4} /></span>
                <span className="banner-title">曲をついか</span>
                <span className="banner-sub">Add your music</span>
              </button>
            );
          }
          const expanded = selected && isOpen;
          const hue = hueFor(item);
          const best = DIFFICULTIES.map(name => {
            const record = records[recordKey(item.id, name)];
            return record && record.score > 0 ? record : null;
          });
          return (
            <article key={item.id} id={`song-${item.id}`} role="option" aria-selected={selected} aria-label={`${item.title} by ${item.artist}`}
              className={`banner song ${selected ? 'selected' : ''} ${expanded ? 'open' : ''}`} style={{ '--hue': hue, width: expanded ? OPEN : BAR }}>
              {!expanded ? (
                <button className="banner-face" onClick={() => pick(i)}>
                  <span className="banner-crowns">{best.map((record, k) => <Crown key={DIFFICULTIES[k]} kind={record?.crown || null} size={20} />)}</span>
                  <span className="banner-title">{item.title}</span>
                  {item.source === 'demo' && <span className="banner-tag">DEMO</span>}
                  {item.source === 'device' && <span className="banner-tag">LOCAL</span>}
                </button>
              ) : (
                <div className="panel">
                  <header className="panel-head">
                    <button className="panel-back" aria-label="Back to songs" onClick={back}><ChevronLeft size={26} strokeWidth={3.4} /></button>
                    <div className="panel-names">
                      <h2>{item.title}</h2>
                      <p>{item.artist}</p>
                    </div>
                    <dl className="panel-facts">
                      <div><dt>BPM</dt><dd>{Math.round(item.bpm)}</dd></div>
                      <div><dt>Length</dt><dd>{formatTime(item.duration)}</dd></div>
                    </dl>
                  </header>
                  <div className="levels" role="radiogroup" aria-label="Difficulty">
                    {DIFFICULTIES.map((name, k) => {
                      const info = LEVELS[name];
                      const stats = item.levels[name];
                      const record = best[k];
                      const stamp = record ? rankFor(record.score) : null;
                      return (
                        <button key={name} role="radio" aria-checked={k === level} className={`level ${k === level ? 'selected' : ''}`} style={{ '--tone': info.color, '--deep': info.dark }}
                          onPointerMove={() => { if (live.current.level !== k) setLevel(k); }} onFocus={() => setLevel(k)} onClick={() => { if (live.current.busy) return; setLevel(k); audio.don(true); stopPreview(); live.current = { ...live.current, busy: true }; onPlay(item, name); }}>
                          <span className="level-crown"><Crown kind={record?.crown || null} size={34} /></span>
                          <span className="level-icon"><LevelIcon level={name} size={52} /></span>
                          <strong>{info.jp}</strong>
                          <em>{info.en}</em>
                          <Stars count={stats.stars} max={info.maxStars} color={info.color} />
                          <span className="level-notes">{stats.hits} notes</span>
                          <span className="level-best">
                            {record ? <>{stamp && <b style={{ background: stamp.color }}>{stamp.label}</b>}{record.score.toLocaleString()}</> : 'No record yet'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {item.source !== 'demo' && (
                    confirming ? (
                      <div className="panel-remove confirming" role="alertdialog" aria-label="Remove this song?">
                        <span>Remove this song and its records?</span>
                        <button className="button small danger" onClick={() => { setConfirming(false); setOpen(false); onDelete(item); }}>Remove</button>
                        <button className="button small ghost" onClick={() => setConfirming(false)}>Keep</button>
                      </div>
                    ) : (
                      <button className="panel-remove" onClick={() => setConfirming(true)}><Trash2 size={16} strokeWidth={2.8} />Remove song</button>
                    )
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <button className="shelf-arrow left" aria-label="Previous" onClick={() => move(-1)}><ChevronLeft size={40} strokeWidth={3.6} /></button>
      <button className="shelf-arrow right" aria-label="Next" onClick={() => move(1)}><ChevronRight size={40} strokeWidth={3.6} /></button>

      <footer className="select-foot">
        <p className="hints">
          <span><kbd className="ka">D</kbd><kbd className="ka">K</kbd>{isOpen ? 'Difficulty' : 'Move'}</span>
          <span><kbd className="don">F</kbd><kbd className="don">J</kbd>{isOpen ? 'Play' : 'Choose'}</span>
          <span><kbd>Esc</kbd>Back</span>
        </p>
        <p className="count">{songs.length} {songs.length === 1 ? 'song' : 'songs'}</p>
        <ul className="legend" aria-label="Score stamps">
          {[...RANKS].reverse().map(rank => <li key={rank.id}><b style={{ background: rank.color }}>{rank.label}</b>{(rank.min / 1000).toLocaleString()}k</li>)}
        </ul>
      </footer>
    </section>
  );
}
