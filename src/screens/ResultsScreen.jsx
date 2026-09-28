// Results: the score counts up, the crown drops in, the crowd reacts.
import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw, ListMusic, Sparkles } from 'lucide-react';
import { Art } from '../ui/Art.jsx';
import { Backdrop } from '../ui/Backdrop.jsx';
import { Crown, LevelIcon, Mascot } from '../ui/icons.jsx';
import { drawGauge } from '../game/art/hud.js';
import { audio } from '../game/audio.js';
import { menuAction } from '../game/input.js';
import { GAUGE as GAUGE_LAYOUT } from '../game/layout.js';
import { GAUGE, LEVELS, RANKS, accuracy } from '../game/rules.js';

const CROWN_NAMES = { silver: 'Clear', gold: 'Full combo', rainbow: 'All perfect' };

function useCountUp(target, delay, length = 1100) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame;
    const begin = performance.now() + delay;
    let lastTick = 0;
    const step = now => {
      const t = Math.min(1, Math.max(0, (now - begin) / length));
      setValue(Math.round(target * (1 - (1 - t) ** 3)));
      if (t > 0 && t < 1 && now - lastTick > 70) { audio.jingle('tick'); lastTick = now; }
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, delay, length]);
  return value;
}

export function ResultsScreen({ song, result, outcome, onRetry, onSongs }) {
  const level = LEVELS[result.difficulty];
  const rule = GAUGE[result.difficulty];
  const rank = RANKS.find(item => item.id === result.rank) || null;
  const [choice, setChoice] = useState(result.cleared ? 1 : 0);
  const score = useCountUp(result.score, 900);
  const good = useCountUp(result.good, 1300, 700);
  const ok = useCountUp(result.ok, 1500, 700);
  const bad = useCountUp(result.bad, 1700, 700);
  const combo = useCountUp(result.maxCombo, 1900, 700);
  const rolls = useCountUp(result.rolls, 2100, 700);

  useEffect(() => {
    const timers = [
      setTimeout(() => audio.jingle(result.cleared ? 'clear' : 'fail'), 350),
      result.crown ? setTimeout(() => audio.jingle('crown'), 2500) : null,
    ];
    return () => timers.forEach(clearTimeout);
  }, [result.cleared, result.crown]);

  const live = useRef({ choice, done: false });
  live.current.choice = choice;

  const choose = useCallback(index => {
    if (live.current.done) return;
    live.current.done = true;
    audio.jingle('confirm');
    if (index === 0) onRetry(); else onSongs();
  }, [onRetry, onSongs]);

  const focus = index => { live.current.choice = index; setChoice(index); };

  useEffect(() => {
    const down = event => {
      if (event.repeat) return;
      const action = menuAction(event);
      if (!action) return;
      event.preventDefault();
      if (action === 'confirm') choose(live.current.choice);
      else if (action === 'back') choose(1);
      else { focus(1 - live.current.choice); audio.jingle('move'); }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [choose]);

  const gauge = useCallback((c, time) => {
    c.save();
    c.translate(-GAUGE_LAYOUT.x + 96, -GAUGE_LAYOUT.y + 12);
    drawGauge(c, { value: Math.min(result.gauge, result.gauge * Math.min(1, time / 1.2)), clear: rule.clear, time });
    c.restore();
  }, [result.gauge, rule.clear]);

  return (
    <section className={`results ${result.cleared ? 'cleared' : 'failed'}`} aria-label="Results">
      <Backdrop variant="results" mood={result.cleared ? 'happy' : 'sad'} bpm={song.bpm} />
      <header className="results-head">
        <h1><span>せいせき</span>Results</h1>
        <div className="results-song"><strong>{song.title}</strong><span>{song.artist}</span></div>
      </header>

      <div className="results-side">
        <div className="results-level" style={{ '--tone': level.color, '--deep': level.dark }}>
          <LevelIcon level={result.difficulty} size={64} />
          <strong>{level.jp}</strong>
          <em>{level.en}</em>
        </div>
        <div className={`results-crown ${result.crown ? 'earned' : ''}`}>
          <Crown kind={result.crown} size={96} />
          <span>{result.crown ? CROWN_NAMES[result.crown] : 'No crown'}</span>
        </div>
      </div>

      <div className="results-board">
        <div className="results-verdict">
          <strong>{result.cleared ? 'クリア成功!' : 'クリア失敗…'}</strong>
          <span>{result.cleared ? 'Song cleared' : 'Not cleared'}{result.auto ? ' · auto play' : ''}</span>
        </div>
        <Art className="results-gauge" width={910} height={72} draw={gauge} animate label={`Soul gauge ${Math.round(result.gauge)} percent, clear line at ${rule.clear} percent`} />
        <div className="results-score">
          <span>スコア<small>Score</small></span>
          <output aria-label={`Score ${result.score}`}>{score.toLocaleString()}<small>点</small></output>
          {outcome?.improved.score && !result.auto && <em className="record"><Sparkles size={18} strokeWidth={2.8} />New record</em>}
        </div>
        <dl className="results-counts">
          <div className="good"><dt>良<small>Good</small></dt><dd>{good}</dd></div>
          <div className="ok"><dt>可<small>OK</small></dt><dd>{ok}</dd></div>
          <div className="bad"><dt>不可<small>Miss</small></dt><dd>{bad}</dd></div>
          <div className="combo"><dt>最大コンボ<small>Max combo</small></dt><dd>{combo}</dd></div>
          <div className="rolls"><dt>連打<small>Drumroll</small></dt><dd>{rolls}</dd></div>
          <div className="accuracy"><dt>精度<small>Accuracy</small></dt><dd>{accuracy(result).toFixed(1)}%</dd></div>
        </dl>
        <div className={`results-stamp ${rank ? 'earned' : ''}`} style={{ '--tone': rank?.color || '#6a5a66' }} aria-label={rank ? `Score stamp: ${rank.name}` : 'No score stamp'}>
          <b>{rank ? rank.label : '—'}</b>
          <span>{rank ? rank.name : 'No stamp'}</span>
        </div>
      </div>

      <div className="results-mascot"><Mascot size={230} mood={result.cleared ? 'happy' : 'sad'} bpm={song.bpm} drumming={result.cleared} /></div>

      <nav className="results-actions" aria-label="What next">
        <button className={`button large ${choice === 0 ? 'selected' : ''}`} onPointerMove={() => { if (live.current.choice !== 0) focus(0); }} onFocus={() => focus(0)} onClick={() => choose(0)}>
          <RotateCcw size={24} strokeWidth={3} /><span>もういちど<small>Play again</small></span>
        </button>
        <button className={`button large ${choice === 1 ? 'selected' : ''}`} onPointerMove={() => { if (live.current.choice !== 1) focus(1); }} onFocus={() => focus(1)} onClick={() => choose(1)}>
          <ListMusic size={24} strokeWidth={3} /><span>曲をえらぶ<small>Song select</small></span>
        </button>
      </nav>
    </section>
  );
}
