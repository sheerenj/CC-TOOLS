/* Boldly brand colours — the ONE place the palette lives. All four Boldly tools load this file.
   Fine-tune in any tool (View → Brand colours → Edit), then "Export brand-colors.js" and replace this file.
   Bump `updated` whenever you change it here, so every browser picks up the new palette. */
window.BOLDLY_BRAND = {
  updated: '2026-10-01',
  colors: [
    { name: 'Lilac',     hex: '#d4befd' },
    { name: 'Magenta',   hex: '#db1cfa' },
    { name: 'Vermilion', hex: '#dd3e0f' },
    { name: 'Wine',      hex: '#620118' },
    { name: 'Oxblood',   hex: '#360100' },
    { name: 'Night',     hex: '#1c002c' },
    { name: 'Violet',    hex: '#4d2ab9' },
    { name: 'Lavender',  hex: '#714ae8' },
    { name: 'Aqua',      hex: '#88e4e4' },
    { name: 'Cobalt',    hex: '#322ab5' },
    { name: 'Lime',      hex: '#88ed6e' },
  ],
  /* ready-made background / ink pairs (by name) */
  pairs: [
    ['Night', 'Lilac'], ['Lilac', 'Night'], ['Cobalt', 'Lime'], ['Wine', 'Aqua'], ['Oxblood', 'Vermilion'],
    ['Violet', 'Lilac'], ['Magenta', 'Night'], ['Lime', 'Cobalt'], ['Aqua', 'Wine'], ['Vermilion', 'Oxblood'],
  ],
};
