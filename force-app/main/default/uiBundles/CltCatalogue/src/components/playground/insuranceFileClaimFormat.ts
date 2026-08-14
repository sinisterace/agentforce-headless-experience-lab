import { CarFront, ShieldAlert, CloudRain, Droplets, Flame, Square, Scale, Activity, HelpCircle } from 'lucide-react';

/**
 * Presentation helpers for the File a Claim card, split out of the component
 * file so React Fast Refresh stays happy (a module that mixes component and
 * non-component exports can't hot-reload in place).
 *
 * These mirror the deployed asaInsuranceFileClaim LWC exactly.
 */

export type IncidentIcon =
  | 'collision'
  | 'theft'
  | 'weather'
  | 'water'
  | 'fire'
  | 'glass'
  | 'liability'
  | 'medical'
  | 'other';

/** Normalize a free-text incident icon hint to one of the tile buckets. */
export function normalizeIncidentIcon(icon?: string): IncidentIcon {
  const raw = String(icon || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'collision' || raw === 'crash' || raw === 'accident') return 'collision';
  if (raw === 'theft' || raw === 'stolen' || raw === 'burglary' || raw === 'breakin') return 'theft';
  if (raw === 'weather' || raw === 'storm' || raw === 'hail' || raw === 'wind') return 'weather';
  if (raw === 'water' || raw === 'flood' || raw === 'leak') return 'water';
  if (raw === 'fire' || raw === 'smoke') return 'fire';
  if (raw === 'glass' || raw === 'windshield' || raw === 'window') return 'glass';
  if (raw === 'liability' || raw === 'injury' || raw === 'thirdparty') return 'liability';
  if (raw === 'medical' || raw === 'health' || raw === 'illness') return 'medical';
  return 'other';
}

/** Tile icon by incident bucket. */
export function incidentIcon(icon?: string) {
  switch (normalizeIncidentIcon(icon)) {
    case 'collision':
      return CarFront;
    case 'theft':
      return ShieldAlert;
    case 'weather':
      return CloudRain;
    case 'water':
      return Droplets;
    case 'fire':
      return Flame;
    case 'glass':
      return Square;
    case 'liability':
      return Scale;
    case 'medical':
      return Activity;
    default:
      return HelpCircle;
  }
}
