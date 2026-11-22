import type { TileNode } from './TileRenderer';
import type {
  CarouselProduct,
  PickupProduct,
  PickupStore,
  RetailOrderTrackingPayload,
  RetailProductCarouselPayload,
  RetailReturnsPayload,
  RetailStorePickupPayload,
  ReturnItem,
  ReturnReason,
  ReturnResolution,
} from '@/components/playground/payloads';
import {
  formatMoney,
  retailProductImage,
  stepsForStatus,
  stockBucket,
  stockLabel,
  trackStatus,
  trackVehicle,
} from '@/components/playground/retailFormat';

/**
 * Per-CLT BuilderKit tile builders for the ASA Retail CLTs. Each returns a Slack
 * "tile/mosaic" node tree (see TileRenderer) composed from the CLT's LWC-true
 * payload — the authentic way these CLTs render in Slack (declarative tiles),
 * distinct from the live LWC previews in the playground. Data is resolved inline
 * rather than left as "{!$attrs.…}" bindings since we render with the payload in
 * hand, and the same empty-array → test-mode fallbacks the LWC previews use are
 * honoured so a tile is never blank.
 */

const t = (definition: string, attributes?: Record<string, any>, children?: TileNode[]): TileNode => ({ type: 'block', definition, attributes, children });
const text = (text: string, attributes: Record<string, any> = {}): TileNode => t('tile/text', { text, ...attributes });

/** Wrap card content in a mosaic → single container → padded column. */
function shell(children: TileNode[]): TileNode {
  return t('tile/mosaic', undefined, [
    t('tile/container', undefined, [t('tile/column', { gap: 'md', padding: 'md' }, children)]),
  ]);
}

/** in / low / out → Block Kit badge variant. */
const STOCK_BADGE: Record<string, string> = { in: 'success', low: 'warning', out: 'danger' };

/* ── #1 Product Carousel ─────────────────────────────────────────────────── */

const TEST_PRODUCTS: CarouselProduct[] = [
  { id: 'p1', name: 'Trailblazer Running Shoe', sku: 'VR3-BLK-10', category: 'shoes', price: 128, compareAtPrice: 160, rating: 4.7, reviewCount: 2140, badge: '-20%', availability: 'in_stock' },
  { id: 'p2', name: 'Everyday Merino Crew', sku: 'EMC-NVY-M', category: 'apparel', price: 68, rating: 4.8, reviewCount: 512, badge: 'New', availability: 'in_stock' },
];

function productBlock(product: CarouselProduct, payloadCurrency: string): TileNode {
  const bucket = stockBucket(product.availability);
  const isOut = bucket === 'out';
  const currency = product.currency || payloadCurrency || 'USD';
  const onSale = typeof product.compareAtPrice === 'number' && product.compareAtPrice > product.price;
  const img = retailProductImage(product.imageUrl, product.name);

  const info: TileNode[] = [text(product.name || 'Product', { variant: 'body', weight: 'semibold' })];

  const priceRow: TileNode[] = [text(formatMoney(product.price ?? 0, currency), { variant: 'body', weight: 'bold' })];
  if (onSale) priceRow.push(text(formatMoney(product.compareAtPrice as number, currency), { variant: 'caption', color: 'muted' }));
  info.push(t('tile/row', { gap: 'sm', align: 'baseline' }, priceRow));

  if (typeof product.rating === 'number') {
    info.push(t('tile/row', { gap: 'xs', align: 'center' }, [
      t('tile/icon', { name: 'star', size: 'xs', color: 'warning' }),
      text(`${product.rating}${product.reviewCount ? ` (${product.reviewCount})` : ''}`, { variant: 'caption', color: 'muted' }),
    ]));
  }

  const badges: TileNode[] = [];
  if (product.badge) badges.push(t('tile/badge', { label: product.badge, variant: onSale ? 'danger' : 'info' }));
  badges.push(t('tile/badge', { label: stockLabel(bucket), variant: STOCK_BADGE[bucket] }));
  info.push(t('tile/row', { gap: 'xs', wrap: true }, badges));

  const topRow = t('tile/row', { gap: 'md', align: 'center' }, [
    ...(img ? [t('tile/image', { src: img, alt: product.name || 'Product', aspect: 'square', rounded: true })] : []),
    t('tile/column', { gap: 'xs' }, info),
  ]);

  return t('tile/container', undefined, [
    t('tile/column', { gap: 'sm', padding: 'sm' }, [
      topRow,
      t('tile/button', { label: isOut ? 'Unavailable' : product.addLabel || 'Add to cart', variant: isOut ? 'default' : 'primary' }),
    ]),
  ]);
}

