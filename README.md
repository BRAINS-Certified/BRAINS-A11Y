# brains-a11y

**The BRAINS accessibility standard.** Eight viewing-preference axes, one
implementation, shared across every Shard and BRAINS surface — so a person who
sets their preferences on one of our products finds the same controls, in the
same place, behaving the same way, on all of them.

Zero dependencies. No build step required. Works in React, in Astro, and on a
static HTML page with no toolchain at all.

```
Theme · Density · Motion · Contrast · Text size · Line spacing · Reading font · Accent
```

## Why this exists

The estate had two separate implementations of the same idea that shared **no
axes at all**: `shard-audit` had density, motion, contrast and accent;
`shard-financial-tool` and `shard-books-site` had theme, text size, line
spacing and a dyslexia mode. Neither had more than five of the eight. Every
other repo had only the `a11y.yml` CI workflow and no controls whatsoever.

Three font systems and two conflicting "accessible gold" values were in play.
One of them was wrong — see [docs/CONTRAST.md](docs/CONTRAST.md).

## Install

Private repo, so consuming builds authenticate:

```bash
npm install git+ssh://git@github.com/BRAINS-Certified/brains-a11y.git
```

## Use it

```jsx
import { noFlashScript } from '@brains/a11y/core/no-flash';
import { A11yProvider, A11yPanel, SkipLink } from '@brains/a11y/react';
import '@brains/a11y/tokens/base.css';
import '@brains/a11y/tokens/shard.css';   // or brains.css
import '@brains/a11y/tokens/panel.css';
```

Full recipes for Next.js, Astro and plain HTML are in
[docs/MIGRATION.md](docs/MIGRATION.md).

**The no-flash script must be inlined in `<head>`.** Loading it from a file
reintroduces the flash it exists to prevent.

## Two brands, two token sets

Shard and BRAINS have separate approved brand guides, so the package ships
both. Import `tokens/base.css` (behaviour, brand-agnostic) plus exactly one
brand file.

| | Shard | BRAINS |
|---|---|---|
| Display | Lexend | Inter |
| Body | DM Sans | **Atkinson Hyperlegible** |
| Mono | DM Mono | JetBrains Mono |
| Dark ground | `#0A1628` Night | `#0A0A0A` |
| Light ground | `#F5EDD8` Bone | `#FFFFFF` |
| Accent (dark) | `#FCC14D` | `#FCC14D` |
| Accent (light) | `#7A5500` | `#7A5500` |

BRAINS sets Atkinson Hyperlegible as the **default** body face — the most
legible face should not be something a user has to go and find. Shard follows
its brand guide and offers it on the reading-font axis.

## Verify

```bash
npm run verify        # contrast + unit tests + build — dependency-free, runs in CI
npm run test:browser  # every axis, every value, both brands, in real Chromium
```

`scripts/check-contrast.mjs` measures every pair the token files ship and fails
on anything below its stated WCAG level. It exists because an approved brand
guide shipped a stated ratio that was wrong by a factor of nearly two. A number
written in a document is a claim; the script is the evidence.

## Layout

```
core/      vanilla ES modules, zero dependencies — the actual logic
tokens/    base.css (behaviour) · shard.css · brains.css · panel.css
react/     A11yProvider, useA11y, A11yPanel, SkipLink  (JSX source)
astro/     NoFlash.astro, A11yPanel.astro              (no client framework)
dist/      brains-a11y.js — IIFE global, for static pages
docs/      SPEC.md · CONTRAST.md · MIGRATION.md
scripts/   check-contrast.mjs · build-iife.mjs
test/      node:test unit specs · browser/ real-browser axis verification
```

## Compliance

A surface is compliant when the no-flash script is inlined, `base.css` plus one
brand file are loaded, **the panel is reachable from the header on every page
including pre-authentication and error pages**, and a skip link is the first
focusable element. See [docs/SPEC.md](docs/SPEC.md).

---

Shard Labs Pty Ltd · BRAINS
