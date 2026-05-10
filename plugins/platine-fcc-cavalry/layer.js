// Platine FCC Lattice — Cavalry JavaScript Shape Plugin
// Install: drag the platine-fcc folder into Cavalry, or copy to
//   macOS: ~/Library/Application Support/Cavalry/Third-Party/Plugins/
//   Win:   %APPDATA%\Cavalry\Third-Party\Plugins\
//
// Usage:
//   • animMode = Keyframe → keyframe rotX/rotY/rotZ directly in Cavalry's
//     timeline using the full graph editor. All other anim params are ignored.
//   • animMode = Spin / Swing / Tumble → computed from ctx.getTime() (stateless,
//     frame-accurate). rotX/Y/Z act as a constant base rotation offset.
//   • Oscillation toggles on top of any mode.
//   • outputMode = Atoms → use for fill + inner glow effects.
//     outputMode = Bonds → duplicate layer, set to Bonds, apply Stroke only.
//   • Merge Atoms → boolean union of all circles into one true silhouette
//     (best for per-shape inner glow). Capped at 128 atoms for performance.

'use strict';

// ─── Constants ────────────────────────────────────────────────────
const PI  = Math.PI;
const TAU = PI * 2;
const D2R = PI / 180;

// ─── Easing functions (index matches swingEase enum 0–9) ─────────
const EASE_FNS = [
  t => t,                                                                             // 0  linear
  t => -(Math.cos(PI * t) - 1) / 2,                                                  // 1  sine
  t => t * t,                                                                         // 2  easeIn quad
  t => t * (2 - t),                                                                   // 3  easeOut quad
  t => t < 0.5 ? 2*t*t : -1 + (4 - 2*t) * t,                                        // 4  easeInOut quad
  t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2,                           // 5  easeInOut cubic
  t => t === 0 ? 0 : t === 1 ? 1 : t < 0.5                                           // 6  exponential
       ? Math.pow(2, 20*t - 10) / 2
       : (2 - Math.pow(2, -20*t + 10)) / 2,
  t => {                                                                               // 7  elastic
    if (t === 0 || t === 1) return t;
    const p = 0.45, s = p / 4;
    return t < 0.5
      ? -(0.5 * Math.pow(2, 10*(2*t-1)) * Math.sin(((2*t-1) - s) * TAU / p))
      : 0.5 * Math.pow(2, -10*(2*t-1)) * Math.sin(((2*t-1) - s) * TAU / p) + 1;
  },
  t => {                                                                               // 8  bounce
    const bounce = u => {
      const n = 7.5625, d = 2.75;
      let v = u;
      if (v < 1/d)        return n * v * v;
      if (v < 2/d)        { v -= 1.5/d;  return n * v * v + 0.75;   }
      if (v < 2.5/d)      { v -= 2.25/d; return n * v * v + 0.9375; }
                            v -= 2.625/d; return n * v * v + 0.984375;
    };
    return t < 0.5 ? (1 - bounce(1 - 2*t)) / 2 : (1 + bounce(2*t - 1)) / 2;
  },
  t => {                                                                               // 9  back (overshoot)
    const c = 2.5949095;
    return t < 0.5
      ? (Math.pow(2*t, 2) * ((c + 1) * 2*t - c)) / 2
      : (Math.pow(2*t - 2, 2) * ((c + 1) * (2*t - 2) + c) + 2) / 2;
  },
];

// ─── FCC Lattice ─────────────────────────────────────────────────
function genFCC(n) {
  const seen   = new Map();
  const result = [];
  const add    = (x, y, z) => {
    const key = `${Math.round(x * 1000)},${Math.round(y * 1000)},${Math.round(z * 1000)}`;
    if (!seen.has(key)) {
      seen.set(key, 1);
      result.push([x - n / 2, y - n / 2, z - n / 2]);
    }
  };
  for (let ix = 0; ix < n; ix++) {
    for (let iy = 0; iy < n; iy++) {
      for (let iz = 0; iz < n; iz++) {
        // Corner atoms
        for (let a = 0; a <= 1; a++)
          for (let b = 0; b <= 1; b++)
            for (let c = 0; c <= 1; c++)
              add(ix+a, iy+b, iz+c);
        // Face-centred atoms
        add(ix+0.5, iy+0.5, iz    ); add(ix+0.5, iy+0.5, iz+1  );
        add(ix+0.5, iy,     iz+0.5); add(ix+0.5, iy+1,   iz+0.5);
        add(ix,     iy+0.5, iz+0.5); add(ix+1,   iy+0.5, iz+0.5);
      }
    }
  }
  return result;
}

// Nearest-neighbour bonds: FCC bond length ≈ 0.707 (√2/2), threshold = 0.76
function genBonds(pts) {
  const bonds    = [];
  const THRESH_SQ = 0.58;   // 0.76² ≈ 0.578
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i][0] - pts[j][0];
      const dy = pts[i][1] - pts[j][1];
      const dz = pts[i][2] - pts[j][2];
      if (dx*dx + dy*dy + dz*dz < THRESH_SQ) bonds.push([i, j]);
    }
  }
  return bonds;
}

// ─── 3D Rotation (Euler: Y → X → Z) ─────────────────────────────
function rot3(x, y, z, rx, ry, rz) {
  // Rotate around Y
  const x1 =  x * Math.cos(ry) + z * Math.sin(ry);
  const z1 = -x * Math.sin(ry) + z * Math.cos(ry);
  // Rotate around X
  const y2 =  y * Math.cos(rx) - z1 * Math.sin(rx);
  const z2 =  y * Math.sin(rx) + z1 * Math.cos(rx);
  // Rotate around Z
  return [
    x1 * Math.cos(rz) - y2 * Math.sin(rz),
    x1 * Math.sin(rz) + y2 * Math.cos(rz),
    z2,
  ];
}