function productCarousel(p: RetailProductCarouselPayload): TileNode {
  const isTest = !(p.products && p.products.length);
  const title = (isTest ? 'Picked for you' : p.title) || 'Picked for you';
  const subtitle = isTest ? 'Based on your recent views' : p.subtitle;
  const products = (isTest ? TEST_PRODUCTS : p.products).slice(0, 3);
  const currency = p.currency || 'USD';

  const kids: TileNode[] = [text(title, { variant: 'h2', weight: 'bold' })];
  if (subtitle) kids.push(text(subtitle, { variant: 'caption', color: 'muted' }));
  products.forEach((prod, i) => {
    if (i > 0) kids.push(t('tile/divider'));
    kids.push(productBlock(prod, currency));
  });
  return shell(kids);
}

/* ── #2 Order Tracking ───────────────────────────────────────────────────── */

const TEST_TRACKING: RetailOrderTrackingPayload = {
  title: 'Track order #4821',
  live: true,
  status: 'out_for_delivery',
  etaText: 'Arriving 2:15–2:30 PM',
  courier: { name: 'Alex Rivera', vehicle: 'bike', initials: 'AR', rating: '4.9 ★' },
  destination: { label: 'Home', address: '150 4th St, San Francisco' },
  submitText: 'Message courier',
};

/** Courier vehicle → allowed icon key (bike falls back to the generic truck). */
const COURIER_ICON: Record<string, string> = { van: 'truck', car: 'car', foot: 'footprints', bike: 'truck' };

/** Timeline step state → icon + colour + badge. */
const STEP_CFG: Record<string, { icon: string; color: string; badge: string; variant: string }> = {
  done: { icon: 'check-circle', color: 'success', badge: 'Done', variant: 'success' },
  current: { icon: 'clock', color: 'info', badge: 'In progress', variant: 'info' },
  todo: { icon: 'clock', color: 'muted', badge: 'Upcoming', variant: 'secondary' },
};

function orderTracking(p: RetailOrderTrackingPayload): TileNode {
  const isTest = !p.status && !(p.steps && p.steps.length) && !p.etaText && !p.courier;
  const data = isTest ? TEST_TRACKING : p;
  const title = (data.title && data.title.trim()) || 'Track your order';
  const status = trackStatus(data.status);
  const steps = data.steps && data.steps.length ? data.steps : stepsForStatus(status);

  const header: TileNode[] = [text(title, { variant: 'h2', weight: 'bold' })];
  if (data.live) header.push(t('tile/badge', { label: 'LIVE', variant: 'danger' }));
  const kids: TileNode[] = [t('tile/row', { justify: 'between', align: 'center' }, header)];

  if (data.etaText) {
    const etaKids: TileNode[] = [
      text('Estimated arrival', { variant: 'caption', color: 'muted' }),
      text(data.etaText, { variant: 'body', weight: 'semibold' }),
    ];
    const dest = data.destination;
    if (dest && (dest.label || dest.address)) {
      etaKids.push(t('tile/row', { gap: 'xs', align: 'center' }, [
        t('tile/icon', { name: 'map-pin', size: 'sm', color: 'muted' }),
        text([dest.label, dest.address].filter(Boolean).join(' · '), { variant: 'caption', color: 'muted' }),
      ]));
    }
    kids.push(t('tile/container', undefined, [t('tile/column', { gap: 'xs', padding: 'sm' }, etaKids)]));
  }

  if (data.courier && data.courier.name) {
    const c = data.courier;
    const icon = COURIER_ICON[trackVehicle(c.vehicle)] || 'truck';
    const col: TileNode[] = [text(c.name, { variant: 'body', weight: 'semibold' })];
    if (c.rating) col.push(text(String(c.rating), { variant: 'caption', color: 'muted' }));
    kids.push(t('tile/row', { gap: 'sm', align: 'center' }, [
      t('tile/icon', { name: icon, size: 'md', color: 'primary' }),
      t('tile/column', { gap: 'none' }, col),
    ]));
  }

  kids.push(t('tile/divider'));

  const stepRows = steps.map((s) => {
    const state = ['done', 'current', 'todo'].includes(s.state) ? s.state : 'todo';
    const cfg = STEP_CFG[state];
    const label: TileNode[] = [text(s.label, { variant: 'body', weight: state === 'current' ? 'semibold' : 'regular' })];
    if (s.time) label.push(text(String(s.time), { variant: 'caption', color: 'muted' }));
    return t('tile/row', { justify: 'between', align: 'center' }, [
      t('tile/row', { gap: 'sm', align: 'center' }, [
        t('tile/icon', { name: cfg.icon, size: 'md', color: cfg.color }),
        t('tile/column', { gap: 'none' }, label),
      ]),
      t('tile/badge', { label: cfg.badge, variant: cfg.variant }),
    ]);
  });
  kids.push(t('tile/column', { gap: 'sm' }, stepRows));

  const submitText = data.submitText && data.submitText.trim();
  if (submitText) kids.push(t('tile/button', { label: submitText, variant: 'primary' }));

  return shell(kids);
}

