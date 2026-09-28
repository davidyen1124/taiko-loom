// What a finger sees of the drum on a touch screen: four zones across the
// display, rim, face, face, rim. They are only light. Touches are read by the
// play screen from the whole display, at any height, and game/input.js decides
// what each one plays.
//
// The colour is kept out of the way of the game. It lives below the lane,
// strongest along the bottom edge where thumbs are, and the words that name the
// two sounds fade once the song is under way.
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { PADS } from '../game/input.js';

export const TouchZones = forwardRef(function TouchZones({ top, foot }, ref) {
  const lights = useRef({});
  useImperativeHandle(ref, () => ({
    // lights the zone that was played; never re-renders, so it costs a hit nothing
    flash({ kind, hand }) {
      lights.current[`${kind}-${hand}`]?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-out' });
    },
  }), []);

  return (
    <div className="touch-zones" aria-hidden="true" style={{ top, '--foot': `${foot}px` }}>
      {PADS.map(({ kind, hand }) => (
        <div key={`${kind}-${hand}`} className={`touch-zone ${kind}`}>
          <i ref={node => { lights.current[`${kind}-${hand}`] = node; }} />
          <span>{kind === 'ka' ? 'カッ' : 'ドン'}</span>
        </div>
      ))}
    </div>
  );
});
