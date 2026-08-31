# Roadmap

What is shipped, what is in beta, and what is queued. Dated and honest — an
item sitting here for a year should say so rather than quietly disappear.

## Shipped — stable

Eleven axes, each with a default that renders as the stock appearance.

Theme · Accent · Contrast (default/high/**soft**) · Density · Text size
(87.5–**200%**) · Line spacing · Letter spacing · Line length · Reading font ·
Motion · Decorative images.

Plus: three legacy storage schemes migrated on first run · OS signals honoured
(`prefers-reduced-motion`, `prefers-contrast`, `forced-colors`,
`prefers-reduced-transparency`) · radiogroup keyboard contract · polite
live-region announcements · 48 colour pairs measured in CI · every axis clicked
in a real browser before release.

## Beta — opt in

Enable with `?a11y-beta` in the URL, `setExperimental(true)`, or
`localStorage['brains.a11y.experimental'] = '1'`.

| Option | Why it is in beta |
|---|---|
| **Reading guide** — ruler, focus | Plausible and popular; we have no strong evidence either way, and the focus mode needs surfaces to mark their sections |
| **Paper tint** — warm, cool | Reported benefit is common, robust evidence is not. See `docs/EVIDENCE.md` |
| **OpenDyslexic** reading font | Widely requested; controlled studies do not show a reliable gain over a well-set sans-serif |

Beta options can change or be withdrawn. They are here to be tried and
reported on.

## Queued

Roughly in the order we would take them.

### Next
- **Preference sync for signed-in viewers.** Settings live on the device today.
  A person who sets them on a laptop should not start again on their phone.
  Needs an opt-in and a clear statement that accessibility settings are
  sensitive data.
- **Accessibility statement generator.** Required under the EU Web
  Accessibility Directive and the European Accessibility Act; nobody in the
  estate has one. Generate per surface from measured evidence, not from a
  template of claims.
- **Reduced-data mode.** `prefers-reduced-data` — drop webfonts and heavy
  media. Helps metered connections and low-end devices as much as anything.

### After that
- **VPAT / ACR generation.** The document enterprise buyers ask for before
  signing. Only worth publishing if it is generated from real test output.
- **EN 301 549 mapping.** The harmonised standard behind the European
  Accessibility Act. Map each axis and check to its clause.
- **Per-surface audit evidence, versioned.** The asset is the trend line across
  releases, not a badge. Same shape as the BRAINS LLM Standard's model cards,
  applied to accessibility.
- **Automated flashing check.** SC 2.3.1 — no content flashing more than three
  times a second. Cheap to lint, catastrophic to miss.
- **Cognitive-load lint for prose.** Reading grade is already gated by the
  BRAINS floor; extend it to UI strings.

### Considered, not queued
- **A "simplified view" toggle.** Strip a page to its content. Powerful, but it
  is a content-model change, not a stylesheet — it belongs to each surface.
- **Text-to-speech.** Browsers and operating systems already do this better
  than a page-level control, and a page-level one competes with the screen
  reader rather than helping it.
- **An accessibility overlay.** Never. See the README.

## Principles for adding anything

1. Say which tier the evidence is in — see `docs/EVIDENCE.md`.
2. Every default must render as the stock appearance.
3. Every colour goes into `scripts/check-contrast.mjs` in the same commit.
4. Nothing ships as stable until it has been clicked in a real browser and
   asserted on computed style. Attributes are not evidence.
5. No option is described as a treatment for a condition.
