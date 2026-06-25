# Platine FCC Lattice — Cavalry shape

FCC crystal-lattice generator with spin / swing / tumble / oscillation, depth-aware.

## Output modes
- **Atoms / Bonds / Atoms + Bonds** — the classic single-mesh render.
- **Points (Duplicator)** — emits *one vertex per atom*, ordered **back-to-front**
  (far → near). Use this to drive a Duplicator so every crystal is its own,
  individually shader-addressable instance.

## Route A — moving crystals via a Duplicator + shader array
1. Add a **Platine FCC Lattice** layer. Set **Output → Points (Duplicator)**.
   (Its stroke/fill can be hidden — it's only a distribution source now.)
2. Make your **crystal** shape (a polygon/faceted shape) — this is what gets cloned.
3. Add a **Duplicator**; set the crystal as its child and the FCC layer as its
   target, with **Distribution = Vertices** (NOT "Along Path" — that spaces evenly
   and ignores the atom positions).
4. The crystals now sit on the animated lattice and move with it for free.
5. Drive **per-crystal** size / colour / rotation by connecting a **shader / array /
   incrementer / falloff** to the Duplicator. Because the points are emitted
   far → near, the clone **index runs with depth** — index 0 = farthest,
   last = nearest — so an index-driven ramp reads as a real 3D depth cue.

> Verify in your Cavalry version that the Duplicator can distribute on a
> third-party shape's **vertices**. If not, tell me and I'll switch the Points
> output to whatever distribution your Duplicator accepts.

## Keeping the Dot-Pattern layer in sync (no manual matching)
The **Platine Dot Pattern** layer re-derives the same 3D silhouette, so its 3D
params must match this layer. Instead of matching by hand every time:

1. Treat **this FCC layer as the single source of truth** for the transform.
2. In the Dot-Pattern layer, **connect** each 3D attribute to the FCC layer's:
   `animMode, rotX, rotY, rotZ, spinAxis, spinSpeed, swingAxis, swingSpeed,
   swingRange, swingEase, tumbleX, tumbleY, tumbleZ, oscOn, oscAxis, oscAmp,
   oscFreq, cells, latticeSize, atomSize, loopFrames`.
3. Now changing the FCC layer updates the dot halftone automatically.

Save the wired-up FCC + Duplicator + Dot-Pattern as a Cavalry **Component /
scene template** so the whole rig is one drag to reuse.

## Install
Copy `layer.js`, `layerIcon*.png` into the Cavalry plugin folder and merge this
plugin's objects from `definitions.json` / `strings.json` into the aggregate
arrays there, then restart Cavalry.
