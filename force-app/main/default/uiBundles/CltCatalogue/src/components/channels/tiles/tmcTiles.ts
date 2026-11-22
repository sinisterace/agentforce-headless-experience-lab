import type { TileNode } from './TileRenderer';
import type {
  PlanComparePlan,
  TmcPlanComparePayload,
  TmcDataUsagePayload,
  TmcServiceStatusPayload,
  TmcBillExplainerPayload,
} from '@/components/playground/payloads';

/**
 * Per-CLT BuilderKit tile builders for the Technology, Media & Comms CLTs. Each
 * returns a Slack "tile/mosaic" node tree (see TileRenderer) composed from the
 * CLT's LWC-true payload — the authentic way these CLTs render in Slack
 * (declarative Block Kit tiles), distinct from the live LWC preview used in the
 * playground. Data is resolved inline rather than left as "{!$attrs.…}" bindings
 * since we render with the payload in hand. Empty arrays fall back to the same
 * test-mode sample data the editors show, so the tile surface always renders.
 */

const t = (definition: string, attributes?: Record<string, any>, children?: TileNode[]): TileNode => ({ type: 'block', definition, attributes, children });
const text = (text: string, attributes: Record<string, any> = {}): TileNode => t('tile/text', { text, ...attributes });

/** Wrap card content in a mosaic → single container → padded column. */
function shell(children: TileNode[]): TileNode {
  return t('tile/mosaic', undefined, [
    t('tile/container', undefined, [t('tile/column', { gap: 'md', padding: 'md' }, children)]),
  ]);
}

/** Bold section title with a leading TMC glyph. */
function titleRow(icon: string, title: string): TileNode {
  return t('tile/row', { gap: 'sm', align: 'center' }, [
    t('tile/icon', { name: icon, size: 'md', color: 'primary' }),
    text(title, { variant: 'h2', weight: 'bold' }),
  ]);
}

/* ── Formatting (mirrors playground/tmcFormat.ts) ─────────────────────────── */

function money(amount: number, currency = 'USD'): string {
  const n = Number(amount);
  if (!isFinite(n)) return '';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: n % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

/** Show up to one decimal, no trailing ".0". */
function trimNum(n: number): string {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

function cadenceSuffix(cadence?: string): string {
  const raw = String(cadence || 'mo').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'yr' || raw === 'year' || raw === 'yearly' || raw === 'annual' || raw === 'annually') return '/yr';
  if (raw === 'wk' || raw === 'week' || raw === 'weekly') return '/wk';
  return '/mo';
}

/* ── Status normalization (mirrors playground/tmcFormat.ts) ───────────────── */

type ServiceState = 'operational' | 'degraded' | 'down' | 'maintenance';
type OverallState = 'operational' | 'degraded' | 'outage' | 'maintenance';

const STATUS_RANK: Record<ServiceState, number> = { operational: 0, maintenance: 1, degraded: 2, down: 3 };
const STATUS_LABEL: Record<ServiceState, string> = { operational: 'Operational', maintenance: 'Maintenance', degraded: 'Degraded', down: 'Down' };
const OVERALL_LABEL: Record<OverallState, string> = {
  operational: 'All systems operational',
  degraded: 'Some services degraded',
  outage: 'Service outage',
  maintenance: 'Scheduled maintenance',
};

/** Badge variants are class-driven (success | warning | danger | info | secondary). */
const STATUS_BADGE: Record<ServiceState, string> = { operational: 'success', maintenance: 'info', degraded: 'warning', down: 'danger' };
const STATUS_ICON_COLOR: Record<ServiceState, string> = { operational: 'success', maintenance: 'info', degraded: 'warning', down: 'danger' };
const OVERALL_BADGE: Record<OverallState, string> = { operational: 'success', degraded: 'warning', outage: 'danger', maintenance: 'info' };
const OVERALL_ICON: Record<OverallState, string> = { operational: 'check-circle', degraded: 'alert', outage: 'error', maintenance: 'settings' };
const OVERALL_ICON_COLOR: Record<OverallState, string> = { operational: 'success', degraded: 'warning', outage: 'danger', maintenance: 'info' };

function normStatus(s?: string): ServiceState {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'down' || raw === 'outage' || raw === 'offline' || raw === 'unavailable' || raw === 'major') return 'down';
  if (raw === 'degraded' || raw === 'partial' || raw === 'slow' || raw === 'issues' || raw === 'minor' || raw === 'impaired') return 'degraded';
  if (raw === 'maintenance' || raw === 'scheduled' || raw === 'planned') return 'maintenance';
  return 'operational';
}

