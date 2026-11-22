/**
 * Shared presentation helpers + payload shapes for the Agentforce Coworker
 * ("ecw") team-track cards. Split out of the card components so React Fast
 * Refresh stays happy and so the previews mirror the (future) deployed LWCs
 * exactly — same number formatting + segment geometry. The first bespoke card
 * is the Sales "My pipeline" snapshot; more will land here per department.
 *
 * Design family note (see docs/memory + the design-DNA brief): the ecw cards
 * are tuned to look native to the real Agentforce Coworker "Ask" surface — a
 * clean light surface, deep-navy ink, a single Coworker-blue accent, and a
 * subtly tinted hero — while keeping the bespoke tells of the Energy/Mfg cards
 * (monospace tabular numerals, hand-drawn viz, never-blank sample data,
 * container queries). The reference exemplar is the Sales "My pipeline" card.
 */

/** Sequential Coworker-blue ramp (deep → light), stepped by stage ORDER so the
 *  funnel leads with the deepest, boldest band and lightens toward the close.
 *  Single-hue by design: a stage's identity is carried by its row label +
 *  value, so color never has to be told apart — colorblind-safe, no legend. */
export const ECW_PIPE_RAMP = ['#0b5cae', '#1372cf', '#2f8aed', '#5aa6f5', '#86c0fa', '#a9d3fd'];

/** Numeric guard — mirrors the LWC `num()` so preview == deployed. */
export function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return isFinite(n) ? n : fallback;
}

export function money(amount: number, currency = 'USD', maxFractionDigits = 2): string {
  const n = Number(amount);
  if (!isFinite(n)) return '';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: maxFractionDigits }).format(n);
  } catch {
    return `${currency} ${n.toFixed(maxFractionDigits)}`;
  }
}

/** Compact currency for hero/stat figures: 1_420_000 → "$1.42M", 320_000 →
 *  "$320K". Falls back to full `money()` for non-USD so the symbol stays right. */
export function compactMoney(amount: number, currency = 'USD'): string {
  const n = Number(amount);
  if (!isFinite(n)) return '';
  if (currency !== 'USD') return money(n, currency, 0);
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  const strip = (v: number) => String(Number(v.toFixed(2)));
  if (abs >= 1e9) return `${sign}$${strip(abs / 1e9)}B`;
  if (abs >= 1e6) return `${sign}$${strip(abs / 1e6)}M`;
  if (abs >= 1e3) return `${sign}$${Math.round(abs / 1e3)}K`;
  return money(n, currency, 0);
}

/* ── Sales · My pipeline ─────────────────────────────────────────────────── */

export type PipelineStage = { label: string; amount: number };
/** One horizontal stage bar: width is the stage's share of the LARGEST stage. */
export type PipelineBar = { label: string; amount: number; pct: number; color: string };
/** A 2×2 stat tile. `state` drives the semantic color on the value + its LED. */
export type PipelineStat = { label: string; value: string; state?: 'good' | 'warn' | 'bad' };

export type EcwPipelinePayload = {
  title: string;
  /** Eyebrow above the title, e.g. "This quarter · QTD". */
  periodLabel: string;
  /** Freshness chip, e.g. "Updated 2 min ago". */
  updatedText?: string;
  currency?: string;
  /** The one hero number — total open pipeline. */
  openTotal: number;
  /** Quarter-over-quarter delta as a percent; positive is good (green). */
  deltaPct?: number;
  deltaText?: string;
  /** Open pipeline by stage → segmented bar + hairline legend. */
  stages: PipelineStage[];
  /** The 2×2 tiles (open opps, closing this month, win rate, avg deal). */
  stats: PipelineStat[];
  /** Primary action label. */
  submitText?: string;
};

/** Baked sample so the card never renders blank (mirrors the LWC test mode). */
export const PIPELINE_TEST: EcwPipelinePayload = {
  title: 'My pipeline',
  periodLabel: 'This quarter · QTD',
  updatedText: 'Updated 2 min ago',
  currency: 'USD',
  openTotal: 1_420_000,
  deltaPct: 8,
  deltaText: 'vs last quarter',
  stages: [
    { label: 'Prospecting', amount: 420_000 },
    { label: 'Qualification', amount: 380_000 },
    { label: 'Proposal', amount: 350_000 },
    { label: 'Negotiation', amount: 270_000 },
  ],
  stats: [
    { label: 'Open opportunities', value: '12' },
    { label: 'Closing this month', value: '$320K' },
    { label: 'Win rate (QTD)', value: '34%', state: 'good' },
    { label: 'Avg deal size', value: '$118K' },
  ],
  submitText: 'Open in CRM',
};

/** Per-stage horizontal bars: each stage's width is its share of the LARGEST
 *  stage (a common baseline, so magnitudes compare directly), floored so a tiny
 *  stage stays visible; color steps along the ramp in pipeline order. */
export function pipelineBars(stages: PipelineStage[]): PipelineBar[] {
  const valid = (Array.isArray(stages) ? stages : []).filter((s) => s && isFinite(Number(s.amount)) && Number(s.amount) > 0);
  const max = valid.reduce((m, s) => Math.max(m, num(s.amount)), 0) || 1;
  return valid.map((s, i) => ({
    label: s.label,
    amount: num(s.amount),
    pct: Math.max(6, Math.round((num(s.amount) / max) * 100)),
    color: ECW_PIPE_RAMP[Math.min(i, ECW_PIPE_RAMP.length - 1)],
  }));
}
