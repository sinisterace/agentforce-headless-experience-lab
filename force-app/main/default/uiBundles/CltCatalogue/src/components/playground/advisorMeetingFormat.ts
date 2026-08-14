import { Phone, Video, Landmark } from 'lucide-react';

/**
 * Presentation helpers for the Advisor Appointment card, split out of the
 * component file so React Fast Refresh stays happy (a module that mixes
 * component and non-component exports can't hot-reload in place).
 *
 * These mirror the deployed asaFinServAdvisorMeeting LWC exactly.
 */

/** Normalize a free-text meetingType to one of video | phone | branch. */
export function normalizeMeetingType(meetingType?: string): 'video' | 'phone' | 'branch' {
  const raw = String(meetingType || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'video' || raw === 'virtual' || raw === 'online' || raw === 'zoom') return 'video';
  if (raw === 'phone' || raw === 'call' || raw === 'audio') return 'phone';
  if (raw === 'inbranch' || raw === 'branch' || raw === 'inperson' || raw === 'office') return 'branch';
  return 'video';
}

/** Slot icon by meeting type. */
export function meetingTypeIcon(meetingType?: string) {
  switch (normalizeMeetingType(meetingType)) {
    case 'phone':
      return Phone;
    case 'branch':
      return Landmark;
    default:
      return Video;
  }
}

export function meetingTypeLabel(meetingType?: string): string {
  switch (normalizeMeetingType(meetingType)) {
    case 'phone':
      return 'Phone call';
    case 'branch':
      return 'In branch';
    default:
      return 'Video';
  }
}

/** ISO yyyy-mm-dd → "Thu, Aug 14" (parsed as a local date to avoid a tz day-shift). */
export function formatMeetingDate(value?: string): string {
  if (!value) return '';
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  try {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(d);
  } catch {
    return s;
  }
}

/** "09:00"/"9:00" 24h → "9:00 AM". A string already carrying am/pm passes through. */
export function formatMeetingTime(value?: string): string {
  if (!value) return '';
  const s = String(value).trim();
  if (/[ap]\.?m\.?/i.test(s)) return s.toUpperCase().replace(/\s+/g, ' ');
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return s;
  let h = Number(m[1]);
  const min = m[2];
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${min} ${period}`;
}

/**
 * ISO yyyy-mm-dd → { weekday:"Thu", day:"14", month:"August" } for the calendar
 * date tile. Returns null for non-ISO input (caller shows raw text). Mirrors the
 * LWC formatDateParts.
 */
export function formatMeetingDateParts(
  value?: string,
): { weekday: string; day: string; month: string } | null {
  const s = String(value || '');
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  try {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return {
      weekday: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d),
      day: new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(d),
      month: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(d),
    };
  } catch {
    return null;
  }
}

/** Advisor avatar initials — from explicit `initials` or derived from the name. */
export function advisorInitials(name: string, initials?: string): string {
  const explicit = (initials || '').trim();
  if (explicit) return explicit;
  const derived = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
  return derived || 'A';
}
