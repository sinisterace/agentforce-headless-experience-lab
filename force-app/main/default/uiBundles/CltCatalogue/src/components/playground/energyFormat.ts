/**
 * Shared presentation helpers for the ASA Energy & Utilities cards (Outage
 * Tracker, Usage & Cost, Budget Billing, Rebate Offers). Split out of the
 * component files so React Fast Refresh stays happy. These mirror the deployed
 * LWCs exactly (same normalization + chart geometry + money math), so the
 * catalogue preview renders what Enhanced Chat v2 renders.
 */

export const ENERGY_PALETTE = ['#d97706', '#0f766e', '#b45309', '#a16207', '#78716c', '#0369a1'];

export function money(amount: number, currency = 'USD', maxFractionDigits = 2): string {
  const n = Number(amount);
  if (!isFinite(n)) return '';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: maxFractionDigits }).format(n);
  } catch {
    return `${currency} ${n.toFixed(maxFractionDigits)}`;
  }
}

/* ── Outage Tracker ──────────────────────────────────────────────────────── */

export type OutageStatus = 'investigating' | 'outage' | 'restoring' | 'restored';
export const OUTAGE_STATUS_LABELS: Record<OutageStatus, string> = {
  investigating: 'Investigating',
  outage: 'Power outage',
  restoring: 'Restoring power',
  restored: 'Power restored',
};

export function normOutageStatus(s?: string): OutageStatus {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'restored' || raw === 'resolved' || raw === 'back') return 'restored';
  if (raw === 'restoring' || raw === 'repairing' || raw === 'onsite') return 'restoring';
  if (raw === 'investigating' || raw === 'assessing' || raw === 'reported') return 'investigating';
  return 'outage';
}

export type StepState = 'done' | 'current' | 'todo';
export function normStepState(s?: string): StepState {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'done' || raw === 'complete' || raw === 'completed') return 'done';
  if (raw === 'current' || raw === 'active' || raw === 'inprogress' || raw === 'progress') return 'current';
  return 'todo';
}

/** Default restoration track derived from status when steps are omitted. */
export function deriveOutageSteps(status: OutageStatus): { label: string; state: StepState }[] {
  const stages = ['Outage detected', 'Crew dispatched', 'On site — repairing', 'Power restored'];
  const currentIndex: Record<OutageStatus, number> = { investigating: 0, outage: 1, restoring: 2, restored: 4 };
  const ci = currentIndex[status];
  return stages.map((label, i) => ({ label, state: (i < ci ? 'done' : i === ci ? 'current' : 'todo') as StepState }));
}

/* ── Budget Billing chart ────────────────────────────────────────────────── */

export function budgetChart(actual: number[] | undefined, budget: number | undefined): { line: string; area: string; budgetLine: string } | null {
  const nums = (Array.isArray(actual) ? actual : []).map(Number).filter((n) => isFinite(n));
  if (nums.length < 2) return null;
  const w = 100;
  const h = 44;
  const pad = 4;
  const hasBudget = typeof budget === 'number' && isFinite(budget);
  const all = hasBudget ? nums.concat([budget as number]) : nums.slice();
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const step = (w - pad * 2) / (nums.length - 1);
  const yFor = (v: number) => Math.round((pad + (h - pad * 2) * (1 - (v - min) / span)) * 100) / 100;
  const pts = nums.map((v, i) => [Math.round((pad + i * step) * 100) / 100, yFor(v)] as [number, number]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const last = pts[pts.length - 1];
  const area = `${line} L${last[0]},${h} L${pts[0][0]},${h} Z`;
  const budgetLine = hasBudget ? `M${pad},${yFor(budget as number)} L${w - pad},${yFor(budget as number)}` : '';
  return { line, area, budgetLine };
}

/* ── Rebate Offers ───────────────────────────────────────────────────────── */

export const REBATE_CATEGORY_LABELS: Record<string, string> = {
  thermostat: 'Thermostat',
  hvac: 'HVAC',
  heat_pump: 'Heat pump',
  ev_charger: 'EV charger',
  solar: 'Solar',
  insulation: 'Insulation',
  water_heater: 'Water heater',
  appliance: 'Appliance',
};

export function rebateCategoryLabel(cat?: string): string {
  const raw = String(cat || '').toLowerCase().replace(/[^a-z_]/g, '');
  if (!raw) return '';
  return REBATE_CATEGORY_LABELS[raw] || raw.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}
