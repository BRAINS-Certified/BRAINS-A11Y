/**
 * Unit tests for core/panel.mjs — mountPanel, mountTrigger, mount.
 *
 * The three functions need a DOM, so we build a minimal fake that covers what
 * the module actually uses. No real browser, no jsdom dependency — just enough
 * to verify the structure, attributes and wiring are correct.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

/* ── Minimal fake DOM ─────────────────────────────────────────────────────── */

/**
 * Very small in-memory DOM. Covers createElement / appendChild /
 * setAttribute / textContent / querySelector / querySelectorAll and the
 * subset of event handling the panel uses.
 */

function makeElement(tag) {
  const el = {
    tag: tag.toLowerCase(),
    _attrs: {},
    _children: [],
    _listeners: {},
    _text: '',
    _html: '',
    className: '',
    id: '',
    type: '',
    hidden: false,
    tabIndex: 0,
    parentNode: null,
    get textContent() { return this._text; },
    set textContent(v) { this._text = String(v); },
    getAttribute(k) { return this._attrs[k] ?? null; },
    setAttribute(k, v) { this._attrs[k] = String(v); },
    removeAttribute(k) { delete this._attrs[k]; },
    hasAttribute(k) { return k in this._attrs; },
    insertAdjacentHTML(pos, html) {
      // Only 'beforeend' is used by the module.
      this._html += html;
    },
    appendChild(child) {
      child.parentNode = this;
      this._children.push(child);
      return child;
    },
    insertBefore(child, ref) {
      const idx = this._children.indexOf(ref);
      if (idx >= 0) this._children.splice(idx, 0, child);
      else this._children.push(child);
      child.parentNode = this;
      return child;
    },
    removeChild(child) {
      const idx = this._children.indexOf(child);
      if (idx >= 0) this._children.splice(idx, 1);
      child.parentNode = null;
      return child;
    },
    contains(child) {
      if (!child) return false;
      if (child === this) return true;
      return this._children.some((c) => c.contains(child));
    },
    get nextSibling() { return null; },
    addEventListener(ev, fn, capture) {
      const key = ev + (capture ? ':capture' : '');
      if (!this._listeners[key]) this._listeners[key] = [];
      this._listeners[key].push(fn);
    },
    removeEventListener(ev, fn, capture) {
      const key = ev + (capture ? ':capture' : '');
      this._listeners[key] = (this._listeners[key] || []).filter((f) => f !== fn);
    },
    dispatchEvent(type, detail) {
      (this._listeners[type] || []).forEach((fn) => fn({ type, detail, key: detail }));
    },
    // querySelector / querySelectorAll — simple class/role/type selectors only
    querySelectorAll(sel) { return deepQuery(this, sel); },
    querySelector(sel) { return deepQuery(this, sel)[0] || null; },
    focus() { this._focused = true; },
  };
  return el;
}

