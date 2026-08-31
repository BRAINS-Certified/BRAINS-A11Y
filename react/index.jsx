'use client';

/**
 * brains-a11y — React bindings.
 *
 * Consuming Next.js apps must transpile this package, since it ships JSX
 * source rather than a build artefact:
 *
 *   // next.config.js
 *   module.exports = { transpilePackages: ['@brains/a11y'] };
 *
 * Nothing here owns state that the core does not. The provider is a thin
 * subscription over the same document attributes and storage the vanilla
 * core writes, so a page can mix the React panel and a plain <script> control
 * without them fighting.
 */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import {
  AXES, DEFAULTS, LABELS, read, apply, update, subscribe,
} from '../core/index.mjs';
import { nextIndex, HANDLED_KEYS } from '../core/keyboard.mjs';
import { ICONS, ICON_ATTRS, AXIS_ICONS } from '../core/icons.mjs';

const PreferencesContext = createContext(null);

/**
 * Wrap the app once, as high as possible. Renders children immediately with
 * the server-safe defaults, then reconciles on mount — the inline no-flash
 * script is what prevents a visible change, not this component.
 */
export function A11yProvider({ children }) {
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = read();
    apply(loaded);
    setPrefs(loaded);
    setReady(true);
    return subscribe(setPrefs);
  }, []);

  const set = useCallback((change) => {
    setPrefs((current) => update(current, change));
  }, []);

  const reset = useCallback(() => {
    setPrefs((current) => update(current, DEFAULTS));
  }, []);

  const value = useMemo(() => ({ prefs, set, reset, ready }), [prefs, set, reset, ready]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

/** @returns {{prefs: object, set: (c: object) => void, reset: () => void, ready: boolean}} */
export function useA11y() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('useA11y must be used inside <A11yProvider>');
  }
  return context;
}

/**
 * The control panel. Renders every axis as a labelled radiogroup — arrow keys
 * move between options, which is what a radiogroup role promises and what
 * screen-reader users will expect.
 *
 * @param {object} props
 * @param {string[]} [props.axes] subset of axes to show, in order
 * @param {string}   [props.title]
 */
/**
 * One icon from the set, inline so it inherits colour from the text beside it.
 * @param {{name: string, size?: number}} props
 */
export function Icon({ name, size = 20 }) {
  const parts = ICONS[name];
  if (!parts) return null;
  return (
    <svg width={size} height={size} aria-hidden="true" {...ICON_ATTRS}>
      {parts.map((part, i) => (part.c === 'circle'
        ? <circle key={i} cx={part.cx} cy={part.cy} r={part.r} />
        : <path key={i} d={part.p} />))}
    </svg>
  );
}

/**
 * The control that opens the panel.
 *
 * Presets a site owner picks between, all tunable through the CSS custom
 * properties documented in tokens/trigger.css:
 *
 *   variant   'icon' | 'label' | 'pill' | 'fab'      default 'label'
 *   placement 'inline' | 'fixed-top-right' | 'fixed-top-left'
 *             | 'fixed-bottom-right' | 'fixed-bottom-left'   default 'inline'
 *   icon      any name from TRIGGER_ICONS               default 'neurodiversity'
 *   label     visible text and accessible name          default 'Display & reading'
 *
 * Three defaults are deliberate.
 *
 * 'label', because an icon alone is only obvious to people who already know the
 * convention — the wrong assumption for a control whose audience is people the
 * page has not served well so far.
 *
 * 'neurodiversity' rather than the universal access figure, because that figure
 * reads as physical or visual disability to most people, and most of these axes
 * are about reading, attention and sensory load. The infinity loop is the symbol
 * the neurodivergent community chose for itself.
 *
 * 'Display & reading' rather than 'Accessibility', because a large share of the
 * people these controls help do not think of themselves as disabled and will
 * not open a menu that says they are.
 */
export function A11yTrigger({
  variant = 'label',
  placement = 'inline',
  icon = 'neurodiversity',
  label = 'Display & reading',
  onClick,
  expanded,
  controls,
  children,
}) {
  const showLabel = variant === 'label' || variant === 'pill';
  return (
    <button
      type="button"
      className="a11y-trigger"
      data-variant={variant}
      data-placement={placement}
      aria-label={showLabel ? undefined : label}
      aria-expanded={expanded === undefined ? undefined : expanded}
      aria-controls={controls}
      aria-haspopup="dialog"
      onClick={onClick}
    >
      <Icon name={icon} size={variant === 'fab' ? 24 : 20} />
      {showLabel && <span>{children ?? label}</span>}
    </button>
  );
}

/**
 * A small mark a site can show to say which standard it follows. Optional, and
 * deliberately quiet — it states a fact, it does not claim conformance.
 */
export function A11yMark({ href = 'https://github.com/BRAINS-Certified/brains-a11y' }) {
  return (
    <a className="a11y-mark" href={href} rel="noopener">
      <Icon name="accessibility" size={16} />
      <span>Accessibility preferences by BRAINS</span>
    </a>
  );
}

export function A11yPanel({ axes, title = 'Viewing preferences' }) {
  const { prefs, set, reset } = useA11y();
  const shown = axes && axes.length ? axes : Object.keys(AXES);

  return (
    <div className="a11y-panel">
      <div className="a11y-panel__head">
        <h2 className="a11y-panel__title">{title}</h2>
        <p className="a11y-panel__note">
          Saved to this device only. Nothing is sent anywhere and nothing is tracked.
        </p>
      </div>

      {shown.map((axis) => (
        <fieldset key={axis} className="a11y-panel__axis">
          <legend className="a11y-panel__legend">
            <Icon name={AXIS_ICONS[axis]} size={14} />
            {LABELS[axis]._}
          </legend>
          <div
            role="radiogroup"
            aria-label={LABELS[axis]._}
            className="a11y-panel__options"
            onKeyDown={(event) => {
              if (!HANDLED_KEYS.includes(event.key)) return;
              const options = AXES[axis];
              const to = nextIndex(event.key, options.indexOf(prefs[axis]), options.length);
              if (to < 0) return;
              event.preventDefault();
              // Selection follows focus — the expected radiogroup behaviour.
              set({ [axis]: options[to] });
              event.currentTarget.children[to]?.focus();
            }}
          >
            {AXES[axis].map((option) => {
              const active = prefs[axis] === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  /* Roving tabindex: the group is one tab stop, not five. */
                  tabIndex={active ? 0 : -1}
                  className="a11y-panel__option"
                  data-active={active || undefined}
                  onClick={() => set({ [axis]: option })}
                >
                  {LABELS[axis][option]}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <button type="button" className="a11y-panel__reset" onClick={reset}>
        <Icon name="reset" size={14} />
        Reset to defaults
      </button>
    </div>
  );
}

/** Skip-to-content link. Render as the first focusable element on the page. */
export function SkipLink({ href = '#main', children = 'Skip to content' }) {
  return <a className="a11y-skip-link" href={href}>{children}</a>;
}

export { AXES, DEFAULTS, LABELS };
export { ICONS, AXIS_ICONS } from '../core/icons.mjs';
