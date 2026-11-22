import { Car, Cat, Heart, Home, HousePlus, Plane, Umbrella, Activity } from 'lucide-react';

/**
 * Presentation helpers for the Policy Selector card, split out of the component
 * file so React Fast Refresh stays happy (a module that mixes component and
 * non-component exports can't hot-reload in place).
 *
 * These mirror the deployed asaInsurancePolicySelector LWC exactly.
 */

/** Normalize a free-text policy type to one of the icon buckets. */
export function normalizePolicyType(
  type?: string,
): 'auto' | 'home' | 'renters' | 'life' | 'health' | 'umbrella' | 'pet' | 'travel' {
  const raw = String(type || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'home' || raw === 'homeowners' || raw === 'property' || raw === 'dwelling') return 'home';
  if (raw === 'renters' || raw === 'rental' || raw === 'tenant') return 'renters';
  if (raw === 'life' || raw === 'termlife' || raw === 'wholelife') return 'life';
  if (raw === 'health' || raw === 'medical' || raw === 'dental' || raw === 'vision') return 'health';
  if (raw === 'umbrella' || raw === 'liability') return 'umbrella';
  if (raw === 'pet') return 'pet';
  if (raw === 'travel') return 'travel';
  return 'auto';
}

/** Card icon by policy type. */
export function policyTypeIcon(type?: string) {
  switch (normalizePolicyType(type)) {
    case 'home':
      return Home;
    case 'renters':
      return HousePlus;
    case 'life':
      return Heart;
    case 'health':
      return Activity;
    case 'umbrella':
      return Umbrella;
    case 'pet':
      return Cat;
    case 'travel':
      return Plane;
    default:
      return Car;
  }
}

/** Status bucket → pill modifier class suffix. */
export function normalizePolicyStatus(
  status?: string,
): 'active' | 'pending' | 'lapsed' | 'cancelled' | 'neutral' {
  const raw = String(status || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'active' || raw === 'inforce' || raw === 'current') return 'active';
  if (raw === 'pending' || raw === 'inreview' || raw === 'processing') return 'pending';
  if (raw === 'lapsed' || raw === 'expired' || raw === 'pastdue') return 'lapsed';
  if (raw === 'cancelled' || raw === 'canceled' || raw === 'terminated') return 'cancelled';
  return 'neutral';
}

export function formatMoney(amount: number, currency = 'USD'): string {
  const num = Number(amount);
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number.isNaN(num) ? 0 : num);
  } catch {
    return `${currency} ${(Number.isNaN(num) ? 0 : num).toFixed(2)}`;
  }
}

/** ISO yyyy-mm-dd → "Nov 1, 2026" (parsed as a local date to avoid a tz day-shift). */
export function formatPolicyDate(value?: string): string {
  if (!value) return '';
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  try {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  } catch {
    return s;
  }
}
