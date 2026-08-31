# Configuring the trigger

The panel is the same everywhere; the button that opens it is not. A site owner
picks a preset and, if they want, tunes it with custom properties. Nothing here
requires forking the package.

## Which icon, and what to call it

Two defaults here are deliberate, and both are about who feels invited.

**The icon defaults to `neurodiversity`, not the universal access figure.** That
figure reads, to most people, as physical or visual disability. Most of these
axes are about reading, attention and sensory load. The infinity loop is the
symbol the neurodivergent community chose for itself — and in gold, the one
autistic self-advocates adopted specifically to displace the puzzle piece.
Puzzle-piece imagery is banned in BRAINS copy and will never appear here.

**The label defaults to "Display & reading", not "Accessibility".** A large
share of the people these controls help do not think of themselves as disabled
and will not open a menu that says they are. Someone who finds long lines hard
to track is looking for reading settings.

| `icon` | Reads as |
|---|---|
| `neurodiversity` | **Default.** The infinity loop — for everyone, not only vision |
| `accessibility` | The universal access figure. Use where visitors expect the convention |
| `focus` | Attention and calm |
| `sensory` | Sensory load |
| `brains` · `shard` | Your own mark, where the control should read as part of the product |

Labels worth considering: `Display & reading` · `Viewing preferences` ·
`Reading settings` · `Comfort` · `Accessibility`. Pick the one your visitors
would actually search for.

```jsx
<A11yTrigger icon="neurodiversity" label="Display & reading" />
<A11yTrigger icon="brains" variant="pill" label="Make this easier to read" />
```

## Grouping the panel

Thirteen axes in one flat list reads as a settings dump. `GROUPS` suggests an
order and three headings that tell a reader this is not only a vision tool:

| Group | Axes |
|---|---|
| **Reading** | Text size · Line spacing · Letter spacing · Line length · Reading font |
| **Focus & calm** | Motion · Decorative images · Density · Reading guide |
| **Colour & contrast** | Theme · Contrast · Accent · Paper tint |

Use it, reorder it, or ignore it — it is a suggestion, not a constraint. A test
asserts every axis belongs to exactly one group, so the list cannot silently
fall out of date.

## Presets

| `variant` | What it is | When to use it |
|---|---|---|
| `label` | Icon plus visible text | **The default, and usually right.** An icon alone is only obvious to people who already know the convention — a poor assumption for a control whose audience is people the page has not served well yet |
| `icon` | Square, icon only | A dense toolbar where every other control is an icon too |
| `pill` | Rounded, filled with the accent | Marketing pages, where it should read as an invitation |
| `fab` | Floating circle | Sites with no room in the header. Pair with a `fixed-*` placement |

| `placement` | Behaviour |
|---|---|
| `inline` | Sits in normal flow. Put it in the header |
| `fixed-top-right` · `fixed-top-left` | Pinned to the viewport |
| `fixed-bottom-right` · `fixed-bottom-left` | Pinned to the viewport |

```jsx
<A11yTrigger variant="pill" placement="inline" onClick={toggle} />
<A11yTrigger variant="fab" placement="fixed-bottom-right" onClick={toggle} />
```

```astro
<A11yTrigger variant="icon" controls="a11y-panel" />
```

## Tuning

Override on `:root`, or on the button, or scoped to one page.

| Property | Default | Notes |
|---|---|---|
| `--a11y-trigger-size` | `44px` | **Never set below 44px** — WCAG 2.2 SC 2.5.8 |
| `--a11y-trigger-radius` | `3px` | `0` square, `999px` pill |
| `--a11y-trigger-bg` | `transparent` | `pill` and `fab` default to the accent |
| `--a11y-trigger-fg` | `var(--ink)` | |
| `--a11y-trigger-border` | `var(--line)` | |
| `--a11y-trigger-bg-hover` | `var(--surface-2)` | |
| `--a11y-trigger-shadow` | `none` | `fab` ships a shadow |
| `--a11y-trigger-offset` | `1rem` | Distance from the edge when floating |
| `--a11y-trigger-z` | `2147483001` | Lower it if it covers your own overlay |

```css
:root {
  --a11y-trigger-radius: 999px;
  --a11y-trigger-bg: #14324a;
  --a11y-trigger-fg: #ffffff;
}
```

**Any colour you override is yours to verify.** The pairs this package ships
are measured in CI; yours are not. Add them to `scripts/check-contrast.mjs` or
check them another way, but check them.

## Where to put it

The panel must be reachable from **every** page, including sign-in, error and
marketing pages. The gap that prompted a global bar in one of our own products
was exactly this: the panel lived inside the authenticated shell, so signed-out
visitors got a hard-coded theme and no controls at all.

A skip link should still be the first focusable element on the page. The
trigger comes after it.

## Icons

Nineteen icons in one geometric family — 24×24, 1.75 stroke, `currentColor`, so
they follow the accent and contrast axes without extra wiring.

```jsx
import { Icon } from '@brains/a11y/react';
<Icon name="contrast" size={20} />
```

Files are in `assets/icons/` for anyone who wants them: one SVG per icon plus
`sprite.svg`. They are generated from `core/icons.mjs` by
`node scripts/build-icons.mjs` — edit the source, not the files.

## Saying what you use

Optional, and deliberately quiet:

```jsx
<A11yMark />   →   ♿ Accessibility preferences by BRAINS
```

It states which controls a site offers. **It is not a conformance badge**, and
this package will not ship one. A badge that claims compliance without
measuring it is the overlay problem wearing a different hat.
