/**
 * brains-a11y — axe-core audit of the package's own components.
 *
 * Self-assessment is not evidence. This runs the real engine over the panel
 * and the trigger, in both brands, and again at the settings most likely to
 * break something: largest text, compact density, high contrast, and again on
 * the light theme.
 *
 *   npm run test:axe
 *
 * Needs Playwright and @axe-core/playwright. Set PLAYWRIGHT_PATH and
 * AXE_PATH if they live in another checkout.
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE = process.env.A11Y_FIXTURE
  ? pathToFileURL(resolve(process.env.A11Y_FIXTURE)).href
  : pathToFileURL(resolve(here, 'fixture.html')).href;

const load = async (envVar, pkg, file) => import(
  process.env[envVar] ? pathToFileURL(resolve(process.env[envVar], file)).href : pkg
).catch(() => {
  console.error(`  ${pkg} not found. Install it, or set ${envVar} to a checkout that has it.`);
  process.exit(2);
});

const { chromium } = await load('PLAYWRIGHT_PATH', 'playwright', 'index.mjs');
const { default: AxeBuilder } = await load('AXE_PATH', '@axe-core/playwright', 'dist/index.mjs');

/** States worth auditing separately — each changes colour or layout. */
const STATES = [
  { name: 'default',        prefs: {} },
  { name: 'bone theme',     prefs: { theme: 'bone' } },
  { name: 'largest text',   prefs: { textSize: 'xxl' } },
  { name: 'compact',        prefs: { density: 'compact' } },
  { name: 'high contrast',  prefs: { contrast: 'high' } },
  { name: 'soft contrast',  prefs: { contrast: 'soft' } },
  { name: 'hyperlegible',   prefs: { readingFont: 'hyperlegible' } },
];

const browser = await chromium.launch();
// axe requires an explicit context — browser.newPage() short-circuits one and
// the injection it needs then has nowhere to land.
const context = await browser.newContext();
const page = await context.newPage();
await page.goto(FIXTURE);
await page.waitForTimeout(400);

let total = 0;
const found = [];

for (const state of STATES) {
  for (const [axis, value] of Object.entries(state.prefs)) {
    for (const brand of ['shard', 'brains']) {
      await page.click(`#panelwrap-${brand} [data-axis="${axis}"][data-value="${value}"]`);
    }
  }
  await page.waitForTimeout(120);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();

  total += results.passes.length;
  const serious = results.violations;
  console.log(`  ${serious.length === 0 ? 'PASS' : 'FAIL'}  ${state.name.padEnd(15)}`
    + ` ${results.passes.length} passes, ${serious.length} violations`);
  for (const v of serious) {
    found.push(`${state.name}: [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} node(s))`);
  }

  // reset for the next state
  for (const brand of ['shard', 'brains']) {
    await page.click(`#panelwrap-${brand} [data-a11y-reset], #panelwrap-${brand} .a11y-panel__reset`)
      .catch(() => {});
  }
  await page.goto(FIXTURE);
  await page.waitForTimeout(200);
}

console.log(`\n  ${found.length === 0 ? 'No axe violations.' : found.length + ' violation(s):'}`);
for (const f of found) console.log('    ' + f);

await browser.close();
process.exit(found.length === 0 ? 0 : 1);
