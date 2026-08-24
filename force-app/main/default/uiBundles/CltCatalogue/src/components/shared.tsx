import { useState } from 'react';
import {
  Activity,
  Building2,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  Car,
  ClipboardList,
  Cpu,
  Gauge,
  GitCompareArrows,
  PackageSearch,
  MapPin,
  Pill,
  Power,
  PiggyBank,
  BarChart3,
  Ticket,
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
import financialServicesArtwork from '@/assets/brand/industry-financial-services.png';
import healthcareArtwork from '@/assets/brand/industry-healthcare.png';
import insuranceArtwork from '@/assets/brand/industry-insurance.png';
import retailArtwork from '@/assets/brand/industry-retail.png';
import manufacturingArtwork from '@/assets/brand/industry-manufacturing.png';
import energyArtwork from '@/assets/brand/industry-energy.png';
import technologyCommsArtwork from '@/assets/brand/industry-technology-comms.png';
import automotiveArtwork from '@/assets/brand/industry-automotive.png';
import travelHospitalityArtwork from '@/assets/brand/industry-travel-hospitality.png';
import legalArtwork from '@/assets/brand/industry-legal.png';
import hvacArtwork from '@/assets/brand/industry-hvac.png';
import publicSectorArtwork from '@/assets/brand/industry-public-sector.png';

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

const INDUSTRY_ARTWORK: Record<string, string> = {
  financial_services: financialServicesArtwork,
  healthcare: healthcareArtwork,
  insurance: insuranceArtwork,
  retail: retailArtwork,
  manufacturing: manufacturingArtwork,
  energy_utilities: energyArtwork,
  technology_comms: technologyCommsArtwork,
  automotive: automotiveArtwork,
  travel_hospitality: travelHospitalityArtwork,
  legal: legalArtwork,
  hvac: hvacArtwork,
  public_sector: publicSectorArtwork,
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
  plan_compare: GitCompareArrows,
  data_usage: Gauge,
  service_status: Activity,
  bill_explainer: Receipt,
  equipment_monitor: Cpu,
  part_reorder: PackageSearch,
  work_order: ClipboardList,
  quote_builder: FileText,
  outage_tracker: Power,
  usage_cost: BarChart3,
  budget_billing: PiggyBank,
  rebate_offers: Ticket,
};

export function industryIcon(key: string): IconType {
  return INDUSTRY_ICONS[key] ?? Building2;
}

export function industryArtwork(key: string): string | undefined {
  return INDUSTRY_ARTWORK[key];
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
