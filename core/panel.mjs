/**
 * brains-a11y — canonical vanilla panel.
 *
 * Renders the identical DOM structure and .a11y-panel__* class names as the
 * React <A11yPanel>, so every non-React surface gets the same panel.
 * Zero dependencies; vanilla ES modules only.
 *
 * API:
 *   mountPanel(target, opts)   → { destroy() }
 *   mountTrigger(target, opts) → { setExpanded(bool), destroy() }
 *   mount(target, opts)        → { destroy() }   (trigger + popover combined)
 */

import { LABELS, DEFAULTS, read, update, subscribe, resolveAxes } from './index.mjs';
import { nextIndex, HANDLED_KEYS } from './keyboard.mjs';
import { iconSvg, AXIS_ICONS } from './icons.mjs';

/**
 * Resolve a target argument to an Element, or throw.
 * @param {string|Element} target
 * @param {string} caller name for the error message
 * @returns {Element}
 */
function resolveTarget(target, caller) {
  const el = typeof target === 'string'
    ? document.querySelector(target)
    : target;
  if (!el) throw new Error(`brains-a11y ${caller}: target not found — ${String(target)}`);
  return el;
}

/**
 * Mount the canonical accessibility panel into `target`.
 *
 * Renders the exact same DOM and `.a11y-panel__*` class names as the React
 * `<A11yPanel>`. Styling comes from the existing `tokens/panel.css` only.
 *
 * @param {string|Element} target  CSS selector or Element to render into
 * @param {object}   [opts]
 * @param {string[]} [opts.axes]         subset of axes to show, in order
 * @param {string}   [opts.title]        panel heading text (default 'Viewing preferences')
 * @param {number}   [opts.headingLevel] 1–6, default 2; fit the host page's heading outline
 * @returns {{ destroy(): void }}
 */
