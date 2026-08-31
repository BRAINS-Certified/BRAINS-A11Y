# The axes

## The stable set

The canonical set of viewing preferences for every Shard and BRAINS surface.
Each is a `data-*` attribute on `<html>`; each has a default that renders as
the stock appearance, so an absent attribute is always safe.

| Axis | Attribute | Values | Default | What it does |
|---|---|---|---|---|
| Theme | `data-theme` | `midnight` · `bone` | `midnight` | Dark or light ground; unset follows the OS |
| Accent | `data-accent` | `gold` · `teal` · `blue` | `gold` | Swaps the accent token, per theme |
| Contrast | `data-contrast` | `default` · `high` · `soft` | `default` | High strengthens; **soft lowers luminance** |
| Density | `data-density` | `comfortable` · `compact` | `comfortable` | Scales the spacing rhythm to ~72% |
| Text size | `data-text-size` | `s` · `m` · `l` · `xl` · `xxl` | `m` | 87.5% / 100% / 125% / 160% / **200%** |
| Line spacing | `data-line-spacing` | `tight` · `standard` · `roomy` | `standard` | Body line-height 1.4 / 1.6 / 1.9 |
| Letter spacing | `data-text-spacing` | `standard` · `wide` | `standard` | The SC 1.4.12 values, as a control |
| Line length | `data-measure` | `standard` · `narrow` | `standard` | Caps running text at 72ch / 52ch |
| Reading font | `data-reading-font` | `standard` · `hyperlegible` | `standard` | Atkinson Hyperlegible; italics become weight |
| Motion | `data-motion` | `full` · `reduced` | `full` | Zeroes animation and transition durations |
| Decorative images | `data-decoration` | `shown` · `hidden` | `shown` | Hides elements marked `data-decorative` |

## Beta axes — behind the opt-in

| Axis | Attribute | Values | Default |
|---|---|---|---|
| Reading guide | `data-reading-guide` | `off` · `ruler` · `focus` | `off` |
| Paper tint | `data-tint` | `none` · `warm` · `cool` | `none` |

Plus one beta value on a stable axis: `data-reading-font="dyslexic"`
(OpenDyslexic). See `docs/EVIDENCE.md` for why each sits in beta.

Enable beta with `?a11y-beta`, `setExperimental(true)`, or
`localStorage['brains.a11y.experimental'] = '1'`.

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
7. **200% text must reflow.** The top of the text-size scale is the benchmark
   in SC 1.4.4, and a layout that survives it at a 320px viewport also
   satisfies SC 1.4.10. Browser zoom stacks on top, so a viewer who needs 400%
   can combine the two.
8. **`role="radiogroup"` is a promise.** Arrow keys move between options, Home
   and End reach the ends, and the group is a single tab stop. Announcing the
   role without honouring it is worse than using plain buttons.
9. **The OS is asked first.** `prefers-reduced-motion`, `prefers-contrast` and
   `forced-colors` apply automatically. Someone who has already configured
   their system should not have to configure every website too.
10. **Nothing is tracked.** Preferences live in `localStorage` on the device and
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

## Verifying an axis actually does something

Attributes and ARIA state are not evidence that an axis works. Three axes once
shipped in this package doing nothing at all, while setting every attribute
correctly and reporting the right `aria-checked`:

- **Density** — `--space-*` were declared on `:root` as
  `calc(1rem * var(--a11y-density))`. A custom property is substituted at the
  element where it is *declared*, so density resolved once at `:root` and
  descendants inherited a fixed length. They are now declared on every element.
- **Contrast** and **reading font** — both write tokens the brand files also
  own (`--ink-muted`, `--line`, `--font-body`, `--font-display`). At equal
  specificity the brand file won on source order, because it is imported second.
  The brand files now sit in the `brains-a11y-brand` cascade layer, and this
  file is unlayered, so axis rules win without a specificity fight.

**Do not layer `tokens/base.css`, and do not unlayer the brand files.** Contrast
and reading font silently stop working if either happens, and no attribute
assertion will catch it.

`npm run test:browser` clicks every value of every axis in both brands and
asserts an observable computed-style change. Run it before any release that
touches CSS.
