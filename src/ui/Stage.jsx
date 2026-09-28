// The stage fills the window. It is laid out in design units (1280 x 720 and
// up, see game/layout.js) and scaled as a whole, so every screen keeps its
// proportions at any size and nothing is letterboxed.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { SAFE, STAGE, reserveFor, setStage, stageFor } from '../game/layout.js';
import { safeArea } from './safeArea.js';

const StageContext = createContext({ scale: 1, width: SAFE.width, height: SAFE.height, upright: false, docked: false, dock: () => {} });
export const useStage = () => useContext(StageContext);
export const useStageScale = () => useContext(StageContext).scale;

const same = (a, b) => a.width === b.width && a.height === b.height && a.upright === b.upright && a.docked === b.docked
  && a.left === b.left && a.right === b.right && a.reserve === b.reserve && Math.abs(a.scale - b.scale) < 1e-4;

const fingers = () => window.matchMedia('(pointer: coarse)').matches;

// The stage for a window, with what the device keeps for itself taken into account.
function fit(width, height, docked) {
  const area = safeArea();
  const touch = fingers();
  const reserve = docked ? reserveFor(height, area.bottom) : 0;
  const stage = stageFor(width, height, { touch, reserve });
  // sideways on a phone the notch eats into one end of the display
  const sideways = !stage.upright && touch;
  return { ...stage, reserve: stage.docked ? reserve : 0, left: sideways ? area.left / stage.scale : 0, right: sideways ? area.right / stage.scale : 0 };
}

export function Stage({ children }) {
  const frame = useRef();
  const [docked, setDocked] = useState(false);
  const [stage, setSize] = useState(() => fit(window.innerWidth, window.innerHeight, false));
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const measure = () => {
      const box = frame.current.getBoundingClientRect();
      const next = fit(box.width, box.height, docked);
      setSize(current => (same(current, next) ? current : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame.current);
    window.addEventListener('orientationchange', measure);
    return () => { observer.disconnect(); window.removeEventListener('orientationchange', measure); };
  }, [docked]);

  // the drawing code reads the live size, so set it before anything renders
  setStage(stage.width, stage.height, { left: stage.left, right: stage.right });

  // The play screen asks for room under the stage while the touch drum is out.
  const dock = useCallback(wanted => setDocked(Boolean(wanted)), []);
  const value = useMemo(() => ({ ...stage, dock }), [stage, dock]);

  const { width, height, scale, upright } = stage;
  const top = upright || stage.docked;
  const style = {
    width, height,
    transform: `translate(-50%, ${top ? '0' : '-50%'}) scale(${scale})`,
    '--w': `${width}px`,
    '--h': `${height}px`,
    '--ox': `${(width - SAFE.width) / 2}px`,      // where the 1280-wide design grid starts
    '--oy': `${(height - SAFE.height) / 2}px`,
    '--foot': `${STAGE.foot}px`,                  // the curtain band under the festival
    '--left': `${stage.left}px`,                  // columns the device keeps at each end
    '--right': `${stage.right}px`,
  };
  return (
    <div className={`stage-frame ${upright ? 'upright' : ''} ${stage.docked ? 'docked' : ''}`} ref={frame} style={{ '--reserve': `${stage.reserve}px` }}>
      <div className="stage" style={style}>
        <StageContext.Provider value={value}>{children}</StageContext.Provider>
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