export function mountPanel(target, opts) {
  const el = resolveTarget(target, 'mountPanel');
  const options = opts || {};
  const title = options.title !== undefined ? options.title : 'Viewing preferences';
  const level = Math.min(Math.max(Math.round(options.headingLevel || 2), 1), 6);

  const allAxes = resolveAxes();
  const shown = options.axes && options.axes.length
    ? options.axes.filter(function (a) { return a in allAxes; })
    : Object.keys(allAxes);

  /* ── Build DOM ─────────────────────────────────────────────────────────── */

  const panel = document.createElement('div');
  panel.className = 'a11y-panel';

  // Head: title + note
  const head = document.createElement('div');
  head.className = 'a11y-panel__head';

  const heading = document.createElement('h' + level);
  heading.className = 'a11y-panel__title';
  heading.textContent = title;
  head.appendChild(heading);

  const note = document.createElement('p');
  note.className = 'a11y-panel__note';
  note.textContent = 'Saved to this device only. Nothing is sent anywhere and nothing is tracked.';
  head.appendChild(note);

  panel.appendChild(head);

  // Per-axis fieldsets
  const groupEls = [];
  for (let fi = 0; fi < shown.length; fi++) {
    const axis = shown[fi];
    const axisOptions = allAxes[axis];
    if (!axisOptions) continue;

    const fieldset = document.createElement('fieldset');
    fieldset.className = 'a11y-panel__axis';

    const legend = document.createElement('legend');
    legend.className = 'a11y-panel__legend';
    const iconName = AXIS_ICONS[axis];
    // Inline SVG icon — inherits currentColor, matches React's <Icon size={14} />
    if (iconName) legend.insertAdjacentHTML('beforeend', iconSvg(iconName, { size: 14 }));
    legend.appendChild(document.createTextNode(LABELS[axis]._));
    fieldset.appendChild(legend);

    const group = document.createElement('div');
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-label', LABELS[axis]._);
    group.className = 'a11y-panel__options';

    for (let oi = 0; oi < axisOptions.length; oi++) {
      const option = axisOptions[oi];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('role', 'radio');
      btn.className = 'a11y-panel__option';
      /* "Standard" appears on four different axes. Each radio states its axis
       * so the label stays unique and descriptive on its own (matches React). */
      btn.setAttribute('aria-label', LABELS[axis]._ + ': ' + LABELS[axis][option]);
      btn.textContent = LABELS[axis][option];
      group.appendChild(btn);
    }

    fieldset.appendChild(group);
    panel.appendChild(fieldset);
    groupEls.push(group);
  }

  // Reset button
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'a11y-panel__reset';
  resetBtn.insertAdjacentHTML('beforeend', iconSvg('reset', { size: 14 }));
  resetBtn.appendChild(document.createTextNode('Reset to defaults'));
  panel.appendChild(resetBtn);

  el.appendChild(panel);

  /* ── State + paint ─────────────────────────────────────────────────────── */

  let prefs = read();

  /** Sync aria-checked, tabIndex and data-active to current prefs. */
  function paint() {
    for (let fi = 0; fi < shown.length; fi++) {
      const axis = shown[fi];
      const axisOptions = allAxes[axis];
      if (!axisOptions) continue;
      const group = groupEls[fi];
      if (!group) continue;
      const btns = group.querySelectorAll('.a11y-panel__option');
      const activeIdx = axisOptions.indexOf(prefs[axis]);
      for (let i = 0; i < btns.length; i++) {
        const active = i === activeIdx;
        btns[i].setAttribute('aria-checked', String(active));
        /* Roving tabindex: the selected option is the group's single tab stop. */
        btns[i].tabIndex = active ? 0 : -1;
        if (active) btns[i].setAttribute('data-active', '');
        else btns[i].removeAttribute('data-active');
      }
    }
  }

  /* ── Event wiring ──────────────────────────────────────────────────────── */

  for (let fi = 0; fi < shown.length; fi++) {
    // IIFE-safe closure: capture axis + axisOptions per iteration
    (function (axis, axisOptions, group) {
      /* Arrow keys + Home/End: selection follows focus (radiogroup contract). */
      group.addEventListener('keydown', function (event) {
        if (HANDLED_KEYS.indexOf(event.key) === -1) return;
        const to = nextIndex(event.key, axisOptions.indexOf(prefs[axis]), axisOptions.length);
        if (to < 0) return;
        event.preventDefault();
        prefs = update(prefs, { [axis]: axisOptions[to] });
        paint();
        group.querySelectorAll('.a11y-panel__option')[to].focus();
      });

      const btns = group.querySelectorAll('.a11y-panel__option');
      for (let oi = 0; oi < btns.length; oi++) {
        (function (btn, option) {
          btn.addEventListener('click', function () {
            prefs = update(prefs, { [axis]: option });
            paint();
          });
        })(btns[oi], axisOptions[oi]);
      }
    })(shown[fi], allAxes[shown[fi]], groupEls[fi]);
  }

  resetBtn.addEventListener('click', function () {
    prefs = update(prefs, DEFAULTS);
    paint();
  });

  /* Subscribe to cross-tab and other-panel changes. */
  const unsubscribe = subscribe(function (next) { prefs = next; paint(); });

  /* Initial paint to sync with stored prefs. */
  paint();

  /* ── Handle ────────────────────────────────────────────────────────────── */
  return {
    destroy: function () {
      unsubscribe();
      if (el.contains(panel)) el.removeChild(panel);
    },
  };
}

/**
 * Mount a trigger button that opens/closes an accessibility panel.
 *
 * Matches the React `<A11yTrigger>` markup and `tokens/trigger.css` classes.
 *
 * @param {string|Element} target  CSS selector or Element to render into
 * @param {object}  [opts]
 * @param {string}  [opts.variant]    'icon' | 'label' | 'pill' | 'fab'  default 'label'
 * @param {string}  [opts.placement]  'inline' | 'fixed-top-right' | 'fixed-top-left'
 *                                    | 'fixed-bottom-right' | 'fixed-bottom-left'
 * @param {string}  [opts.icon]       icon name                           default 'neurodiversity'
 * @param {string}  [opts.label]      visible text and accessible name    default 'Display & reading'
 * @param {string}  [opts.controls]   id of the element aria-controls points to
 * @returns {{ setExpanded(v: boolean): void, destroy(): void }}
 */