// ─── Clamp helpers ────────────────────────────────────────────────
function clampInt(v, lo, hi) { return Math.max(lo, Math.min(hi, Math.round(v))); }
function clamp(v, lo, hi)    { return Math.max(lo, Math.min(hi, v)); }

// ─── Read inputs ─────────────────────────────────────────────────
// Cavalry exposes each attribute "id" as a global variable in the JS scope.
// The values below are live — they update every frame (including keyframe interpolation).

const n_cells    = clampInt(cells,      1, 8);
const t          = ctx.getTime();              // seconds — stateless, scrub-safe
const bsc        = latticeSize / (n_cells * 2.55);  // px per lattice unit
const ar         = bsc * clamp(atomSize, 0.01, 1.0); // atom radius

// Animation mode map
const ANIM_MODES = ['keyframe', 'spin', 'swing', 'tumble'];
const mode       = ANIM_MODES[clampInt(animMode, 0, 3)];

// Base rotation — always keyframeable; in non-keyframe modes these are offsets
let rx = rotX * D2R;
let ry = rotY * D2R;
let rz = rotZ * D2R;

// ─── Spin ─────────────────────────────────────────────────────────
if (mode === 'spin') {
  const SPIN_AXES = ['x', 'y', 'z', 'xy', 'xyz'];
  const ax        = SPIN_AXES[clampInt(spinAxis, 0, 4)];
  const angle     = t * spinSpeed * D2R;   // spinSpeed in °/s
  if      (ax === 'x')   rx += angle;
  else if (ax === 'y')   ry += angle;
  else if (ax === 'z')   rz += angle;
  else if (ax === 'xy')  { rx += angle * 0.55; ry += angle; }
  else                   { rx += angle * 0.37; ry += angle; rz += angle * 0.61; }
}

// ─── Swing ────────────────────────────────────────────────────────
else if (mode === 'swing') {
  const SWING_AXES = ['x', 'y', 'z'];
  const ax         = SWING_AXES[clampInt(swingAxis, 0, 2)];
  // swingSpeed in cycles/s → phase 0→2 over one full back-and-forth
  const phase = (t * swingSpeed * 2.0) % 2.0;
  const norm  = phase <= 1.0 ? phase : 2.0 - phase;   // triangle wave 0→1→0
  const ef    = EASE_FNS[clampInt(swingEase, 0, EASE_FNS.length - 1)] || EASE_FNS[0];
  const angle = (ef(norm) * 2.0 - 1.0) * (swingRange * 0.5 * D2R);
  if      (ax === 'x') rx += angle;
  else if (ax === 'y') ry += angle;
  else                 rz += angle;
}

// ─── Tumble ───────────────────────────────────────────────────────
else if (mode === 'tumble') {
  // tumbleX/Y/Z in °/s — fully independent per-axis
  rx += t * tumbleX * D2R;
  ry += t * tumbleY * D2R;
  rz += t * tumbleZ * D2R;
}

// (keyframe mode: rx/ry/rz already read from the keyframed attributes above)

// ─── Oscillation (additive, works on top of any mode) ─────────────
if (oscOn) {
  const OSC_AXES = ['x', 'y', 'z'];
  const ax  = OSC_AXES[clampInt(oscAxis, 0, 2)];
  const off = Math.sin(t * oscFreq * TAU) * oscAmp * D2R;
  if      (ax === 'x') rx += off;
  else if (ax === 'y') ry += off;
  else                 rz += off;
}

// ─── Generate lattice & project ───────────────────────────────────
const pts3D     = genFCC(n_cells);
const projected = pts3D.map(([px, py, pz]) => {
  const [ox, oy, oz] = rot3(px, py, pz, rx, ry, rz);
  return {
    sx: ox * bsc,
    sy: -oy * bsc,  // flip Y: positive Y up in 3D → positive Y down in screen space
    sz: oz,
  };
});

// Sort back-to-front so front atoms render on top
const sorted = [...projected].sort((a, b) => a.sz - b.sz);

// ─── Output mode ──────────────────────────────────────────────────
const OUT_MODES = ['atoms', 'bonds', 'both'];
const outMode   = OUT_MODES[clampInt(outputMode, 0, 2)];
const doAtoms   = outMode === 'atoms' || outMode === 'both';
const doBonds   = outMode === 'bonds' || outMode === 'both';

// ─── Build path ───────────────────────────────────────────────────
let result;

if (doAtoms) {
  if (mergeAtoms && pts3D.length <= 128) {
    // Boolean union → single merged silhouette.
    // Effects (inner glow, etc.) apply cleanly to the whole shape.
    // Limited to ≤128 atoms (n≤4) to keep it interactive.
    result = new cavalry.Path();
    for (const { sx, sy } of sorted) {
      const circle = new cavalry.Path();
      circle.addEllipse(sx, sy, ar, ar);
      result = result.unite(circle);
    }
  } else {
    // Compound path — each atom is a separate contour in one Path object.
    // Fast at any cell count. Effects apply per contour.
    result = new cavalry.Path();
    for (const { sx, sy } of sorted) {
      result.addEllipse(sx, sy, ar, ar);
    }
  }
} else {
  result = new cavalry.Path();
}

// ─── Bonds ────────────────────────────────────────────────────────
// Tip: for separate bond styling, duplicate the layer and set Output = Bonds,
// then apply Stroke only to that instance (no Fill / no inner glow).
if (doBonds) {
  const bonds = genBonds(pts3D);
  for (const [i, j] of bonds) {
    result.moveTo(projected[i].sx, projected[i].sy);
    result.lineTo(projected[j].sx, projected[j].sy);
  }
}

// ─── Output ───────────────────────────────────────────────────────
ctx.setResult(result);
