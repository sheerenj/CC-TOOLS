import { hslToHex, pickColors, adjustHSL } from '../color.js';

let gid = 20000;

function makeStarburst(cx, cy, cellW, cellH, palette, rng) {
  const id = ++gid;
  const barCount  = rng.int(8, 14);
  const maxR      = Math.min(cellW, cellH) * 0.43;
  const barLength = maxR * 2;
  const barWidth  = barLength * rng.float(0.062, 0.098);
  const rx        = (barWidth * 0.5).toFixed(2);

  // 3 colors for the length-wise gradient
  const colors = pickColors(palette, rng, 3);
  const c0 = hslToHex(...colors[0]);
  const c1 = hslToHex(...colors[1]);
  const c2 = hslToHex(...colors[2]);

  // Cylindrical shading colors
  const lightCenter = hslToHex(...adjustHSL(colors[1], 0, -18, 26));
  const darkEdge    = hslToHex(...adjustHSL(colors[1], 5,  10, -22));

  const useShadow = rng.bool(0.6);
  const barDefs   = [];
  const barShapes = [];

  if (useShadow) {
    barDefs.push(`
    <filter id="sh${id}" x="-8%" y="-8%" width="116%" height="116%">
      <feDropShadow dx="2" dy="3" stdDeviation="4" flood-color="rgba(0,0,0,0.18)"/>
    </filter>`);
  }

  for (let i = 0; i < barCount; i++) {
    const bid = `${id}_${i}`;
    // Bars span full angle range (each bar covers both directions from center)
    const angleDeg = (i / barCount) * 180;
    const angleRad = angleDeg * Math.PI / 180;

    // Length-wise: horizontal in bar-local space, then rotated
    // Gradient goes from (cx - L/2, cy) to (cx + L/2, cy) in world, then rotated
    barDefs.push(`
    <linearGradient id="bl${bid}" gradientUnits="userSpaceOnUse"
      x1="${(cx - barLength / 2).toFixed(2)}" y1="${cy.toFixed(2)}"
      x2="${(cx + barLength / 2).toFixed(2)}" y2="${cy.toFixed(2)}"
      gradientTransform="rotate(${angleDeg.toFixed(2)},${cx.toFixed(2)},${cy.toFixed(2)})">
      <stop offset="0%"   stop-color="${c0}"/>
      <stop offset="50%"  stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>`);

    // Width-wise: vertical in bar-local space = perpendicular cylindrical shading
    barDefs.push(`
    <linearGradient id="bw${bid}" gradientUnits="userSpaceOnUse"
      x1="${cx.toFixed(2)}" y1="${(cy - barWidth / 2).toFixed(2)}"
      x2="${cx.toFixed(2)}" y2="${(cy + barWidth / 2).toFixed(2)}"
      gradientTransform="rotate(${angleDeg.toFixed(2)},${cx.toFixed(2)},${cy.toFixed(2)})">
      <stop offset="0%"   stop-color="${darkEdge}"/>
      <stop offset="35%"  stop-color="${lightCenter}" stop-opacity="0.82"/>
      <stop offset="50%"  stop-color="white"          stop-opacity="0.55"/>
      <stop offset="65%"  stop-color="${lightCenter}" stop-opacity="0.82"/>
      <stop offset="100%" stop-color="${darkEdge}"/>
    </linearGradient>`);

    const bx = (cx - barLength / 2).toFixed(2);
    const by = (cy - barWidth  / 2).toFixed(2);
    const bw = barLength.toFixed(2);
    const bh = barWidth.toFixed(2);
    const transform = `rotate(${angleDeg.toFixed(2)},${cx.toFixed(2)},${cy.toFixed(2)})`;
    const shadowAttr = useShadow ? ` filter="url(#sh${id})"` : '';

    barShapes.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${rx}" ry="${rx}" fill="url(#bl${bid})" transform="${transform}"${shadowAttr}/>`);
    barShapes.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${rx}" ry="${rx}" fill="url(#bw${bid})" transform="${transform}" opacity="0.68"/>`);
  }

  // Small central disc to cover bar intersections cleanly
  const centerColors = pickColors(palette, rng, 2);
  const discR = (barWidth * 1.1).toFixed(2);
  const discLight = hslToHex(...adjustHSL(centerColors[0], 0, -10, 24));
  const discDark  = hslToHex(...adjustHSL(centerColors[1], 5,  8, -16));
  barDefs.push(`
    <radialGradient id="dc${id}" cx="38%" cy="34%" r="64%">
      <stop offset="0%"   stop-color="${discLight}"/>
      <stop offset="100%" stop-color="${discDark}"/>
    </radialGradient>`);
  barShapes.push(`<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${discR}" fill="url(#dc${id})"/>`);

  return { defs: barDefs.join(''), shapes: barShapes.join('\n') };
}

export function generateStarburst(rng, palette, count) {
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
    const { defs, shapes } = makeStarburst(cx, cy, cellW, cellH, palette, rng);
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
