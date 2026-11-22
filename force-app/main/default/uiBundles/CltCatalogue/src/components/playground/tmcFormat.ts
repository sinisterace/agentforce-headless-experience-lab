import {
  Building2,
  Cast,
  Clock,
  MonitorSmartphone,
  PhoneCall,
  Signal,
  Wifi,
} from 'lucide-react';

/**
 * Shared presentation helpers for the ASA Technology, Media & Comms cards
 * (Plan Comparison, Data Usage Meter, Service Status, Bill Explainer). Split
 * out of the component files so React Fast Refresh stays happy. These mirror the
 * deployed LWCs exactly (same normalization + gauge geometry + category hues).
 */

/* ── Money + numbers ─────────────────────────────────────────────────────── */

export function formatMoney(amount: number, currency = 'USD'): string {
  const n = Number(amount);
  if (!isFinite(n)) return '';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: n % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

/** Show up to one decimal, no trailing ".0". */
export function trimNum(n: number): string {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/* ── Plan Comparison ─────────────────────────────────────────────────────── */

export function cadenceSuffix(cadence?: string): string {
  const raw = String(cadence || 'mo').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'yr' || raw === 'year' || raw === 'yearly' || raw === 'annual' || raw === 'annually') return '/yr';
  if (raw === 'wk' || raw === 'week' || raw === 'weekly') return '/wk';
  return '/mo';
}

/* ── Data Usage gauge ────────────────────────────────────────────────────── */

/** 270° of a pathLength=100 circle — matches the LWC gauge track. */
export const GAUGE_TRACK = 75;

export type UsageGauge = {
  isUnlimited: boolean;
  usedLabel: string;
  totalLabel: string;
  remainingLabel: string;
  valueDash: string;
  trackDash: string;
  bucket: 'ok' | 'warn' | 'over' | 'unlimited';
};

export function computeUsage(used: number | undefined, total: number | undefined, unit: string): UsageGauge {
  const u = Math.max(0, Number(used) || 0);
  const t = total == null ? null : Number(total);
  const isUnlimited = t === null || !isFinite(t) || t <= 0;
  const trackDash = `${GAUGE_TRACK} 100`;
  if (isUnlimited) {
    return {
      isUnlimited: true,
      usedLabel: trimNum(u),
      totalLabel: 'Unlimited',
      remainingLabel: `${trimNum(u)} ${unit} used`,
      valueDash: trackDash,
      trackDash,
      bucket: 'unlimited',
    };
  }
  const frac = Math.max(0, Math.min(1, u / (t as number)));
  const over = u >= (t as number);
  const warn = frac >= 0.8;
  return {
    isUnlimited: false,
    usedLabel: trimNum(u),
    totalLabel: `of ${trimNum(t as number)} ${unit}`,
    remainingLabel: over
      ? `${trimNum(u - (t as number))} ${unit} over`
      : `${trimNum((t as number) - u)} ${unit} left`,
    valueDash: `${(GAUGE_TRACK * frac).toFixed(2)} 100`,
    trackDash,
    bucket: over ? 'over' : warn ? 'warn' : 'ok',
  };
}

/** Default hue cycle for usage-category segments without an explicit color. */
export const USAGE_COLORS = ['#0891b2', '#6366f1', '#f59e0b', '#ec4899', '#10b981', '#64748b'];

/* ── Service Status ──────────────────────────────────────────────────────── */

export type ServiceState = 'operational' | 'degraded' | 'down' | 'maintenance';
export type OverallState = 'operational' | 'degraded' | 'outage' | 'maintenance';

const STATUS_RANK: Record<ServiceState, number> = { operational: 0, maintenance: 1, degraded: 2, down: 3 };
export const STATUS_LABEL: Record<ServiceState, string> = {
  operational: 'Operational',
  maintenance: 'Maintenance',
  degraded: 'Degraded',
  down: 'Down',
};

export function normStatus(s?: string): ServiceState {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'down' || raw === 'outage' || raw === 'offline' || raw === 'unavailable' || raw === 'major') return 'down';
  if (raw === 'degraded' || raw === 'partial' || raw === 'slow' || raw === 'issues' || raw === 'minor' || raw === 'impaired') return 'degraded';
  if (raw === 'maintenance' || raw === 'scheduled' || raw === 'planned') return 'maintenance';
  return 'operational';
}

