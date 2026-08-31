#!/usr/bin/env node
/**
 * brains-a11y — contrast verifier.
 *
 * Exists because the approved Shard brand guide shipped a documented pair
 * (#D99518 on white, claimed 4.6:1 AA) that actually measures 2.54:1 and
 * fails. A stated ratio is not evidence; this script is. CI runs it, so a
 * failing pair cannot enter the token files unnoticed.
 *
 * Usage:  node scripts/check-contrast.mjs [--json]
 * Exit:   0 all pairs pass their stated requirement, 1 otherwise.
 */

const REQUIRED = { AA: 4.5, 'AA-large': 3, AAA: 7 };

function channel(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function ratio(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Every foreground/background pair the token files actually ship. */
export const PAIRS = [
  // ── Shard · Midnight (dark) ──────────────────────────────────────────────
  ['#E2E8F0', '#0A1628', 'AA',       'shard/midnight ink on bg'],
  ['#94A3B8', '#0A1628', 'AA',       'shard/midnight ink-muted on bg'],
  ['#E2E8F0', '#132842', 'AA',       'shard/midnight ink on surface'],
  ['#94A3B8', '#132842', 'AA',       'shard/midnight ink-muted on surface'],
  ['#FCC14D', '#0A1628', 'AA',       'shard/midnight accent gold on bg'],
  ['#0A1628', '#FCC14D', 'AA',       'shard/midnight accent-ink on gold'],
  ['#5EEAD4', '#0A1628', 'AA',       'shard/midnight accent teal on bg'],
  ['#0A1628', '#5EEAD4', 'AA',       'shard/midnight accent-ink on teal'],
  ['#93C5FD', '#0A1628', 'AA',       'shard/midnight accent blue on bg'],
  ['#0A1628', '#93C5FD', 'AA',       'shard/midnight accent-ink on blue'],

  // ── Shard · Bone (light) ─────────────────────────────────────────────────
  ['#0A1628', '#F5EDD8', 'AA',       'shard/bone ink on bg'],
  ['#475569', '#F5EDD8', 'AA',       'shard/bone ink-muted on bg'],
  ['#0A1628', '#FFFFFF', 'AA',       'shard/bone ink on surface'],
  ['#475569', '#FFFFFF', 'AA',       'shard/bone ink-muted on surface'],
  ['#7A5500', '#F5EDD8', 'AA',       'shard/bone accent gold on bg'],
  ['#7A5500', '#FFFFFF', 'AA',       'shard/bone accent gold on surface'],
  ['#FFFFFF', '#7A5500', 'AA',       'shard/bone accent-ink on gold'],
  ['#0F766E', '#F5EDD8', 'AA',       'shard/bone accent teal on bg'],
  ['#FFFFFF', '#0F766E', 'AA',       'shard/bone accent-ink on teal'],
  ['#1D4ED8', '#F5EDD8', 'AA',       'shard/bone accent blue on bg'],
  ['#FFFFFF', '#1D4ED8', 'AA',       'shard/bone accent-ink on blue'],

  // ── BRAINS · Midnight (dark) ─────────────────────────────────────────────
  ['#F5F5F5', '#0A0A0A', 'AA',       'brains/midnight ink on bg'],
  ['#9B9B9B', '#131313', 'AA',       'brains/midnight ink-muted on panel'],
  ['#FCC14D', '#0A0A0A', 'AA',       'brains/midnight accent gold on bg'],
  ['#0A0A0A', '#FCC14D', 'AA',       'brains/midnight accent-ink on gold'],
  ['#5EEAD4', '#0A0A0A', 'AA',       'brains/midnight accent teal on bg'],
  ['#93C5FD', '#0A0A0A', 'AA',       'brains/midnight accent blue on bg'],

  // ── BRAINS · Bone (light) ────────────────────────────────────────────────
  ['#1A1A1A', '#FFFFFF', 'AA',       'brains/bone ink on bg'],
  ['#5A5A5A', '#FFFFFF', 'AA',       'brains/bone ink-muted on bg'],
  ['#7A5500', '#FFFFFF', 'AA',       'brains/bone accent gold on bg'],
  ['#0F766E', '#FFFFFF', 'AA',       'brains/bone accent teal on bg'],
  ['#1D4ED8', '#FFFFFF', 'AA',       'brains/bone accent blue on bg'],

  // ── Soft contrast: lower luminance, but body text still has to clear AA ──
  ['#C9D3E0', '#131E2E', 'AA',       'shard/midnight-soft ink on bg'],
  ['#C9D3E0', '#1B2839', 'AA',       'shard/midnight-soft ink on surface'],
  ['#FCC14D', '#131E2E', 'AA',       'shard/midnight-soft accent on bg'],
  ['#24303F', '#EDE6D4', 'AA',       'shard/bone-soft ink on bg'],
  ['#24303F', '#F5F0E4', 'AA',       'shard/bone-soft ink on surface'],
  ['#7A5500', '#EDE6D4', 'AA',       'shard/bone-soft accent on bg'],
  ['#D6D6D6', '#17171A', 'AA',       'brains/midnight-soft ink on bg'],
  ['#FCC14D', '#17171A', 'AA',       'brains/midnight-soft accent on bg'],
  ['#26262A', '#F2F2F0', 'AA',       'brains/bone-soft ink on bg'],
  ['#7A5500', '#F2F2F0', 'AA',       'brains/bone-soft accent on bg'],

  ['#9BA9BC', '#131E2E', 'AA',       'shard/midnight-soft ink-muted on bg'],
  ['#566476', '#EDE6D4', 'AA',       'shard/bone-soft ink-muted on bg'],
  ['#8A8A8A', '#17171A', 'AA',       'brains/midnight-soft ink-muted on bg'],
  ['#6A6A6A', '#F2F2F0', 'AA',       'brains/bone-soft ink-muted on bg'],

  // ── Paper tint (beta) still has to carry body text ───────────────────────
  ['#0A1628', '#F7EFE0', 'AA',       'shard/bone tint-warm ink on bg'],
  ['#0A1628', '#EAF0F4', 'AA',       'shard/bone tint-cool ink on bg'],
  ['#7A5500', '#F7EFE0', 'AA',       'shard/bone tint-warm accent on bg'],
  ['#7A5500', '#EAF0F4', 'AA',       'shard/bone tint-cool accent on bg'],

  // ── Interactive control boundaries need 3:1 — SC 1.4.11 ──────────────────
  ['#697A92', '#0A1628', 'AA-large', 'shard/midnight control border on bg'],
  ['#697A92', '#132842', 'AA-large', 'shard/midnight control border on surface'],
  ['#7D735C', '#F5EDD8', 'AA-large', 'shard/bone control border on bg'],
  ['#7D735C', '#FFFFFF', 'AA-large', 'shard/bone control border on surface'],
  ['#6A6A6A', '#0A0A0A', 'AA-large', 'brains/midnight control border on bg'],
  ['#6A6A6A', '#131313', 'AA-large', 'brains/midnight control border on surface'],
  ['#818181', '#FFFFFF', 'AA-large', 'brains/bone control border on bg'],
  ['#818181', '#F5F5F5', 'AA-large', 'brains/bone control border on surface'],

  // ── High-contrast muted text must reach AAA ──────────────────────────────
  ['#CBD5E1', '#0A1628', 'AAA',      'shard/midnight ink-muted-high on bg'],
  ['#1E293B', '#F5EDD8', 'AAA',      'shard/bone ink-muted-high on bg'],
];

function run({ json = false } = {}) {
  const results = PAIRS.map(([fg, bg, level, label]) => {
    const r = ratio(fg, bg);
    return { fg, bg, level, label, ratio: Math.round(r * 100) / 100, pass: r >= REQUIRED[level] };
  });
  const failed = results.filter((r) => !r.pass);

  if (json) {
    console.log(JSON.stringify({ results, failed: failed.length }, null, 2));
  } else {
    for (const r of results) {
      const mark = r.pass ? 'PASS' : 'FAIL';
      console.log(
        `  ${mark}  ${String(r.ratio).padStart(6)}:1  ${r.level.padEnd(9)} ${r.label}`,
      );
    }
    console.log(
      `\n  ${results.length - failed.length}/${results.length} pairs pass.`,
    );
  }
  return failed.length === 0;
}

const invokedDirectly =
  process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (invokedDirectly) {
  const ok = run({ json: process.argv.includes('--json') });
  process.exit(ok ? 0 : 1);
}
