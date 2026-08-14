import { Building2, Phone, Video } from 'lucide-react';

/**
 * Presentation helpers for the Appointment Scheduler card, split out of the
 * component file so React Fast Refresh stays happy (a module that mixes
 * component and non-component exports can't hot-reload in place).
 *
 * These mirror the deployed asaHealthcareApptScheduler LWC exactly.
 */

export type VisitBucket = 'inperson' | 'video' | 'phone';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Normalize a free-text visit type to one of the slot buckets. */
export function visitBucket(v?: string): VisitBucket {
  const raw = String(v || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'video' || raw === 'telehealth' || raw === 'virtual') return 'video';
  if (raw === 'phone' || raw === 'call' || raw === 'audio') return 'phone';
  return 'inperson';
}

export function visitLabel(bucket: VisitBucket): string {
  if (bucket === 'video') return 'Video';
  if (bucket === 'phone') return 'Phone';
  return 'In person';
}

/** Slot icon by visit bucket. */
export function visitIcon(bucket: VisitBucket) {
  switch (bucket) {
    case 'video':
      return Video;
    case 'phone':
      return Phone;
    default:
      return Building2;
  }
}

/** ISO yyyy-mm-dd → { weekday, dayNum, long } using UTC so the day never drifts. */
export function formatApptDate(iso?: string): { weekday: string; dayNum: string; long: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return { weekday: '', dayNum: String(iso || ''), long: String(iso || '') };
  const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  const wd = WEEKDAYS[dt.getUTCDay()] || '';
  const mo = MONTHS[Number(m[2]) - 1] || '';
  const d = Number(m[3]);
  return { weekday: wd, dayNum: String(d), long: `${wd}, ${mo} ${d}` };
}

/** ISO yyyy-mm-dd → "Aug 2026" month caption, or "" when unparseable. */
export function apptMonthLabel(iso?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return '';
  return `${MONTHS[Number(m[2]) - 1] || ''} ${m[1]}`;
}

/** "HH:MM" (24h) → "9:00 AM". Passes through anything it can't parse. */
export function formatApptTime(hhmm?: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
  if (!m) return String(hhmm || '');
  let h = Number(m[1]);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h %= 12;
  if (h === 0) h = 12;
  return `${h}:${m[2]} ${ampm}`;
}

/** Provider initials: explicit `initials` wins, else derived from the name (Dr. stripped). */
export function providerInitials(provider?: { name?: string; initials?: string }): string {
  if (!provider) return '';
  if (provider.initials) return String(provider.initials).trim().slice(0, 2).toUpperCase();
  const name = provider.name ? String(provider.name).replace(/^dr\.?\s+/i, '').trim() : '';
  if (!name) return '';
  const parts = name.split(/\s+/);
  const first = parts[0] ? parts[0].charAt(0) : '';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}