export function mountTrigger(target, opts) {
  const el = resolveTarget(target, 'mountTrigger');
  const options = opts || {};
  const variant = options.variant || 'label';
  const placement = options.placement || 'inline';
  const icon = options.icon || 'neurodiversity';
  const label = options.label !== undefined ? options.label : 'Display & reading';
  const controls = options.controls;

  /* label and pill both show visible text (mirrors React A11yTrigger logic). */
  const showLabel = variant === 'label' || variant === 'pill';
  const iconSize = variant === 'fab' ? 24 : 20;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'a11y-trigger';
  btn.setAttribute('data-variant', variant);
  if (placement !== 'inline') btn.setAttribute('data-placement', placement);
  btn.setAttribute('aria-haspopup', 'dialog');
  /* Icon-only variants need an explicit accessible label; label variants
   * have visible text that already names the button. */
  if (!showLabel) btn.setAttribute('aria-label', label);
  if (controls) btn.setAttribute('aria-controls', controls);

  btn.insertAdjacentHTML('beforeend', iconSvg(icon, { size: iconSize }));

  if (showLabel) {
    const span = document.createElement('span');
    span.textContent = label;
    btn.appendChild(span);
  }

  el.appendChild(btn);

  function setExpanded(expanded) {
    btn.setAttribute('aria-expanded', String(expanded));
  }

  return {
    setExpanded: setExpanded,
    destroy: function () {
      if (el.contains(btn)) el.removeChild(btn);
    },
  };
}

/**
 * Convenience: mount a trigger + a popover panel together, with open/close,
 * Escape, and click-outside wired up automatically.
 *
 * @param {string|Element} triggerTarget  where to mount the trigger button
 * @param {object}  [opts]
 * @param {string|Element} [opts.panelTarget]  where to mount the panel (default: after trigger)
 * @param {string}  [opts.variant]   passed to mountTrigger
 * @param {string}  [opts.placement] passed to mountTrigger
 * @param {string}  [opts.icon]      passed to mountTrigger
 * @param {string}  [opts.label]     passed to mountTrigger
 * @param {string[]} [opts.axes]     passed to mountPanel
 * @param {string}  [opts.title]     passed to mountPanel
 * @param {number}  [opts.headingLevel] passed to mountPanel
 * @returns {{ destroy(): void }}
 */
export function mount(triggerTarget, opts) {
  const triggerEl = resolveTarget(triggerTarget, 'mount');
  const options = opts || {};

  /* The popover wraps the panel and gets the CSS .a11y-popover + [hidden]. */
  const popoverId = 'brains-a11y-popover-' + Math.random().toString(36).slice(2, 8);
  const popover = document.createElement('div');
  popover.className = 'a11y-popover';
  popover.id = popoverId;
  popover.hidden = true;

  /* If a panelTarget is given, render the panel there; otherwise use the
   * popover as the panel container (appended after the trigger's parent). */
  const panelTarget = options.panelTarget
    ? resolveTarget(options.panelTarget, 'mount panelTarget')
    : popover;

  const trigger = mountTrigger(triggerEl, {
    variant: options.variant,
    placement: options.placement,
    icon: options.icon,
    label: options.label,
    controls: popoverId,
  });
  trigger.setExpanded(false);

  /* Insert the popover after the trigger container in the DOM. */
  if (!options.panelTarget) {
    if (triggerEl.parentNode) {
      triggerEl.parentNode.insertBefore(popover, triggerEl.nextSibling);
    } else {
      triggerEl.appendChild(popover);
    }
  }

  const panelHandle = mountPanel(panelTarget, {
    axes: options.axes,
    title: options.title,
    headingLevel: options.headingLevel,
  });

  let open = false;

  function setOpen(next) {
    open = next;
    popover.hidden = !open;
    trigger.setExpanded(open);
  }

  /* The trigger button is the first (and only) child of triggerEl after mount. */
  const triggerBtn = triggerEl.querySelector('.a11y-trigger');
  if (triggerBtn) {
    triggerBtn.addEventListener('click', function () { setOpen(!open); });
  }

  function onKeyDown(event) {
    if (event.key === 'Escape' && open) {
      setOpen(false);
      if (triggerBtn) triggerBtn.focus();
    }
  }

  function onClickOutside(event) {
    if (!open) return;
    if (triggerEl.contains(event.target)) return;
    if (popover.contains(event.target)) return;
    if (options.panelTarget && panelTarget.contains(event.target)) return;
    setOpen(false);
  }

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('click', onClickOutside, true);

  return {
    destroy: function () {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onClickOutside, true);
      panelHandle.destroy();
      trigger.destroy();
      if (popover.parentNode) popover.parentNode.removeChild(popover);
    },
  };
}