function normOverall(o?: string): OverallState {
  const raw = String(o || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'outage' || raw === 'down' || raw === 'major') return 'outage';
  if (raw === 'degraded' || raw === 'partial' || raw === 'minor' || raw === 'issues') return 'degraded';
  if (raw === 'maintenance' || raw === 'scheduled' || raw === 'planned') return 'maintenance';
  return 'operational';
}

function overallFromServices(states: ServiceState[]): OverallState {
  const worst = states.reduce((acc, s) => Math.max(acc, STATUS_RANK[s] ?? 0), 0);
  return worst >= 3 ? 'outage' : worst === 2 ? 'degraded' : worst === 1 ? 'maintenance' : 'operational';
}

/** Map a service to one of TileRenderer's allowed icon names. */
function serviceIconName(icon?: string, name?: string): string {
  const raw = String(icon || name || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw.includes('internet') || raw.includes('wifi') || raw.includes('broadband') || raw.includes('fiber') || raw.includes('data')) return 'wifi';
  if (raw.includes('tv') || raw.includes('cable') || raw.includes('stream') || raw.includes('video')) return 'tv';
  if (raw.includes('mobile') || raw.includes('cell') || raw.includes('wireless')) return 'smartphone';
  if (raw.includes('voice') || raw.includes('landline') || raw.includes('homephone') || raw.includes('call')) return 'phone';
  if (raw.includes('home') || raw.includes('smart') || raw.includes('security')) return 'building';
  return 'signal';
}

/** Discount branch of tmcFormat.normBillCategory — the only categorization the tile needs. */
function isDiscountCat(c?: string): boolean {
  const raw = String(c || '').toLowerCase().replace(/[^a-z]/g, '');
  return raw === 'discount' || raw === 'credit' || raw === 'promo' || raw === 'adjustment';
}

/* ── Test-mode sample data (mirrors the editor previews) ──────────────────── */

const TEST_PLANS: PlanComparePlan[] = [
  { id: 'essential', name: 'Essential', price: 45, tagline: 'For light users', features: ['10 GB premium data', '5G nationwide', 'SD streaming'] },
  { id: 'unlimited', name: 'Unlimited Plus', price: 70, tagline: 'Our most popular plan', badge: 'Most popular', recommended: true, features: ['Unlimited premium data', 'HD streaming', '50 GB hotspot', '5G Ultra Capacity'] },
  { id: 'premium', name: 'Premium 5G', price: 90, tagline: 'Everything, maxed out', features: ['Unlimited premium data', '4K UHD streaming', '100 GB hotspot', 'Global roaming'] },
];

const TEST_USAGE: TmcDataUsagePayload = {
  title: 'Your data this cycle',
  cycleText: '12 days left · resets Sep 30',
  used: 42.1,
  total: 50,
  unit: 'GB',
  categories: [
    { label: 'Streaming', amount: 24.6 },
    { label: 'Social', amount: 9.8 },
    { label: 'Other', amount: 7.7 },
  ],
  note: "You're on track to stay under your limit.",
  submitText: 'Add a data pass',
};

const TEST_STATUS: TmcServiceStatusPayload = {
  title: 'Service status',
  overall: 'degraded',
  headline: "We're aware of an issue affecting your area",
  area: 'SoMa, San Francisco 94103',
  etaText: 'Est. restore by 4:30 PM',
  updatedText: 'Updated 2 min ago',
  services: [
    { id: 'internet', name: 'Internet', status: 'down', detail: 'Fiber node offline', icon: 'internet' },
    { id: 'tv', name: 'TV', status: 'degraded', detail: 'Some channels affected', icon: 'tv' },
    { id: 'mobile', name: 'Mobile', status: 'operational', icon: 'mobile' },
    { id: 'voice', name: 'Home phone', status: 'operational', icon: 'voice' },
  ],
  submitText: "Notify me when it's fixed",
};

