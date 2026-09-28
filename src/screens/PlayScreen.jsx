// The play screen: connects the keyboard and touch input, the audio clock,
// the rules engine and the renderer, and owns pause / retry / quit.
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pause, Play, RotateCcw, ListMusic } from 'lucide-react';
import { audio } from '../game/audio.js';
import { Game } from '../game/engine.js';
import { menuAction, padForKey, padForPoint } from '../game/input.js';
import { FRAME, STAGE } from '../game/layout.js';
import { Renderer } from '../game/renderer.js';
import { crownFor, isBig, rankFor } from '../game/rules.js';
import { drumLayout, padAt } from '../game/touchDrum.js';
import { safeArea } from '../ui/safeArea.js';
import { useStage } from '../ui/Stage.jsx';
import { TouchDrum } from '../ui/TouchDrum.jsx';
import { loadFonts } from '../fonts.js';

const PAUSE_OPTIONS = [
  { id: 'resume', label: 'つづける', sub: 'Resume', icon: Play },
  { id: 'retry', label: 'やりなおす', sub: 'Retry', icon: RotateCcw },
  { id: 'quit', label: '曲をえらぶ', sub: 'Song select', icon: ListMusic },
];

export function PlayScreen({ song, buffer, difficulty, settings, session, onFinish, onQuit }) {
  const canvas = useRef();
  const state = useRef({});
  const [paused, setPaused] = useState(false);
  const [choice, setChoice] = useState(0);
  const [run, setRun] = useState(0);
  const live = useRef({ paused: false, choice: 0 });
  live.current.paused = paused;
  live.current.choice = choice;
  // The drum is for fingers. It shows on devices whose main pointer is a
  // finger, and on any other device from the moment its screen is touched.
  const [touch, setTouch] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);
  const [drum, setDrum] = useState(null);
  const pads = useRef();
  const stage = useStage();
  const shown = touch && settings.guide;
  live.current.drum = shown ? drum : null;

  // While the drum is out the stage makes room for it underneath.
  const { dock } = stage;
  useEffect(() => {
    dock(shown);
    return () => dock(false);
  }, [dock, shown]);

  // one run of the song, restarted whenever `run` changes
  useEffect(() => {
    let frame;
    let alive = true;
    const renderer = new Renderer(canvas.current);
    const game = new Game(song, difficulty, { auto: settings.auto });
    const offset = settings.offset / 1000;
    state.current = { renderer, game, offset, done: false };
    // development only: lets QA step the game frame by frame (see docs/qa.md)
    if (import.meta.env.DEV) window.__taiko = { renderer, game, audio };
    renderer.start(game, song, { speed: settings.speed });
    renderer.drum = live.current.behind || null;
    audio.setVolumes({ music: settings.music, sfx: settings.sfx });
    audio.load(buffer);
    setPaused(false);

    const resize = () => renderer.resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas.current);

    const tick = () => {
      if (!alive) return;
      const now = performance.now() / 1000;
      const time = audio.time() - offset;
      if (audio.playing) {
        game.update(time);
        const events = game.drain();
        for (const event of events) {
          if (event.type === 'auto') {
            if (event.kind === 'ka') audio.ka(event.big); else audio.don(event.big);
            pads.current?.flash(event);
            if (event.big) pads.current?.flash({ kind: event.kind, hand: event.hand === 'left' ? 'right' : 'left' });
          } else if (event.type === 'milestone') audio.jingle('milestone');
          else if (event.type === 'gogo' && event.on) audio.jingle('gogo');
          else if (event.type === 'holdEnd' && event.popped) audio.pop();
          else if (event.type === 'finish' && !state.current.done) {
            state.current.done = true;
            const result = event.result;
            setTimeout(() => {
              if (!alive) return;
              audio.stop();
              onFinish({ ...result, crown: crownFor(result), rank: rankFor(result.score)?.id || null });
            }, 900);
          }
        }
        renderer.handle(events, now);
      }
      renderer.draw(time, now);
      frame = requestAnimationFrame(tick);
    };

    loadFonts(`${song.title}${song.artist}`).then(async () => {
      if (!alive) return;
      await audio.unlock();
      if (!alive) return;
      audio.play(-2.2);
      frame = requestAnimationFrame(tick);
    });

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      audio.stop();
    };
  }, [song, buffer, difficulty, settings, session, run, onFinish]);

  const strike = useCallback((pad, stamp) => {
    const { renderer, game, offset, done } = state.current;
    if (!renderer || done || !audio.playing) return;
    const now = performance.now();
    const at = audio.time(stamp && stamp <= now ? stamp : now) - offset;
    const next = game.notes.slice(game.cursor).find(n => n.state === 'waiting');
    const big = Boolean(next && isBig(next) && Math.abs(next.time - at) < game.windows.ok);
    if (pad.kind === 'ka') audio.ka(big); else audio.don(big);
    renderer.strike(pad.kind, pad.hand, now / 1000);
    pads.current?.flash(pad);
    if (game.auto) return;
    // bring the rules up to this instant first, so judging never depends on
    // how recently a frame was drawn
    game.update(at);
    game.hit(pad.kind, pad.hand, at);
    renderer.handle(game.drain().filter(event => {
      if (event.type === 'milestone') audio.jingle('milestone');
      if (event.type === 'holdEnd' && event.popped) audio.pop();
      return true;
    }), now / 1000);
  }, []);

  const pause = useCallback(() => {
    if (state.current.done || !audio.playing) return;
    audio.pause();
    audio.jingle('back');
    live.current = { paused: true, choice: 0 };
    setChoice(0);
    setPaused(true);
  }, []);

  const choose = useCallback(id => {
    if (!live.current.paused) return;
    live.current.paused = false;
    if (id === 'resume') {
      audio.jingle('confirm');
      setPaused(false);
      audio.play(audio.position);
    } else if (id === 'retry') {
      audio.jingle('confirm');
      setRun(value => value + 1);
    } else {
      audio.jingle('back');
      onQuit();
    }
  }, [onQuit]);

  useEffect(() => {
    const down = event => {
      if (event.repeat) return;
      if (live.current.paused) {
        const action = menuAction(event);
        if (!action) return;
        event.preventDefault();
        if (action === 'confirm') choose(PAUSE_OPTIONS[live.current.choice].id);
        else if (action === 'back') choose('resume');
        else {
          const next = (live.current.choice + (action === 'left' || action === 'up' ? 2 : 1)) % 3;
          live.current.choice = next;
          setChoice(next);
          audio.jingle('move');
        }
        return;
      }
      if (event.key === 'Escape' || event.key === 'p' || event.key === 'P') { event.preventDefault(); pause(); return; }
      const pad = padForKey(event);
      if (!pad) return;
      event.preventDefault();
      strike(pad, event.timeStamp);
    };
    const hidden = () => { if (document.hidden) pause(); };
    window.addEventListener('keydown', down);
    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('blur', pause);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [choose, pause, strike]);

  // Where the drum sits, in the window and on the stage. The festival friends
  // need the second one: they line up behind the drum.
  useEffect(() => {
    const place = () => {
      const box = canvas.current?.getBoundingClientRect();
      if (!box || !box.width) return;
      const upright = window.innerHeight > window.innerWidth;
      const row = box.height / STAGE.height;
      const next = drumLayout(window.innerWidth, window.innerHeight, {
        upright, stageBottom: box.bottom, inset: safeArea(),
        laneBottom: box.top + (FRAME.y + FRAME.height + STAGE.top) * row,
      });
      const unit = STAGE.width / box.width;
      const behind = shown && !upright
        ? { cx: (next.cx - box.left) * unit, cy: (next.cy - box.top) * unit, rx: next.rx * unit, ry: next.ry * unit }
        : null;
      live.current.behind = behind;
      if (state.current.renderer) state.current.renderer.drum = behind;
      setDrum({ ...next, upright });
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(canvas.current);
    window.addEventListener('resize', place);
    return () => { observer.disconnect(); window.removeEventListener('resize', place); };
  }, [shown, stage.width, stage.height, stage.scale, stage.docked]);

  // The whole display listens, not just the stage or the picture of the drum.
  useEffect(() => {
    const down = event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (live.current.paused || event.target.closest?.('button, .pause, .dialog-shade, .rotate-hint')) return;
      event.preventDefault();
      if (event.pointerType !== 'mouse') setTouch(true);
      const on = live.current.drum;
      strike(on ? padAt(event.clientX, event.clientY, on) : padForPoint(event.clientX, window.innerWidth), event.timeStamp);
    };
    window.addEventListener('pointerdown', down, { passive: false });
    return () => window.removeEventListener('pointerdown', down);
  }, [strike]);

  return (
    <section className="play" aria-label={`Playing ${song.title}`}>
      <canvas ref={canvas} className="play-canvas" aria-label="Notes scroll from right to left. Hit them when they reach the circle." />
      <button className="play-pause" aria-label="Pause" onClick={pause}><Pause size={26} fill="currentColor" strokeWidth={0} /></button>
      {shown && drum && !paused && createPortal(<TouchDrum ref={pads} drum={drum} upright={drum.upright} />, document.body)}
      {paused && (
        <div className="pause" role="dialog" aria-modal="true" aria-label="Paused">
          <div className="pause-panel">
            <h2><span>ひとやすみ</span>Paused</h2>
            <div className="pause-options">
              {PAUSE_OPTIONS.map((option, index) => (
                <button
                  key={option.id}
                  className={`pause-option ${index === choice ? 'selected' : ''}`}
                  onPointerMove={() => { if (live.current.choice !== index) { live.current.choice = index; setChoice(index); } }}
                  onFocus={() => { live.current.choice = index; setChoice(index); }}
                  onClick={() => choose(option.id)}
                >
                  <option.icon size={30} strokeWidth={2.6} />
                  <strong>{option.label}</strong>
                  <small>{option.sub}</small>
                </button>
              ))}
            </div>
            <p className="pause-hint"><kbd>D</kbd><kbd>K</kbd> move · <kbd>F</kbd><kbd>J</kbd> choose · <kbd>Esc</kbd> resume</p>
          </div>
        </div>
      )}
    </section>
  );
}
