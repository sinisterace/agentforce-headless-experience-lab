import {
  Bike,
  Car,
  CreditCard,
  Footprints,
  Home,
  Mountain,
  Package,
  RefreshCw,
  RotateCcw,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  Shirt,
  ToyBrick,
  Truck,
  Watch,
} from 'lucide-react';
import trailblazerRunningShoe from '@/assets/retail/trailblazer-running-shoe-v2.jpg';
import everydayMerinoCrew from '@/assets/retail/everyday-merino-crew.jpg';

/**
 * Shared presentation helpers for the ASA Retail cards (Product Carousel,
 * Order Tracking, Returns, Store Pickup). Split out of the component files so
 * React Fast Refresh stays happy. These mirror the deployed LWCs exactly.
 */

/* ── Product category → glyph + hue (placeholder tiles, no photo needed) ─── */

export type ProductCategory =
  | 'apparel'
  | 'shoes'
  | 'electronics'
  | 'beauty'
  | 'home'
  | 'grocery'
  | 'accessories'
  | 'outdoors'
  | 'toys'
  | 'general';

/** Normalize a free-text category to one of the placeholder buckets. */
export function productCategory(c?: string): ProductCategory {
  const raw = String(c || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'apparel' || raw === 'clothing' || raw === 'clothes' || raw === 'fashion') return 'apparel';
  if (raw === 'shoes' || raw === 'footwear' || raw === 'sneakers') return 'shoes';
  if (raw === 'electronics' || raw === 'tech' || raw === 'gadgets' || raw === 'phone') return 'electronics';
  if (raw === 'beauty' || raw === 'cosmetics' || raw === 'skincare') return 'beauty';
  if (raw === 'home' || raw === 'homegoods' || raw === 'furniture' || raw === 'kitchen') return 'home';
  if (raw === 'grocery' || raw === 'groceries' || raw === 'food') return 'grocery';
  if (raw === 'accessories' || raw === 'accessory' || raw === 'jewelry' || raw === 'watches') return 'accessories';
  if (raw === 'outdoors' || raw === 'outdoor' || raw === 'sports' || raw === 'fitness') return 'outdoors';
  if (raw === 'toys' || raw === 'toy' || raw === 'kids' || raw === 'games') return 'toys';
  return 'general';
}

/** Placeholder-tile glyph by category. */
export function productIcon(cat: ProductCategory) {
  switch (cat) {
    case 'apparel':
      return Shirt;
    case 'shoes':
      return Footprints;
    case 'electronics':
      return Smartphone;
    case 'beauty':
      return Sparkles;
    case 'home':
      return Home;
    case 'grocery':
      return ShoppingBasket;
    case 'accessories':
      return Watch;
    case 'outdoors':
      return Mountain;
    case 'toys':
      return ToyBrick;
    default:
      return Package;
  }
}

/** A cohesive hue per category, used to tint the no-photo product tile. */
export function productHue(cat: ProductCategory): string {
  switch (cat) {
    case 'apparel':
      return '#6366f1';
    case 'shoes':
      return '#0ea5e9';
    case 'electronics':
      return '#475569';
    case 'beauty':
      return '#ec4899';
    case 'home':
      return '#f59e0b';
    case 'grocery':
      return '#22c55e';
    case 'accessories':
      return '#a855f7';
    case 'outdoors':
      return '#10b981';
    case 'toys':
      return '#ef4444';
    default:
      return '#8b5cf6';
  }
}

/**
 * Use an explicit payload image when provided, otherwise enrich the catalogue's
 * two sample products with bundle-owned photography. Unknown products continue
 * to use the category glyph, so arbitrary agent payloads remain safe.
 */
export function retailProductImage(imageUrl?: string, name?: string): string {
  const explicit = String(imageUrl || '').trim();
  if (explicit) return explicit;
  const normalizedName = String(name || '').toLowerCase();
  if (normalizedName.includes('trailblazer') && (normalizedName.includes('shoe') || normalizedName.includes('runner'))) {
    return trailblazerRunningShoe;
  }
  if (normalizedName.includes('merino') || normalizedName.includes('crew')) {
    return everydayMerinoCrew;
  }
  return '';
}

/* ── Money + rating ──────────────────────────────────────────────────────── */

