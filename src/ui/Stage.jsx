// The stage fills the window. It is laid out in design units (1280 x 720 and
// up, see game/layout.js) and scaled as a whole, so every screen keeps its
// proportions at any size and nothing is letterboxed.
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { SAFE, STAGE, setStage, stageFor } from '../game/layout.js';

const StageContext = createContext({ scale: 1, width: SAFE.width, height: SAFE.height, upright: false });
export const useStage = () => useContext(StageContext);
export const useStageScale = () => useContext(StageContext).scale;

const same = (a, b) => a.width === b.width && a.height === b.height && a.upright === b.upright && Math.abs(a.scale - b.scale) < 1e-4;

export function Stage({ children }) {
  const frame = useRef();
  const [stage, setSize] = useState(() => stageFor(window.innerWidth, window.innerHeight));
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const measure = () => {
      const box = frame.current.getBoundingClientRect();
      const next = stageFor(box.width, box.height);
      setSize(current => (same(current, next) ? current : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame.current);
    window.addEventListener('orientationchange', measure);
    return () => { observer.disconnect(); window.removeEventListener('orientationchange', measure); };
  }, []);

  // the drawing code reads the live size, so set it before anything renders
  setStage(stage.width, stage.height);

  const { width, height, scale, upright } = stage;
  const style = {
    width, height,
    transform: `translate(-50%, ${upright ? '0' : '-50%'}) scale(${scale})`,
    '--w': `${width}px`,
    '--h': `${height}px`,
    '--ox': `${(width - SAFE.width) / 2}px`,      // where the 1280-wide design grid starts
    '--oy': `${(height - SAFE.height) / 2}px`,
    '--foot': `${STAGE.foot}px`,                  // the curtain band under the festival
  };
  return (
    <div className={`stage-frame ${upright ? 'upright' : ''}`} ref={frame}>
      <div className="stage" style={style}>
        <StageContext.Provider value={stage}>{children}</StageContext.Provider>
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
