#!/usr/bin/env node
/**
 * Builds a minimal page that loads the real token files and the real bundle,
 * with one scoped surface per brand. Deliberately plain: it exists to be
 * asserted against, not looked at.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');

/** Scope a brand file to a class so both brands can coexist on one page. */
const scope = (css, sel) => css
  .replace(/:root\[data-theme='bone'\]\[data-accent='(\w+)'\]/g, `${sel}[data-theme='bone'][data-accent='$1']`)
  .replace(/:root\[data-accent='(\w+)'\]/g, `${sel}[data-accent='$1']`)
  .replace(/:root\[data-theme='(\w+)'\]/g, `${sel}[data-theme='$1']`)
  .replace(/^(\s*):root,$/gm, `$1${sel},`)
  .replace(/^(\s*):root\s*\{/gm, `$1${sel} {`)
  .replace(/^(\s*)body\s*\{/gm, `$1${sel} {`)
  .replace(/^(\s*)h1, h2, h3, h4 \{/gm, `$1${sel} h1, ${sel} h2, ${sel} h3, ${sel} h4 {`)
  .replace(/^(\s*)code, kbd, samp, pre, \.tabular \{/gm, `$1${sel} code, ${sel} .tabular {`);

const surface = (brand) => `
  <div class="scope brand-${brand}" id="scope-${brand}" data-a11y-scope
       data-theme="midnight" data-density="comfortable" data-motion="full"
       data-contrast="default" data-text-size="m" data-line-spacing="standard"
       data-reading-font="standard" data-accent="gold">
    <div class="surface" id="surface-${brand}">
      <h2>Heading</h2>
      <p>Body copy.</p>
      <p class="muted">Muted copy.</p>
      <p data-a11y-section>Sectioned copy for the focus guide.</p>
      <img data-decorative alt="" width="24" height="24"
           src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==">
      <div class="card"><span class="stat">4.3</span></div>
      <button class="cta" type="button">Action</button>
    </div>
    <div class="panelwrap" id="panelwrap-${brand}"></div>
  </div>`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>fixture</title>
<style>
${read('tokens/base.css')}
${scope(read('tokens/shard.css'), '.brand-shard')}
${scope(read('tokens/brains.css'), '.brand-brains')}
${read('tokens/panel.css')}
.scope{background:var(--bg);color:var(--ink);font-family:var(--font-body)}
.surface{padding:1.5em}
.surface h2{font-family:var(--font-display);font-size:1.3em}
.surface p.muted{color:var(--ink-muted)}
.surface .card{background:var(--surface);border:1px solid var(--line);padding:var(--space-4)}
.surface .stat{font-family:var(--font-mono);color:var(--accent)}
.surface .cta{background:var(--accent);color:var(--accent-ink);border:0;
  padding:var(--space-2) var(--space-4);transition:opacity var(--a11y-motion-duration)}
.panelwrap{padding:0 1.5em 1.5em}
</style></head><body>
<!-- A valid document, deliberately. axe grades pages as well as components, and
     a harness missing <main>, an <h1> and landmarks reports three document-level
     violations that say nothing about the package. Giving the harness real
     structure means what remains is about the components. -->
<a class="a11y-skip-link" href="#main">Skip to content</a>
<header><p>brains-a11y fixture</p></header>
<main id="main">
<h1>Accessibility preferences fixture</h1>
${surface('shard')}
${surface('brains')}
</main>
<script>${read('dist/brains-a11y.js')}</script>
<script type="module">${read('core/reading-guide.mjs').replace(/^export /gm, '')}
['shard', 'brains'].forEach(function (b) {
  attachReadingGuide({ root: document.getElementById('scope-' + b) });
});</script>
<script>
(function () {
  var A = window.BrainsA11y;
  /* Enable beta so the fixture exercises all axes, including readingGuide and
   * tint — the browser suite asserts on those too. */
  A.setExperimental(true);
  /* Use the canonical mountPanel so the fixture tests the same code path
   * that non-React sites will use in production. The panel reads and writes
   * state through the same store as the computed-style assertions. */
  ['shard', 'brains'].forEach(function (brand) {
    var target = document.getElementById('scope-' + brand);
    var host = document.getElementById('panelwrap-' + brand);
    /* mountPanel wires store → UI automatically; apply keeps the scope's
     * data attributes in sync so the computed-style probes see changes. */
    A.mountPanel(host, { axes: Object.keys(A.resolveAxes(true)) });
    /* Redirect clicks to also update the scope element so the browser spec's
     * computed-style probes (which read from target, not from <html>) work. */
    host.addEventListener('click', function (event) {
      /* The panel has already called update() which writes <html> attributes;
       * we just need to mirror the current store state onto the scoped target. */
      var prefs = A.read();
      A.apply(prefs, target);
    });
    /* Also mirror on initial render. */
    A.apply(A.read(), target);
  });
})();
</script></body></html>`;

writeFileSync(resolve(root, 'test/browser/fixture.html'), html);
console.log('test/browser/fixture.html built');
