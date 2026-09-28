# QA record

This is a record of what was checked, in the order it was checked. The game began
with an analysis server written in Python. It was removed on 2026-09-27, once the
browser analysed songs as well as the server did: see "Without a server" below. Rows
in the first table that speak of a server, an API or uploading describe the game as
it was then.

## Automated

| Suite | Command | Result |
| --- | --- | --- |
| Rules engine, analyser, built-in songs, stage layout and artwork | `npm test` | 64 passed |
| Hosting worker and build output | `npm run build && npm run test:sites` | 4 passed |

## Checked by hand

Tested on 2026-09-27 in the Claude desktop browser pane (Chromium), against the dev
server and the analysis server the game then had. Viewports: 1280 x 720, 844 x 390
(phone, sideways) and 375 x 812 (phone, upright, touch emulation).

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
| Phone upright | Rotate hint shown | Pass |
| Touch | Four zones fill the screen; taps map to ka, don, don, ka | Pass |
| Touch | Tap on the pause button is not counted as a drum hit | Pass |

## The public site, in Chromium and WebKit

Tested on 2026-09-27 with Playwright driving headless Chromium and WebKit (Safari's
engine) against `npm run preview:pages`, which serves the static build under
`/taiko-nights/` as GitHub Pages does. 35 checks in each browser, all passing. The
same checks were run again against https://davidyen1124.github.io/taiko-nights/ once
it was published: 70 of 70.

| Area | What was done | Result |
| --- | --- | --- |
| Loading | No console errors, no missing files, artwork and icon load from the sub-path | Pass |
| Loading | Every request stays inside the site folder; nothing asks for `/api` | Pass |
| Loading | No audio file is downloaded at any point | Pass |
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

## Painted artwork and the touch drum

Tested on 2026-09-27 with Playwright driving headless Chromium and WebKit, against
the development build and the static build served under `/taiko-nights/`.

| Area | What was done | Result |
| --- | --- | --- |
| Characters | 16 poses of Yoru and 10 of the festival friends laid out on one anchor and compared by eye | Pass |
| Characters | Same size from pose to pose: standing poses within 8% of one another, measured | Pass, automated |
| Characters | Yoru shows the hand and the part of the drum that was played | Pass, automated |
| Notes | Roundness of the painted notes: edge within 1.5 px of a circle of radius 127 | Pass |
| Notes | Drumroll band matches its note; balloon trails its note | Pass |
| Stand-ins | Every picture blocked: the game starts and plays with the figures drawn in code | Pass |
| Festival | Sign lettering and lantern glow still sit on the repainted picture | Pass |
| Title | Yoru whole at 16:9, 4:3, 21:9 and on a phone; logo and start button over open sky | Pass after fix 23 |
| Menus | Painted lane behind song select; banners and text stay readable | Pass |
| Touch drum | Hidden with mouse and keyboard at 1280 x 720 and 1920 x 1080 | Pass |
| Touch drum | Real touches: skin left and right, rim left and right, beside the drum, above the drum | Pass, 6 of 6 each |
| Touch drum | Two fingers together play both hands | Pass |
| Touch drum | Pause button is not a drum hit; the drum steps aside while paused | Pass |
| Notch | Score, pause button, gauge, title and song select arrows keep clear of both ends | Pass after fix 26 |
| Home screen | Manifest and icons are served; the page asks to open full screen | Pass |
| Touch drum | Festival friends line up behind the drum instead of under it | Pass |
| Cut-off text | Audit on title, shelf, each song, help, settings and add dialogs at seven window shapes: 98 screens | Pass |
| Whole site | The 35 end-to-end checks of the static build, in both browsers | Pass, 70 of 70 |
| Drawing cost | WebKit, busiest part of the hardest song at 2560 x 1440: 3.2 ms a frame | Pass |
| Drawing cost | Chromium without a graphics card: the same with every picture blocked as with them | No change |

## The phone layout

