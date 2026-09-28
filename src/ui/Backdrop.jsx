// Animated scenery behind the menus.
import { useCallback } from 'react';
import { Art } from './Art.jsx';
import { drawDancers, DANCERS } from '../game/art/dancers.js';
import { Effects } from '../game/art/effects.js';
import { drawMascot } from '../game/art/mascot.js';
import { plate } from '../game/art/plates.js';
import { drawGarland, drawScene, drawWaves } from '../game/art/scenery.js';
import { STAGE } from '../game/layout.js';

const everyone = Object.fromEntries(DANCERS.map(d => [d.id, -10]));
// on the results screen the crowd gathers between the mascot and the buttons
const RESULT_PLACES = { fox: 330, daruma: 445, cat: 560 };
const sparks = new Effects();

export function Backdrop({ variant = 'select', mood = 'happy', bpm = 120 }) {
  const draw = useCallback((c, time, scale) => {
    const beats = time * (bpm / 60);
    const beat = beats % 1;
    if (variant === 'title' && plate('title')) {
      // key art, breathing slowly, with live fireworks in its open sky
      const image = plate('title');
      const zoom = 1.03 + 0.012 * Math.sin(time * 0.5);
      const width = STAGE.width * zoom;
      const height = STAGE.height * zoom;
      c.drawImage(image, (STAGE.width - width) * 0.62, (STAGE.height - height) * 0.5, width, height);
      if (Math.floor(time * 0.9) !== sparks.tick) {
        sparks.tick = Math.floor(time * 0.9);
        sparks.firework(time, 90 + ((sparks.tick * 397) % 520), 250 + ((sparks.tick * 61) % 120), (sparks.tick * 83) % 360, 0.8);
      }
      sparks.prune(time);
      c.save();
      c.translate(0, -140);
      sparks.drawScene(c, time);
      c.restore();
      return;
    }
    if (variant === 'title' || variant === 'results') {
      drawWaves(c, scale, time, variant === 'title' ? 'night' : mood === 'sad' ? 'indigo' : 'clear', STAGE.width, 360);
      c.save();
      c.translate(0, 360);
      drawScene(c, scale, time, { gogo: variant === 'title' ? 0.4 : 0, cleared: mood === 'sad' ? 0 : 1 });
      if (mood !== 'sad') {
        if (Math.floor(time * 1.3) !== sparks.tick) {
          sparks.tick = Math.floor(time * 1.3);
          sparks.firework(time, 140 + ((sparks.tick * 397) % 1000), 60 + ((sparks.tick * 61) % 90), (sparks.tick * 83) % 360, 1);
        }
        sparks.prune(time);
        sparks.drawScene(c, time);
      }
      c.restore();
      if (mood !== 'sad') {
        drawDancers(c, scale, 698, {
          time, beat, step: Math.floor(beats), entered: everyone, gogo: variant === 'title',
          places: variant === 'results' ? RESULT_PLACES : null, size: variant === 'results' ? 0.9 : 1,
        });
      }
      if (mood === 'sad') { c.fillStyle = 'rgba(12,8,30,.45)'; c.fillRect(0, 360, STAGE.width, 360); }
      drawGarland(c, time, STAGE.width);
      if (variant === 'title') {
        const swing = Math.max(0, 1 - ((beats % 2) * 3));
        const other = Math.max(0, 1 - (((beats + 1) % 2) * 3));
        drawMascot(c, 1010, 660, 1.75, { bob: Math.max(0, 1 - beat * 2.6), left: swing, right: other, mood: 'gogo', time, blink: time % 3.7 < 0.12 });
      }
    } else {
      drawWaves(c, scale, time, variant === 'select' ? 'dusk' : 'indigo', STAGE.width, STAGE.height, 10);
      c.fillStyle = 'rgba(14,6,24,.28)';
      c.fillRect(0, 0, STAGE.width, STAGE.height);
      drawGarland(c, time, STAGE.width);
    }
  }, [variant, mood, bpm]);
  return <Art className="backdrop" width={STAGE.width} height={STAGE.height} draw={draw} animate />;
}
