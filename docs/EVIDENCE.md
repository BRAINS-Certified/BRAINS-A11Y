# Evidence

What each option claims, and how well that claim is supported. This file exists
because accessibility features are easy to ship on good intentions, and a
person choosing between them deserves to know which are load-bearing.

Three tiers.

## Anchored in a standard

These implement a published success criterion. The claim is testable and the
test is named.

| Option | Criterion |
|---|---|
| Text size to 200% | WCAG 2.2 SC 1.4.4 Resize Text; a surface that survives it also meets SC 1.4.10 Reflow |
| Letter and word spacing | SC 1.4.12 Text Spacing — the exact values a page must survive |
| Motion | SC 2.3.3 Animation from Interactions; `prefers-reduced-motion` |
| Contrast (high) | SC 1.4.3 / 1.4.11; every shipped pair measured by `scripts/check-contrast.mjs` |
| Focus visibility | SC 2.4.7 / 2.4.11 |
| Touch targets ≥44px | SC 2.5.8 Target Size |
| Radiogroup keyboard | WAI-ARIA Authoring Practices, radio group pattern |

## Well supported, not a standard

Good evidence or strong professional consensus, but no criterion to point at.

- **Atkinson Hyperlegible** — designed by the Braille Institute for letter-form
  differentiation. The claim is narrow and specific: characters that are easy
  to confuse are drawn differently. That is well founded for low vision. It is
  *not* a claim about dyslexia, and this package does not make one.
- **Line length** — a long-standing typographic finding that over-long measures
  cost the reader on the return sweep.
- **Soft contrast** — high contrast helps some readers and hurts others.
  Photophobia, migraine and sensory sensitivity commonly call for *less*
  luminance, not more. Offering only "more contrast" assumes everyone's need
  points the same way; it does not.
- **Density and decorative-image hiding** — reduce extraneous load. Consistent
  with cognitive-load research, though the specific settings are judgement.

## Offered as preference, contested as evidence

In the beta channel, and staying there until something changes.

- **OpenDyslexic** (`readingFont: dyslexic`) — widely requested and widely
  believed to help. Controlled studies have **not** shown a reliable reading
  gain over a well-set sans-serif; several find no difference. It is included
  because readers ask for it and preference is a legitimate reason to offer a
  typeface — but it is not presented as a remedy, and it is not in the stable
  set. If a reader finds it better, that is reason enough for them to use it.
- **Paper tint** (`tint`) — coloured overlays and tinted backgrounds have a
  long history and a contested literature. Reported benefit is common; robust
  evidence of a reading effect is not. Offered as a preference, never as a
  treatment, and never described in clinical terms.
- **Reading guide** (`readingGuide`) — ruler and focus modes are plausible and
  popular; we have no strong evidence either way. In beta while we gather it.

## What this package will not do

- Claim conformance it has not measured.
- Describe any option as a treatment for a condition.
- Present a preference as a clinical intervention.
- Ship an overlay that promises compliance without changing the page.

If an option moves between tiers, it moves here first and in the changelog.
