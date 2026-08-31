#!/usr/bin/env node
/** Writes every icon out to assets/icons/*.svg from the single source in core/icons.mjs. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ICONS, iconSvg } from '../core/icons.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, 'assets/icons');
mkdirSync(dir, { recursive: true });

const kebab = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
let symbols = '';
for (const name of Object.keys(ICONS)) {
  const svg = iconSvg(name, { size: 24 });
  writeFileSync(resolve(dir, `a11y-${kebab(name)}.svg`), svg + '\n');
  symbols += svg
    .replace(/^<svg[^>]*>/, `<symbol id="a11y-${kebab(name)}" viewBox="0 0 24 24">`)
    .replace(/<\/svg>$/, '</symbol>');
}
writeFileSync(resolve(dir, 'sprite.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" `
  + `stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" hidden>`
  + `${symbols}</svg>\n`);
console.log(`assets/icons: ${Object.keys(ICONS).length} icons + sprite.svg`);
