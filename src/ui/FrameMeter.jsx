// How smoothly the game is running, as the display draws it. Shown when the
// address ends in ?fps, for finding out how the game runs on a device that is
// not at hand. It reads: frames a second now, the longest wait for a frame in
// the last five seconds, how many frames in that time came late, and the size
// of what is being drawn.
import { useEffect, useRef } from 'react';
import { paceNow } from '../game/pacer.js';

const LATE = 25;                  // ms: a frame that missed its turn on a 60 Hz display

export function FrameMeter() {
  const out = useRef();
  useEffect(() => {
    let frame;
    let last = performance.now();
    let gaps = [];                // [when, how long]
    let shown = last;
    const tick = now => {
      gaps.push([now, now - last]);
      last = now;
      if (now - shown >= 500) {
        shown = now;
        gaps = gaps.filter(([when]) => now - when <= 5000);
        const recent = gaps.filter(([when]) => now - when <= 1000);
        const fps = recent.length ? 1000 / (recent.reduce((sum, [, gap]) => sum + gap, 0) / recent.length) : 0;
        const worst = Math.max(...gaps.map(([, gap]) => gap));
        const late = gaps.filter(([, gap]) => gap > LATE).length;
        const canvas = document.querySelector('.play-canvas, .backdrop');
        const playing = document.querySelector('.play-canvas') ? paceNow() : '';
        const line = `${fps.toFixed(0)} fps · worst ${worst.toFixed(0)} ms · late ${late}/${gaps.length} · ${canvas ? `${canvas.width}x${canvas.height}` : 'no canvas'} · ${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio}${playing ? ` · ${playing}` : ''}`;
        if (out.current) out.current.textContent = line;
        if (import.meta.env.DEV) navigator.sendBeacon?.('/__frames', line);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return <output className="frame-meter" ref={out} />;
}
