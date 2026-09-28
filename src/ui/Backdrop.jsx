// Animated scenery behind the menus. It always covers the whole stage.
import { useCallback } from 'react';
import { Art } from './Art.jsx';
import { useStage } from './Stage.jsx';
import { drawDancers, DANCERS } from '../game/art/dancers.js';
import { Effects } from '../game/art/effects.js';
import { drawMascot } from '../game/art/mascot.js';
import { plate, plateEdge } from '../game/art/plates.js';
import { drawFooter, drawGarland, drawScene, drawWaves } from '../game/art/scenery.js';
import { SAFE, STAGE } from '../game/layout.js';

const everyone = Object.fromEntries(DANCERS.map(d => [d.id, -10]));
// on the results screen the crowd gathers between the mascot and the buttons
const RESULT_PLACES = { fox: 372, daruma: 472, cat: 568 };
const TITLE_ART = { width: 1672, height: 941 };
const sparks = new Effects();

export function Backdrop({ variant = 'select', mood = 'happy', bpm = 120 }) {
  const { width, height } = useStage();
  const draw = useCallback((c, time, scale) => {
    const beats = time * (bpm / 60);
    const beat = beats % 1;
    const left = (width - SAFE.width) / 2;
    if (variant === 'title' && plate('title')) {
      // Key art at full width, breathing slowly. It is never cropped at the
      // sides. A window taller than the art gets more of its ground below.
      const zoom = (width / TITLE_ART.width) * (1.03 + 0.012 * Math.sin(time * 0.5));
      const w = TITLE_ART.width * zoom;
      const h = TITLE_ART.height * zoom;
      const tall = h < height;
      // A wide window shows a band of the picture: the band that holds all of Yoru.
      const y = tall ? 0 : (height - h) * 0.92;
      const x = (width - w) * 0.62;
      if (tall) {
        // the ground carries on below the picture: its last rows, drawn out
        const rows = 10;
        c.fillStyle = plateEdge('title');
        c.fillRect(0, h - 2, width, height - h + 2);
        c.drawImage(plate('title'), 0, TITLE_ART.height - rows - 2, TITLE_ART.width, rows, x, h - 3, w, height - h + 3);
        const shade = c.createLinearGradient(0, h, 0, height);
        shade.addColorStop(0, 'rgba(60,20,8,0)');
        shade.addColorStop(1, 'rgba(60,20,8,.38)');
        c.fillStyle = shade;
        c.fillRect(0, h - 3, width, height - h + 3);
      }
      c.drawImage(plate('title'), x, y, w, h);
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
      const sceneHeight = 360 + STAGE.bottom;
      const sceneTop = height - STAGE.foot - sceneHeight;
      drawWaves(c, scale, time, variant === 'title' ? 'night' : mood === 'sad' ? 'indigo' : 'clear', width, sceneTop);
      c.save();
      c.translate(0, sceneTop);
      c.beginPath(); c.rect(0, 0, width, sceneHeight); c.clip();
      drawScene(c, scale, time, { gogo: variant === 'title' ? 0.4 : 0, cleared: mood === 'sad' ? 0 : 1, width, height: sceneHeight });
      if (mood !== 'sad') {
        if (Math.floor(time * 1.3) !== sparks.tick) {
          sparks.tick = Math.floor(time * 1.3);
          sparks.firework(time, 140 + ((sparks.tick * 397) % Math.max(200, width - 280)), 60 + ((sparks.tick * 61) % 90), (sparks.tick * 83) % 360, 1);
        }
        sparks.prune(time);
        sparks.drawScene(c, time);
      }
      c.restore();
      c.save();
      c.translate(0, height - STAGE.foot);
      drawFooter(c, width, STAGE.foot);
      c.restore();
      if (mood !== 'sad') {
        const places = variant === 'results'
          ? Object.fromEntries(Object.entries(RESULT_PLACES).map(([id, x]) => [id, left + x]))
          : null;
        drawDancers(c, scale, height - STAGE.foot - 22, {
          time, beat, step: Math.floor(beats), entered: everyone, gogo: variant === 'title',
          places, size: variant === 'results' ? 0.8 : 1, centre: width / 2, spread: Math.min(1.3, width / SAFE.width),
        });
      }
      if (mood === 'sad') { c.fillStyle = 'rgba(12,8,30,.45)'; c.fillRect(0, sceneTop, width, height - sceneTop); }
      drawGarland(c, time, width);
      if (variant === 'title') {
        const swing = Math.max(0, 1 - ((beats % 2) * 3));
        const other = Math.max(0, 1 - (((beats + 1) % 2) * 3));
        drawMascot(c, width - 270, height - STAGE.foot - 60, 1.75, { bob: Math.max(0, 1 - beat * 2.6), left: swing, right: other, mood: 'gogo', time, beats, blink: time % 3.7 < 0.12 });
      }
    } else if (plate('menu')) {
      // The painted lane, covering the stage and drifting very slowly. It is
      // dimmed so the song banners, not the picture, are what the eye finds.
      const picture = plate('menu');
      const zoom = Math.max(width / picture.naturalWidth, height / picture.naturalHeight) * (1.05 + 0.012 * Math.sin(time * 0.25));
      const w = picture.naturalWidth * zoom;
      const h = picture.naturalHeight * zoom;
      c.drawImage(picture, (width - w) / 2, (height - h) * 0.45, w, h);
      c.fillStyle = 'rgba(14,6,24,.14)';
      c.fillRect(0, 0, width, height);
      drawGarland(c, time, width);
    } else {
      drawWaves(c, scale, time, variant === 'select' ? 'dusk' : 'indigo', width, height, 10);
      c.fillStyle = 'rgba(14,6,24,.28)';
      c.fillRect(0, 0, width, height);
      drawGarland(c, time, width);
    }
  }, [variant, mood, bpm, width, height]);
  return <Art className="backdrop" width={width} height={height} draw={draw} animate />;
}
