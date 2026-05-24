export function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function adjustHSL([h, s, l], dh = 0, ds = 0, dl = 0) {
  return [h + dh, Math.max(15, Math.min(100, s + ds)), Math.max(8, Math.min(95, l + dl))];
}

// 8-12 saturated colors per palette
export const PALETTES = [
  // Cosmic candy
  [[300,82,64],[260,78,60],[200,86,64],[160,76,58],[340,82,64],[220,80,70],[280,72,54],[180,80,60],[240,84,62],[140,76,56]],
  // Fire & ice
  [[4,90,60],[32,90,64],[300,82,60],[200,86,64],[60,86,64],[336,82,60],[180,86,60],[244,76,64],[120,80,60],[28,88,65]],
  // Tropical jewel
  [[172,82,54],[124,76,54],[52,92,60],[20,86,60],[320,82,64],[272,76,60],[100,82,60],[40,86,64],[196,84,58],[60,84,58]],
  // Neon dreams
  [[280,100,64],[200,100,64],[320,100,64],[160,100,60],[60,100,64],[0,100,64],[240,92,64],[100,92,64],[280,90,55],[40,95,62]],
  // Jewel tones
  [[212,72,50],[152,66,46],[332,72,50],[32,76,54],[272,66,50],[92,66,50],[2,72,50],[182,66,50],[312,70,52],[62,74,52]],
  // Aurora
  [[180,85,60],[220,80,65],[260,85,65],[300,80,60],[160,80,58],[240,90,68],[200,85,62],[280,82,58],[140,78,55],[320,85,62]],
];

export function pickColors(palette, rng, n) {
  const start = rng.int(0, palette.length - 1);
  return Array.from({ length: n }, (_, i) => palette[(start + i) % palette.length]);
}