export function normOverall(o?: string): OverallState {
  const raw = String(o || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'outage' || raw === 'down' || raw === 'major') return 'outage';
  if (raw === 'degraded' || raw === 'partial' || raw === 'minor' || raw === 'issues') return 'degraded';
  if (raw === 'maintenance' || raw === 'scheduled' || raw === 'planned') return 'maintenance';
  return 'operational';
}

/** Derive the banner state from the worst individual service. */
export function overallFromServices(states: ServiceState[]): OverallState {
  const worst = states.reduce((acc, s) => Math.max(acc, STATUS_RANK[s] ?? 0), 0);
  return worst >= 3 ? 'outage' : worst === 2 ? 'degraded' : worst === 1 ? 'maintenance' : 'operational';
}

export const OVERALL_LABEL: Record<OverallState, string> = {
  operational: 'All systems operational',
  degraded: 'Some services degraded',
  outage: 'Service outage',
  maintenance: 'Scheduled maintenance',
};

export type ServiceIcon = 'internet' | 'tv' | 'mobile' | 'voice' | 'home' | 'generic';

export function normServiceIcon(i?: string, name?: string): ServiceIcon {
  const raw = String(i || name || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw.includes('internet') || raw.includes('wifi') || raw.includes('broadband') || raw.includes('fiber') || raw.includes('data')) return 'internet';
  if (raw.includes('tv') || raw.includes('cable') || raw.includes('stream') || raw.includes('video')) return 'tv';
  if (raw.includes('mobile') || raw.includes('cell') || raw.includes('wireless')) return 'mobile';
  if (raw.includes('voice') || raw.includes('landline') || raw.includes('homephone') || raw.includes('call')) return 'voice';
  if (raw.includes('home') || raw.includes('smart') || raw.includes('security')) return 'home';
  return 'generic';
}

export function serviceIcon(icon: ServiceIcon) {
  switch (icon) {
    case 'internet':
      return Wifi;
    case 'tv':
      return Cast;
    case 'mobile':
      return MonitorSmartphone;
    case 'voice':
      return PhoneCall;
    case 'home':
      return Building2;
    default:
      return Signal;
  }
}

export { Clock };

/* ── Bill Explainer categories ───────────────────────────────────────────── */

export type BillCategory =
  | 'plan'
  | 'data'
  | 'device'
  | 'streaming'
  | 'taxes'
  | 'onetime'
  | 'discount'
  | 'other';

export const BILL_COLORS: Record<BillCategory, string> = {
  plan: '#0891b2',
  data: '#6366f1',
  device: '#f59e0b',
  streaming: '#ec4899',
  taxes: '#64748b',
  onetime: '#8b5cf6',
  discount: '#15803d',
  other: '#94a3b8',
};

export function normBillCategory(c?: string): BillCategory {
  const raw = String(c || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'plan' || raw === 'service' || raw === 'subscription') return 'plan';
  if (raw === 'data' || raw === 'usage' || raw === 'overage') return 'data';
  if (raw === 'device' || raw === 'equipment' || raw === 'installment' || raw === 'phone' || raw === 'hardware') return 'device';
  if (raw === 'streaming' || raw === 'addon' || raw === 'addons' || raw === 'entertainment') return 'streaming';
  if (raw === 'taxes' || raw === 'tax' || raw === 'fees' || raw === 'fee' || raw === 'surcharge') return 'taxes';
  if (raw === 'onetime' || raw === 'onetimecharge' || raw === 'activation' || raw === 'setup') return 'onetime';
  if (raw === 'discount' || raw === 'credit' || raw === 'promo' || raw === 'adjustment') return 'discount';
  return 'other';
}
