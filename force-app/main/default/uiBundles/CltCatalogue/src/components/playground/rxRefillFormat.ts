/**
 * Presentation helpers for the Prescription Refill card, split out of the
 * component file so React Fast Refresh stays happy.
 *
 * These mirror the deployed asaHealthcareRxRefill LWC exactly.
 */

export type RxStatusBucket = 'ok' | 'low' | 'out';

/** Normalize a free-text supply status to ok | low | out. */
export function statusBucket(s?: string): RxStatusBucket {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'low' || raw === 'runninglow' || raw === 'warn') return 'low';
  if (raw === 'out' || raw === 'norefills' || raw === 'none' || raw === 'empty') return 'out';
  return 'ok';
}

/** Default pill text when the payload omits `supplyText`. */
export function statusText(bucket: RxStatusBucket): string {
  if (bucket === 'low') return 'Running low';
  if (bucket === 'out') return 'No refills';
  return 'In stock';
}

/** "N refills left" note, or "" when the count is missing. */
export function refillsNote(refillsLeft?: number): string {
  if (refillsLeft == null || Number.isNaN(Number(refillsLeft))) return '';
  const n = Number(refillsLeft);
  return n === 1 ? '1 refill left' : `${n} refills left`;
}
