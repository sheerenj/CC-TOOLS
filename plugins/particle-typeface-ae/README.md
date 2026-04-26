# Particle Typeface — After Effects CEP Panel

An After Effects panel plugin that generates animated particle text compositions directly in AE, with full keyframed motion paths, multi-color layers, and standard AE workflow compatibility.

## Requirements

- After Effects CC 2022 (v22.0) or later
- macOS

## Installation

### 1. Enable CEP Debug Mode

Open Terminal and run:

```bash
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
```

Restart your Mac or restart After Effects after running this command.

### 2. Copy the Extension

Copy the `com.jansheeren.particletypeface` folder to:

```
~/Library/Application Support/Adobe/CEP/extensions/
```

The full path should look like:

```
~/Library/Application Support/Adobe/CEP/extensions/com.jansheeren.particletypeface/
```

If the `extensions` folder doesn't exist, create it.

### 3. Open in After Effects

1. Launch (or restart) After Effects
2. Go to **Window > Extensions > Particle Typeface**

The panel will dock like any standard AE panel.

---

## Usage

1. **Type your text** in the text field and choose a font/size/weight
2. **Adjust particle settings** — dot size, variance, physics, colors
3. **Configure AE settings** — comp name, resolution, FPS, duration, particle count, keyframe interval
4. Click **Export to After Effects** — the plugin will:
   - Run an offline deterministic simulation
   - Write frame data to a temp file
   - Call ExtendScript to build the comp
5. The composition opens automatically in the AE viewer

### Layers

Each color gets its own Shape Layer (`Particles — Color 1`, `Particles — Color 2`, …). Every dot is a Group inside that layer with an Ellipse, a Fill, and position keyframes — fully editable in AE's timeline.

### Keyframe Interval

The "Keyframe every N frames" slider controls density. At N=1 every frame has a keyframe; at N=4 AE interpolates between sparse keyframes (much faster to create and easier to edit).

---

## Removing Debug Mode

When you're done testing, disable debug mode:

```bash
defaults delete com.adobe.CSXS.11 PlayerDebugMode
```
