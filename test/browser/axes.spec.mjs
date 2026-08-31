/**
 * Every axis, every value, both brands — clicked in a real browser, asserting
 * an observable computed-style change.
 *
 * This exists because three axes once shipped doing nothing at all. Density's
 * spacing tokens pre-resolved at :root; contrast and reading-font wrote tokens
 * the brand files also owned and lost on source order. Every attribute was set
 * correctly and every aria-checked was right — the DOM looked perfect and the
 * page did not move. Asserting on attributes would have passed all three.
 *
 *   node test/browser/build-fixture.mjs && node test/browser/axes.spec.mjs
 *
 * Needs Playwright with Chromium. Not wired into the default CI job, which is
 * dependency-free by design; run it before any release that touches CSS.
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE = pathToFileURL(resolve(here, 'fixture.html')).href;

/**
 * Playwright is not a dependency of this package — the default test run is
 * deliberately dependency-free. Resolve it from wherever it already exists:
 * a local devDependency, or PLAYWRIGHT_PATH pointing at another checkout.
 */
const { chromium } = await import(
  process.env.PLAYWRIGHT_PATH
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PATH, 'index.mjs')).href
    : 'playwright'
).catch(() => {
  console.error(
    '  Playwright not found. Install it (npm i -D playwright && npx playwright install chromium)\n' +
    '  or set PLAYWRIGHT_PATH to an existing playwright package directory.');
  process.exit(2);
});

/** How to observe each axis. The property must be one the axis actually moves. */
const PROBES = {
  theme:       { sel: null,               prop: 'backgroundColor' },
  density:     { sel: '.card',            prop: 'padding' },
  motion:      { sel: '.cta',             prop: 'transitionDuration' },
  contrast:    { sel: 'p.muted',          prop: 'color' },
  textSize:    { sel: null,               prop: 'fontSize' },
  lineSpacing: { sel: null,               prop: 'lineHeight' },
  // BRAINS already uses Atkinson for body by design, so the body face does not
  // move there. The display face moves on both brands.
  readingFont: { sel: 'h3',               prop: 'fontFamily' },
  accent:      { sel: '.stat',            prop: 'color' },
};

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(FIXTURE);
await page.waitForTimeout(400);

const axes = await page.evaluate(() =>
  Object.fromEntries(Object.entries(window.BrainsA11y.AXES).map(([k, v]) => [k, [...v]])));

let pass = 0;
const failures = [];

for (const brand of ['shard', 'brains']) {
  for (const [axis, values] of Object.entries(axes)) {
    const probe = PROBES[axis];
    const seen = new Map();

    for (const value of values) {
      await page.click(`#panelwrap-${brand} [data-axis="${axis}"][data-value="${value}"]`);
      await page.waitForTimeout(60);

      const observed = await page.evaluate(([id, sel, prop]) => {
        const scope = document.getElementById(id);
        return getComputedStyle(sel ? scope.querySelector(sel) : scope)[prop];
      }, [`scope-${brand}`, probe.sel, probe.prop]);

      const attr = await page.getAttribute(
        `#scope-${brand}`,
        `data-${axis.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}`);
      const checked = await page.getAttribute(
        `#panelwrap-${brand} [data-axis="${axis}"][data-value="${value}"]`, 'aria-checked');

      seen.set(value, { observed, attr, checked });
    }

    const distinct = new Set([...seen.values()].map((v) => v.observed));
    const ok = distinct.size === values.length
      && [...seen.entries()].every(([v, r]) => r.attr === v)
      && [...seen.values()].every((r) => r.checked === 'true');

    if (ok) { pass++; console.log(`  PASS  ${brand.padEnd(7)} ${axis}`); }
    else {
      failures.push(`${brand}/${axis}: ${[...seen.entries()]
        .map(([v, r]) => `${v}=${r.observed}`).join('  ')}`);
      console.log(`  FAIL  ${brand.padEnd(7)} ${axis}`);
    }
  }
}

console.log(`\n  ${pass} axes pass, ${failures.length} fail.`);
for (const f of failures) console.log('    ' + f);
if (errors.length) {
  console.log('\n  Page errors:');
  for (const e of [...new Set(errors)]) console.log('    ' + e);
}

await browser.close();
process.exit(failures.length === 0 && errors.length === 0 ? 0 : 1);
