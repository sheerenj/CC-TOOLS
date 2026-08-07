# Resonance · Sound Visual Studio

Turns a recording — a testimonial, a voice note, a track — into an art-directed
audio-reactive clip, and records it as an MP4 with the sound baked in.

Built for HEAR THE YOUTH social content: black background, violet / red /
green-blue inks, flat geometry, grid-locked layout.

## How it works

1. **Sound** — drop an audio file. It is decoded in the browser and analysed
   offline with an own FFT (2048-point Hann, 96 log-spaced bands at 60 analysis
   frames per second). Nothing is uploaded. Levels are auto-normalised per file,
   so a quiet voice note and a mastered track arrive with the same headroom.
2. Because the whole timeline is analysed up front, a frame can read the
   spectrum *at another point in time*. That is what **Stagger** does: copy `n`
   in an array reads the value `n × stagger` frames ago, so the value travels
   through the array instead of every copy reacting at once — the delay-per-copy
   move a Cavalry duplicator makes. A live analyser can't do this.
3. **Quantise** snaps values to discrete steps, so motion happens in increments
   rather than sliding — the difference between a meter and a designed system.
4. **Trim** with the two markers in the transport bar; only that range records.
   `15 s from here` snaps a social-length cut.
5. **Look** — pick a system and tune it. **Art** — inks, layout, finish.
   **Export** — record.

## Systems

**Geometric** — flat fills, hard edges, grid-locked:

| Look | What it is |
| --- | --- |
| Capsules | Array of capsules — row, column, grid, ring or diagonal — with a travelling wave through the array |
| Mosaic | Modular tile grid (quarter circles, geo primitives, dots) where sound drives rotation in 90° steps, scale, tile swap or reveal |
| Dial | Concentric arcs with a tick ring and centre dot — instrument panel, not a meter |
| Editorial | Headline locked to the margin box with bars whose widths snap to the column grid, plus frequency labels |
| Data grid | LED matrix — level, scale or flip cells |
| Bars | Spectrum bars — mirror / up / split / ring, optional block-quantised steps |

**Expressive** — for texture and the illustration-adjacent looks:

| Look | What it is |
| --- | --- |
| Liquid | Layered blob deformed by the spectrum, offset per layer for riso misregistration |
| Contour | Concentric contours, each ring a few frames further in the past |
| Halftone | Dot / square / plus / line / stalk grid driven by a wind field — see below |
| Ridgeline | Stacked spectrum lines scrolling upward, occluding each other |
| Radial | Rays around a circle, tapered by amplitude |
| Slit shear | Disc, bar or word sliced and sheared per band |
| Type mask | A word filled with the moving spectrum, optional speech bubble |

## The halftone field

Halftone is the deep one. A single smooth 3-D noise field (x, y, time) that
**drifts downwind** rather than morphing in place drives four things at once:

- **Delay** — how far back in time each mark reads the spectrum. `Wind` mixes
  the downwind distance with the field; `Sweep` is a straight travelling wave;
  `Swirl` rotates; `Turbulent` is pure field; `Ripple` is the old radial wave.
- **Lean** — marks bend into the gust (`Bend`), clamped so they never fall over.
  `Stalk` marks are anchored at the cell base and exist even in silence: sound
  gives them height, wind gives them lean. Stalk + wind + bend is a hay field.
- **Drift** — marks sway off the grid (`Sway`), and density undulates
  (`Breath`).
- **Ink** — colour is a continuous position in the palette, not a fixed index:
  `Drift` sends colour bands travelling with the wind, `Gusts` paints patches
  that follow the field, `Level` maps loudness, `Depth` maps the delay, `Grid`
  falls back to the global ink mapping. Blending uses a double smoothstep, so
  most of the field sits on a pure ink and crossfades quickly instead of being
  one permanent gradient.

Because everything is coupled to the same field, the motion reads as one
material moving rather than a grid of independent meters. `Spectrum mapping ·
Field` goes further and lets the field decide which frequency each mark listens
to, so patches of the image answer to different parts of the voice.

## Art direction

- **Layout** — margin, 9-point anchor, rules (frame / lines / cross), rendered
  column grid, and instrument metadata (label + timecode, plus a spectrum tick
  scale on *Full*). Anchor and margin are the fastest way out of a symmetrical,
  dead-centre composition.
- **Colour** — background plus an editable ink list (violet `#A65FD6`,
  red `#C4182B`, green-blue `#3FC08C` on `#0B0A0D`). Ink mapping: across the
  spectrum, blended, alternating, by loudness, cycling, per layer, single ink.
  Hard colour blocking (*alternating*) is the current-feeling default; *blended*
  is the gradient option.
- **Finish** — three macros: **Flat** (no grain, bloom, haze or vignette — the
  default), **Print** (grain + misregistration, no glow) and **Glow** (bloom,
  haze, trails). Every underlying slider stays available.

## Presets

`Studio` `Dumbar` `Cavalry` `Editorial` `Matrix` `Halo` `Testimony` `Contour`
`Liquid` `Hayfield` `Quote` `Riso`

Each preset resets to a clean flat baseline first, so nothing leaks between
them. **Vary** (or `R`) re-rolls the system, its parameters, layout and finish
inside ranges that stay clean and geometric — flat finish 70% of the time, and
centred systems stay on the vertical axis so nothing lands corner-cropped.
`Space` plays / pauses.

## Reaction controls

- **Sensitivity / contrast curve** — how much of the signal reaches the visual.
- **Attack / release** — how fast shapes grow and fall back.
- **Tilt** — speech is bass-heavy; a positive tilt keeps the highs visible.
- **Loudness pump** — scales the whole composition with overall level.
- **Quantise / stagger** — see above.

## Export

`Record clip` plays the trim in real time and captures canvas + audio through
`MediaRecorder`. Output is MP4 (H.264 + AAC) where the browser supports it,
WebM (VP9 + Opus) otherwise; the Export tab shows which. Also PNG of the
current frame at full artboard resolution.

## Notes

- Recording runs in real time: a 20 s clip takes 20 s. Keep the tab in the
  foreground — background tabs drop frames.
- If the preview stutters at 1080 × 1920, set **Render scale** to 75%.
- Pixel dimensions are forced even; h.264 encoders reject odd sizes.
- Bubble captions draw their text in the background colour (green pill, black
  type) to match the campaign identity.
- Safe-area guides are never recorded. The column grid and rules *are* — they
  are design elements, not aids.
