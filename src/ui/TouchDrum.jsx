// The drum you play on a touch screen. It is only a picture: touches are read
// by the play screen from the whole display, so there are no dead spots, and
// game/touchDrum.js decides what each touch means.
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { SKIN } from '../game/touchDrum.js';

const PICTURE = `${import.meta.env.BASE_URL}art/drum.webp`;
const PARTS = [['don', 'left'], ['don', 'right'], ['ka', 'left'], ['ka', 'right']];

export const TouchDrum = forwardRef(function TouchDrum({ drum, height }, ref) {
  const head = useRef();
  const parts = useRef({});
  useImperativeHandle(ref, () => ({
    // lights the part that was played; never re-renders, so it costs a hit nothing
    flash({ kind, hand }) {
      parts.current[`${kind}-${hand}`]?.animate([{ opacity: 0.9 }, { opacity: 0 }], { duration: 180, easing: 'ease-out' });
      head.current?.animate([{ transform: 'translateY(3px) scale(.988)' }, { transform: 'none' }], { duration: 110, easing: 'ease-out' });
    },
  }), []);

  const { cx, cy, rx, ry, depth, skin } = drum;
  const bottom = Math.min(height, cy + skin.ry);
  // words sit in the part of the drum that is on screen
  const donY = (cy - skin.ry + bottom) / 2 - (cy - ry);
  const ring = (1 + SKIN) / 2;
  const lift = Math.min(0.92, Math.max(0.34, (cy - (height - 34)) / (ring * ry) + 0.12));
  const kaX = ring * rx * Math.sqrt(1 - lift * lift);
  const kaY = ry - ring * ry * lift;
  return (
    <div className="touch-drum" aria-hidden="true" style={{ left: cx - rx, top: cy - ry, width: rx * 2, height: ry * 2, '--skin': SKIN }}>
      <i className="touch-drum-side" style={{ height: ry + depth, borderRadius: `0 0 ${rx}px ${rx}px / 0 0 ${ry}px ${ry}px` }} />
      <div className="touch-drum-head" ref={head}>
        <img src={PICTURE} alt="" draggable={false} />
        {PARTS.map(([kind, hand]) => (
          <i key={`${kind}-${hand}`} className={`touch-drum-light ${kind} ${hand}`} ref={node => { parts.current[`${kind}-${hand}`] = node; }} />
        ))}
        <span className="touch-drum-word don" style={{ left: rx - skin.rx * 0.46, top: donY }}>ドン</span>
        <span className="touch-drum-word don" style={{ left: rx + skin.rx * 0.46, top: donY }}>ドン</span>
        <span className="touch-drum-word ka" style={{ left: rx - kaX, top: kaY }}>カッ</span>
        <span className="touch-drum-word ka" style={{ left: rx + kaX, top: kaY }}>カッ</span>
      </div>
    </div>
  );
});
