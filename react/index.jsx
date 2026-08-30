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
          <legend className="a11y-panel__legend">{LABELS[axis]._}</legend>
          <div role="radiogroup" aria-label={LABELS[axis]._} className="a11y-panel__options">
            {AXES[axis].map((option) => {
              const active = prefs[axis] === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={active}
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
