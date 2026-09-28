# QA record

Tested on 2026-09-27 in the Claude desktop browser pane (Chromium), against the dev
server and a local backend. Viewports: 1280 x 720, 844 x 390 (phone, sideways) and
375 x 812 (phone, upright, touch emulation).

## Automated

| Suite | Command | Result |
| --- | --- | --- |
| Rules engine, browser analyser, built-in songs and stage layout | `npm test` | 42 passed |
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

## The public site, in Chromium and WebKit

Tested on 2026-09-27 with Playwright driving headless Chromium and WebKit (Safari's
engine) against `npm run preview:pages`, which serves the static build under
`/taiko-nights/` as GitHub Pages does. 35 checks in each browser, all passing.

| Area | What was done | Result |
| --- | --- | --- |
| Loading | No console errors, no missing files, artwork and icon load from the sub-path | Pass |
| Loading | Every request stays inside the site folder; nothing asks for `/api` | Pass |
| Loading | No audio file is downloaded at any point | Pass |
| Title | Status reads "analysed in your browser", never "offline" | Pass |
| Song select | Three built-in songs, each with its own colour, 3 charts each | Pass |
| Play | Raijin Rush on Hard in auto play: 456 of 456 良, no misses, over 1,000,000 | Pass |
| Play | A built-in song is ready within 0.2 s of choosing it | Pass |
| Add a song | 3:57 MP3 analysed in the browser in 3.0 s (Chromium), 1.4 s (WebKit) | Pass |
| Add a song | No network request is made while it is analysed | Pass |
| Add a song | 126 BPM, 264 / 469 / 768 notes, matching the backend | Pass |
| Saved songs | Still on the shelf after a reload, previews and plays | Pass after fix 20 |
| Remove song | Gone after a reload, nothing left in storage | Pass |
| Cut-off text | Audit on title, shelf, each song, add dialog, pause and results | Pass |
| Window shapes | Audit at 1280 x 720, 1024 x 768, 1366 x 1024, 1920 x 1080, 2560 x 1080 and 844 x 390: 74 screens | Pass |
| Phone upright | 390 x 844 shows the rotate hint | Pass |

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

## Second pass: full window and cut-off text

Reported by the owner after the first release: black bars beside the stage, a song
title with its outline cut on the left, a smeared "Esc" key cap, the top of
"曲をついか" cut, and the daruma's fan cut.

| Check | Shapes | Result |
| --- | --- | --- |
| Stage fills the window, 0 px left over on every side | 1862x1017, 1440x900, 1024x768, 2560x1080, 1280x720, 844x390 | Pass |
| Text audit (`__auditText()`): title, shelf, open song panel, remove confirm, settings, help, add banner, upload | 1862x1017 and 1024x768 | 252 elements, 0 cut off |
| Text audit: pause, results cleared, results failed | 1862x1017 | 93 elements, 0 cut off |
| Canvas text stress: 90-character title, 70-character artist, score 1,234,560, combo 1234 | 1862x1017 | Pass |
| Every dancer, the mascot and the mascot at the top of a jump are whole | all of the above | Pass |
| Festival stalls and their signs are whole | all of the above | Pass |

Causes and fixes:

9. **Black bars.** The stage was a fixed 16:9 frame. It now takes the window's shape.
10. **Outlines cut by `overflow: hidden`.** Text is shortened with an ellipsis by
    clipping its box, and the outline paints outside that box. Every outlined, clipped
    text now has padding for its outline.
11. **Smeared key caps.** Key caps inherited a dark text shadow meant for labels.
12. **Dancers cut.** Their sprite canvases had no room for fans, tails and paws.
13. **Go-Go banner over the song title.** Banners now cross the festival sky.
14. **Long titles squeezed.** They now shrink, then shorten, and are never distorted.
15. **Four-digit combo wider than the drum.** Sized to fit.
16. **Festival picture zoomed on tall windows,** cropping the outer stalls and a sign.
    It is now never zoomed past its width; spare rows become a curtain band.
17. **Moon sliced by the frame edge** at some widths. It is shown whole or not at all.
18. **Lane whited out on a hit during Go-Go Time.** The flash is softer.

19. **Built-in songs took 10 to 28 seconds to prepare** in Chrome and Safari. The Web
    Audio graph slows down with every note scheduled on it. The songs are now
    synthesised in plain JavaScript in a worker, in under a second.
20. **Safari would not save an added song.** It refused to store the file object. The
    file is now saved as plain bytes.
21. **The built-in music was 6 ms behind its chart.** The old mixing stage delayed the
    sound. The new one does not: the music is within 2 ms of the chart.
22. **Loud peaks clipped at full volume** (up to 8% over full scale). Every song is now
    levelled under a limiter.

The audit measures each text's letters, grows that box by half the outline width, and
tests it against every ancestor that clips. It switches animations off while it
measures, so a panel that is still sliding open is judged by where it ends up.

## Known limits

- The browser pane used for QA draws about two frames a second when it is not in
  view. Animation was therefore judged from stepped frames (below) rather than by
  watching it in motion. Smoothness on a real display was not measured.
- WebKit was tested through Playwright, not Safari itself. Firefox and physical
  phones were not tested.
- Sound was verified by measurement, not by ear: level, tuning of every pitched
  instrument, timing against the chart, and a spectrogram of each song. Whether the
  three songs are pleasant to listen to needs a person.
- The backend reads the 168 BPM built-in song as 112 BPM with a shuffle, a 3:2
  confusion. The browser analyser reads it correctly. Not yet fixed in the backend.
- Bar lines can land half a bar out on music whose first and third beats are alike.
  Both analysers agree with each other when this happens.
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
