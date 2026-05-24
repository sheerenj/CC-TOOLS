#!/usr/bin/env node

import { createRNG } from './src/random.js';
import { PALETTES } from './src/color.js';
import { generateSpheres } from './src/modes/spheres.js';
import { generatePetals } from './src/modes/petals.js';
import { generateStarburst } from './src/modes/starburst.js';
import { writeFileSync } from 'fs';

const MODES = ['spheres', 'petals', 'starburst'];

function parseArgs(argv) {
  const opts = { mode: 'spheres', seed: 42, output: 'composition.svg', count: 4 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--mode'   && argv[i+1]) { opts.mode   = argv[++i]; continue; }
    if (arg === '--seed'   && argv[i+1]) { opts.seed   = parseInt(argv[++i], 10); continue; }
    if (arg === '--output' && argv[i+1]) { opts.output = argv[++i]; continue; }
    if (arg === '--count'  && argv[i+1]) { opts.count  = parseInt(argv[++i], 10); continue; }
    if (arg === '--help' || arg === '-h') {
      console.log(`Usage: gradient-composer [options]

Options:
  --mode    <mode>    spheres | petals | starburst  (default: spheres)
  --seed    <n>       integer seed for reproducibility (default: 42)
  --count   <n>       number of grid variants for petals/starburst (default: 4)
  --output  <file>    output SVG path (default: composition.svg)
  --help              show this message
`);
      process.exit(0);
    }
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));

if (!MODES.includes(opts.mode)) {
  console.error(`Unknown mode "${opts.mode}". Valid modes: ${MODES.join(', ')}`);
  process.exit(1);
}

if (isNaN(opts.seed)) {
  console.error('--seed must be an integer.');
  process.exit(1);
}

const rng = createRNG(opts.seed);
// Deterministically pick palette from seed before handing rng to mode
const palette = PALETTES[rng.int(0, PALETTES.length - 1)];

const count = Math.max(2, Math.min(6, opts.count));

let svg;
switch (opts.mode) {
  case 'spheres':   svg = generateSpheres(rng, palette); break;
  case 'petals':    svg = generatePetals(rng, palette, count); break;
  case 'starburst': svg = generateStarburst(rng, palette, count); break;
}

writeFileSync(opts.output, svg, 'utf8');
console.log(`Wrote ${opts.mode} composition → ${opts.output}  (seed=${opts.seed})`);
