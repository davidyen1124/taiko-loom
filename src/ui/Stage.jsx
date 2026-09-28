// The whole game lives on a 1280 x 720 stage that is scaled to fit the
// window, so every screen keeps the same proportions at any size.
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { STAGE } from '../game/layout.js';

const ScaleContext = createContext(1);
export const useStageScale = () => useContext(ScaleContext);

export function fitStage(width, height) {
  return Math.max(0.1, Math.min(width / STAGE.width, height / STAGE.height));
}

export function Stage({ children }) {
  const frame = useRef();
  const [scale, setScale] = useState(() => fitStage(window.innerWidth, window.innerHeight));
  const [upright, setUpright] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const measure = () => {
      const box = frame.current.getBoundingClientRect();
      setScale(fitStage(box.width, box.height));
      // a phone held upright leaves the stage too small to read
      setUpright(box.width < 700 && box.height > box.width * 1.2);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame.current);
    window.addEventListener('orientationchange', measure);
    return () => { observer.disconnect(); window.removeEventListener('orientationchange', measure); };
  }, []);
  return (
    <div className={`stage-frame ${upright ? 'upright' : ''}`} ref={frame}>
      <div
        className="stage"
        style={{ width: STAGE.width, height: STAGE.height, transform: `translate(-50%, ${upright ? '0' : '-50%'}) scale(${scale})` }}
      >
        <ScaleContext.Provider value={scale}>{children}</ScaleContext.Provider>
      </div>
      {upright && !dismissed && (
        <div className="rotate-hint" role="dialog" aria-label="Turn your device sideways">
          <Smartphone size={64} strokeWidth={2} style={{ transform: 'rotate(90deg)' }} />
          <strong>よこむきにしてね</strong>
          <p>Turn your device sideways for the full stage.</p>
          <button className="button" onClick={() => setDismissed(true)}>Play upright anyway</button>
        </div>
      )}
    </div>
  );
}
