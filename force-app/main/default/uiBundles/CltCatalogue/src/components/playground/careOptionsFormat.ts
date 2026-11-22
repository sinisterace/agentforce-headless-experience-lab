import { CalendarDays, MessageSquare, Phone, Pill, PlusSquare, TriangleAlert, Video } from 'lucide-react';

/**
 * Presentation helpers for the Care Options router card, split out of the
 * component file so React Fast Refresh stays happy.
 *
 * These mirror the deployed asaHealthcareCareOptions LWC exactly.
 */

export type ChannelBucket = 'nurseline' | 'video' | 'inperson' | 'urgent' | 'er' | 'pharmacy' | 'message';
export type ActionKind = 'call' | 'link' | 'book';

/** Normalize a free-text channel to one of the row buckets. */
export function channelBucket(c?: string): ChannelBucket {
  const raw = String(c || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'nurseline' || raw === 'nurse' || raw === 'advice') return 'nurseline';
  if (raw === 'video' || raw === 'telehealth' || raw === 'virtual') return 'video';
  if (raw === 'inperson' || raw === 'clinic' || raw === 'office') return 'inperson';
  if (raw === 'urgent' || raw === 'urgentcare') return 'urgent';
  if (raw === 'er' || raw === 'emergency' || raw === 'ers') return 'er';
  if (raw === 'pharmacy' || raw === 'rx') return 'pharmacy';
  return 'message';
}

/** Row icon by channel bucket. */
export function channelIcon(bucket: ChannelBucket) {
  switch (bucket) {
    case 'nurseline':
      return Phone;
    case 'video':
      return Video;
    case 'inperson':
      return CalendarDays;
    case 'urgent':
      return PlusSquare;
    case 'er':
      return TriangleAlert;
    case 'pharmacy':
      return Pill;
    default:
      return MessageSquare;
  }
}

/** Normalize a free-text action type to call | link | book. */
export function actionKind(a?: string): ActionKind {
  const raw = String(a || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'call' || raw === 'phone') return 'call';
  if (raw === 'link' || raw === 'url' || raw === 'web') return 'link';
  return 'book';
}

/** A tel: href, or "" when there is nothing dialable. */
export function telHref(value?: string): string {
  const cleaned = String(value || '').replace(/[^0-9+]/g, '');
  return cleaned ? `tel:${cleaned}` : '';
}
