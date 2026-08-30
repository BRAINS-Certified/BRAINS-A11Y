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
