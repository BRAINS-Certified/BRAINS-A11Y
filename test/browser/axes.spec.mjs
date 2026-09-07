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
  // Probe label/dt specifically: these regressed once (the selector lists
  // omitted them), so form-heavy surfaces saw both axes do nothing. Guarding
  // the exact elements that broke keeps the fix from silently reverting.
  textSpacing: { sel: 'label',            prop: 'letterSpacing' },
  measure:     { sel: 'dt',               prop: 'maxWidth' },
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

/* The canonical panel renders options as `.a11y-panel__option` identified by
 * aria-label + position — no data-axis/data-value. Select positionally:
 * fieldsets render in axis order and options in value order, both driven by the
 * same resolveAxes() this test iterates, so index maps cleanly to (axis,value). */
const axisNames = Object.keys(axes);
const optionLoc = (brand, axis, value) =>
  page.locator(`#panelwrap-${brand} .a11y-panel__axis`).nth(axisNames.indexOf(axis))
      .locator('.a11y-panel__option').nth(axes[axis].indexOf(value));

for (const brand of ['shard', 'brains']) {
  for (const [axis, values] of Object.entries(axes)) {
    const probe = PROBES[axis];
    const seen = new Map();

    // Paper tint only applies on a light ground, by design.
    if (NEEDS_LIGHT_THEME.has(axis)) {
      await optionLoc(brand, 'theme', 'bone').click();
      await page.waitForTimeout(60);
    }

    for (const value of values) {
      await optionLoc(brand, axis, value).click();
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
      const checked = await optionLoc(brand, axis, value).getAttribute('aria-checked');

      seen.set(value, { observed, attr, checked });
    }

    const distinct = new Set([...seen.values()].map((v) => v.observed));
    const ok = distinct.size === values.length
      && [...seen.entries()].every(([v, r]) => r.attr === v)
      && [...seen.values()].every((r) => r.checked === 'true');

    if (NEEDS_LIGHT_THEME.has(axis)) {
      await optionLoc(brand, 'theme', 'midnight').click();
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
 *    Checked at the largest text size, from a clean baseline — the SC is a
 *    text-scaling criterion, not an every-axis-stacked one. The loop above
 *    leaves every axis at its last value (xxl AND wide letter-spacing AND …),
 *    which is beyond what 1.4.10 requires and can nudge the panel a few px over.
 *    Reset the scopes to defaults, then set only the largest text size. ── */
// Truly clean context: the loop persisted prefs to localStorage, which the
// panels re-hydrate from. Clear it and reload so the only non-default axis is
// the text size we're testing.
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(400);
await page.setViewportSize({ width: 320, height: 640 });
await page.evaluate(() => {
  ['scope-shard', 'scope-brains'].forEach((id) =>
    document.getElementById(id).setAttribute('data-text-size', 'xxl'));
});
await page.waitForTimeout(150);
const overflow = await page.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth);
const reflowOk = overflow <= 1;
console.log(`\n  Reflow at 320px \u00d7 200% text: ${reflowOk ? 'PASS' : 'FAIL'} (overflow ${overflow}px)`);
if (!reflowOk) failures.push(`reflow: ${overflow}px horizontal overflow`);

/* ── Keyboard: role="radiogroup" promises arrow keys and one tab stop. ── */
await page.setViewportSize({ width: 1280, height: 900 });
await optionLoc('shard', 'accent', 'gold').click();
await page.waitForTimeout(80);
const accentGroup = page.locator('#panelwrap-shard .a11y-panel__axis').nth(axisNames.indexOf('accent'));
const tabStops = await accentGroup.locator('.a11y-panel__option')
  .evaluateAll((els) => els.filter((e) => e.tabIndex === 0).length);
await optionLoc('shard', 'accent', 'gold').focus();
// Arrow-key selection-follows-focus writes through update() to <html>, not to
// the scope (the fixture only mirrors to the scope on click). Read where the
// value actually lands.
const readAccent = () => page.evaluate(() => document.documentElement.getAttribute('data-accent'));
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(80);
const afterArrow = await readAccent();
await page.keyboard.press('End');
await page.waitForTimeout(80);
const afterEnd = await readAccent();

const kbOk = tabStops === 1 && afterArrow === 'teal' && afterEnd === 'blue';
console.log(`  Radiogroup keyboard:            ${kbOk ? 'PASS' : 'FAIL'}` +
  ` (tab stops ${tabStops}, ArrowRight -> ${afterArrow}, End -> ${afterEnd})`);
if (!kbOk) failures.push('radiogroup keyboard contract');

console.log(`\n  ${failures.length === 0 ? 'ALL CHECKS PASS' : failures.length + ' FAILING'}`);

await browser.close();
process.exit(failures.length === 0 && errors.length === 0 ? 0 : 1);
