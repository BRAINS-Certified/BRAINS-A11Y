import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AXES, ATTRIBUTES, DEFAULTS, LABELS, normalise, apply, update,
} from '../core/index.mjs';
import { noFlashScript } from '../core/no-flash.mjs';

test('every axis default is the first allowed value', () => {
  for (const [axis, values] of Object.entries(AXES)) {
    assert.equal(DEFAULTS[axis], values[0], `${axis} default`);
  }
});

test('every axis has an attribute and a full label set', () => {
  for (const [axis, values] of Object.entries(AXES)) {
    assert.ok(ATTRIBUTES[axis], `${axis} attribute`);
    assert.ok(LABELS[axis]._, `${axis} legend`);
    for (const value of values) assert.ok(LABELS[axis][value], `${axis}/${value} label`);
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
  assert.equal(Object.keys(attrs).length, Object.keys(AXES).length);
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