Tested on 2026-09-28 with Playwright driving headless WebKit and Chromium against the
development build, with a finger for a pointer. The picture of a drum was replaced by
four touch zones after it was played on a real iPhone in Safari, where the window is
about 844 x 291: see fix 29. The rows about the touch drum in the section above
describe what was there before.

Windows: 844 x 291 (iPhone in Safari, bars showing), 844 x 390 and 932 x 430 (iPhone
from the home screen, with its safe areas put in by hand), 667 x 375 (iPhone SE),
915 x 412 (Android), 1180 x 820 (tablet).

| Area | What was done | Result |
| --- | --- | --- |
| Whole display | Title, song select, play and results fill every window above from edge to edge: no bars at the sides, no strip below | Pass after fix 29, automated |
| Touch zones | Real touches at eight places across the display and four heights, from the sky band to the last row: ka, don, don, ka, by place alone | Pass, 31 of 31 |
| Touch zones | One pixel either side of each border plays the zone it is in | Pass, automated |
| Touch zones | A touch lights its zone; Yoru and the panel drum show the same hand and sound | Pass |
| Touch zones | Colour begins under the lane and nowhere covers the notes, the gauge or the score | Pass |
| Touch zones | Words sit above the strip an iPhone keeps along the bottom, and fade after the first bars | Pass |
| Touch zones | Pause button is not a drum hit; the zones step aside while paused | Pass |
| Touch zones | Not shown with a mouse and keyboard | Pass |
| Lane | On a window of 844 x 291 the lane and its notes are drawn 29% larger than the design grid would draw them | Pass, automated |
| Sky band | Drawn at 60% on such a window, in full on a tablet and on a 16:9 phone; gauge, title and Yoru keep their places in it; notes fly to the soul orb where it now is | Pass |
| Sky band | Yoru stands clear of the pause button, which is 44 px across on a phone | Pass, automated |
| Upright | A phone or tablet held upright is asked to turn. Turned in the middle of a song, the song pauses; turned back, the pause menu is waiting | Pass |
| Keys | Names of keys are not shown on a device played with fingers; How to play explains the zones instead | Pass |
| How to play | Opens before the first song in both browsers, with four keys at 1280 x 720 and 1024 x 768 and four zones at 844 x 291 and 844 x 390; fits without scrolling | Pass |
| How to play | A pad sounds when tapped, clicked or played with its key; the song starts from Start and from the close button | Pass |
| How to play | Does not open before the second song, in auto play, or once it has been read from the question mark | Pass |
| Title | Yoru's head is whole on a window as wide as 844 x 291 (the feet are not) | Pass after fix 31 |
| Desktop | Play screen at 1280 x 720, 1862 x 1017, 1024 x 768 and 2560 x 1080 compared pixel by pixel with the version before: identical but for the judgement word of fix 30 | Pass |
| Whole site | The 36 end-to-end checks of the static build, in both browsers | Pass, 72 of 72 |

## Smoothness

Tested on 2026-09-28 after the game was reported to be laggy on a real iPhone, in
every screen. The report could not be reproduced: the iPhone itself was not at hand,
and in headless WebKit on a fast Mac every screen drew 60 frames a second before the
changes as well as after. What follows is what was measured there, and what was
changed because it is sound on any phone. See fix 32.