function matchSel(el, sel) {
  if (sel === '*') return true;
  // class selector  e.g. .a11y-panel__option
  if (sel.startsWith('.')) return (el.className || '').split(' ').includes(sel.slice(1));
  // attribute selector [role="radio"] or [data-foo]
  if (sel.startsWith('[')) {
    const inner = sel.slice(1, -1);
    const eqIdx = inner.indexOf('=');
    if (eqIdx < 0) return el.hasAttribute(inner);
    const k = inner.slice(0, eqIdx);
    const v = inner.slice(eqIdx + 1).replace(/^["']|["']$/g, '');
    return el.getAttribute(k) === v;
  }
  // tag selector
  return el.tag === sel.toLowerCase();
}

function deepQuery(root, sel) {
  const results = [];
  function walk(node) {
    if (node !== root && matchSel(node, sel)) results.push(node);
    node._children.forEach(walk);
  }
  walk(root);
  return results;
}

function makeFakeDocument(bodyEl) {
  return {
    _listeners: {},
    createElement: makeElement,
    createTextNode: (t) => {
      const n = makeElement('text');
      n.textContent = t;
      return n;
    },
    querySelector(sel) { return bodyEl.querySelector(sel); },
    getElementById(id) {
      return deepQuery(bodyEl, '*').find((n) => n.id === id) || null;
    },
    get body() { return bodyEl; },
    addEventListener(ev, fn, cap) {
      const key = ev + (cap ? ':capture' : '');
      if (!this._listeners[key]) this._listeners[key] = [];
      this._listeners[key].push(fn);
    },
    removeEventListener(ev, fn, cap) {
      const key = ev + (cap ? ':capture' : '');
      this._listeners[key] = (this._listeners[key] || []).filter((f) => f !== fn);
    },
    dispatchEvent(ev) {
      (this._listeners[ev.type + ':capture'] || []).forEach((fn) => fn(ev));
      (this._listeners[ev.type] || []).forEach((fn) => fn(ev));
    },
  };
}

/**
 * Inject a minimal fake browser environment for the duration of one test,
 * then restore globals.
 */
function withFakeDom(fn) {
  const bodyEl = makeElement('body');
  const fakeDocument = makeFakeDocument(bodyEl);

  const fakeWindow = {
    _listeners: {},
    localStorage: { _store: {}, getItem(k) { return this._store[k] ?? null; },
      setItem(k, v) { this._store[k] = v; }, removeItem(k) { delete this._store[k]; } },
    matchMedia: () => ({ matches: false }),
    location: { search: '' },
    CustomEvent: class CustomEvent {
      constructor(type, init) { this.type = type; this.detail = init?.detail; }
    },
    dispatchEvent(ev) {
      (this._listeners['brains-a11y:change'] || []).forEach((fn) => fn(ev));
    },
    addEventListener(ev, fn) {
      if (!this._listeners[ev]) this._listeners[ev] = [];
      this._listeners[ev].push(fn);
    },
    removeEventListener(ev, fn) {
      this._listeners[ev] = (this._listeners[ev] || []).filter((f) => f !== fn);
    },
  };

  const prev = {
    document: globalThis.document,
    window: globalThis.window,
    CustomEvent: globalThis.CustomEvent,
    localStorage: globalThis.localStorage,
  };

  globalThis.document = fakeDocument;
  globalThis.window = fakeWindow;
  globalThis.CustomEvent = fakeWindow.CustomEvent;
  globalThis.localStorage = fakeWindow.localStorage;

  try {
    return fn({ bodyEl, fakeDocument, fakeWindow });
  } finally {
    globalThis.document = prev.document;
    globalThis.window = prev.window;
    globalThis.CustomEvent = prev.CustomEvent;
    globalThis.localStorage = prev.localStorage;
  }
}

/* ── Tests ────────────────────────────────────────────────────────────────── */

test('core/panel.mjs exports mountPanel, mountTrigger and mount', async () => {
  const mod = await import('../core/panel.mjs');
  assert.equal(typeof mod.mountPanel, 'function', 'mountPanel is exported');
  assert.equal(typeof mod.mountTrigger, 'function', 'mountTrigger is exported');
  assert.equal(typeof mod.mount, 'function', 'mount is exported');
});

test('mountPanel throws when the target is not found', async () => {
  const { mountPanel } = await import('../core/panel.mjs');
  await withFakeDom(({ bodyEl }) => {
    assert.throws(
      () => mountPanel('#does-not-exist'),
      /target not found/,
    );
  });
});

test('mountPanel renders .a11y-panel with head, axes, and reset', async () => {
  const { mountPanel } = await import('../core/panel.mjs');
  await withFakeDom(({ bodyEl }) => {
    const container = makeElement('div');
    bodyEl.appendChild(container);

    const handle = mountPanel(container, { title: 'Test panel', headingLevel: 3 });

    // Outer panel element
    const panelEl = container.querySelector('.a11y-panel');
    assert.ok(panelEl, '.a11y-panel rendered');

    // Head section
    assert.ok(panelEl.querySelector('.a11y-panel__head'), '.a11y-panel__head present');
    const titleEl = panelEl.querySelector('.a11y-panel__title');
    assert.ok(titleEl, '.a11y-panel__title present');
    assert.equal(titleEl.tag, 'h3', 'headingLevel=3 → h3');
    assert.equal(titleEl.textContent, 'Test panel');

    const noteEl = panelEl.querySelector('.a11y-panel__note');
    assert.ok(noteEl, '.a11y-panel__note present');
    assert.ok(noteEl.textContent.includes('Saved to this device only'));

    // At least one fieldset axis
    const fieldsets = panelEl.querySelectorAll('.a11y-panel__axis');
    assert.ok(fieldsets.length > 0, 'at least one .a11y-panel__axis rendered');

    // Each axis has a legend and a radiogroup
    const legends = panelEl.querySelectorAll('.a11y-panel__legend');
    assert.equal(legends.length, fieldsets.length, 'one legend per axis');

    const radiogroups = panelEl.querySelectorAll('[role="radiogroup"]');
    assert.equal(radiogroups.length, fieldsets.length, 'one radiogroup per axis');

    // Each radiogroup has an aria-label
    radiogroups.forEach((rg) => {
      assert.ok(rg.getAttribute('aria-label'), 'radiogroup has aria-label');
    });

    // Reset button
    const resetEl = panelEl.querySelector('.a11y-panel__reset');
    assert.ok(resetEl, '.a11y-panel__reset present');

    handle.destroy();
    assert.ok(!container.querySelector('.a11y-panel'), 'destroy removes the panel');
  });
});

test('mountPanel renders option buttons with correct a11y attributes', async () => {
  const { mountPanel } = await import('../core/panel.mjs');
  await withFakeDom(({ bodyEl }) => {
    const container = makeElement('div');
    bodyEl.appendChild(container);

    // Show only the 'theme' axis so we can check a concrete axis
    const handle = mountPanel(container, { axes: ['theme'] });

    const options = container.querySelectorAll('.a11y-panel__option');
    assert.ok(options.length >= 2, 'at least two options for theme axis');

    // Every option must be role=radio with aria-checked
    options.forEach((btn) => {
      assert.equal(btn.getAttribute('role'), 'radio', 'role="radio"');
      assert.ok(btn.hasAttribute('aria-checked'), 'aria-checked present');
      assert.ok(btn.getAttribute('aria-label'), 'aria-label present');
      // aria-label must include the axis name + option name (not just "Standard")
      assert.ok(
        btn.getAttribute('aria-label').includes(':'),
        'aria-label is "Axis: Option" format',
      );
    });

    // Roving tabindex: exactly one option has tabIndex=0
    const tab0 = options.filter((b) => b.tabIndex === 0);
    const tabNeg = options.filter((b) => b.tabIndex === -1);
    assert.equal(tab0.length, 1, 'exactly one option has tabIndex=0');
    assert.equal(tabNeg.length, options.length - 1, 'rest have tabIndex=-1');

    // The option with tabIndex=0 must also have aria-checked=true and data-active
    const active = tab0[0];
    assert.equal(active.getAttribute('aria-checked'), 'true', 'active option: aria-checked=true');
    assert.ok(active.hasAttribute('data-active'), 'active option: data-active set');

    handle.destroy();
  });
});

test('mountPanel: option click updates aria-checked and data-active', async () => {
  const { mountPanel } = await import('../core/panel.mjs');
  await withFakeDom(({ bodyEl }) => {
    const container = makeElement('div');
    bodyEl.appendChild(container);

    const handle = mountPanel(container, { axes: ['theme'] });

    const options = container.querySelectorAll('.a11y-panel__option');
    // options[0] = midnight (default active), options[1] = bone
    const boneBtn = options[1];
    assert.equal(boneBtn.getAttribute('aria-checked'), 'false', 'bone starts unchecked');

    // Simulate click on 'bone'
    boneBtn._listeners['click']?.[0]?.();

    assert.equal(boneBtn.getAttribute('aria-checked'), 'true', 'bone is now checked');
    assert.ok(boneBtn.hasAttribute('data-active'), 'bone has data-active');
    assert.equal(options[0].getAttribute('aria-checked'), 'false', 'midnight is unchecked');
    assert.ok(!options[0].hasAttribute('data-active'), 'midnight data-active removed');
    assert.equal(boneBtn.tabIndex, 0, 'bone has tabIndex=0');
    assert.equal(options[0].tabIndex, -1, 'midnight has tabIndex=-1');

    handle.destroy();
  });
});

test('mountPanel headingLevel defaults to h2', async () => {
  const { mountPanel } = await import('../core/panel.mjs');
  await withFakeDom(({ bodyEl }) => {
    const container = makeElement('div');
    bodyEl.appendChild(container);
    const handle = mountPanel(container);
    const titleEl = container.querySelector('.a11y-panel__title');
    assert.equal(titleEl.tag, 'h2', 'default headingLevel=2');
    handle.destroy();
  });
});

test('mountPanel clamps headingLevel to 1–6', async () => {
  const { mountPanel } = await import('../core/panel.mjs');
  await withFakeDom(({ bodyEl }) => {
    const container = makeElement('div');
    bodyEl.appendChild(container);
    const h = mountPanel(container, { headingLevel: 99 });
    assert.equal(container.querySelector('.a11y-panel__title').tag, 'h6');
    h.destroy();
  });
  await withFakeDom(({ bodyEl }) => {
    const container = makeElement('div');
    bodyEl.appendChild(container);
    const h = mountPanel(container, { headingLevel: -3 });
    assert.equal(container.querySelector('.a11y-panel__title').tag, 'h1');
    h.destroy();
  });
});

test('mountTrigger renders .a11y-trigger with correct attributes', async () => {
  const { mountTrigger } = await import('../core/panel.mjs');
  await withFakeDom(({ bodyEl }) => {
    const container = makeElement('div');
    bodyEl.appendChild(container);

    const handle = mountTrigger(container, {
      variant: 'label',
      label: 'My label',
      controls: 'panel-id',
    });

    const btn = container.querySelector('.a11y-trigger');
    assert.ok(btn, '.a11y-trigger rendered');
    assert.equal(btn.getAttribute('data-variant'), 'label');
    assert.equal(btn.getAttribute('aria-haspopup'), 'dialog');
    assert.equal(btn.getAttribute('aria-controls'), 'panel-id');
    // label variant: no aria-label on button (text is visible)
    assert.ok(!btn.hasAttribute('aria-label'), 'label variant: no aria-label needed');

    handle.destroy();
    assert.ok(!container.querySelector('.a11y-trigger'), 'destroy removes trigger');
  });
});

test('mountTrigger icon-only variant sets aria-label', async () => {
  const { mountTrigger } = await import('../core/panel.mjs');
  await withFakeDom(({ bodyEl }) => {
    const container = makeElement('div');
    bodyEl.appendChild(container);
    const handle = mountTrigger(container, { variant: 'icon', label: 'Open preferences' });
    const btn = container.querySelector('.a11y-trigger');
    assert.equal(btn.getAttribute('aria-label'), 'Open preferences');
    handle.destroy();
  });
});

test('mountTrigger setExpanded updates aria-expanded', async () => {
  const { mountTrigger } = await import('../core/panel.mjs');
  await withFakeDom(({ bodyEl }) => {
    const container = makeElement('div');
    bodyEl.appendChild(container);
    const handle = mountTrigger(container);
    const btn = container.querySelector('.a11y-trigger');
    handle.setExpanded(true);
    assert.equal(btn.getAttribute('aria-expanded'), 'true');
    handle.setExpanded(false);
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
    handle.destroy();
  });
});

test('the IIFE bundle exposes mountPanel, mountTrigger and mount on BrainsA11y', async () => {
  const { readFileSync } = await import('node:fs');
  const bundle = readFileSync(new URL('../dist/brains-a11y.js', import.meta.url), 'utf8');
  const surface = bundle.split('global.BrainsA11y')[1] ?? '';
  for (const name of ['mountPanel', 'mountTrigger', 'mount']) {
    assert.ok(new RegExp(`\\b${name}\\b`).test(surface), `${name} is on BrainsA11y global`);
  }
});
