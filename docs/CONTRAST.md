# Contrast — the finding, and the guard

## The finding

**Shard Brand & Visual Identity Guidelines v1.0 (Approved) contain an incorrect
contrast figure, and it is in the rule the guide itself calls the most common
accessibility bug.**

Both `BRAND-GUIDELINES-v1.0.md` and `SKILL.md` instruct:

> Use **Brand Deep (`#D99518`)** for any gold text on a light ground (4.6:1, AA).

Measured against WCAG 2.x relative luminance:

| Pair | Stated | Measured | Verdict |
|---|---|---|---|
| `#D99518` on `#FFFFFF` | 4.6:1 AA | **2.54:1** | **Fails AA at every text size** |
| `#D99518` on Bone `#F5EDD8` | — | **2.18:1** | **Fails** |
| `#FCC14D` on `#FFFFFF` | ~1.9:1, decorative only | 1.63:1 | Fails (guide is right to ban it) |
| `#FCC14D` on Night `#0A1628` | 10.4:1 | 11.11:1 | Passes AAA |

`#D99518` is not a usable text colour on any light ground. It is roughly as
inaccessible as the bright gold the guide correctly forbids.

## The resolution

The Shard Books implementation had independently derived the right value and
documented it in `docs/coordination/brand-accessibility-spec.md`:

> **Accent:** `#7A5500` — **darkened gold** — required so gold-on-light passes
> AA (≥4.5:1). Do NOT use `#FCC14D` for text on light.

| Pair | Measured | Verdict |
|---|---|---|
| `#7A5500` on `#FFFFFF` | **6.72:1** | AA, comfortably |
| `#7A5500` on Bone `#F5EDD8` | **5.75:1** | AA |
| `#FFFFFF` on `#7A5500` | **6.72:1** | AA — safe as a button fill |

**This package ships `#7A5500` for gold text on light grounds.** `#FCC14D`
remains correct on dark grounds and for fills and marks.

## Consequences elsewhere

Anything that followed the guide's instruction is affected wherever gold text
sits on a light ground — small-caps labels, section numbers, list markers,
eyebrows. Two known cases at the time of writing:

- Shard Labs advisory documents produced from the brand system in August 2026.
- Any surface that adopted `--brand: #D99518` from the guide's CSS token line.

`#FCC14D` on dark grounds is unaffected and was always correct.

## The guard

`scripts/check-contrast.mjs` verifies every foreground/background pair this
package ships, and CI fails the build if any pair misses its stated level. A
ratio written in prose is a claim; the script is the evidence.

```bash
npm run check:contrast
```

Adding a colour to a token file without adding its pairs to that script is the
one change reviewers should always reject.

## Fixing the brand guide

The correction belongs upstream in `shard-brand-skill`. Until it lands there,
this package is the authority for the accessible value, and the two disagree.
That is recorded here deliberately rather than left as a silent divergence.
