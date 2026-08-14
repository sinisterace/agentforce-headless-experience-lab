import { useState } from 'react';
import {
  Building2,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  Car,
  Cpu,
  MapPin,
  Pill,
  Stethoscope,
  Factory,
  FileText,
  Gavel,
  HeartPulse,
  Landmark,
  MapPinned,
  ShieldCheck,
  Layers3,
  LifeBuoy,
  Boxes,
  Plane,
  PlusSquare,
  Receipt,
  Send,
  Sparkles,
  Store,
  Truck,
  Umbrella,
  Undo2,
  Users,
  Wallet,
  Workflow,
  Zap,
} from 'lucide-react';
import type { CompanyProfile } from '@/types/catalog';

type IconType = typeof Store;

/**
 * Icons are presentation, not catalog data — labels always come from the org.
 * Any key the catalog adds without an entry here falls back to a neutral icon
 * rather than breaking the screen. (UI spec §1 icon maps.)
 */
const INDUSTRY_ICONS: Record<string, IconType> = {
  financial_services: Landmark,
  insurance: Umbrella,
  healthcare: HeartPulse,
  retail: Store,
  technology_comms: Cpu,
  manufacturing: Factory,
  energy_utilities: Zap,
  hvac: Building2,
  automotive: Car,
  travel_hospitality: Plane,
  public_sector: Building2,
  legal: Gavel,
  general_customer_service: LifeBuoy,
};

const CAPABILITY_ICONS: Record<string, IconType> = {
  appointment_picker: CalendarDays,
  record_selector: Layers3,
  add_item: PlusSquare,
  account_selector: Wallet,
  transaction_dispute: Receipt,
  advisor_appointment: CalendarClock,
  money_movement: Send,
  policy_selector: ShieldCheck,
  file_a_claim: FileText,
  product_carousel: Boxes,
  status_tracker: Workflow,
  issue_triage: LifeBuoy,
  customer_summary: Users,
  appointment_scheduler: CalendarPlus,
  find_care: MapPin,
  care_options: Stethoscope,
  rx_refill: Pill,
  order_tracking: Truck,
  returns: Undo2,
  store_pickup: MapPinned,
};

export function industryIcon(key: string): IconType {
  return INDUSTRY_ICONS[key] ?? Building2;
}

export function capabilityIcon(key: string): IconType {
  return CAPABILITY_ICONS[key] ?? Sparkles;
}

export function hostnameOf(website: string): string {
  try {
    return new URL(website).hostname;
  } catch {
    return website.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
  }
}

export function initialsOf(companyName: string): string {
  return companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

/**
 * Company monogram. Logos are often unavailable, so the initials are the common
 * path rather than the exception — a broken image falls back to the monogram.
 */
export function CompanyMark({
  profile,
  initials,
  compact = false,
}: {
  profile: CompanyProfile;
  initials: string;
  compact?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <div className={compact ? 'company-mark compact' : 'company-mark'}>
      {profile.logoUrl && !imageFailed ? (
        <img
          src={profile.logoUrl}
          alt={`${profile.companyName} logo`}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span aria-label={`${profile.companyName} initials`}>{initials}</span>
      )}
    </div>
  );
}
