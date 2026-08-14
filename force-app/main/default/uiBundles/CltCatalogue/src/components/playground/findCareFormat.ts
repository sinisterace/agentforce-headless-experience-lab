import { Ambulance, Building2, FlaskConical, Hospital, Pill, PlusSquare, Stethoscope, Video } from 'lucide-react';

/**
 * Presentation helpers for the Find Care Near You card, split out of the
 * component file so React Fast Refresh stays happy.
 *
 * These mirror the deployed asaHealthcareFindCare LWC exactly.
 */

export type FacilityBucket =
  | 'urgentcare'
  | 'er'
  | 'primarycare'
  | 'pharmacy'
  | 'clinic'
  | 'hospital'
  | 'lab'
  | 'telehealth';

/** Normalize a free-text facility type to one of the card buckets. */
export function facilityBucket(t?: string): FacilityBucket {
  const raw = String(t || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'urgentcare' || raw === 'urgent') return 'urgentcare';
  if (raw === 'er' || raw === 'emergency' || raw === 'emergencyroom') return 'er';
  if (raw === 'primarycare' || raw === 'primary' || raw === 'doctor' || raw === 'gp') return 'primarycare';
  if (raw === 'pharmacy' || raw === 'drugstore' || raw === 'rx') return 'pharmacy';
  if (raw === 'hospital') return 'hospital';
  if (raw === 'lab' || raw === 'laboratory' || raw === 'labs') return 'lab';
  if (raw === 'telehealth' || raw === 'video' || raw === 'virtual') return 'telehealth';
  return 'clinic';
}

export function facilityLabel(bucket: FacilityBucket): string {
  switch (bucket) {
    case 'urgentcare':
      return 'Urgent care';
    case 'er':
      return 'Emergency room';
    case 'primarycare':
      return 'Primary care';
    case 'pharmacy':
      return 'Pharmacy';
    case 'hospital':
      return 'Hospital';
    case 'lab':
      return 'Lab';
    case 'telehealth':
      return 'Telehealth';
    default:
      return 'Clinic';
  }
}

/** Card icon by facility bucket. */
export function facilityIcon(bucket: FacilityBucket) {
  switch (bucket) {
    case 'urgentcare':
      return PlusSquare;
    case 'er':
      return Ambulance;
    case 'primarycare':
      return Stethoscope;
    case 'pharmacy':
      return Pill;
    case 'hospital':
      return Hospital;
    case 'lab':
      return FlaskConical;
    case 'telehealth':
      return Video;
    default:
      return Building2;
  }
}

/** A tel: href from a phone string, or "" when there is nothing dialable. */
export function telHref(phone?: string): string {
  const cleaned = String(phone || '').replace(/[^0-9+]/g, '');
  return cleaned ? `tel:${cleaned}` : '';
}