/* ── #3 Returns & Exchange ───────────────────────────────────────────────── */

const TEST_ITEMS: ReturnItem[] = [
  { id: 'i1', name: 'Trailblazer Running Shoe', sku: 'VR3-BLK-10', variant: 'Size 10 · Black', price: 128, category: 'shoes' },
  { id: 'i2', name: 'Everyday Merino Crew', sku: 'EMC-NVY-M', variant: 'Medium · Navy', price: 68, category: 'apparel' },
];
const TEST_REASONS: ReturnReason[] = [
  { id: 'too_small', label: 'Too small' },
  { id: 'too_large', label: 'Too large' },
  { id: 'changed_mind', label: 'Changed my mind' },
  { id: 'defective', label: 'Arrived damaged' },
  { id: 'wrong_item', label: 'Wrong item' },
];
const DEFAULT_RESOLUTIONS: ReturnResolution[] = [
  { id: 'refund', kind: 'refund', label: 'Refund' },
  { id: 'exchange', kind: 'exchange', label: 'Exchange' },
  { id: 'credit', kind: 'credit', label: 'Store credit' },
];

function itemRow(it: ReturnItem): TileNode {
  const img = retailProductImage(it.imageUrl, it.name);
  const info: TileNode[] = [text(it.name || 'Item', { variant: 'body', weight: 'semibold' })];
  if (it.variant) info.push(text(it.variant, { variant: 'caption', color: 'muted' }));
  if (it.sku) info.push(text(`SKU ${it.sku}`, { variant: 'caption', color: 'muted' }));
  const left = t('tile/row', { gap: 'md', align: 'center' }, [
    ...(img ? [t('tile/image', { src: img, alt: it.name || 'Item', aspect: 'square', rounded: true })] : []),
    t('tile/column', { gap: 'none' }, info),
  ]);
  const rowKids: TileNode[] = [left];
  if (typeof it.price === 'number') rowKids.push(text(formatMoney(it.price, it.currency || 'USD'), { variant: 'body', weight: 'bold' }));
  return t('tile/container', undefined, [t('tile/row', { justify: 'between', align: 'center', padding: 'sm' }, rowKids)]);
}

function returns(p: RetailReturnsPayload): TileNode {
  const isTest = !(p.items && p.items.length);
  const title = (isTest ? 'Start a return' : p.title) || 'Start a return';
  const subtitle = isTest ? "Choose what you'd like to send back" : p.subtitle;
  const orderLabel = isTest ? 'Order #4821 · Mar 2' : p.orderLabel;
  const items = isTest ? TEST_ITEMS : p.items;
  const reasons = isTest ? TEST_REASONS : p.reasons ?? [];
  const resolutions = p.resolutions && p.resolutions.length ? p.resolutions : DEFAULT_RESOLUTIONS;
  const submitText = (p.submitText && p.submitText.trim()) || 'Continue return';

  const kids: TileNode[] = [text(title, { variant: 'h2', weight: 'bold' })];
  const sub = [subtitle, orderLabel].filter(Boolean).join(' · ');
  if (sub) kids.push(text(sub, { variant: 'caption', color: 'muted' }));

  kids.push(text('Items to return', { variant: 'h4', weight: 'semibold' }));
  kids.push(t('tile/column', { gap: 'sm' }, items.map(itemRow)));

  if (reasons.length) {
    kids.push(t('tile/divider'));
    kids.push(text('Reason for return', { variant: 'h4', weight: 'semibold' }));
    kids.push(t('tile/row', { gap: 'sm', wrap: true }, reasons.map((r) => t('tile/button', { label: r.label, variant: 'default' }))));
  }
  if (resolutions.length) {
    kids.push(t('tile/divider'));
    kids.push(text('Resolution', { variant: 'h4', weight: 'semibold' }));
    kids.push(t('tile/row', { gap: 'sm', wrap: true }, resolutions.map((r) => t('tile/button', { label: r.label, variant: 'default' }))));
  }

  kids.push(t('tile/button', { label: submitText, variant: 'primary' }));
  return shell(kids);
}

/* ── #4 Store Pickup ─────────────────────────────────────────────────────── */

