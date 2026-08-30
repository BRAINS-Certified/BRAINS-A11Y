/**
 * brains-a11y — the no-flash script.
 *
 * Must run in <head>, before first paint, or the page renders in the default
 * theme and then visibly snaps to the user's choice. It is generated from the
 * axis definitions rather than hand-written, so it cannot drift from the core
 * when an axis is added or a value renamed.
 *
 * Inline it — do not load it from a file. A network round-trip defeats it.
 *
 *   import { noFlashScript } from 'brains-a11y/core/no-flash.mjs';
 *   `<script>${noFlashScript()}</script>`
 */

import { AXES, ATTRIBUTES, DEFAULTS, STORAGE_KEY, LEGACY_KEYS, LEGACY_SEPARATE_KEYS } from './index.mjs';

/**
 * @returns {string} an IIFE, safe to inline in a <script> tag.
 */
export function noFlashScript() {
  const config = JSON.stringify({
    key: STORAGE_KEY,
    legacy: Object.keys(LEGACY_KEYS),
    sep: LEGACY_SEPARATE_KEYS,
    axes: AXES,
    attrs: ATTRIBUTES,
    defaults: DEFAULTS,
  });

  return `(function(){try{
var C=${config},d=document.documentElement,p={},k;
for(k in C.defaults)p[k]=C.defaults[k];
function g(n){try{return localStorage.getItem(n)}catch(e){return null}}
function j(s){if(!s)return null;try{var v=JSON.parse(s);return v&&typeof v==='object'?v:null}catch(e){return null}}
function set(o){if(!o)return;for(var a in C.axes){var v=o[a];if(typeof v==='string'&&C.axes[a].indexOf(v)>-1)p[a]=v}}
try{if(window.matchMedia&&matchMedia('(prefers-color-scheme: light)').matches)p.theme='bone'}catch(e){}
var cur=j(g(C.key));
if(cur){set(cur)}
else{
  var l0=j(g('brains.prefs'));if(l0)set(l0);
  var l1=j(g('shard.viewing.v1'));
  if(l1){set(l1);if(l1.dyslexia===true)p.readingFont='hyperlegible'}
  var s2={};for(var n in C.sep){var sv=g(n);if(sv)s2[C.sep[n]]=sv}set(s2);
  if(g('sb:dyslexia')==='true')p.readingFont='hyperlegible';
}
for(k in C.attrs)d.setAttribute(C.attrs[k],p[k]);
}catch(e){}})();`;
}
