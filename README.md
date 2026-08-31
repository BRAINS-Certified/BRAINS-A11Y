<!-- markdownlint-disable MD041 -->
<div align="center">

<img src="assets/icons/a11y-accessibility.svg" alt="" width="72">

# brains-a11y

<!-- markdownlint-disable-next-line MD001 -->
### Accessibility preferences that actually move the page

<br />

[![Licence](https://img.shields.io/badge/licence-MIT-0A0A0A?style=for-the-badge&labelColor=7A5500)](LICENSE)
[![WCAG](https://img.shields.io/badge/WCAG-2.2%20AA-7A5500?style=for-the-badge&labelColor=0A0A0A)](docs/EVIDENCE.md)
[![Dependencies](https://img.shields.io/badge/dependencies-none-2A8B91?style=for-the-badge&labelColor=0A0A0A)](package.json)
[![BRAINS Certified Gold](https://img.shields.io/badge/BRAINS%20Certified-Gold-D99518?style=for-the-badge&labelColor=0A0A0A)](https://github.com/BRAINS-Certified/BRAINS-template-repo/blob/main/CERTIFIED.md)

<br />

[Try it ↓](#the-eleven-axes) &nbsp;·&nbsp; [Install ↓](#install) &nbsp;·&nbsp; [Evidence ↓](docs/EVIDENCE.md) &nbsp;·&nbsp; [Roadmap ↓](ROADMAP.md)

</div>

---

**Eleven viewing preferences, one implementation, shared across every surface — so a person who sets up a page once finds the same controls, in the same place, behaving the same way, everywhere else.**

> **Reliable, affirming, inclusive.** Built by neurodivergent minds, for neurodivergent people.

Zero dependencies. No build step required. Works in React, in Astro, and on a static HTML page with no toolchain at all.

---

## This is not an overlay

Accessibility overlays inject a widget that promises compliance and does not deliver it. Disabled users have said so repeatedly, and hundreds of practitioners have signed their names to the point. Some of those products have been sued over it.

`brains-a11y` is the opposite thing, and the difference is worth being precise about:

| An overlay | This |
|---|---|
| Bolts onto a finished page and tries to correct it from outside | Is part of the design system, so the page is built right |
| Claims conformance | Claims nothing; publishes measurements |
| Hides the page's problems | **Exposes them** — turn text to 200% and every fixed width in your layout shows up |
| Ships a compliance badge | Ships a contrast script that fails your build |

**We do not ship a conformance badge and we will not.** A badge that claims compliance without measuring it is the same problem wearing a different hat.

---

## The eleven axes

Every one has a default that renders as your stock appearance, so a page with no stored preference — or with storage blocked, or before JavaScript arrives — is always correct.

| | Axis | Values |
|---|---|---|
| ◐ | **Theme** | Midnight · Bone — unset follows the OS |
| ◆ | **Accent** | Gold · Teal · Blue |
| ◑ | **Contrast** | Default · High · **Soft** |
| ▤ | **Density** | Comfortable · Compact |
| **A** | **Text size** | 87.5% · 100% · 125% · 160% · **200%** |
| ≡ | **Line spacing** | Tight · Standard · Roomy |
| ⇔ | **Letter spacing** | Standard · Wide |
| ⟷ | **Line length** | Standard · Narrow |
| **Aa** | **Reading font** | Standard · Atkinson Hyperlegible |
| ◌ | **Motion** | Full · Reduced |
| ▣ | **Decorative images** | Shown · Hidden |

Three things there are unusual enough to call out.

**Contrast has three settings, not two.** High contrast helps some readers and actively hurts others — photophobia, migraine and sensory sensitivity commonly call for *less* luminance, not more. Offering only "high" quietly assumes everyone's need points the same way. **Soft** goes the other way.

**Text size reaches 200%,** the benchmark WCAG SC 1.4.4 sets, not a decorative maximum. Browser zoom stacks on top, so a reader who needs 400% can get there. Expect this axis to find layout bugs — that is the point.

**Density is one scalar,** not a list of utility-class overrides. Add a new spacing value and it follows automatically.

### Beta channel

Enable with `?a11y-beta`, `setExperimental(true)`, or `localStorage['brains.a11y.experimental'] = '1'`.

**Reading guide** (ruler, focus) · **Paper tint** (warm, cool) · **OpenDyslexic**

These are in beta because the evidence is genuinely unsettled, and [`docs/EVIDENCE.md`](docs/EVIDENCE.md) says so. OpenDyslexic is there because readers ask for it — not because controlled studies show a reading gain over a well-set sans-serif. They do not. Preference is a good enough reason to offer a typeface; it is not a good enough reason to call it a remedy.

---

## Install

```bash
npm install github:BRAINS-Certified/brains-a11y
```

```jsx
import { noFlashScript } from '@brains/a11y/core/no-flash';
import { A11yProvider, A11yPanel, A11yTrigger, SkipLink } from '@brains/a11y/react';
import '@brains/a11y/tokens/base.css';
import '@brains/a11y/tokens/shard.css';   // or brains.css, or your own
import '@brains/a11y/tokens/panel.css';
import '@brains/a11y/tokens/trigger.css';
```

**Inline the no-flash script in `<head>`.** Loading it from a file reintroduces the flash it exists to prevent.

Recipes for Next.js, Astro and plain HTML: [`docs/MIGRATION.md`](docs/MIGRATION.md). Trigger presets and every tuneable property: [`docs/CONFIGURING.md`](docs/CONFIGURING.md).

---

## Bring your own brand

`tokens/base.css` is behaviour and carries no colour. Add exactly one brand file — two ship here, and a third is a copy away.

| | Shard | BRAINS |
|---|---|---|
| Display | Lexend | Inter |
| Body | DM Sans | **Atkinson Hyperlegible** |
| Mono | DM Mono | JetBrains Mono |
| Dark ground | `#0A1628` | `#0A0A0A` |
| Light ground | `#F5EDD8` | `#FFFFFF` |
| Accent, dark / light | `#FCC14D` / `#7A5500` | `#FCC14D` / `#7A5500` |

BRAINS sets Atkinson Hyperlegible as the **default** body face. The most legible face should not be something a reader has to go and find.

---

## Verify

```bash
npm run verify        # contrast + unit tests + build — no dependencies, runs in CI
npm run test:browser  # every axis, every value, both brands, in real Chromium
```

`scripts/check-contrast.mjs` measures **52 colour pairs** and fails the build on any miss.

It exists because an approved brand guide told us, in three separate places, to use a gold that gives "4.6:1, AA" on white. It measures **2.54:1** and fails — inside the rule that same guide called the most common accessibility bug. [`docs/CONTRAST.md`](docs/CONTRAST.md) has the full account. **A ratio written in a document is a claim. The script is the evidence.**

`test/browser` clicks every value of every axis in both brands and asserts a real computed-style change. That exists because three axes once shipped **completely inert** — every attribute set correctly, every `aria-checked` right, and nothing moving on screen. Attribute assertions passed all three.

---

## What's in the box

```text
core/      vanilla ES modules, zero dependencies — state, no-flash, keyboard, icons, reading guide
tokens/    base.css (behaviour) · shard.css · brains.css · panel.css · trigger.css
react/     A11yProvider · useA11y · A11yPanel · A11yTrigger · A11yMark · Icon · SkipLink
astro/     NoFlash · A11yPanel · A11yTrigger — no client framework
assets/    19 icons, one geometric family, plus a sprite
dist/      brains-a11y.js — IIFE global, for pages with no build step
docs/      SPEC · EVIDENCE · CONTRAST · MIGRATION · CONFIGURING
```

---

## Compliance

A surface is compliant when the no-flash script is inlined, `base.css` plus one brand file are loaded, **the panel is reachable from the header on every page including sign-in and error pages**, and a skip link is the first focusable element.

Standards this is built against: **WCAG 2.2 AA** throughout, with SC 1.4.4, 1.4.10, 1.4.12, 2.3.3, 2.5.8 and the ARIA radio-group pattern implemented explicitly. **EN 301 549** mapping — the harmonised standard behind the European Accessibility Act — is on the [roadmap](ROADMAP.md), not done.

We will say what we have measured, and no more than that.

---

<div align="center">

**[BRAINS](https://github.com/BRAINS-Certified)** · MIT · Contributions welcome — start with [CONTRIBUTING.md](CONTRIBUTING.md)

</div>
