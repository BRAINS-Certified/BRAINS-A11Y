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
      <h3>Heading</h3>
      <p>Body copy.</p>
      <p class="muted">Muted copy.</p>
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
.surface h3{font-family:var(--font-display);font-size:1.3em}
.surface p.muted{color:var(--ink-muted)}
.surface .card{background:var(--surface);border:1px solid var(--line);padding:var(--space-4)}
.surface .stat{font-family:var(--font-mono);color:var(--accent)}
.surface .cta{background:var(--accent);color:var(--accent-ink);border:0;
  padding:var(--space-2) var(--space-4);transition:opacity var(--a11y-motion-duration)}
.panelwrap{padding:0 1.5em 1.5em}
</style></head><body>
${surface('shard')}
${surface('brains')}
<script>${read('dist/brains-a11y.js')}</script>
<script>
(function () {
  var A = window.BrainsA11y;
  ['shard', 'brains'].forEach(function (brand) {
    var target = document.getElementById('scope-' + brand);
    var host = document.getElementById('panelwrap-' + brand);
    var prefs = Object.assign({}, A.DEFAULTS);
    var buttons = [];
    var panel = document.createElement('div');
    panel.className = 'a11y-panel';
    Object.keys(A.AXES).forEach(function (axis) {
      var group = document.createElement('div');
      group.setAttribute('role', 'radiogroup');
      group.setAttribute('aria-label', A.LABELS[axis]._);
      group.className = 'a11y-panel__options';
      A.AXES[axis].forEach(function (value) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'radio');
        b.className = 'a11y-panel__option';
        b.setAttribute('data-axis', axis);
        b.setAttribute('data-value', value);
        b.textContent = A.LABELS[axis][value];
        b.addEventListener('click', function () {
          prefs[axis] = value; A.apply(prefs, target); paint();
        });
        buttons.push(b); group.appendChild(b);
      });
      panel.appendChild(group);
    });
    function paint() {
      buttons.forEach(function (b) {
        var on = prefs[b.getAttribute('data-axis')] === b.getAttribute('data-value');
        b.setAttribute('aria-checked', String(on));
        if (on) b.setAttribute('data-active', ''); else b.removeAttribute('data-active');
      });
    }
    host.appendChild(panel); A.apply(prefs, target); paint();
  });
})();
</script></body></html>`;

writeFileSync(resolve(root, 'test/browser/fixture.html'), html);
console.log('test/browser/fixture.html built');
