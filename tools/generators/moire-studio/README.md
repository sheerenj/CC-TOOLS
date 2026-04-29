# Moiré Studio

Two standalone tools for generating moiré interference patterns. Both run fully in-browser with no dependencies.

---

## Moiré Studio — Pixel / Canvas (`index.html`)

Raster renderer using the HTML5 Canvas API. Pixels are composited at the GPU level.

**Best for:** animation, video export, real-time interaction, pixel-level effects

| Feature | Details |
|---|---|
| Rendering | Canvas 2D — pixel-by-pixel |
| Export | MP4 video, PNG sequence, single PNG |
| Animation | Built-in loop with adjustable speed |
| Pattern types | Stripes, diamonds, circles (polar) |
| Combination modes | Normal, Multiply, Screen, Difference, XOR, and more |
| Resolution | Fixed to screen/export pixel dimensions |

---

## Moiré SVG Studio — Vector (`moire-svg-studio.html`)

Vector renderer that builds pure SVG geometry. Patterns scale to any resolution without quality loss.

**Best for:** print, large-format export, scalable assets, geometric precision

| Feature | Details |
|---|---|
| Rendering | SVG paths — resolution-independent |
| Export | `.svg` file at any canvas size (up to 16 000 × 16 000) |
| Animation | None — static output |
| Pattern types (per layer) | **Rings**, **Radial**, **Lines**, **Grid** (two independent angle families) |
| Combination modes | **XOR** (geometric, via `fill-rule="evenodd"`) + 12 CSS blend modes |
| Resolution | Fully scalable — export at any DPI |

### How SVG XOR works

XOR mode concatenates the path data from both layers into a single `<path fill-rule="evenodd">`. Regions covered by an odd number of overlapping shapes are filled; even-coverage regions (intersections) cancel out. This is mathematically equivalent to pixel-level XOR but operates on geometry, producing crisp edges at any resolution.

---

## Quick comparison

| | Pixel Studio | SVG Studio |
|---|---|---|
| File | `index.html` | `moire-svg-studio.html` |
| Output type | Raster (pixels) | Vector (paths) |
| Scales without loss | No | Yes |
| Animation / video | Yes | No |
| Infinite resolution export | No | Yes |
| Geometric XOR | Approximate | Exact |
