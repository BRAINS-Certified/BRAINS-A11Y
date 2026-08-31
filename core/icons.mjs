/**
 * brains-a11y — the icon set.
 *
 * One geometric family: 24×24 box, 1.75 stroke, round caps and joins, drawn in
 * `currentColor` so an icon always matches the text beside it and follows the
 * accent and contrast axes without any extra wiring.
 *
 * Paths live here as data rather than as files so a component can render them
 * inline. Inline matters: an <img> cannot inherit currentColor, and a sprite
 * needs a fetch that a no-build static page may not want. `scripts/build-icons.mjs`
 * writes the same paths out to assets/icons/*.svg for anyone who wants files.
 */

/** Shared attributes for every icon. */
export const ICON_ATTRS = Object.freeze({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.75',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
});

/**
 * Icon geometry, keyed by name. Values are arrays of SVG element descriptors so
 * a renderer can build real nodes rather than injecting markup.
 * @type {Record<string, Array<{c?: string, p?: string, cx?: number, cy?: number, r?: number, x1?: number, y1?: number, x2?: number, y2?: number}>>}
 */
export const ICONS = Object.freeze({
  /* The trigger. The universal access figure, drawn in the same stroke family
     as everything else rather than borrowed as a filled glyph. */
  accessibility: [
    { c: 'circle', cx: 12, cy: 4.2, r: 1.9 },
    { p: 'M3.8 8.4c2.7.9 5.4 1.4 8.2 1.4s5.5-.5 8.2-1.4' },
    { p: 'M12 9.8v4.4' },
    { p: 'M12 14.2 9.2 21' },
    { p: 'M12 14.2 14.8 21' },
  ],

  theme:        [{ c: 'circle', cx: 12, cy: 12, r: 8.2 },
                 { p: 'M12 3.8v16.4' },
                 { p: 'M12 3.8a8.2 8.2 0 0 1 0 16.4z' }],
  accent:       [{ p: 'M12 3.2 6.4 9.6a7.6 7.6 0 1 0 11.2 0z' }],
  contrast:     [{ c: 'circle', cx: 12, cy: 12, r: 8.2 },
                 { p: 'M12 3.8v16.4' },
                 { p: 'M15.4 7.1h3.9M14.6 10.4h5.4M14.6 13.6h5.4M15.4 16.9h3.9' }],
  density:      [{ p: 'M4 5.5h16M4 9.2h16M4 14.8h16M4 18.5h16' }],
  textSize:     [{ p: 'M2.6 18 7.4 6.4 12.2 18' }, { p: 'M4.4 14.2h6' },
                 { p: 'M14.6 18 18 9.6 21.4 18' }, { p: 'M15.9 15.4h4.2' }],
  lineSpacing:  [{ p: 'M9 6.4h12M9 12h12M9 17.6h12' },
                 { p: 'M4.2 8.6 4.2 4.6l0 0' }, { p: 'M2.6 6.2 4.2 4.6 5.8 6.2' },
                 { p: 'M2.6 17.8 4.2 19.4 5.8 17.8' }, { p: 'M4.2 19.4v-4' }],
  textSpacing:  [{ p: 'M8 17.2 11 6.8l3 10.4' }, { p: 'M9 14h4' },
                 { p: 'M4 5.6v12.8' }, { p: 'M20 5.6v12.8' }],
  measure:      [{ p: 'M4 6.4h16M4 12h11M4 17.6h16' },
                 { p: 'M18.4 10 20.8 12l-2.4 2' }],
  readingFont:  [{ p: 'M3.4 17.6 7.6 6.4l4.2 11.2' }, { p: 'M4.9 13.9h5.4' },
                 { p: 'M20.6 17.6V11a2.6 2.6 0 0 0-5.2 0' },
                 { p: 'M20.6 14.2h-3a2.4 2.4 0 1 0 0 4.8c1.7 0 3-1.4 3-3.1' }],
  motion:       [{ c: 'circle', cx: 12, cy: 12, r: 2.4 },
                 { p: 'M7.4 7.4a6.5 6.5 0 0 0 0 9.2M16.6 16.6a6.5 6.5 0 0 0 0-9.2' },
                 { p: 'M4.4 4.4a10.7 10.7 0 0 0 0 15.2M19.6 19.6a10.7 10.7 0 0 0 0-15.2' }],
  decoration:   [{ p: 'M20.4 15.6V5.4a1.8 1.8 0 0 0-1.8-1.8H8.4' },
                 { p: 'M3.6 7.2v11.4a1.8 1.8 0 0 0 1.8 1.8h11.4' },
                 { p: 'M3.6 16.2 8 11.8l3.2 3.2' }, { p: 'M2.4 2.4 21.6 21.6' }],
  readingGuide: [{ p: 'M4 6.2h16M4 17.8h16' },
                 { p: 'M2.8 10.6h18.4v2.8H2.8z' }],
  tint:         [{ p: 'M12 3.4 7.1 9.3a6.4 6.4 0 1 0 9.8 0z' },
                 { p: 'M8.2 14.6a4.2 4.2 0 0 0 7.6 0' }],

  /* ── Identity ────────────────────────────────────────────────────────────
   * The universal access figure reads, to most people, as physical or visual
   * disability. That is a poor fit for a tool whose axes are mostly about
   * reading, attention and sensory load, so the trigger icon is a choice.
   *
   * `neurodiversity` is the infinity loop — the symbol the neurodivergent
   * community chose for itself, and in gold the one autistic self-advocates
   * adopted specifically to displace the puzzle piece. Puzzle-piece imagery is
   * banned in BRAINS copy for that reason and will never appear here. */
  neurodiversity: [
    { p: 'M8.5 8.3a3.7 3.7 0 1 0 0 7.4c2.5 0 3.3-2 3.5-3.7.2-1.7 1-3.7 3.5-3.7a3.7 3.7 0 1 1 0 7.4c-2.5 0-3.3-2-3.5-3.7-.2-1.7-1-3.7-3.5-3.7z' },
  ],

  /* Attention and focus — a viewfinder, not a target. Nobody is being aimed at. */
  focus: [
    { p: 'M4 8.6V5.7A1.7 1.7 0 0 1 5.7 4h2.9' },
    { p: 'M15.4 4h2.9A1.7 1.7 0 0 1 20 5.7v2.9' },
    { p: 'M20 15.4v2.9a1.7 1.7 0 0 1-1.7 1.7h-2.9' },
    { p: 'M8.6 20H5.7A1.7 1.7 0 0 1 4 18.3v-2.9' },
    { c: 'circle', cx: 12, cy: 12, r: 2.7 },
  ],

  /* Sensory load — intensity coming down, drawn as a falling meter rather than
   * an ear or a brain. Both of those name a body part; this names the setting. */
  sensory: [
    { p: 'M4 11.4v1.2' },
    { p: 'M8 8.2v7.6' },
    { p: 'M12 5.6v12.8' },
    { p: 'M16 9.4v5.2' },
    { p: 'M20 11.2v1.6' },
  ],

  /* ── Brand marks, for a trigger that should read as ours ────────────────── */

  /* BRAINS — the continuous C of human cognition beside the networked nodes of
   * machine intelligence, simplified to the icon grid. */
  brains: [
    { p: 'M14.8 5.4a7.4 7.4 0 1 0 0 13.2' },
    { c: 'circle', cx: 17.6, cy: 7.6, r: 1.5 },
    { c: 'circle', cx: 20.2, cy: 12, r: 1.5 },
    { c: 'circle', cx: 17.6, cy: 16.4, r: 1.5 },
    { p: 'M18.4 8.9 19.4 10.7M19.4 13.3 18.4 15.1' },
  ],

  /* Shard — the faceted diamond, on the 24-grid. */
  shard: [
    { p: 'M12 3 20 12 12 21 4 12z' },
    { p: 'M12 3v18' },
    { p: 'M4 12 12 9.2 20 12' },
  ],

  /* Panel furniture */
  reset:        [{ p: 'M3.6 12a8.4 8.4 0 1 0 2.6-6.1' }, { p: 'M3.4 4.2v4.6h4.6' }],
  close:        [{ p: 'M6.2 6.2 17.8 17.8M17.8 6.2 6.2 17.8' }],
  check:        [{ p: 'M4.8 12.6 9.6 17.4 19.2 6.6' }],
  chevron:      [{ p: 'M8.4 5.6 15.2 12l-6.8 6.4' }],
  beaker:       [{ p: 'M9.4 3.4v5.2L4.6 17.4a1.8 1.8 0 0 0 1.6 2.8h11.6a1.8 1.8 0 0 0 1.6-2.8L14.6 8.6V3.4' },
                 { p: 'M8.2 3.4h7.6' }, { p: 'M7.2 14.6h9.6' }],
});

