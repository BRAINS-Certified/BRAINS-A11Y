# Contributing

## Before you push

```bash
npm run verify
```

Contrast, tests and the IIFE build all have to pass.

## The rules that matter

**Adding a colour means adding its pairs to `scripts/check-contrast.mjs`.**
A token file change without a corresponding entry there should be rejected in
review. This package exists partly because an approved brand guide shipped a
contrast figure that was never measured.

**Adding an axis** means touching, in this order: `AXES`, `ATTRIBUTES` and
`LABELS` in `core/index.mjs`; behaviour in `tokens/base.css`; brand values in
both brand files if it is colour-bearing. The React and Astro panels and the
no-flash script derive from `AXES` and need no change. `test/core.test.mjs`
asserts that every axis has an attribute and a full label set, so an
incomplete addition fails.

**Every default must render as the stock appearance.** The first value in an
axis is its default, and a page with no preferences applied has to look right.

**Failures stay silent.** Storage errors are caught and ignored. These are
cosmetic settings; a private window must never throw.

## What does not belong here

Server-side persistence, telemetry, analytics, or anything that transmits a
person's accessibility settings off their device.
