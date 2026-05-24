import { hslToHex, pickColors, adjustHSL } from '../color.js';

let gid = 10000;

function petalPath(cx, cy, length, halfWidth, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  // Perpendicular unit vector
  const px = -sin;
  const py =  cos;

  const tipX = cx + cos * length;
  const tipY = cy + sin * length;

  // Two control points per side for cubic bezier
  const cp1x = cx + cos * length * 0.28 + px * halfWidth;
  const cp1y = cy + sin * length * 0.28 + py * halfWidth;
  const cp2x = cx + cos * length * 0.72 + px * halfWidth * 0.55;
  const cp2y = cy + sin * length * 0.72 + py * halfWidth * 0.55;

  const cp3x = cx + cos * length * 0.72 - px * halfWidth * 0.55;
  const cp3y = cy + sin * length * 0.72 - py * halfWidth * 0.55;
  const cp4x = cx + cos * length * 0.28 - px * halfWidth;
  const cp4y = cy + sin * length * 0.28 - py * halfWidth;

  const fmt = n => n.toFixed(2);
  return [
    `M ${fmt(cx)},${fmt(cy)}`,
    `C ${fmt(cp1x)},${fmt(cp1y)} ${fmt(cp2x)},${fmt(cp2y)} ${fmt(tipX)},${fmt(tipY)}`,
    `C ${fmt(cp3x)},${fmt(cp3y)} ${fmt(cp4x)},${fmt(cp4y)} ${fmt(cx)},${fmt(cy)}`,
    'Z',
  ].join(' ');
}

function makeFlower(cx, cy, cellW, cellH, palette, rng) {
  const id = ++gid;
  const petalCount = rng.int(10, 16);
  const maxR = Math.min(cellW, cellH) * 0.40;
  const petalLength = maxR * rng.float(0.85, 1.0);
  const halfWidth = petalLength * rng.float(0.20, 0.30);

  // 4 colors for the along-petal gradient
  const colors = pickColors(palette, rng, 4);
  const c0 = hslToHex(...colors[0]);
  const c1 = hslToHex(...colors[1]);
  const c2 = hslToHex(...colors[2]);
  const c3 = hslToHex(...colors[3]);

  // Lighter center overlay for cylindrical roundness
  const lightC = hslToHex(...adjustHSL(colors[1], 0, -18, 28));
  // Darker edge overlay
  const darkC  = hslToHex(...adjustHSL(colors[2], 5, 10, -18));

  const petalDefs   = [];
  const petalShapes = [];

  for (let i = 0; i < petalCount; i++) {
    const pid = `${id}_${i}`;
    const angle = (i / petalCount) * Math.PI * 2 + rng.float(-0.04, 0.04);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Primary gradient: along petal length, 4 hue stops
    petalDefs.push(`
    <linearGradient id="pl${pid}" gradientUnits="userSpaceOnUse"
      x1="${cx.toFixed(2)}" y1="${cy.toFixed(2)}"
      x2="${(cx + cos * petalLength).toFixed(2)}" y2="${(cy + sin * petalLength).toFixed(2)}">
      <stop offset="0%"   stop-color="${c0}"/>
      <stop offset="28%"  stop-color="${c1}"/>
      <stop offset="64%"  stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c3}"/>
    </linearGradient>`);

    // Secondary radial: volumetric roundness — lighter spine, darker edges
    const midX = (cx + cos * petalLength * 0.5).toFixed(2);
    const midY = (cy + sin * petalLength * 0.5).toFixed(2);
    const radR = (petalLength * 0.42).toFixed(2);
    petalDefs.push(`
    <radialGradient id="pr${pid}" gradientUnits="userSpaceOnUse"
      cx="${midX}" cy="${midY}" r="${radR}">
      <stop offset="0%"   stop-color="${lightC}" stop-opacity="0.52"/>
      <stop offset="52%"  stop-color="${lightC}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${darkC}"  stop-opacity="0.32"/>
    </radialGradient>`);

    const path    = petalPath(cx, cy, petalLength, halfWidth, angle);
    const opacity = rng.float(0.80, 0.93).toFixed(2);
    petalShapes.push(`<path d="${path}" fill="url(#pl${pid})" opacity="${opacity}"/>`);
    petalShapes.push(`<path d="${path}" fill="url(#pr${pid})" opacity="0.62"/>`);
  }

  // Center disc
  const centerR  = petalLength * 0.095;
  const cLight   = hslToHex(...adjustHSL(colors[0], 0, -5, 22));
  const cDark    = hslToHex(...adjustHSL(colors[0], 18, 12, -18));
  petalDefs.push(`
    <radialGradient id="pc${id}" cx="38%" cy="34%" r="62%">
      <stop offset="0%"   stop-color="${cLight}"/>
      <stop offset="100%" stop-color="${cDark}"/>
    </radialGradient>`);
  petalShapes.push(`<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${centerR.toFixed(2)}" fill="url(#pc${id})"/>`);

  return { defs: petalDefs.join(''), shapes: petalShapes.join('\n') };
}

export function generatePetals(rng, palette, count) {
  const cols = count <= 4 ? 2 : 3;
  const rows = Math.ceil(count / cols);
  const cellW = 1000 / cols;
  const cellH = 1000 / rows;

  const allDefs   = [];
  const allShapes = [];

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = cellW * (col + 0.5);
    const cy = cellH * (row + 0.5);
    const { defs, shapes } = makeFlower(cx, cy, cellW, cellH, palette, rng);
    allDefs.push(defs);
    allShapes.push(shapes);
  }

  const gridLines = [];
  for (let c = 1; c < cols; c++)
    gridLines.push(`<line x1="${c * cellW}" y1="0" x2="${c * cellW}" y2="1000" stroke="#bfbbb3" stroke-width="1"/>`);
  for (let r = 1; r < rows; r++)
    gridLines.push(`<line x1="0" y1="${r * cellH}" x2="1000" y2="${r * cellH}" stroke="#bfbbb3" stroke-width="1"/>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  <rect width="1000" height="1000" fill="#d4d0c8"/>
  <defs>${allDefs.join('')}</defs>
  ${gridLines.join('\n')}
  ${allShapes.join('\n')}
</svg>`;
}
