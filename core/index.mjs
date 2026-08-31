/**
 * brains-a11y core — framework-agnostic viewing preferences.
 *
 * Zero dependencies, no build step. Works as an ES module in a browser, in a
 * bundler, or (via core/brains-a11y.iife.js) as a plain <script> tag on a
 * static page with no toolchain at all.
 *
 * The eight axes are the union of what shipped independently across the
 * estate: shard-audit had density/motion/contrast/accent, the Shard Books app
 * and site had theme/text-size/line-spacing/reading-font. Neither had more
 * than five. This is the full set, defined once.
 *
 * Design rules, all of them load-bearing:
 *   - Every default renders as the stock appearance, so a page with no stored
 *     preference, blocked storage, or failed JS looks correct.
 *   - Storage failures degrade silently. Preferences are cosmetic; a private
 *     window must not throw.
 *   - Unknown or corrupt values fall back per-axis, never wholesale.
 *   - Nothing here is persisted server-side and nothing is tracked.
 */

/** @typedef {'midnight'|'bone'} Theme */
/** @typedef {'comfortable'|'compact'} Density */
/** @typedef {'full'|'reduced'} Motion */
/** @typedef {'default'|'high'} Contrast */
/** @typedef {'s'|'m'|'l'|'xl'|'xxl'} TextSize */
/** @typedef {'tight'|'standard'|'roomy'} LineSpacing */
/** @typedef {'standard'|'hyperlegible'} ReadingFont */
/** @typedef {'gold'|'teal'|'blue'} Accent */

/**
 * @typedef {object} Preferences
 * @property {Theme} theme
 * @property {Density} density
 * @property {Motion} motion
 * @property {Contrast} contrast
 * @property {TextSize} textSize
 * @property {LineSpacing} lineSpacing
 * @property {ReadingFont} readingFont
 * @property {Accent} accent
 */

export const STORAGE_KEY = 'brains.a11y.v1';

/**
 * Legacy storage schemes, read once on first run so nobody loses a preference
 * they had already set. Two shapes exist: a JSON blob under one key, and
 * shard-books-site's separate `sb:*` string keys.
 */
export const LEGACY_SEPARATE_KEYS = {
  'sb:theme': 'theme',
  'sb:text-size': 'textSize',
  'sb:line-spacing': 'lineSpacing',
};

/** Storage keys from the pre-consolidation implementations, read once on migrate. */
export const LEGACY_KEYS = {
  /** shard-audit — density/motion/contrast/accent */
  'brains.prefs': (v) => ({
    density: v.density, motion: v.motion, contrast: v.contrast, accent: v.accent,
  }),
  /** shard-financial-tool and shard-books-site — theme/textSize/lineSpacing/dyslexia */
  'shard.viewing.v1': (v) => ({
    theme: v.theme,
    textSize: v.textSize,
    lineSpacing: v.lineSpacing,
    readingFont: v.dyslexia === true ? 'hyperlegible' : undefined,
  }),
};

/**
 * Stable axes. First entry is the default, and every default renders as the
 * stock appearance.
 */
export const AXES = /** @type {const} */ ({
  theme: ['midnight', 'bone'],
  accent: ['gold', 'teal', 'blue'],
  contrast: ['default', 'high', 'soft'],
  density: ['comfortable', 'compact'],
  textSize: ['m', 's', 'l', 'xl', 'xxl'],
  lineSpacing: ['standard', 'tight', 'roomy'],
  textSpacing: ['standard', 'wide'],
  measure: ['standard', 'narrow'],
  readingFont: ['standard', 'hyperlegible'],
  motion: ['full', 'reduced'],
  decoration: ['shown', 'hidden'],
});

/**
 * Axes still in beta. Off unless a viewer or an app opts in — see
 * {@link setExperimental}. They are here to be tried and reported on, not
 * relied upon: values may change or be withdrawn.
 */
export const EXPERIMENTAL_AXES = /** @type {const} */ ({
  readingGuide: ['off', 'ruler', 'focus'],
  tint: ['none', 'warm', 'cool'],
});

/**
 * Extra values on otherwise-stable axes, also behind the beta opt-in.
 *
 * `readingFont: 'dyslexic'` (OpenDyslexic) sits here deliberately. Readers ask
 * for it and it belongs in a beta channel so they can, but the published
 * evidence does not show a reliable reading gain over a good sans-serif — see
 * docs/EVIDENCE.md. Atkinson Hyperlegible is in the stable set because its
 * claim is narrower and better supported: letter-form differentiation for low
 * vision.
 */
export const EXPERIMENTAL_VALUES = /** @type {const} */ ({
  readingFont: ['dyslexic'],
});

export const EXPERIMENTAL_STORAGE_KEY = 'brains.a11y.experimental';

