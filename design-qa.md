# Taiko Nights — implementation QA

final result: passed

## Source and capture evidence

- User source: `/Users/david/Projects/taiko-nights/design/reference.png` (1000×530).
- Complete working concept: `/Users/david/Projects/taiko-nights/design/concept.png` (1536×1024).
- Desktop implementation: `/Users/david/Projects/taiko-nights/design/desktop.png` (1536×1024 CSS pixels, 1×).
- Laptop implementation: `/Users/david/Projects/taiko-nights/design/laptop.png` (1280×720 CSS pixels, 1×).
- Mobile implementation: `/Users/david/Projects/taiko-nights/design/mobile.png` (390×844 CSS pixels, 1×).
- URL: `http://localhost:4173/`.
- Captures: Codex in-app browser, `tab.getScreenshot()`. The alternate full-page screenshot API produced a density mismatch; that capture was replaced with the native screenshot API before comparison.
- Comparison state: default track loaded, Medium selected, ready to play, zero score. Source concept and desktop capture were opened together with `view_image` in the same inspection call. Mobile was inspected in that pass too.

## Visual comparison

1. **Layout:** the 1456-pixel-wide game occupies x=40–1496 and y=64–794 at the native concept viewport. Header, dark horizontal lane, syllable strip, festival stage, control bar, and keyboard guide retain the source hierarchy. Compact laptop layout keeps Play and keyboard instructions in the viewport.
2. **Typography:** heavy rounded sans-serif headings, outlined score, restrained utility labels, and high-contrast keycaps preserve the arcade character. Native controls have explicit font sizes. Small laptop score typography was reduced to keep the song title above the soul gauge.
3. **Palette:** dark plum page, burgundy cloud pattern, orange drum panel, charcoal lane, coral primary control, cyan Ka notes, and warm lantern scene match the concept’s color relationships. The background is intentionally dark plum, not white or cream.
4. **Assets:** generated transparent sprite atlas, standalone festival scene, and repeating cloud artwork are loaded at their intended positions. No screenshot is used as interactive UI. Note and mascot art are generated variants. Scenic cropping changes for narrow/short viewports; mobile preserves the central festival stalls.
5. **Controls / spacing:** Easy / Medium / Hard selected states, large Play button, volume, pause/restart keys, and Change song remain readable. On mobile, difficulty and Play occupy one row and utility controls move below them; note sizes and speed adapt to prevent overlap.
6. **Content:** actual title, artist, detected BPM, note count, score, progress, accuracy, and soul are live values. The concept’s illustrative 93 BPM was replaced with the measured 126 BPM. The initial empty soul meter reflects actual game state.
7. **Icons and motion:** blossom mark and utility icons use Lucide. Notes are raster sprites. Canvas target rings, beat guides, and roll spans are functional game geometry. UI respects reduced-motion preferences while essential note movement remains playable.

No additional focused screenshots were necessary: the native captures made the score, note lane, source artwork, and controls legible for direct comparison. Modal copy and state were separately inspected through browser accessibility and DOM snapshots.

## Copy / intentional adaptations

Compared with the concept, the implementation adds a waveform, elapsed/duration labels, accuracy, personal best, count-in, functional help, import, calibration, and results states. These support the requested playable music workflow. `About` becomes `How to play`. BPM is audio-derived. Decorative bamboo and the hanging header lantern are omitted in favor of the generated mascot/drum assets and a compact difficulty flag. The mascot, stall illustration, and flower mark are deliberate generated/library variants, not pixel-identical copies. Online Taiko features are outside this standalone single-player build.

The implementation was faithfully verified against the selected festival-game structure with these documented adaptations. No actionable P0/P1/P2 visual findings remain.

## Findings and repair history

- **P1 — keyboard focus after Play:** the initial event filter excluded all buttons. Restricted the exclusion to text/range fields and dialogs. Actual keyboard play on the supplied song produced a 2500 score; Space paused and R restarted.
- **P2 — desktop controls below the fold:** original layout reached 1082 px at a 1024 px viewport. Sized the game to available viewport height and tightened control spacing. Final DOM measured 1536×1024 with zero overflow; laptop measured 1280×720 with Play in view.
- **P2 — oversized mobile notes:** desktop note radius caused overlapping notes on a 274 px lane. Added width-aware note sizing and a minimum mobile scroll speed. Final 390×844 capture shows distinct, readable notes and no horizontal overflow.
- **P2 — short-screen song title obstruction:** the large score pushed the title behind the soul meter. Added a short-height font rule; the final laptop capture shows both score and title.
- **P2 — sprite clipping / pattern scale:** reduced mascot sprite height so its full outline fits; enlarged the cloud texture to match the concept’s motif scale. Final native capture confirms both.
- **Functional — roll boundary duplicates:** rounded note timestamps survived an unrounded interval filter. Added boundary tolerance and regenerated the charts. Hard changed from 813 to 803 notes; chart-order tests now pass.
- **Functional — short-track soul balance:** normalized gains and penalties by the number of normal notes and added a regression check.

## Interaction evidence

| Check | Result |
| --- | --- |
| Page identity and nonblank render | Passed; Taiko Nights title and real controls |
| Framework error overlays | None |
| Browser console errors/warnings | None in the inspected sessions |
| Supplied audio playback | Passed; actual local derivative of linked FLAC |
| F/J keyboard scoring | Passed; visible score changed to 2500 |
| Space pause and R restart | Passed; elapsed position retained on pause |
| Easy / Medium / Hard selection | Passed; selected state and chart count changed |
| Offset +80 ms and reset | Passed; displayed value updated and reset |
| Local WAV import | Passed; 7-second click fixture analyzed at 119.7 BPM, 13 Medium notes |
| Complete imported-track playthrough | Passed; results, counts, grade, score, personal best appeared |
| Invalid audio URL | Passed; recoverable decode error, existing song retained |
| Mobile / desktop sizing | Passed at the three recorded viewports |
| Automated tests | 11 passed |
| Production build | Passed |

## Limits

Actual Bluetooth/device latency still requires user calibration. Safari, Firefox, physical phones, and alternate FLAC decoder implementations were not exercised. Tempo detection is heuristic; difficult or changing meters may need a manually authored chart. The entire 3:57 song was analyzed and validated, but the browser completion test used the short imported fixture rather than waiting through the entire song.

## Implementation checklist

- [x] Reference and generated concept inspected.
- [x] Assets implemented as standalone files with native app controls.
- [x] Desktop and mobile compared after repairs.
- [x] Keyboard/audio/import/results workflow exercised.
- [x] Final tests and production build passed.
- [x] Local preview left running.

No remaining P3 issue is required for the requested workflow.
