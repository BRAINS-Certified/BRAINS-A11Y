# Changelog

All notable changes to BRAINS A11Y. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
this project uses [semantic versioning](https://semver.org/).

---

## [1.0.0] — 2026-08-31

First release. Eleven stable axes and two in beta, shared across every Shard
and BRAINS surface.

### Added

- **Eleven stable axes.** Theme · Accent · Contrast · Density · Text size ·
  Line spacing · Letter spacing · Line length · Reading font · Motion ·
  Decorative images. Every default renders as the stock appearance, so a page
  with no stored preference — or with storage blocked, or before JavaScript
  arrives — is always correct.
- **Contrast has three settings, not two.** High strengthens; **soft** lowers
  luminance. Photophobia, migraine and sensory sensitivity commonly need less
  intensity, not more, and offering only "high" assumes everyone's need points
  the same way.
- **Text size reaches 200%**, the benchmark WCAG 2.2 SC 1.4.4 sets. Browser
  zoom stacks on top. Verified at 0px horizontal overflow in a 320px viewport,
  which also satisfies SC 1.4.10.
- **A beta channel** for what is genuinely unsettled — reading guide, paper
  tint, OpenDyslexic. Enable with `?a11y-beta`, `setExperimental(true)`, or a
  storage flag.
- **Framework-agnostic core** with no dependencies and no build step, plus
  React bindings, Astro components, and an IIFE global for pages with no
  toolchain.
- **Twenty-four icons** in one geometric family, six offered for the trigger,
  and four trigger presets with five placements — every colour, radius, size
  and offset behind a custom property.
- **Migration from three legacy storage schemes** on first run, so nobody
  loses a preference they had already set.
- **OS signals honoured** — `prefers-reduced-motion`, `prefers-contrast`,
  `forced-colors`, `prefers-reduced-transparency`.

### Fixed

Defects found and closed during the build, recorded because the useful part of
a first release is what it caught.

- **Three axes shipped inert.** Density, contrast and reading font set every
  attribute correctly, reported the right `aria-checked`, and moved nothing on
  screen. Density's spacing tokens resolved once at `:root`; contrast and
  reading font wrote tokens the brand files also owned and lost on source
  order. Attribute assertions passed all three, which is why
  `test/browser` now asserts on computed style instead.
- **Control borders measured 1.08:1** against the surface — SC 1.4.11 asks for
  3:1 on a control boundary. A `--control-border` token now ships, verified
  3.4–4.7:1 on every ground.
- **The selected option was carried by fill colour alone.** It now has a tick.
- **"Standard" was the accessible name of four different buttons.** Each
  control now states its own axis.
- **`role="radiogroup"` was announced without being honoured** — no arrow
  keys, and every option a tab stop.
- **`A11yMark` was a link with no underline.**
- **The panel hardcoded an `<h2>`,** skipping a level under an `h3`.

### Brand

- **Brand Deep corrected to `#7A5500`.** Shard Brand Guidelines v1.0 instructed
  `#D99518` for gold text on light grounds and stated 4.6:1 AA. It measures
  **2.54:1** and fails. Corrected upstream in the brand skill at v1.1; see
  [`docs/CONTRAST.md`](docs/CONTRAST.md).
- **The trigger defaults to the infinity loop, not the universal access
  figure,** and to "Display & reading", not "Accessibility". Most of these axes
  are about reading, attention and sensory load, and a large share of the
  people they help do not think of themselves as disabled.

### Verified

60 colour pairs measured in CI · 19 unit tests · 26 axis checks in real
Chromium across both brands · reflow at 200% in a 320px viewport · the
radiogroup keyboard contract · audited line by line against
[The A11Y Project checklist](https://www.a11yproject.com/checklist/).
