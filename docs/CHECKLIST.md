# The A11Y Project checklist, audited

An honest pass over [the A11Y Project checklist](https://www.a11yproject.com/checklist/),
run 31 August 2026.

**The checklist grades a page. This is a library.** So each item lands in one of
three places, and pretending otherwise would be the kind of overclaiming this
package exists to avoid:

- **Package** — the package's own components and CSS have to satisfy it.
- **Helps** — the package gives a surface a control or token that makes it
  achievable, but cannot achieve it alone.
- **Surface** — nothing a library can do. Yours to meet.

## What the audit changed

Five real defects, all now fixed. They are listed first because the useful part
of an audit is what it caught, not what it confirmed.

| Defect | Item it failed |
|---|---|
| Control borders measured **1.08:1** against the surface — the `--line` hairline is right for a divider and wrong for a control someone has to find | *Check the contrast of borders for input elements* — SC 1.4.11 wants 3:1. A `--control-border` token now ships, verified 3.4–4.7:1 on every ground |
| The selected option was distinguished by **fill colour alone** | *Make sure color isn't the only way information is conveyed.* A tick now marks the selected option |
| **"Standard" was the accessible name of four different buttons** — line spacing, letter spacing, line length and reading font | *Make sure that `button` content is unique and descriptive.* Each control now states its own axis |
| `A11yMark` was a link with **no underline**, distinguished by colour only | *Ensure that links are recognizable as links* |
| The panel hardcoded an **`<h2>`** | *Don't skip heading levels.* Dropped under an `h3` it broke the outline. `headingLevel` is now a prop |

## Content

| Item | Where | Notes |
|---|---|---|
| Plain language, no idioms | **Package** | Panel copy is plain; the BRAINS floor gates reading grade in CI |
| `button`, `a`, `label` content unique and descriptive | **Package** | Fixed — see above |
| Left-aligned for LTR, right for RTL | Surface | The keyboard helper takes an `rtl` flag; text alignment is the surface's |

## Global code

| Item | Where | Notes |
|---|---|---|
| Validate your HTML | **Package** | Components emit valid markup |
| `lang` on `html` | Surface | |
| Unique `title` per view | Surface | |
| **Viewport zoom not disabled** | Surface | **The package depends on this.** `user-scalable=no` defeats the text-size axis entirely |
| Landmark elements | Surface | |
| Linear content flow | Surface | |
| Avoid `autofocus` | **Package** | None used. The popover moves focus on user action, which is the dialog pattern, not autofocus |
| Extend session timeouts | n/a | |
| Remove `title` tooltips | **Package** | No `title` attributes. SVG `<title>` is an accessible name, not a tooltip |

## Keyboard

| Item | Where | Notes |
|---|---|---|
| Visible focus style | **Package** | `:focus-visible` is never removed by any axis, and thickens under high contrast |
| Focus order matches layout | **Package** | DOM order is visual order |
| No invisible focusable elements | **Package** | The popover uses `hidden`, so closed contents are not reachable |

## Images

| Item | Where | Notes |
|---|---|---|
| All `img` have `alt` | **Package** | The package ships no `img`; icons are inline SVG, `aria-hidden` |
| Decorative images use null `alt` | **Helps** | `data-decorative` marks them, and the decoration axis can hide them |
| Text alternative for complex images | Surface | |
| Alt includes text in the image | Surface | |

## Headings · Lists · Tables

| Item | Where | Notes |
|---|---|---|
| Headings introduce content, logical sequence, no skipped levels | **Package** | Fixed — `headingLevel` prop |
| One `h1` per view | Surface | |
| List elements for list content | **Package** | Uses `fieldset`/`legend`, which is correct for grouped controls |
| Table markup, `th` with `scope`, `caption` | n/a | The package ships no tables |

## Controls

| Item | Where | Notes |
|---|---|---|
| `a` for links | **Package** | |
| Links recognisable as links | **Package** | Fixed — underlined |
| Controls have `:focus` states | **Package** | |
| `button` for buttons | **Package** | |
| Skip link, visible on focus | **Package** | `.a11y-skip-link` ships; the surface must place it first |
| Identify links opening in a new tab | **Package** | None open in a new tab |

## Forms

| Item | Where | Notes |
|---|---|---|
| Inputs associated with labels | **Package** | Radiogroups are labelled; every control is individually named |
| `fieldset` and `legend` | **Package** | Used for every axis |
| `autocomplete` · error lists · error association | n/a | The package has no form inputs |
| Error states not colour-only | **Package** | The equivalent — selected state — is fixed |

## Media · Video · Audio

All **n/a**. The package ships no media, and nothing autoplays.

## Appearance

| Item | Where | Notes |
|---|---|---|
| Check in specialized browsing modes | **Package** | `forced-colors` handled; the selected option is restated in system colours |
| **Increase text size to 200%** | **Package** | Not merely survived — it is an axis, verified at 0px overflow in a 320px viewport |
| Good proximity between content | **Package** | Spacing tokens, which density scales |
| Colour is not the only means | **Package** | Fixed — tick on the selected option |
| Instructions not visual/audio-only | **Package** | |
| Simple, consistent layout | **Package** | |

## Animation

| Item | Where | Notes |
|---|---|---|
| Subtle, no flashing | **Package** | Transitions only; nothing flashes |
| Pause background video | n/a | |
| Obeys `prefers-reduced-motion` | **Package** | Honoured, and the motion axis can only reduce further, never re-enable |

## Colour contrast

| Item | Where | Notes |
|---|---|---|
| Normal text · large text | **Package** | 60 pairs measured in CI |
| **Icons** | **Package** | Drawn in `currentColor`, so they inherit verified text colours |
| **Borders of input elements** | **Package** | Fixed — `--control-border`, 3.4–4.7:1 |
| Text over images or video | Surface | |
| Custom `::selection` | **Package** | None set, so the browser default applies |

## Mobile and touch

| Item | Where | Notes |
|---|---|---|
| Rotates to any orientation | **Package** | Nothing locks orientation |
| **No horizontal scrolling** | **Package** | Asserted at 320px × 200% text |
| Icons activatable with ease | **Package** | 44px minimum, held regardless of density |
| Space between interactive items | **Package** | Gap from the spacing scale |

## What a surface still owns

Adopting this package does not make a site conformant. These remain yours:

`lang` · page titles · **viewport zoom left enabled** · landmarks · heading
outline · image alternatives · form labelling and errors · media captions and
transcripts · link purpose in your own content · contrast of any colour you add.

The package makes those easier to get right. It cannot get them right for you,
and it will not claim to.
