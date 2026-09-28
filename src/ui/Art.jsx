// A canvas that paints with the same drawing code as the play screen, so
// menus and gameplay share one set of artwork.
import { useEffect, useRef } from 'react';
import { useStageScale } from './Stage.jsx';

export function Art({ width, height, draw, animate = false, className = '', label }) {
  const ref = useRef();
  const painter = useRef(draw);
  painter.current = draw;
  const stage = useStageScale();
  useEffect(() => {
    const canvas = ref.current;
    const scale = Math.min(3, (window.devicePixelRatio || 1) * Math.max(0.5, stage));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext('2d');
    let frame;
    const started = performance.now();
    const paint = now => {
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.clearRect(0, 0, width, height);
      painter.current(context, (now - started) / 1000, scale);
      if (animate) frame = requestAnimationFrame(paint);
    };
    paint(performance.now());
    document.fonts?.ready.then(() => paint(performance.now()));
    return () => cancelAnimationFrame(frame);
  }, [width, height, animate, stage, draw]);
  return <canvas ref={ref} className={`art ${className}`} style={{ width, height }} role={label ? 'img' : 'presentation'} aria-label={label} />;
}
