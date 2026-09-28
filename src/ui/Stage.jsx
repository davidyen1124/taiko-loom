// The stage fills the window. It is laid out in design units (1280 x 720 and
// up, see game/layout.js) and scaled as a whole, so every screen keeps its
// proportions at any size and nothing is letterboxed.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { SAFE, STAGE, setStage, stageFor } from '../game/layout.js';
import { fingers } from './device.js';
import { safeArea } from './safeArea.js';

const StageContext = createContext({ scale: 1, width: SAFE.width, height: SAFE.height, upright: false, compact: false, play: () => {} });
export const useStage = () => useContext(StageContext);
export const useStageScale = () => useContext(StageContext).scale;

const same = (a, b) => a.width === b.width && a.height === b.height && a.upright === b.upright && a.compact === b.compact
  && a.left === b.left && a.right === b.right && Math.abs(a.scale - b.scale) < 1e-4;

// The stage for a window, with what the device keeps for itself taken into account.
function fit(width, height, play) {
  const area = safeArea();
  const touch = fingers();
  const stage = stageFor(width, height, { touch, play });
  // on a phone the notch eats into one end of the display
  return { ...stage, left: touch ? area.left / stage.scale : 0, right: touch ? area.right / stage.scale : 0 };
}

export function Stage({ children }) {
  const frame = useRef();
  const [playing, setPlaying] = useState(false);
  const [stage, setSize] = useState(() => fit(window.innerWidth, window.innerHeight, false));
  useEffect(() => {
    const measure = () => {
      const box = frame.current.getBoundingClientRect();
      const next = fit(box.width, box.height, playing);
      setSize(current => (same(current, next) ? current : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame.current);
    window.addEventListener('orientationchange', measure);
    return () => { observer.disconnect(); window.removeEventListener('orientationchange', measure); };
  }, [playing]);

  // the drawing code reads the live size, so set it before anything renders
  setStage(stage.width, stage.height, { left: stage.left, right: stage.right, compact: stage.compact });

  // The play screen says when it is up: on a phone its stage is laid out for fingers.
  const play = useCallback(on => setPlaying(Boolean(on)), []);
  const value = useMemo(() => ({ ...stage, play }), [stage, play]);

  const { width, height, scale, upright } = stage;
  const style = {
    width, height,
    transform: `translate(-50%, -50%) scale(${scale})`,
    '--w': `${width}px`,
    '--h': `${height}px`,
    '--ox': `${(width - SAFE.width) / 2}px`,      // where the 1280-wide design grid starts
    '--oy': `${(height - SAFE.height) / 2}px`,
    '--foot': `${STAGE.foot}px`,                  // the curtain band under the festival
    '--left': `${stage.left}px`,                  // columns the device keeps at each end
    '--right': `${stage.right}px`,
  };
  return (
    <div className={`stage-frame ${stage.compact ? 'compact' : ''}`} ref={frame}>
      <div className="stage" style={style} inert={upright}>
        <StageContext.Provider value={value}>{children}</StageContext.Provider>
      </div>
      {upright && (
        <div className="rotate-hint" role="alert">
          <Smartphone size={64} strokeWidth={2} style={{ transform: 'rotate(90deg)' }} />
          <strong>よこむきにしてね</strong>
          <p>Turn your device sideways to play.</p>
        </div>
      )}
    </div>
  );
}