/**
 * Whether beta axes are active for this view. True when the app enabled them,
 * when a viewer set the flag in storage, or when the URL carries `?a11y-beta`.
 * @returns {boolean}
 */
export function isExperimentalEnabled() {
  if (experimentalOverride !== null) return experimentalOverride;
  if (typeof window === 'undefined') return false;
  try {
    if (new URLSearchParams(window.location.search).has('a11y-beta')) return true;
  } catch { /* no location, or an opaque origin */ }
  try {
    return window.localStorage.getItem(EXPERIMENTAL_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

let experimentalOverride = /** @type {boolean|null} */ (null);

/**
 * Turn the beta channel on or off for this view, and remember the choice.
 * Pass null to fall back to the viewer's own flag.
 * @param {boolean|null} on
 */
export function setExperimental(on) {
  experimentalOverride = on;
  if (typeof window === 'undefined' || on === null) return;
  try {
    if (on) window.localStorage.setItem(EXPERIMENTAL_STORAGE_KEY, '1');
    else window.localStorage.removeItem(EXPERIMENTAL_STORAGE_KEY);
  } catch { /* storage blocked — the override still holds for this view */ }
}

/**
 * The axes in force, given whether beta is on.
 * @param {boolean} [experimental]
 * @returns {Record<string, readonly string[]>}
 */
export function resolveAxes(experimental = isExperimentalEnabled()) {
  if (!experimental) return { ...AXES };
  const merged = /** @type {Record<string, readonly string[]>} */ ({ ...AXES });
  for (const [axis, extra] of Object.entries(EXPERIMENTAL_VALUES)) {
    merged[axis] = [...(merged[axis] ?? []), ...extra];
  }
  return { ...merged, ...EXPERIMENTAL_AXES };
}

/** The data-* attribute each axis writes to <html>. */
export const ATTRIBUTES = /** @type {const} */ ({
  theme: 'data-theme',
  accent: 'data-accent',
  contrast: 'data-contrast',
  density: 'data-density',
  textSize: 'data-text-size',
  lineSpacing: 'data-line-spacing',
  textSpacing: 'data-text-spacing',
  measure: 'data-measure',
  readingFont: 'data-reading-font',
  motion: 'data-motion',
  decoration: 'data-decoration',
  readingGuide: 'data-reading-guide',
  tint: 'data-tint',
});

/** Defaults for every axis, stable and beta alike. */
export const DEFAULTS = Object.freeze(
  /** @type {any} */ (
    Object.fromEntries(
      [...Object.entries(AXES), ...Object.entries(EXPERIMENTAL_AXES)]
        .map(([axis, values]) => [axis, values[0]]),
    )
  ),
);

/**
 * Coerce an unknown blob into a fully-populated Preferences object.
 * Each axis falls back independently, so one corrupt value cannot discard
 * the user's other choices.
 * @param {unknown} input
 * @returns {Preferences}
 */
export function normalise(input, experimental = isExperimentalEnabled()) {
  const source = input && typeof input === 'object' ? /** @type {any} */ (input) : {};
  const effective = resolveAxes(experimental);
  const out = /** @type {any} */ ({});
  // Every axis is always present, so a page never reads undefined. Beta axes
  // simply hold their default while the channel is off.
  for (const [axis, values] of Object.entries({ ...AXES, ...EXPERIMENTAL_AXES })) {
    // An axis that is gated off accepts only its default. Falling back to the
    // full value list here would have let a stored beta value through with the
    // channel closed.
    const allowed = effective[axis] ?? [values[0]];
    const value = source[axis];
    out[axis] = typeof value === 'string' && allowed.includes(value) ? value : values[0];
  }
  return out;
}

/**
 * Apply preferences to a document element. Idempotent.
 * @param {Preferences} prefs
 * @param {HTMLElement} [root]
 */
export function apply(prefs, root) {
  const el = root || (typeof document !== 'undefined' ? document.documentElement : null);
  if (!el) return;
  for (const [axis, attribute] of Object.entries(ATTRIBUTES)) {
    el.setAttribute(attribute, /** @type {any} */ (prefs)[axis]);
  }
}

/**
 * The theme to use when the person has never chosen one. Follows the operating
 * system rather than forcing a default, so a light-mode user is not shown a
 * dark page on first visit.
 * @returns {Theme}
 */
export function systemTheme() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return DEFAULTS.theme;
  }
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'bone' : 'midnight';
  } catch {
    return DEFAULTS.theme;
  }
}

/**
 * Read stored preferences, migrating from every legacy scheme on first run.
 * An unset theme follows the operating system.
 * @returns {Preferences}
 */