const TEST_BILL: TmcBillExplainerPayload = {
  title: 'Your September bill',
  currency: 'USD',
  total: 118.4,
  dueDateText: 'Due Sep 28',
  periodText: 'Sep 1 – Sep 30',
  items: [
    { id: 'plan', label: 'Unlimited Plus plan', amount: 70, category: 'plan' },
    { id: 'device', label: 'iPhone installment', amount: 27.08, category: 'device' },
    { id: 'stream', label: 'Streaming add-on', amount: 9.99, category: 'streaming' },
    { id: 'taxes', label: 'Taxes & fees', amount: 11.33, category: 'taxes' },
  ],
  deltaAmount: 12.4,
  deltaText: 'You added the Streaming add-on this cycle.',
  note: 'Autopay is on. This amount will be charged automatically.',
  submitText: 'Pay now',
  secondaryText: 'Set up autopay',
};

/* ── #1 Plan Comparison ───────────────────────────────────────────────────── */
function planCompare(p: TmcPlanComparePayload): TileNode {
  const rawPlans = (p.plans ?? []).filter((x) => x && x.id && x.name);
  const isTest = rawPlans.length === 0;
  const title = (isTest ? 'Compare plans' : p.title) || 'Compare plans';
  const subtitle = isTest ? 'Pick the plan that fits how you use your phone' : p.subtitle;
  const currency = p.currency || 'USD';
  const cadence = cadenceSuffix(p.cadence);
  const currentPlanId = isTest ? 'essential' : (p.currentPlanId || '');
  const plans = (isTest ? TEST_PLANS : rawPlans).slice(0, 3);

  const cards = plans.map((pl) => {
    const isCurrent = !!currentPlanId && pl.id === currentPlanId;
    const recommended = !!pl.recommended && !isCurrent;
    const badge = (pl.badge || '').trim();
    const features = (pl.features ?? []).filter(Boolean);

    const kids: TileNode[] = [];
    if (isCurrent) kids.push(t('tile/badge', { label: 'Current plan', variant: 'secondary' }));
    else if (badge) kids.push(t('tile/badge', { label: badge, variant: recommended ? 'success' : 'info' }));
    else if (recommended) kids.push(t('tile/badge', { label: 'Recommended', variant: 'success' }));

    kids.push(t('tile/row', { justify: 'between', align: 'center' }, [
      t('tile/column', { gap: 'none' }, [
        text(pl.name, { variant: 'body', weight: 'bold' }),
        ...(pl.tagline ? [text(pl.tagline, { variant: 'caption', color: 'muted' })] : []),
      ]),
      t('tile/column', { gap: 'none', align: 'end' }, [
        text(money(pl.price, pl.currency || currency), { variant: 'h4', weight: 'bold' }),
        text(cadence, { variant: 'caption', color: 'muted' }),
      ]),
    ]));

    if (features.length) {
      kids.push(t('tile/column', { gap: 'xs' }, features.map((f) =>
        t('tile/row', { gap: 'sm', align: 'center' }, [
          t('tile/icon', { name: 'check-circle', size: 'sm', color: 'success' }),
          text(f, { variant: 'caption' }),
        ]),
      )));
    }

    kids.push(t('tile/button', {
      label: isCurrent ? 'Current plan' : 'Select',
      variant: isCurrent ? 'default' : recommended ? 'primary' : 'default',
    }));

    return t('tile/container', undefined, [t('tile/column', { gap: 'sm', padding: 'sm' }, kids)]);
  });

  const kids: TileNode[] = [titleRow('smartphone', title)];
  if (subtitle) kids.push(text(subtitle, { variant: 'caption', color: 'muted' }));
  kids.push(t('tile/divider'), t('tile/column', { gap: 'sm' }, cards));
  return shell(kids);
}

