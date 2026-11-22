/**
 * Presentation helpers for the Claim Status Tracker card, split out of the
 * component file so React Fast Refresh stays happy (a module that mixes
 * component and non-component exports can't hot-reload in place).
 *
 * These mirror the deployed asaInsuranceClaimStatus LWC exactly.
 */

export type ClaimBucket = 'submitted' | 'review' | 'approved' | 'paid' | 'denied';
export type StepState = 'done' | 'current' | 'upcoming' | 'denied';

/** The canonical happy-path pipeline; denied claims render Submitted → Denied. */
export const DEFAULT_TRACK = ['Submitted', 'Review', 'Approved', 'Paid'];

/** Status bucket → accent + which step is current. */
export function normalizeClaimStatus(status?: string): ClaimBucket {
  const raw = String(status || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'submitted' || raw === 'filed' || raw === 'new' || raw === 'received') return 'submitted';
  if (raw === 'review' || raw === 'inreview' || raw === 'processing' || raw === 'investigating' || raw === 'pending') return 'review';
  if (raw === 'approved' || raw === 'accepted') return 'approved';
  if (raw === 'paid' || raw === 'settled' || raw === 'closed' || raw === 'complete' || raw === 'completed') return 'paid';
  if (raw === 'denied' || raw === 'declined' || raw === 'rejected') return 'denied';
  return 'review';
}

export function normalizeStepState(state?: string): StepState {
  const raw = String(state || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'done' || raw === 'complete' || raw === 'completed' || raw === 'passed') return 'done';
  if (raw === 'current' || raw === 'active' || raw === 'inprogress') return 'current';
  if (raw === 'denied' || raw === 'declined' || raw === 'rejected') return 'denied';
  return 'upcoming';
}

/** Derive a step track from a status bucket when no explicit steps are given. */
export function deriveSteps(bucket: ClaimBucket): { label: string; state: StepState }[] {
  if (bucket === 'denied') {
    return [
      { label: 'Submitted', state: 'done' },
      { label: 'Denied', state: 'denied' },
    ];
  }
  const currentIndex = DEFAULT_TRACK.map((s) => s.toLowerCase()).indexOf(bucket);
  return DEFAULT_TRACK.map((label, i) => {
    let state: StepState = 'upcoming';
    if (bucket === 'paid') state = 'done';
    else if (i < currentIndex) state = 'done';
    else if (i === currentIndex) state = 'current';
    return { label, state };
  });
}

export function formatMoney(amount: number, currency = 'USD'): string {
  const num = Number(amount);
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number.isNaN(num) ? 0 : num);
  } catch {
    return `${currency} ${(Number.isNaN(num) ? 0 : num).toFixed(2)}`;
  }
}

/** ISO yyyy-mm-dd → "Jul 28, 2026" (parsed as a local date to avoid a tz day-shift). */
export function formatClaimDate(value?: string): string {
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
