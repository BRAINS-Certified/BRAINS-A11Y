/**
 * brains-a11y — radiogroup keyboard behaviour.
 *
 * `role="radiogroup"` with `role="radio"` children is a promise: arrow keys
 * move between options, Home and End jump to the ends, and only one option is
 * in the tab order so Tab leaves the group rather than walking through every
 * value. The panels shipped without any of it — every option was tabbable and
 * the arrow keys did nothing, which is worse than plain buttons because a
 * screen reader announces a contract the page does not honour.
 *
 * The index arithmetic lives here so the React and Astro panels cannot drift
 * from each other, and so it can be tested without a DOM.
 */

/**
 * Where a key press should move focus within a radiogroup.
 *
 * @param {string} key       KeyboardEvent.key
 * @param {number} current   index of the currently focused option
 * @param {number} length    number of options
 * @param {boolean} [rtl]    true when the group reads right-to-left
 * @returns {number} the destination index, or -1 to leave the event alone
 */
export function nextIndex(key, current, length, rtl = false) {
  if (length < 1) return -1;
  const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
  const back = rtl ? 'ArrowRight' : 'ArrowLeft';

  switch (key) {
    case forward:
    case 'ArrowDown':
      return (current + 1) % length;
    case back:
    case 'ArrowUp':
      return (current - 1 + length) % length;
    case 'Home':
      return 0;
    case 'End':
      return length - 1;
    default:
      return -1;
  }
}

/** Keys this module consumes; a caller should preventDefault on these. */
export const HANDLED_KEYS = Object.freeze([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
]);

/**
 * Roving tabindex: the selected option is the group's single tab stop.
 * @param {ArrayLike<HTMLElement>} options
 * @param {number} selected
 */
export function applyRovingTabindex(options, selected) {
  for (let i = 0; i < options.length; i++) {
    options[i].tabIndex = i === selected ? 0 : -1;
  }
}