/** Format a numeric price as currency; falls back gracefully for odd input. */
export function formatMoney(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

/** Split a 0–5 rating into full / half / empty star counts for rendering. */
export function starParts(rating?: number): { full: number; half: boolean; empty: number } {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  const full = Math.floor(r);
  const half = r - full >= 0.25 && r - full < 0.75;
  const rounded = r - full >= 0.75 ? full + 1 : full;
  const filled = half ? full : rounded;
  return { full: filled, half, empty: 5 - filled - (half ? 1 : 0) };
}

/* ── Availability (shared by Carousel + Store Pickup) ────────────────────── */

export type StockBucket = 'in' | 'low' | 'out';

export function stockBucket(a?: string): StockBucket {
  const raw = String(a || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'out' || raw === 'outofstock' || raw === 'soldout' || raw === 'unavailable') return 'out';
  if (raw === 'low' || raw === 'limited' || raw === 'fewleft') return 'low';
  return 'in';
}

export function stockLabel(bucket: StockBucket): string {
  if (bucket === 'out') return 'Out of stock';
  if (bucket === 'low') return 'Low stock';
  return 'In stock';
}

/* ── Order tracking ──────────────────────────────────────────────────────── */

export type TrackVehicle = 'bike' | 'van' | 'car' | 'foot';

export function trackVehicle(v?: string): TrackVehicle {
  const raw = String(v || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'van' || raw === 'truck' || raw === 'delivery') return 'van';
  if (raw === 'car' || raw === 'auto') return 'car';
  if (raw === 'foot' || raw === 'walk' || raw === 'walking' || raw === 'courier') return 'foot';
  return 'bike';
}

export function vehicleIcon(v: TrackVehicle) {
  switch (v) {
    case 'van':
      return Truck;
    case 'car':
      return Car;
    case 'foot':
      return Footprints;
    default:
      return Bike;
  }
}

/** Canonical order statuses, in order, and the default timeline they seed. */
const TRACK_FLOW = ['submitted', 'packed', 'out_for_delivery', 'delivered'] as const;
export type TrackStatus = (typeof TRACK_FLOW)[number];

export function trackStatus(s?: string): TrackStatus {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'delivered' || raw === 'complete' || raw === 'completed') return 'delivered';
  if (raw === 'outfordelivery' || raw === 'ontheway' || raw === 'shipping' || raw === 'intransit') return 'out_for_delivery';
  if (raw === 'packed' || raw === 'ready' || raw === 'preparing' || raw === 'processing') return 'packed';
  return 'submitted';
}

/** Fraction (0–1) of the map route the courier has covered for a status. */
export function routeProgress(status: TrackStatus): number {
  switch (status) {
    case 'submitted':
      return 0.08;
    case 'packed':
      return 0.28;
    case 'out_for_delivery':
      return 0.62;
    default:
      return 1;
  }
}

/** Build the default timeline from a status when the payload omits steps. */
export function stepsForStatus(status: TrackStatus): { label: string; state: string; time?: string }[] {
  const labels = [
    { key: 'submitted', label: 'Order placed' },
    { key: 'packed', label: 'Packed & ready' },
    { key: 'out_for_delivery', label: 'Out for delivery' },
    { key: 'delivered', label: 'Delivered' },
  ];
  const activeIdx = TRACK_FLOW.indexOf(status);
  return labels.map((l, i) => ({
    label: l.label,
    state: i < activeIdx ? 'done' : i === activeIdx ? 'current' : 'todo',
  }));
}

/* ── Return resolutions ──────────────────────────────────────────────────── */

export type ResolutionKind = 'refund' | 'exchange' | 'credit';

export function resolutionKind(k?: string): ResolutionKind {
  const raw = String(k || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'exchange' || raw === 'swap' || raw === 'replace') return 'exchange';
  if (raw === 'credit' || raw === 'storecredit' || raw === 'giftcard') return 'credit';
  return 'refund';
}

export function resolutionIcon(kind: ResolutionKind) {
  switch (kind) {
    case 'exchange':
      return RefreshCw;
    case 'credit':
      return CreditCard;
    default:
      return RotateCcw;
  }
}

/* ── Shared ──────────────────────────────────────────────────────────────── */

/** A tel: href from a phone string, or "" when there is nothing dialable. */
export function telHref(phone?: string): string {
  const cleaned = String(phone || '').replace(/[^0-9+]/g, '');
  return cleaned ? `tel:${cleaned}` : '';
}
