/**
 * Derive a small brand palette from a single accent hex — deterministic, no
 * network or model call. The scan already infers one brand color
 * (CompanyProfile.accentColor); this fans it out into a harmonized set of
 * swatches (tints, shades, and a complementary pop) the user can pick from to
 * drive the CLT accent (--customer-accent). It is synthetic, not the company's
 * literal brand palette — see the build-plan notes for the LLM/scrape options.
 */

export type Swatch = { hex: string; name: string };

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** #rrggbb → {h(0-360), s(0-100), l(0-100)}. Falls back to a safe blue. */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  const int = m ? parseInt(m[1], 16) : 0x0b5cab;
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const mm = ln - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (v: number) => Math.round((v + mm) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/**
 * Four swatches derived from one accent, all in the brand's OWN hue: the
 * primary plus one lighter tint and two darker shades. No complementary color —
 * a complement sits 180° away on the wheel, so a red brand (Target) would sprout
 * a cyan/blue swatch that reads as off-brand. Lightness is clamped so nothing
 * collapses to pure black/white; the primary is always first and exactly the
 * input color (so "no change" is a real, selectable option).
 */
export function derivePalette(hex: string): Swatch[] {
  const { h, s, l } = hexToHsl(hex);
  const sat = clamp(s, 18, 100); // avoid muddy near-greys for the derived hues
  return [
    { hex, name: 'Primary' },
    { hex: hslToHex(h, clamp(sat - 6, 12, 100), clamp(l + 20, 20, 92)), name: 'Light' },
    { hex: hslToHex(h, clamp(sat + 6, 12, 100), clamp(l - 14, 8, 88)), name: 'Deep' },
    { hex: hslToHex(h, clamp(sat + 10, 12, 100), clamp(l - 28, 6, 82)), name: 'Dark' },
  ];
}

export function sameHex(a?: string, b?: string): boolean {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}
