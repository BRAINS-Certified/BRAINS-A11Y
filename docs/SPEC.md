# The eight axes

The canonical set of viewing preferences for every Shard and BRAINS surface.
Each is a `data-*` attribute on `<html>`; each has a default that renders as
the stock appearance, so an absent attribute is always safe.

| Axis | Attribute | Values | Default | What it does |
|---|---|---|---|---|
| Theme | `data-theme` | `midnight` · `bone` | `midnight` | Dark or light ground |
| Density | `data-density` | `comfortable` · `compact` | `comfortable` | Scales the spacing rhythm to ~72% |
| Motion | `data-motion` | `full` · `reduced` | `full` | Zeroes animation and transition durations |
| Contrast | `data-contrast` | `default` · `high` | `default` | Strengthens borders, lifts muted text, thickens focus rings |
| Text size | `data-text-size` | `s` · `m` · `l` | `m` | Root font size at 90% / 100% / 115% |
| Line spacing | `data-line-spacing` | `tight` · `standard` · `roomy` | `standard` | Body line-height 1.4 / 1.6 / 1.9 |
| Reading font | `data-reading-font` | `standard` · `hyperlegible` | `standard` | Atkinson Hyperlegible; drops italics for weight |
| Accent | `data-accent` | `gold` · `teal` · `blue` | `gold` | Swaps the accent token, per theme |

## Where the set came from

The estate had two disjoint implementations. Neither had more than five axes,
and they shared none:

- **shard-audit** — density, motion, contrast, accent (plus theme, separately).
- **shard-financial-tool** and **shard-books-site** — theme, text size, line
  spacing, dyslexia mode.

This is their union, with "dyslexia mode" generalised to a reading-font axis so
the control names a typeface choice rather than a person.

## Rules that are not negotiable

1. **Defaults render as stock.** A page with no stored preference, with storage
   blocked, or before the script runs, must look correct.
2. **Failures are silent.** Preferences are cosmetic. A private window, a
   quota error, or disabled storage must never throw.
3. **Fallbacks are per-axis.** One corrupt value cannot discard the rest.
4. **The OS wins on motion.** `prefers-reduced-motion: reduce` always reduces
   motion; the control can only reduce it further, never re-enable it.
5. **Focus is never removed** by any axis or any combination of them.
6. **Touch targets stay ≥44px** regardless of density (WCAG 2.2 AA, 2.5.8).
7. **Nothing is tracked.** Preferences live in `localStorage` on the device and
   are never sent anywhere.

## Density, and why it is a scalar

The earlier shard-audit implementation applied compact density by enumerating
exact Tailwind utility classes — `.mb-28`, `.mb-24`, `.mb-20`, and so on down,
each with a responsive variant. Its own source comment recommended the fix:

> If the dashboard grows a new spacing class, add a matching rule below (or
> refactor the dashboard to use CSS variables for rhythm and ditch this list
> entirely).

This package takes that second option. Density is one scalar, `--a11y-density`,
which the `--space-*` tokens multiply. Components that use those tokens follow
density automatically, and a new spacing value cannot silently escape it.

## Contract for consuming surfaces

A surface is compliant when:

- The no-flash script is inlined in `<head>`, before any stylesheet that reads
  a `data-*` attribute.
- `tokens/base.css` and exactly one brand token file are loaded.
- The panel is reachable from the header on **every** page, including
  pre-authentication, error and marketing pages.
- A skip link is the first focusable element.
- `npm run check:contrast` passes for any colours the surface adds.
