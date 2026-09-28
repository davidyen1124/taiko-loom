// A canvas that paints with the same drawing code as the play screen, so
// menus and gameplay share one set of artwork.
import { useEffect, useRef } from 'react';
import { fingers } from './device.js';
import { useStageScale } from './Stage.jsx';
import { pixelRatio } from '../game/pacer.js';
import { onSprites } from '../game/art/sprites.js';

// `rate` is how many times a second a moving picture is painted, at most.
// `cover` says the picture covers the stage: it is then drawn at the size it
// is shown, where a small picture is drawn a little larger to stay crisp.
export function Art({ width, height, draw, animate = false, rate = 60, cover = false, className = '', label }) {
  const ref = useRef();
  const painter = useRef(draw);
  painter.current = draw;
  const stage = useStageScale();
  useEffect(() => {
    const canvas = ref.current;
    const scale = Math.min(3, pixelRatio({ finger: fingers() }) * (cover ? stage : Math.max(0.5, stage)));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext('2d');
    let frame;
    let painted = -Infinity;
    const started = performance.now();
    const wait = 1000 / rate - 4;         // a frame that is nearly due is painted
    const paint = now => {
      if (animate) frame = requestAnimationFrame(paint);
      if (now - painted < wait) return;
      painted = now;
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.clearRect(0, 0, width, height);
      painter.current(context, (now - started) / 1000, scale);
    };
    paint(performance.now());
    const again = () => { painted = -Infinity; if (!animate) paint(performance.now()); };
    document.fonts?.ready.then(again);
    // a still picture is painted again once the painted sprites have arrived
    const forget = onSprites(again);
    return () => { cancelAnimationFrame(frame); forget(); };
  }, [width, height, animate, rate, cover, stage, draw]);
  return <canvas ref={ref} className={`art ${className}`} style={{ width, height }} role={label ? 'img' : 'presentation'} aria-label={label} />;
}
