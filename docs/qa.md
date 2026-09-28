# QA record

Tested on 2026-09-27 in the Claude desktop browser pane (Chromium), against the dev
server and a local backend. Viewports: 1280 x 720, 844 x 390 (phone, sideways) and
375 x 812 (phone, upright, touch emulation).

## Automated

| Suite | Command | Result |
| --- | --- | --- |
| Rules engine and on-device analyser | `npm test` | 22 passed |
| Backend analysis, charting and API | `npm run test:backend` | 29 passed |
| Hosting worker and build output | `npm run build && npm run test:sites` | 4 passed |

## Checked by hand

| Area | What was done | Result |
| --- | --- | --- |
| Title | Loads with key art, logo, start button, key legend, server status | Pass |
| Title | Start by click and by any drum key | Pass |
| Song select | Move with `D` `K` and arrows, wraps at both ends | Pass |
| Song select | Open a song, choose difficulty, start with `F` | Pass |
| Song select | `D` then `F` pressed in quick succession | Pass after fix 1 |
| Song select | Resting mouse pointer does not steal the keyboard selection | Pass after fix 5 |
| Song select | Preview plays for the highlighted song, stops on start | Pass |
| Song select | Crowns and best scores appear after a run | Pass |
| Upload | Pick a file, title and artist parsed from "Artist - Title" | Pass |
| Upload | Japanese file name and title | Pass |
| Upload | Progress through upload and analysis stages, new song selected | Pass after fix 2 |
| Upload | Real 3:57 MP3 through the API: 126.0 BPM, 264 / 469 / 765 notes | Pass |
| Upload | Rejects text files (415), empty files (400), fake audio (job error) | Pass, automated |
| Remove song | Inline confirm, song and records removed, server library updated | Pass |
| Settings | All six controls, reset, values persist after reload | Pass |
| Help | Opens, fits without scrolling, closes by button and `Esc` | Pass after fix 4 |
| Play | Auto play on Hard: every note 良, drumrolls and balloons played | Pass |
| Play | Keyboard play on Easy, 155 of 155 notes 良, record saved | Pass |
| Play | Go-Go Time: lane flames, target fire, fireworks, warm sky | Pass |
| Play | Drumroll counter, balloon counter and pop | Pass |
| Play | Dancers join at 0, 20, 40, 60 and 80% gauge | Pass |
| Play | Combo shown from 10, callouts at 10 / 30 / 50 / 100 | Pass |
| Pause | `Esc` and the button pause; clock holds still while paused | Pass |
| Pause | Resume continues from the same moment at normal speed | Pass |
| Pause | Retry restarts, quit returns to the shelf with music stopped | Pass |
| Results | Cleared: crown, stamp, count-up, new record badge, crowd | Pass |
| Results | Failed: no crown, no stamp, subdued scene | Pass |
| Results | Play again and song select, by key and by click | Pass |
| Offline | Backend stopped: status shown, upload analysed on device | Pass after fix 6 |
| Phone sideways | Stage letterboxed, nothing scrolls | Pass |
| Phone upright | Rotate hint shown, can be dismissed | Pass |
| Touch | Four zones fill the screen; taps map to ka, don, don, ka | Pass |
| Touch | Tap on the pause button is not counted as a drum hit | Pass |

## Bugs found and fixed during QA

1. **Stale menu state.** Two keys pressed quickly let the second act on the screen as
   it was before the first. Handlers now read live state from a ref.
2. **Upload stuck at "Sending".** The cancel signal was created at first render and
   aborted by React's development double-mount, so polling never began. It is now
   created inside the effect.
3. **Backend read 138 BPM as 92.** A 3:2 tempo confusion. The tracked tempo is now
   judged against its look-alikes by laying each grid over the attacks.
4. **Help dialog taller than the stage.** Reworked into two columns.
5. **Hover stole the selection.** A resting pointer re-claimed the highlight when the
   layout moved under it. Selection now follows pointer movement only.
6. **On-device analyser read 112 BPM as 103 at 48 kHz.** It assumed audio always
   decimates to 11,025 Hz. It now measures the real rate; tested at five sample rates.
7. **Hits depended on frame rate.** A drumroll only opened when a frame was drawn.
   The rules are now brought up to the instant of each strike before judging.
8. **Layout collisions.** Score plate under the drum, lantern strings over stall
   signs, garland over the title, notes flying over the title, dancers behind the
   results buttons, a dancer's shadow appearing before the dancer.

## Known limits

- The browser pane used for QA draws about two frames a second when it is not in
  view. Animation was therefore judged from stepped frames (below) rather than by
  watching it in motion. Smoothness on a real display was not measured.
- Safari, Firefox and physical phones were not tested.
- Sound was verified by code path and by synthesis output level, not by ear.
- Chart quality on real music was checked for tempo, structure and playability, not
  for how musical it feels. That needs a person with the song playing.
- Bluetooth and TV latency differ per device. Use the timing offset in Settings.

## Stepping frames

With a song playing in development, paste this in the console to draw the frame at
33.3 seconds without waiting for it:

```js
const { renderer, game, audio } = window.__taiko;
audio.pause();
let time = Math.min(0, audio.position), clock = performance.now() / 1000;
while (time < 33.3) {
  time += 1 / 60; clock += 1 / 60;
  game.update(time);
  renderer.handle(game.drain(), clock);
  if (33.3 - time < 1.6) renderer.draw(time, clock);
}
```

The screenshots in `docs/screens/` were made this way, in auto play on Hard.
