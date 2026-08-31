import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AXES, EXPERIMENTAL_AXES, EXPERIMENTAL_VALUES, ATTRIBUTES, DEFAULTS, LABELS,
  normalise, apply, update, resolveAxes,
} from '../core/index.mjs';
import { noFlashScript } from '../core/no-flash.mjs';

const ALL_AXES = { ...AXES, ...EXPERIMENTAL_AXES };

test('every axis default is the first allowed value', () => {
  for (const [axis, values] of Object.entries(ALL_AXES)) {
    assert.equal(DEFAULTS[axis], values[0], `${axis} default`);
  }
});

test('a beta axis default renders as stock, so beta-off is inert', () => {
  assert.equal(DEFAULTS.readingGuide, 'off');
  assert.equal(DEFAULTS.tint, 'none');
});

test('resolveAxes gates beta axes and beta values', () => {
  const off = resolveAxes(false);
  const on = resolveAxes(true);
  for (const axis of Object.keys(EXPERIMENTAL_AXES)) {
    assert.ok(!(axis in off), `${axis} hidden when beta is off`);
    assert.ok(axis in on, `${axis} present when beta is on`);
  }
  for (const [axis, extra] of Object.entries(EXPERIMENTAL_VALUES)) {
    for (const value of extra) {
      assert.ok(!off[axis].includes(value), `${axis}/${value} hidden when off`);
      assert.ok(on[axis].includes(value), `${axis}/${value} offered when on`);
    }
  }
});

test('a beta value is refused while beta is off, and kept when on', () => {
  assert.equal(normalise({ readingFont: 'dyslexic' }, false).readingFont, 'standard');
  assert.equal(normalise({ readingFont: 'dyslexic' }, true).readingFont, 'dyslexic');
  assert.equal(normalise({ tint: 'warm' }, false).tint, 'none');
  assert.equal(normalise({ tint: 'warm' }, true).tint, 'warm');
});

test('every axis has an attribute and a full label set', () => {
  for (const [axis, values] of Object.entries(ALL_AXES)) {
    assert.ok(ATTRIBUTES[axis], `${axis} attribute`);
    assert.ok(LABELS[axis]._, `${axis} legend`);
    for (const value of values) assert.ok(LABELS[axis][value], `${axis}/${value} label`);
  }
  for (const [axis, extra] of Object.entries(EXPERIMENTAL_VALUES)) {
    for (const value of extra) assert.ok(LABELS[axis][value], `${axis}/${value} label`);
  }
});

test('a corrupt axis falls back alone, without discarding the others', () => {
  const result = normalise({ theme: 'chartreuse', accent: 'teal', textSize: 'l' });
  assert.equal(result.theme, 'midnight');
  assert.equal(result.accent, 'teal');
  assert.equal(result.textSize, 'l');
});

test('normalise tolerates junk input', () => {
  for (const junk of [null, undefined, 42, 'nope', [], { theme: 7 }]) {
    assert.deepEqual(normalise(junk), DEFAULTS);
  }
});

test('apply writes one data attribute per axis', () => {
  const attrs = {};
  const fake = { setAttribute: (k, v) => { attrs[k] = v; } };
  apply(DEFAULTS, fake);
  // Beta axes are written too, at their inert defaults, so the DOM shape does
  // not change when a viewer turns the channel on.
  assert.equal(Object.keys(attrs).length, Object.keys(ALL_AXES).length);
  assert.equal(attrs['data-reading-font'], 'standard');
  assert.equal(attrs['data-text-size'], 'm');
});

test('update merges, normalises and returns the result', () => {
  const attrs = {};
  const fake = { setAttribute: (k, v) => { attrs[k] = v; } };
  const next = update(DEFAULTS, { density: 'compact', motion: 'bogus' }, fake);
  assert.equal(next.density, 'compact');
  assert.equal(next.motion, 'full');
  assert.equal(attrs['data-density'], 'compact');
});

test('the no-flash script parses and covers every axis', () => {
  const script = noFlashScript();
  new Function(script);
  for (const attribute of Object.values(ATTRIBUTES)) {
    assert.ok(script.includes(attribute), `script sets ${attribute}`);
  }
});

test('the no-flash script names both legacy storage keys', () => {
  const script = noFlashScript();
  assert.ok(script.includes('brains.prefs'));
  assert.ok(script.includes('shard.viewing.v1'));
});

test('every stable axis is anchored somewhere in the docs', async () => {
  const { readFileSync } = await import('node:fs');
  const spec = readFileSync(new URL('../docs/SPEC.md', import.meta.url), 'utf8');
  for (const attribute of Object.values(ATTRIBUTES)) {
    assert.ok(spec.includes(attribute), `SPEC.md documents ${attribute}`);
  }
});

test('the no-flash script covers all three legacy schemes and the OS theme', () => {
  const script = noFlashScript();
  for (const marker of ['brains.prefs', 'shard.viewing.v1', 'sb:theme', 'sb:dyslexia',
                        'prefers-color-scheme']) {
    assert.ok(script.includes(marker), `script handles ${marker}`);
  }
});