/**
 * Icons offered for the trigger button. A site picks the one that tells its
 * visitors the truth about what the control does.
 */
export const TRIGGER_ICONS = Object.freeze([
  'accessibility', 'neurodiversity', 'focus', 'sensory', 'brains', 'shard',
]);

/** Every axis maps to an icon; the panel needs no lookup table of its own. */
export const AXIS_ICONS = Object.freeze({
  theme: 'theme', accent: 'accent', contrast: 'contrast', density: 'density',
  textSize: 'textSize', lineSpacing: 'lineSpacing', textSpacing: 'textSpacing',
  measure: 'measure', readingFont: 'readingFont', motion: 'motion',
  decoration: 'decoration', readingGuide: 'readingGuide', tint: 'tint',
});

/**
 * Serialise an icon to an SVG string, for renderers that want markup.
 * @param {string} name
 * @param {{size?: number, title?: string}} [options]
 * @returns {string} SVG markup, or '' for an unknown name
 */
export function iconSvg(name, options = {}) {
  const parts = ICONS[name];
  if (!parts) return '';
  const size = options.size ?? 20;
  const attrs = Object.entries(ICON_ATTRS).map(([k, v]) => `${k}="${v}"`).join(' ');
  const label = options.title
    ? `<title>${options.title}</title>`
    : ' aria-hidden="true"';
  const body = parts.map((part) => (part.c === 'circle'
    ? `<circle cx="${part.cx}" cy="${part.cy}" r="${part.r}"/>`
    : `<path d="${part.p}"/>`)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ${attrs}`
    + `${options.title ? ` role="img"` : label}>${options.title ? label : ''}${body}</svg>`;
}