const TEST_STORES: PickupStore[] = [
  { id: 's1', name: 'Union Square', distance: '0.4 mi', availability: 'in_stock', pickupEta: 'Ready in 2 hours', address: '333 Post St, San Francisco', hours: 'Open until 9:00 PM', phone: '+14155550142' },
  { id: 's2', name: 'Marina District', distance: '2.1 mi', availability: 'low', pickupEta: 'Ready tomorrow 10 AM', address: '2190 Chestnut St, San Francisco', hours: 'Open until 8:00 PM', phone: '+14155550171' },
  { id: 's3', name: 'Stonestown Galleria', distance: '5.6 mi', availability: 'out', address: '3251 20th Ave, San Francisco', hours: 'Open until 9:00 PM' },
];

function storeBlock(st: PickupStore, index: number): TileNode {
  const bucket = stockBucket(st.availability);
  const isOut = bucket === 'out';

  const head: TileNode[] = [text(st.name || 'Store', { variant: 'body', weight: 'semibold' })];
  if (index === 0 && !isOut) head.push(t('tile/badge', { label: 'Best match', variant: 'info' }));

  const leftCol: TileNode[] = [t('tile/row', { gap: 'sm', align: 'center' }, head)];
  if (st.distance) leftCol.push(text(st.distance, { variant: 'caption', color: 'muted' }));

  const blockKids: TileNode[] = [
    t('tile/row', { justify: 'between', align: 'center' }, [
      t('tile/column', { gap: 'none' }, leftCol),
      t('tile/badge', { label: stockLabel(bucket), variant: STOCK_BADGE[bucket] }),
    ]),
  ];
  if (!isOut && st.pickupEta) {
    blockKids.push(t('tile/row', { gap: 'xs', align: 'center' }, [
      t('tile/icon', { name: 'clock', size: 'sm', color: 'muted' }),
      text(st.pickupEta, { variant: 'caption', color: 'muted' }),
    ]));
  }
  if (st.address) {
    blockKids.push(t('tile/row', { gap: 'xs', align: 'center' }, [
      t('tile/icon', { name: 'map-pin', size: 'sm', color: 'muted' }),
      text(st.address, { variant: 'caption', color: 'muted' }),
    ]));
  }
  if (st.hours) blockKids.push(text(st.hours, { variant: 'caption', color: 'muted' }));

  return t('tile/container', undefined, [t('tile/column', { gap: 'xs', padding: 'sm' }, blockKids)]);
}

function storePickup(p: RetailStorePickupPayload): TileNode {
  const isTest = !(p.stores && p.stores.length);
  const title = (isTest ? 'Pick up in store' : p.title) || 'Pick up in store';
  const subtitle = isTest ? 'Ready today at a store near you' : p.subtitle;
  const product: PickupProduct | undefined = isTest
    ? { name: 'Trailblazer Running Shoe', variant: 'Size 10 · Black', category: 'shoes' }
    : p.product;
  const stores = (isTest ? TEST_STORES : p.stores).slice(0, 3);
  const submitText = (p.submitText && p.submitText.trim()) || 'Reserve for pickup';

  const kids: TileNode[] = [text(title, { variant: 'h2', weight: 'bold' })];
  if (subtitle) kids.push(text(subtitle, { variant: 'caption', color: 'muted' }));

  if (product && product.name) {
    const img = retailProductImage(product.imageUrl, product.name);
    const info: TileNode[] = [text(product.name, { variant: 'body', weight: 'semibold' })];
    if (product.variant) info.push(text(product.variant, { variant: 'caption', color: 'muted' }));
    kids.push(t('tile/container', undefined, [
      t('tile/row', { gap: 'md', align: 'center', padding: 'sm' }, [
        ...(img ? [t('tile/image', { src: img, alt: product.name, aspect: 'square', rounded: true })] : []),
        t('tile/column', { gap: 'none' }, info),
      ]),
    ]));
  }

  const nearby = stores.filter((st) => stockBucket(st.availability) !== 'out').length;
  kids.push(text(`${nearby} store${nearby === 1 ? '' : 's'} nearby`, { variant: 'caption', color: 'muted' }));
  kids.push(t('tile/divider'));

  kids.push(t('tile/column', { gap: 'sm' }, stores.map((st, i) => storeBlock(st, i))));

  kids.push(t('tile/button', { label: submitText, variant: 'primary' }));
  return shell(kids);
}

/* ── builder map (consumed by tiles/registry) ────────────────────────────── */

/** Per-CLT Slack tile builders for ASA Retail, keyed by DTO field name. */
export const retailTileBuilders: Record<string, (payload: any) => TileNode> = {
  retailProductCarouselJSON: (p) => productCarousel(p as RetailProductCarouselPayload),
  retailOrderTrackingJSON: (p) => orderTracking(p as RetailOrderTrackingPayload),
  retailReturnsJSON: (p) => returns(p as RetailReturnsPayload),
  retailStorePickupJSON: (p) => storePickup(p as RetailStorePickupPayload),
};