| Area | What was done | Result |
| --- | --- | --- |
| Cost of a frame | Play screen at 844 x 390, three device pixels to one, Hard, Go-Go Time. Frames drawn back to back, each forced to finish by reading a pixel back: 2.6 ms a frame, of which 0.4 ms is JavaScript | Measured |
| Cost of a frame | The same without text: 2.0 ms. Without pictures: 2.2 ms. No one part stands out | Measured |
| Song clock | Frame to frame, the song moved within 0.24 ms (WebKit) and 0.06 ms (Chromium) of what the display's clock moved | Pass |
| Song clock | Over a hardware clock that moves in steps of 23 ms, the steadied clock moves within 1.2 ms of the display's and stays within one step of the music | Pass, automated |
| Pixels | A phone of three device pixels to one draws the play screen and the backdrops at two: 1688 x 780, not 2532 x 1170 | Pass |
| Pacer | Frames on time at 60, 120 and 144 Hz: the picture is left alone. An odd late frame, a pause or a hidden tab: left alone | Pass, automated |
| Pacer | A device that needs 27 ms for a frame, or a steady 25 ms: the picture is stepped down until frames are on time, within four steps and a few seconds | Pass, automated |
| Pacer | A display that holds itself to 30 frames a second, as an iPhone saving power does: one look at the smallest picture, then the whole picture is kept | Pass, automated |
| Pacer | In headless Chromium, which draws without a graphics card, at 2560 x 1440: stepped down to 80% and then drew 60 frames a second | Pass |
| Backdrops | Painted 30 times a second on a device played with fingers, 60 with a mouse | Pass |
| Frame meter | `?fps` shows frames a second, the longest wait, late frames and the size of the picture, on every screen | Pass |
| Desktop | Play screen at 1280 x 720, 1862 x 1017 and 1024 x 768 compared pixel by pixel with the version before: identical | Pass |

## Without a server

The analysis server was removed on 2026-09-27. Tested the same day with Playwright
driving headless Chromium and WebKit against the static build served under
`/taiko-nights/`, then against the published site.

Before it was removed, the two analysers were compared on the same 3:57 song:

| | Server | Browser |
| --- | --- | --- |
| Tempo | 126.0 | 126.0 |
| Beats | 499 | 499, each within 3 ms of the server's |
| First bar line | 0.005 s | 0.005 s |
| Go-Go sections | 4 | the same 4 |
| Notes, Easy / Medium / Hard | 264 / 469 / 765 | 264 / 469 / 768 |
| Notes in the same place | | 88% / 95% / 92% |
| Time taken | 12 s | 1.4 to 3 s |

They also agreed on two of the three built-in songs. On the third, at 168 BPM, the
server heard 112 BPM and a shuffle; the browser heard it correctly.

| Area | What was done | Result |
| --- | --- | --- |
| Same results | The 3:57 song after the removal and the tempo fix: 126 BPM, 499 beats, same bar line, same four Go-Go sections, 262 / 468 / 771 notes | Pass |
| Nothing leaves | No request is made while a song is analysed; nothing is posted at any point; nothing asks for `/api` | Pass |
| No trace | No screen speaks of a server, of being offline or of uploading | Pass |
| Add a song | 3:57 MP3 analysed in 2.6 s (Chromium), 1.4 s (WebKit), saved, on the shelf after a reload, plays, removed | Pass |
| Tempo | A 168 BPM song in straight eighths, started from the wrong guess of 112: settles on 168 | Pass after fix 27, automated |
| Tempo | A 100 BPM shuffle, started from the wrong guess of 150: settles on 100 | Pass after fix 27, automated |
| Tempo | 24 cases in all: 9 drum loops, 3 built-in songs and the 3:57 song, each from its true tempo and from every look-alike in range | Pass, 24 of 24 |
| Feel | A 60 BPM song charted at 120 has nothing between its beats, and is not called a shuffle | Pass after fix 28, automated |
| Whole site | 36 end-to-end checks in each browser | Pass, 72 of 72 |
| Cut-off text | Audit at seven window shapes in both browsers | Pass, 98 of 98 screens |
| Touch drum | Real touches in both browsers | Pass |

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

23. **Title picture had its drum under the logo and the start button.** Painted again
    with everything in its right half; on wide windows the band that is shown is the
    one that holds all of Yoru.
24. **On an upright tablet the touch drum ran off the bottom of the screen,** and the
    stage sat in the middle of the display with empty space above it. The drum is now
    sized to the space it has, and a tablet held upright gets the stage at the top.
25. **Generated sheets looked as if they had a murky background.** They did not: the
    colour sits under fully transparent pixels. Transparency is now measured.