test('the IIFE build exports every public symbol the source declares', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../core/index.mjs', import.meta.url), 'utf8');
  const bundle = readFileSync(new URL('../dist/brains-a11y.js', import.meta.url), 'utf8');
  const declared = [...source.matchAll(/^export (?:const|function) (\w+)/gm)].map((m) => m[1]);
  assert.ok(declared.length >= 15, 'found the exports');
  for (const name of declared) {
    assert.ok(
      new RegExp(`\\b${name}\\b`).test(bundle.split('global.BrainsA11y')[1] ?? ''),
      `${name} is exposed on the global`,
    );
  }
});

test('radiogroup arrow keys wrap, and Home/End jump to the ends', async () => {
  const { nextIndex } = await import('../core/keyboard.mjs');
  assert.equal(nextIndex('ArrowRight', 0, 5), 1);
  assert.equal(nextIndex('ArrowRight', 4, 5), 0, 'wraps forward');
  assert.equal(nextIndex('ArrowLeft', 0, 5), 4, 'wraps backward');
  assert.equal(nextIndex('ArrowDown', 1, 5), 2);
  assert.equal(nextIndex('ArrowUp', 1, 5), 0);
  assert.equal(nextIndex('Home', 3, 5), 0);
  assert.equal(nextIndex('End', 1, 5), 4);
  assert.equal(nextIndex('Tab', 1, 5), -1, 'leaves other keys alone');
  assert.equal(nextIndex('ArrowRight', 0, 0), -1, 'tolerates an empty group');
});

test('right-to-left reverses the horizontal arrows only', async () => {
  const { nextIndex } = await import('../core/keyboard.mjs');
  assert.equal(nextIndex('ArrowLeft', 0, 3, true), 1);
  assert.equal(nextIndex('ArrowRight', 0, 3, true), 2);
  assert.equal(nextIndex('ArrowDown', 0, 3, true), 1, 'vertical is unchanged');
});

test('the IIFE bundle carries every dependency-free core module', async () => {
  const { readFileSync } = await import('node:fs');
  const bundle = readFileSync(new URL('../dist/brains-a11y.js', import.meta.url), 'utf8');
  const surface = bundle.split('global.BrainsA11y')[1] ?? '';
  // One name from each module. Omitting a module is otherwise silent until a
  // page throws at runtime, which is how keyboard.mjs and icons.mjs were both
  // missed in turn.
  for (const name of ['normalise', 'nextIndex', 'iconSvg', 'ICONS', 'AXIS_ICONS']) {
    assert.ok(new RegExp(`\\b${name}\\b`).test(surface), `${name} is on the global`);
  }
});

test('every axis belongs to exactly one panel group', async () => {
  const { GROUPS } = await import('../core/index.mjs');
  const grouped = GROUPS.flatMap((g) => g.axes);
  assert.equal(new Set(grouped).size, grouped.length, 'no axis is listed twice');
  for (const axis of Object.keys(DEFAULTS)) {
    assert.ok(grouped.includes(axis), `${axis} is in a group`);
  }
  for (const axis of grouped) {
    assert.ok(axis in DEFAULTS, `${axis} is a real axis`);
  }
});

test('every trigger icon and group icon exists in the set', async () => {
  const { TRIGGER_ICONS, ICONS, GROUPS, AXIS_ICONS } = await import('../core/icons.mjs')
    .then(async (icons) => ({ ...icons, GROUPS: (await import('../core/index.mjs')).GROUPS }));
  for (const name of TRIGGER_ICONS) assert.ok(ICONS[name], `trigger icon ${name}`);
  for (const group of GROUPS) assert.ok(ICONS[group.icon] || AXIS_ICONS[group.icon], `group icon ${group.icon}`);
});

test('shard.prefs casing maps onto the canonical vocabulary', async () => {
  const { LEGACY_KEYS } = await import('../core/index.mjs');
  const mapped = LEGACY_KEYS['shard.prefs']({
    theme: 'light', textSize: 'L', lineSpacing: 'Roomy', dyslexia: true,
  });
  assert.equal(mapped.theme, 'bone', "'light' is this site's name for Bone");
  assert.equal(mapped.textSize, 'l');
  assert.equal(mapped.lineSpacing, 'roomy');
  assert.equal(mapped.readingFont, 'hyperlegible');
  assert.deepEqual(normalise(mapped, false), {
    ...DEFAULTS, theme: 'bone', textSize: 'l', lineSpacing: 'roomy',
    readingFont: 'hyperlegible',
  });
});

test('the no-flash script covers all four legacy schemes', () => {
  const script = noFlashScript();
  for (const key of ['brains.prefs', 'shard.viewing.v1', 'sb:theme', 'shard.prefs']) {
    assert.ok(script.includes(key), `script reads ${key}`);
  }
});
