# Two tool styles — pick one per tool

Every tool in this repo is either **agency work** or **personal practice**. They use different skins on the same component markup and the same wiring script.

| | Personal practice | Hear The Youth (agency) |
|---|---|---|
| Stylesheet | `shared/sheeren-tools.css` | `shared/hty-brand.css` |
| Look | light grey stage, dot grid, hairlines, no shadows, system sans | dark `#191919` page, black rounded islands, Suisse Intl + Suisse Intl Mono caps, white accent |
| Source of truth | this repo (`design-system/index.html` is the live demo) | [`HearTheYouth/dev-hty-tool-components`](https://github.com/HearTheYouth/dev-hty-tool-components) — brand tokens in `styles/global.css`, never edited per tool |
| Local reference | — | `~/Documents/GitHub/HTY/dev-hty-tool-components` (clone; `git pull` to update) |
| Tools using it | Halftone Dot · Pebble Type · Pebble Loom · Flux Particle · Orb Burst | Resonance · Beadwork · Pebble Studio · Boldly Identity (Typography + Compositions) |

**Shared by both:** `shared/tool-ui.js` wires every component (tabs, sliders, selects, toggles, canvas pan/zoom, frame size). Its global is `HTY` (kept for compatibility), also available as `ToolUI`.

## Starting a new tool

Decide first: **is this for work or for my own practice?**

```html
<!-- personal practice -->
<link rel="stylesheet" href="../../shared/sheeren-tools.css" />
<!-- or agency work -->
<link rel="stylesheet" href="../../shared/hty-brand.css" />

<body class="hty"> … markup … 
<script src="../../shared/tool-ui.js"></script>
```

Components missing from `hty-brand.css` (canvas stats readout, zoom readout, W/H fields) are patched inside each agency tool's own `<style>`, not in the shared file, so other agency tools don't shift.

## History

The personal kit used to be called `hty-ui.css` / `hty-ui.js`, which wrongly suggested it was the agency style. Renamed 2026-09-25. `shared/hty-tools.css` (the old left-sidebar v1, used only by Dot Matrix Studio) is untouched for now.