26. **The touch drum was played on the edge of the display.** Its widest part met the
    bottom edge, which is where an iPhone listens for the swipe that leaves the game.
    Reported from a real iPhone. The stage now moves up and is shorter while the drum
    is out, the whole head of the drum sits above the strip the phone keeps, and only
    the barrel reaches the edge. The HUD also keeps clear of the notch.

27. **A tempo could be mistaken for the one three to two against it.** Steady eighth
    notes at 168 BPM put a drum hit on every line of a grid at 112 as well, so if the
    first guess was 112 it stayed. Nothing in the old rule could tell them apart. The
    rule now also asks whether the music repeats two and four beats later, and whether
    all three thirds of the beat are played. Found by comparing the two analysers.
28. **A song with nothing between its beats could be called a shuffle,** on the
    strength of a few stray attacks. It now takes a real share of the song's attacks.

29. **On a phone the touch drum did not look like a drum, and much of the display was
    wasted.** Reported from a real iPhone in Safari. The drum was a painting made to be
    seen from above, stretched into a flat oval on top of a block of barrel; the stage
    stopped short of both ends of the display; a striped strip ran along the bottom; and
    the sky band took a quarter of a window only 291 px high. A round drum was painted
    and tried in its place, and measured: on such a window its hide is two fifths of
    the display where thumbs reach it. So the drum is gone. The whole display is played,
    in four zones that are only light, the stage fills any phone from edge to edge, and
    the rows the drum took went to the lane. The upright layout was removed: the game
    is played sideways.
30. **The judgement word (良, 可, 不可) was cut off on every device.** It is drawn just
    above the lane and was clipped to the lane, so only its feet showed. Found while
    reading the drawing code for fix 29. It is now drawn after the clip is lifted.
    The burst of a popped balloon had the same fault.
31. **On a very wide window the title picture lost the top of Yoru's head.** The band
    that is shown now starts above the leaf, and gives up the feet instead.
32. **The game was reported laggy on an iPhone, on every screen.** Not reproduced
    here. Three things were changed that lighten the load on any phone: two device
    pixels are drawn for each CSS pixel in place of three, which is less than half the
    pixels; the picture is drawn smaller still if frames keep arriving late; and menu
    backdrops are painted half as often. One thing was changed that makes motion even
    where frames were already on time: the song's clock no longer follows the audio
    hardware's step by step. `?fps` was added so that the next report can come with
    numbers.

The audit measures each text's letters, grows that box by half the outline width, and
tests it against every ancestor that clips. It switches animations off while it
measures, so a panel that is still sliding open is judged by where it ends up.

## Known limits

- The browser pane used for QA draws about two frames a second when it is not in
  view. Animation was therefore judged from stepped frames (below) rather than by
  watching it in motion. Smoothness on a real display was not measured.
- WebKit was tested through Playwright, not Safari itself. Firefox and physical
  phones were not tested here. The touch drum was played with emulated touches, which
  say nothing about how it feels under real thumbs or how late a phone's screen and
  speaker are. Use the timing offset in Settings.
- The test browsers report no safe areas. An iPhone's were put in by hand (the
  numbers an iPhone 14 reports), so the layout is checked but the device's own
  gestures are not.
- Drawing smoothness was measured without a graphics card. On a real display it was
  not measured.
- The lag reported from an iPhone was not reproduced, so it is not known which of the
  changes in fix 32 matter on that phone, or whether the phone was saving power, which
  holds any web page to 30 frames a second.
- The pictures were judged by one pair of eyes. Whether Yoru is appealing is for
  players to say.
- Sound was verified by measurement, not by ear: level, tuning of every pitched
  instrument, timing against the chart, and a spectrogram of each song. Whether the
  three songs are pleasant to listen to needs a person.
- A song in 12/8, with every triplet played, is rhythmically the same as a faster
  song in straight eighths. The analyser takes it for the faster song.
- Bar lines can land half a bar out on music whose first and third beats are alike.
- The analyser was compared with the server it replaced on one real song and three
  built-in ones. That is a narrow sample of music.
- A song lives in one browser on one device, for as long as that browser keeps it.
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
