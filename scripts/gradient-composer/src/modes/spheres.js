import { hslToHex, pickColors, adjustHSL } from '../color.js';

let gid = 0;

function makeSphere(cx, cy, R, palette, rng, isTorus) {
  const id = ++gid;
  const colors = pickColors(palette, rng, 3);
  const [c1, c2, c3] = colors;

  const base1 = hslToHex(...c1);
  const base2 = hslToHex(...c2);
  const base3 = hslToHex(...c3);
  const rimColor = hslToHex(...adjustHSL(c1, 0, -12, 28));

  const specCX = rng.float(25, 40);
  const specCY = rng.float(20, 36);
  const specR  = rng.float(22, 34);

  const innerR = isTorus ? R * rng.float(0.30, 0.46) : 0;

  const dark1 = hslToHex(...adjustHSL(c3, 10,  8, -32));
  const dark2 = hslToHex(...adjustHSL(c3,  5,  4, -20));
  const dark3 = hslToHex(...adjustHSL(c2,  0,  3, -14));

  const blurStd = rng.float(0.8, 2.2);

  const defs = `
    <radialGradient id="b${id}" cx="${rng.float(30,42).toFixed(1)}%" cy="${rng.float(27,40).toFixed(1)}%" r="65%">
      <stop offset="0%"   stop-color="${base1}"/>
      <stop offset="47%"  stop-color="${base2}"/>
      <stop offset="100%" stop-color="${base3}"/>
    </radialGradient>
    <radialGradient id="r${id}" cx="50%" cy="50%" r="50%">
      <stop offset="58%"  stop-color="white"      stop-opacity="0"/>
      <stop offset="100%" stop-color="${rimColor}" stop-opacity="0.48"/>
    </radialGradient>
    <radialGradient id="s${id}" cx="${specCX.toFixed(1)}%" cy="${specCY.toFixed(1)}%" r="${specR.toFixed(1)}%">
      <stop offset="0%"   stop-color="white" stop-opacity="0.95"/>
      <stop offset="52%"  stop-color="white" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </radialGradient>
    <filter id="f${id}" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="${blurStd.toFixed(2)}"/>
    </filter>
    ${isTorus ? `
    <radialGradient id="h${id}" cx="48%" cy="42%" r="56%">
      <stop offset="0%"   stop-color="${dark1}"/>
      <stop offset="54%"  stop-color="${dark2}"/>
      <stop offset="100%" stop-color="${dark3}"/>
    </radialGradient>
    <radialGradient id="hrim${id}" cx="50%" cy="52%" r="50%">
      <stop offset="58%"  stop-color="white"      stop-opacity="0"/>
      <stop offset="100%" stop-color="${rimColor}" stop-opacity="0.18"/>
    </radialGradient>
    <mask id="m${id}">
      <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${R.toFixed(2)}"      fill="white"/>
      <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${innerR.toFixed(2)}" fill="black"/>
    </mask>` : ''}`;

  const mask = isTorus ? ` mask="url(#m${id})"` : '';
  const shadowRx = (R * 0.68).toFixed(2);
  const shadowRy = (R * 0.13).toFixed(2);
  const shadowCY = (cy + R * 0.84).toFixed(2);

  const shapes = `
    <ellipse cx="${cx.toFixed(2)}" cy="${shadowCY}" rx="${shadowRx}" ry="${shadowRy}" fill="rgba(0,0,0,0.10)" filter="url(#f${id})"/>
    <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${R.toFixed(2)}" fill="url(#b${id})"${mask}/>
    <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${R.toFixed(2)}" fill="url(#r${id})"${mask} opacity="0.75"/>
    <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${R.toFixed(2)}" fill="url(#s${id})"${mask}/>
    ${isTorus ? `
    <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${innerR.toFixed(2)}" fill="url(#h${id})"/>
    <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${innerR.toFixed(2)}" fill="url(#hrim${id})"/>
    <circle cx="${(cx + innerR * 0.14).toFixed(2)}" cy="${(cy - innerR * 0.22).toFixed(2)}" r="${(innerR * 0.72).toFixed(2)}"
            fill="none" stroke="white" stroke-width="${(innerR * 0.09).toFixed(2)}" stroke-opacity="0.14" filter="url(#f${id})"/>` : ''}`;

  return { defs, shapes };
}

export function generateSpheres(rng, palette) {
  const count = rng.int(15, 25);

  // Clustered positions
  const clusterCount = rng.int(3, 6);
  const clusters = Array.from({ length: clusterCount }, () => ({
    x: rng.float(140, 860),
    y: rng.float(140, 860),
  }));

  const positions = [];
  for (let i = 0; i < count; i++) {
    const c = clusters[rng.int(0, clusters.length - 1)];
    positions.push({
      x: Math.max(20, Math.min(980, c.x + rng.float(-190, 190))),
      y: Math.max(20, Math.min(980, c.y + rng.float(-190, 190))),
      r: rng.float(38, 108),
    });
  }
  positions.sort((a, b) => a.y - b.y);

  const allDefs = [];
  const allShapes = [];
  for (const { x, y, r } of positions) {
    const isTorus = rng.bool(0.65);
    const { defs, shapes } = makeSphere(x, y, r, palette, rng, isTorus);
    allDefs.push(defs);
    allShapes.push(shapes);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  <rect width="1000" height="1000" fill="#d4d0c8"/>
  <defs>${allDefs.join('')}</defs>
  ${allShapes.join('')}
</svg>`;
}
