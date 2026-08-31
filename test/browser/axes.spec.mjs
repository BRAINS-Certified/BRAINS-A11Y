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
 *   npm run test:browser
 *
 * Kept out of the default `npm test` glob on purpose: Node's runner treats
 * every file under test/ as a spec, and this one needs a browser.
 *
 * Needs Playwright with Chromium. Not wired into the default CI job, which is
 * dependency-free by design; run it before any release that touches CSS.
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
/* Defaults to the built fixture; A11Y_FIXTURE points it at any page that
 * renders the panel, which is how the published preview gets verified too. */
const FIXTURE = process.env.A11Y_FIXTURE
  ? pathToFileURL(resolve(process.env.A11Y_FIXTURE)).href
  : pathToFileURL(resolve(here, 'fixture.html')).href;

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
  readingFont: { sel: 'h2',               prop: 'fontFamily' },
  accent:      { sel: '.stat',            prop: 'color' },
  textSpacing: { sel: 'p',                prop: 'letterSpacing' },
  measure:     { sel: 'p',                prop: 'maxWidth' },
  decoration:  { sel: '[data-decorative]', prop: 'display' },
  // Beta. The guide needs a composite reading: `ruler` shows a band and dims
  // nothing, `focus` dims sections and shows no band — one property cannot
  // tell all three apart.
  readingGuide: { composite: true },
  tint:         { sel: null,              prop: 'backgroundColor' },
};

/** Axes whose visible effect needs a specific theme to be observable. */
const NEEDS_LIGHT_THEME = new Set(['tint']);

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(FIXTURE);
await page.waitForTimeout(400);

const axes = await page.evaluate(() =>
  Object.fromEntries(Object.entries(window.BrainsA11y.resolveAxes(true)).map(([k, v]) => [k, [...v]])));

let pass = 0;
const failures = [];

for (const brand of ['shard', 'brains']) {
  for (const [axis, values] of Object.entries(axes)) {
    const probe = PROBES[axis];
    const seen = new Map();

    // Paper tint only applies on a light ground, by design.
    if (NEEDS_LIGHT_THEME.has(axis)) {
      await page.click(`#panelwrap-${brand} [data-axis="theme"][data-value="bone"]`);
      await page.waitForTimeout(60);
    }

    for (const value of values) {
      await page.click(`#panelwrap-${brand} [data-axis="${axis}"][data-value="${value}"]`);
      await page.waitForTimeout(60);

      const observed = probe.composite
        ? await page.evaluate((id) => {
            const scope = document.getElementById(id);
            const section = scope.querySelector('[data-a11y-section]');
            const ruler = scope.querySelector('.a11y-ruler');
            const band = ruler ? getComputedStyle(ruler).position : 'none';
            return `${getComputedStyle(section).opacity}/${band}`;
          }, `scope-${brand}`)
        : await page.evaluate(([id, sel, prop]) => {
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

    if (NEEDS_LIGHT_THEME.has(axis)) {
      await page.click(`#panelwrap-${brand} [data-axis="theme"][data-value="midnight"]`);
      await page.waitForTimeout(60);
    }

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

/* ── Reflow: SC 1.4.10 says no horizontal scrolling at a 320px viewport.
 *    Checked at the largest text size, which is where it actually bites. ── */
await page.setViewportSize({ width: 320, height: 640 });
await page.click('#panelwrap-shard [data-axis="textSize"][data-value="xxl"]');
await page.waitForTimeout(120);
const overflow = await page.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth);
const reflowOk = overflow <= 1;
console.log(`\n  Reflow at 320px \u00d7 200% text: ${reflowOk ? 'PASS' : 'FAIL'} (overflow ${overflow}px)`);
if (!reflowOk) failures.push(`reflow: ${overflow}px horizontal overflow`);

/* ── Keyboard: role="radiogroup" promises arrow keys and one tab stop. ── */
await page.setViewportSize({ width: 1280, height: 900 });
await page.click('#panelwrap-shard [data-axis="accent"][data-value="gold"]');
await page.waitForTimeout(80);
const tabStops = await page.$$eval(
  '#panelwrap-shard [data-axis="accent"]',
  (els) => els.filter((e) => e.tabIndex === 0).length);
await page.focus('#panelwrap-shard [data-axis="accent"][data-value="gold"]');
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(80);
const afterArrow = await page.getAttribute('#scope-shard', 'data-accent');
await page.keyboard.press('End');
await page.waitForTimeout(80);
const afterEnd = await page.getAttribute('#scope-shard', 'data-accent');

const kbOk = tabStops === 1 && afterArrow === 'teal' && afterEnd === 'blue';
console.log(`  Radiogroup keyboard:            ${kbOk ? 'PASS' : 'FAIL'}` +
  ` (tab stops ${tabStops}, ArrowRight -> ${afterArrow}, End -> ${afterEnd})`);
if (!kbOk) failures.push('radiogroup keyboard contract');

console.log(`\n  ${failures.length === 0 ? 'ALL CHECKS PASS' : failures.length + ' FAILING'}`);

await browser.close();
process.exit(failures.length === 0 && errors.length === 0 ? 0 : 1);