/* ── #2 Data Usage Meter ──────────────────────────────────────────────────── */
function dataUsage(p: TmcDataUsagePayload): TileNode {
  const isTest = !Number.isFinite(p.used as number);
  const src = isTest ? TEST_USAGE : p;
  const title = (src.title && src.title.trim()) || 'Your usage';
  const unit = src.unit || 'GB';
  const used = Math.max(0, Number(src.used) || 0);
  const totalNum = src.total == null ? null : Number(src.total);
  const isUnlimited = totalNum === null || !isFinite(totalNum) || totalNum <= 0;

  let usedLabel: string;
  let remainLabel: string;
  let remainVariant: string;
  let fillVariant: string;
  let over = false;
  if (isUnlimited) {
    usedLabel = `${trimNum(used)} ${unit} used`;
    remainLabel = 'Unlimited';
    remainVariant = 'success';
    fillVariant = 'success';
  } else {
    const total = totalNum as number;
    const frac = Math.max(0, Math.min(1, used / total));
    over = used >= total;
    const warn = frac >= 0.8;
    usedLabel = `${trimNum(used)} of ${trimNum(total)} ${unit}`;
    remainLabel = over ? `${trimNum(used - total)} ${unit} over` : `${trimNum(total - used)} ${unit} left`;
    remainVariant = over ? 'danger' : warn ? 'warning' : 'success';
    fillVariant = over ? 'primary' : warn ? 'info' : 'success';
  }

  const kids: TileNode[] = [titleRow('gauge', title)];
  if (src.cycleText) kids.push(text(src.cycleText, { variant: 'caption', color: 'muted' }));

  kids.push(t('tile/row', { justify: 'between', align: 'center' }, [
    text(usedLabel, { variant: 'h4', weight: 'bold' }),
    t('tile/badge', { label: remainLabel, variant: remainVariant }),
  ]));
  if (!isUnlimited) kids.push(t('tile/progress', { value: used, max: totalNum, variant: fillVariant, showValue: true }));

  const cats = (src.categories ?? []).filter((c) => c && c.label && Number.isFinite(c.amount) && c.amount > 0);
  if (cats.length) {
    kids.push(
      t('tile/divider'),
      text('Breakdown', { variant: 'h4', weight: 'semibold' }),
      t('tile/fields', { items: cats.map((c) => ({ label: c.label, value: `${trimNum(c.amount)} ${unit}` })) }),
    );
  }

  if (src.note) kids.push(text(src.note, { variant: 'caption', color: over ? 'danger' : 'muted' }));
  if (src.submitText) kids.push(t('tile/button', { label: src.submitText, variant: 'primary' }));
  return shell(kids);
}

/* ── #3 Service Status ────────────────────────────────────────────────────── */
function serviceStatus(p: TmcServiceStatusPayload): TileNode {
  const rawServices = (p.services ?? []).filter((s) => s && s.name);
  const isTest = rawServices.length === 0;
  const src = isTest ? TEST_STATUS : p;
  const title = (src.title && src.title.trim()) || 'Service status';
  const services = (isTest ? TEST_STATUS.services : rawServices).slice(0, 6);
  const states = services.map((s) => normStatus(s.status));
  const overall = src.overall ? normOverall(src.overall) : overallFromServices(states);

  const bannerTop = t('tile/row', { justify: 'between', align: 'center' }, [
    t('tile/row', { gap: 'sm', align: 'center' }, [
      t('tile/icon', { name: OVERALL_ICON[overall], size: 'lg', color: OVERALL_ICON_COLOR[overall] }),
      t('tile/column', { gap: 'xs' }, [
        text('Network status', { variant: 'caption', color: 'muted' }),
        t('tile/badge', { label: OVERALL_LABEL[overall], variant: OVERALL_BADGE[overall] }),
      ]),
    ]),
    ...(src.updatedText ? [text(src.updatedText, { variant: 'caption', color: 'muted' })] : []),
  ]);

  const bannerKids: TileNode[] = [bannerTop];
  if (src.headline) bannerKids.push(text(src.headline, { variant: 'body' }));
  const metaChips: TileNode[] = [];
  if (src.area) metaChips.push(t('tile/row', { gap: 'xs', align: 'center' }, [
    t('tile/icon', { name: 'map-pin', size: 'sm', color: 'muted' }),
    text(src.area, { variant: 'caption', color: 'muted' }),
  ]));
  if (src.etaText) metaChips.push(t('tile/row', { gap: 'xs', align: 'center' }, [
    t('tile/icon', { name: 'clock', size: 'sm', color: 'info' }),
    text(src.etaText, { variant: 'caption', color: 'info' }),
  ]));
  if (metaChips.length) bannerKids.push(t('tile/row', { gap: 'md', wrap: true }, metaChips));

  const rows = services.map((s) => {
    const st = normStatus(s.status);
    return t('tile/container', undefined, [
      t('tile/row', { justify: 'between', align: 'center', padding: 'sm' }, [
        t('tile/row', { gap: 'sm', align: 'center' }, [
          t('tile/icon', { name: serviceIconName(s.icon, s.name), size: 'md', color: STATUS_ICON_COLOR[st] }),
          t('tile/column', { gap: 'none' }, [
            text(s.name, { variant: 'body', weight: 'semibold' }),
            text((s.detail && s.detail.trim()) || STATUS_LABEL[st], { variant: 'caption', color: 'muted' }),
          ]),
        ]),
        t('tile/badge', { label: STATUS_LABEL[st], variant: STATUS_BADGE[st] }),
      ]),
    ]);
  });

  const kids: TileNode[] = [
    titleRow('signal', title),
    t('tile/container', undefined, [t('tile/column', { gap: 'sm', padding: 'sm' }, bannerKids)]),
    t('tile/divider'),
    t('tile/column', { gap: 'sm' }, rows),
  ];
  if (src.submitText) kids.push(t('tile/button', { label: src.submitText, variant: 'primary' }));
  return shell(kids);
}

