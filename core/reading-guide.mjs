/**
 * brains-a11y — reading guide (beta).
 *
 * Two aids that need position tracking, so they cannot be CSS alone:
 *
 *   ruler — a translucent band across the line under the pointer or the
 *           keyboard caret, for readers who lose their place on the return
 *           sweep.
 *   focus — dims every section except the one being read. A surface marks its
 *           sections with `data-a11y-section`; nothing happens without that,
 *           because only the surface knows what a section is.
 *
 * Both respect reduced motion, follow the keyboard as well as the pointer, and
 * detach cleanly. Neither ever intercepts a click.
 */

const RULER_CLASS = 'a11y-ruler';

/**
 * Attach the guide.
 *
 * @param {object} [options]
 * @param {Document} [options.doc]
 * @param {HTMLElement} [options.root]  the element carrying data-reading-guide,
 *   default `<html>`. Pass a scoped container to run the guide inside it — the
 *   ruler is appended within that element, because the CSS matches it as a
 *   descendant of whatever holds the attribute.
 * @returns {() => void} detach
 */
export function attachReadingGuide(options = {}) {
  const doc = options.doc
    ?? (typeof document !== 'undefined' ? document : null);
  if (!doc) return () => {};

  const root = options.root ?? doc.documentElement;
  detach(root);

  const ruler = doc.createElement('div');
  ruler.className = RULER_CLASS;
  ruler.setAttribute('aria-hidden', 'true');
  // The ruler must sit inside the element that carries the attribute, or the
  // descendant selector never matches. At page scope that means <body>.
  (root === doc.documentElement ? doc.body : root).appendChild(ruler);

  const moveRuler = (y) => {
    const height = ruler.offsetHeight || 0;
    root.style.setProperty('--a11y-ruler-y', `${Math.round(y - height / 2)}px`);
  };

  const onPointer = (event) => {
    if (root.getAttribute('data-reading-guide') !== 'ruler') return;
    moveRuler(event.clientY);
  };

  const onFocusIn = (event) => {
    const target = /** @type {Element} */ (event.target);
    if (!target || typeof target.getBoundingClientRect !== 'function') return;
    const mode = root.getAttribute('data-reading-guide');
    if (mode === 'ruler') {
      const box = target.getBoundingClientRect();
      moveRuler(box.top + box.height / 2);
    }
    if (mode === 'focus') markCurrent(root, target.closest('[data-a11y-section]'));
  };

  const onPointerSection = (event) => {
    if (root.getAttribute('data-reading-guide') !== 'focus') return;
    const target = /** @type {Element} */ (event.target);
    if (!target || typeof target.closest !== 'function') return;
    markCurrent(root, target.closest('[data-a11y-section]'));
  };

  doc.addEventListener('pointermove', onPointer, { passive: true });
  doc.addEventListener('pointermove', onPointerSection, { passive: true });
  doc.addEventListener('focusin', onFocusIn);

  const teardown = () => {
    doc.removeEventListener('pointermove', onPointer);
    doc.removeEventListener('pointermove', onPointerSection);
    doc.removeEventListener('focusin', onFocusIn);
    ruler.remove();
    markCurrent(root, null);
    root.style.removeProperty('--a11y-ruler-y');
    delete root[STATE];
  };

  root[STATE] = teardown;
  return teardown;
}

/** Detach any guide previously attached to this root. */
export function detach(root = typeof document !== 'undefined' ? document.documentElement : null) {
  if (root && typeof root[STATE] === 'function') root[STATE]();
}

const STATE = '__brainsA11yGuide';

function markCurrent(root, section) {
  for (const el of root.querySelectorAll('[data-a11y-current]')) {
    el.removeAttribute('data-a11y-current');
  }
  if (section) section.setAttribute('data-a11y-current', '');
}