export function read() {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  const stored = parse(safeGet(STORAGE_KEY));
  if (stored) return normalise({ theme: systemTheme(), ...stored });

  // No canonical value yet — fold in anything the old implementations left.
  /** @type {Record<string, unknown>} */
  const migrated = { theme: systemTheme() };
  for (const [key, map] of Object.entries(LEGACY_KEYS)) {
    const legacy = parse(safeGet(key));
    if (!legacy) continue;
    for (const [axis, value] of Object.entries(map(legacy))) {
      if (value !== undefined) migrated[axis] = value;
    }
  }
  for (const [key, axis] of Object.entries(LEGACY_SEPARATE_KEYS)) {
    const value = safeGet(key);
    if (value) migrated[axis] = value;
  }
  if (safeGet('sb:dyslexia') === 'true') migrated.readingFont = 'hyperlegible';

  return normalise(migrated);
}

/**
 * Persist preferences. Silently does nothing if storage is unavailable —
 * the in-memory state and the applied attributes still work for the session.
 * @param {Preferences} prefs
 */
export function write(prefs) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* private mode, quota, or storage disabled — cosmetic setting, fail open */
  }
}

/**
 * Read, apply and return the current preferences. The normal entry point for
 * a page that is not using a framework wrapper.
 * @param {HTMLElement} [root]
 * @returns {Preferences}
 */
export function init(root) {
  const prefs = read();
  apply(prefs, root);
  return prefs;
}

/**
 * Merge a partial change, then apply, persist and notify.
 * @param {Preferences} current
 * @param {Partial<Preferences>} change
 * @param {HTMLElement} [root]
 * @returns {Preferences} the merged result
 */
export function update(current, change, root) {
  const next = normalise({ ...current, ...change });
  apply(next, root);
  write(next);
  if (typeof window !== 'undefined' && typeof CustomEvent === 'function') {
    window.dispatchEvent(new CustomEvent('brains-a11y:change', { detail: next }));
  }
  announce(change);
  return next;
}

/**
 * Speak the change through a polite live region. A sighted user sees the
 * page reflow; a screen-reader user gets nothing unless we say so.
 * @param {Partial<Preferences>} change
 */
export function announce(change) {
  if (typeof document === 'undefined') return;
  const entries = Object.entries(change).filter(([axis]) => axis in AXES);
  if (entries.length !== 1) return;
  const [axis, value] = entries[0];
  const labels = /** @type {any} */ (LABELS)[axis];
  if (!labels || !labels[value]) return;

  let region = document.getElementById('brains-a11y-live');
  if (!region) {
    region = document.createElement('div');
    region.id = 'brains-a11y-live';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.className = 'a11y-sr-only';
    document.body.appendChild(region);
  }
  region.textContent = '';
  region.textContent = `${labels._} set to ${labels[value]}`;
}

/**
 * Subscribe to preference changes, including changes made in another tab.
 * @param {(prefs: Preferences) => void} handler
 * @returns {() => void} unsubscribe
 */
export function subscribe(handler) {
  if (typeof window === 'undefined') return () => {};
  const onChange = (/** @type {any} */ event) => handler(event.detail);
  const onStorage = (/** @type {StorageEvent} */ event) => {
    if (event.key !== STORAGE_KEY) return;
    const next = normalise(parse(event.newValue));
    apply(next);
    handler(next);
  };
  window.addEventListener('brains-a11y:change', onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener('brains-a11y:change', onChange);
    window.removeEventListener('storage', onStorage);
  };
}

/** Human-readable labels for building a control panel. */
export const LABELS = Object.freeze({
  theme: { _: 'Theme', midnight: 'Midnight', bone: 'Bone' },
  density: { _: 'Density', comfortable: 'Comfortable', compact: 'Compact' },
  motion: { _: 'Motion', full: 'Full', reduced: 'Reduced' },
  accent: { _: 'Accent', gold: 'Gold', teal: 'Teal', blue: 'Blue' },
  contrast: { _: 'Contrast', default: 'Default', high: 'High', soft: 'Soft' },
  textSize: {
    _: 'Text size',
    s: 'Small', m: 'Default', l: 'Large', xl: 'Larger', xxl: 'Largest',
  },
  textSpacing: { _: 'Letter spacing', standard: 'Standard', wide: 'Wide' },
  measure: { _: 'Line length', standard: 'Standard', narrow: 'Narrow' },
  decoration: { _: 'Decorative images', shown: 'Shown', hidden: 'Hidden' },
  readingGuide: { _: 'Reading guide', off: 'Off', ruler: 'Ruler', focus: 'Focus' },
  tint: { _: 'Paper tint', none: 'None', warm: 'Warm', cool: 'Cool' },
  lineSpacing: { _: 'Line spacing', tight: 'Tight', standard: 'Standard', roomy: 'Roomy' },
  readingFont: {
    _: 'Reading font',
    standard: 'Standard', hyperlegible: 'Hyperlegible', dyslexic: 'OpenDyslexic',
  },
});

/* ── internals ─────────────────────────────────────────────────────────── */

function safeGet(/** @type {string} */ key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parse(/** @type {string|null} */ raw) {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
}