/* ── #4 Bill Explainer ────────────────────────────────────────────────────── */
function billExplainer(p: TmcBillExplainerPayload): TileNode {
  const rawItems = (p.items ?? []).filter((i) => i && i.label && Number.isFinite(i.amount));
  const isTest = rawItems.length === 0 && !Number.isFinite(p.total as number);
  const src = isTest ? TEST_BILL : p;
  const title = (src.title && src.title.trim()) || 'Your bill';
  const currency = src.currency || 'USD';
  const items = (src.items ?? []).filter((i) => i && i.label && Number.isFinite(i.amount));
  const summed = items.reduce((acc, i) => acc + i.amount, 0);
  const total = Number.isFinite(src.total as number) ? (src.total as number) : summed;

  const rows = items.map((i) => {
    const isCredit = isDiscountCat(i.category) || i.amount < 0;
    const abs = Math.abs(i.amount);
    return {
      item: i.label,
      amount: isCredit ? `−${money(abs, currency)}` : money(i.amount, currency),
      amountClass: isCredit ? 'credit' : 'debit',
    };
  });

  const kids: TileNode[] = [titleRow('receipt', title)];
  if (src.periodText) kids.push(text(src.periodText, { variant: 'caption', color: 'muted' }));

  kids.push(t('tile/row', { justify: 'between', align: 'center' }, [
    t('tile/column', { gap: 'none' }, [
      text('Total due', { variant: 'caption', color: 'muted' }),
      text(money(total, currency), { variant: 'h2', weight: 'bold' }),
    ]),
    ...(src.dueDateText ? [t('tile/badge', { label: src.dueDateText, variant: 'info' })] : []),
  ]));

  if (rows.length) {
    kids.push(
      t('tile/divider'),
      t('tile/table', {
        columns: [
          { key: 'item', header: 'Charge' },
          { key: 'amount', header: 'Amount' },
        ],
        rows,
        ariaLabel: 'Bill line items',
        variant: 'striped',
        hoverable: true,
      }),
    );
  }

  const delta = src.deltaAmount;
  const hasDeltaNum = Number.isFinite(delta as number) && (delta as number) !== 0;
  const deltaUp = hasDeltaNum && (delta as number) > 0;
  if (hasDeltaNum || src.deltaText) {
    const body: TileNode[] = [];
    if (hasDeltaNum) {
      body.push(text(
        `${money(Math.abs(delta as number), currency)} ${deltaUp ? 'more than last month' : 'less than last month'}`,
        { variant: 'caption', weight: 'semibold', ...(deltaUp ? {} : { color: 'success' }) },
      ));
    }
    if (src.deltaText) body.push(text(src.deltaText, { variant: 'caption', color: 'muted' }));
    kids.push(t('tile/row', { gap: 'sm', align: 'center' }, [
      t('tile/icon', { name: deltaUp ? 'up' : 'down', size: 'sm', color: deltaUp ? 'warning' : hasDeltaNum ? 'success' : 'muted' }),
      t('tile/column', { gap: 'none' }, body),
    ]));
  }

  if (src.note) kids.push(text(src.note, { variant: 'caption', color: 'muted' }));
  if (src.submitText) kids.push(t('tile/button', { label: src.submitText, variant: 'primary' }));
  if (src.secondaryText) kids.push(t('tile/button', { label: src.secondaryText, variant: 'default' }));
  return shell(kids);
}

/* ── builder map (consumed by tiles/registry) ────────────────────────────── */

/** Per-CLT Slack tile builders for Technology, Media & Comms, keyed by DTO field name. */
export const tmcTileBuilders: Record<string, (payload: any) => TileNode> = {
  tmcPlanCompareJSON: (p) => planCompare(p as TmcPlanComparePayload),
  tmcDataUsageJSON: (p) => dataUsage(p as TmcDataUsagePayload),
  tmcServiceStatusJSON: (p) => serviceStatus(p as TmcServiceStatusPayload),
  tmcBillExplainerJSON: (p) => billExplainer(p as TmcBillExplainerPayload),
};
