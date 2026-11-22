import type { TileNode } from './TileRenderer';

/**
 * Per-CLT BuilderKit tile builders for the ASA Energy & Utilities CLTs. Each
 * returns a Slack "tile/mosaic" node tree (see TileRenderer) composed from the
 * CLT's LWC-true payload — the authentic way these CLTs render in Slack
 * (declarative Block Kit tiles), distinct from the Enhanced Chat v2 LWC. Data is
 * resolved inline rather than left as "{!$attrs.…}" bindings since we render with
 * the payload in hand. An empty payload drops each builder into the same
 * test-mode sample its playground editor shows, so the Slack surface never
 * renders blank.
 */

const t = (definition: string, attributes?: Record<string, any>, children?: TileNode[]): TileNode => ({ type: 'block', definition, attributes, children });
const text = (text: string, attributes: Record<string, any> = {}): TileNode => t('tile/text', { text, ...attributes });

const num = (v: any): number | null => (Number.isFinite(Number(v)) ? Number(v) : null);

function money(amount: number, currency = 'USD', maxFractionDigits = 2): string {
  const n = Number(amount);
  if (!isFinite(n)) return '';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: maxFractionDigits }).format(n);
  } catch {
    return `${currency} ${n.toFixed(maxFractionDigits)}`;
  }
}

/** Wrap card content in a mosaic → single container → padded column. */
function shell(children: TileNode[]): TileNode {
  return t('tile/mosaic', undefined, [
    t('tile/container', undefined, [t('tile/column', { gap: 'md', padding: 'md' }, children)]),
  ]);
}

/* ── #1 Outage Tracker ───────────────────────────────────────────────────── */

const OUTAGE_STATUS_LABELS: Record<string, string> = {
  investigating: 'Investigating', outage: 'Power outage', restoring: 'Restoring power', restored: 'Power restored',
};
/** Outage state → badge variant (matches the Block Kit status-badge convention). */
const OUTAGE_BADGE: Record<string, string> = {
  investigating: 'warning', outage: 'danger', restoring: 'info', restored: 'success',
};
const STEP_ICON: Record<string, string> = { done: 'check-circle', current: 'bolt', todo: 'clock' };
const STEP_COLOR: Record<string, string> = { done: 'success', current: 'info', todo: 'muted' };

function normOutageStatus(s?: string): string {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'restored' || raw === 'resolved' || raw === 'back') return 'restored';
  if (raw === 'restoring' || raw === 'repairing' || raw === 'onsite') return 'restoring';
  if (raw === 'investigating' || raw === 'assessing' || raw === 'reported') return 'investigating';
  return 'outage';
}

function normStepState(s?: string): string {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'done' || raw === 'complete' || raw === 'completed') return 'done';
  if (raw === 'current' || raw === 'active' || raw === 'inprogress' || raw === 'progress') return 'current';
  return 'todo';
}

/** Default restoration track derived from status when steps are omitted. */
function deriveOutageSteps(status: string): { label: string; state: string }[] {
  const stages = ['Outage detected', 'Crew dispatched', 'On site — repairing', 'Power restored'];
  const currentIndex: Record<string, number> = { investigating: 0, outage: 1, restoring: 2, restored: 4 };
  const ci = currentIndex[status];
  return stages.map((label, i) => ({ label, state: i < ci ? 'done' : i === ci ? 'current' : 'todo' }));
}

const OUTAGE_TEST = {
  title: 'Outage status',
  status: 'restoring',
  headline: 'Crews are on site restoring power',
  area: 'Maple Grove · ZIP 55311',
  cause: 'Storm — downed line',
  affectedText: '1,240 customers affected',
  etaText: 'Est. restore by 6:45 PM',
  updatedText: 'Updated 4 min ago',
  crew: 'Crew #17 on site',
  steps: [
    { label: 'Outage detected', state: 'done', timeText: '3:02 PM' },
    { label: 'Crew dispatched', state: 'done', timeText: '3:40 PM' },
    { label: 'On site — repairing', state: 'current', timeText: '5:15 PM' },
    { label: 'Power restored', state: 'todo' },
  ],
  submitText: 'Text me when power is back',
};

function outageTracker(p: any): TileNode {
  const hasContent = !!(p.headline || p.area || p.cause || (Array.isArray(p.steps) && p.steps.length));
  const src = hasContent ? p : OUTAGE_TEST;

  const status = normOutageStatus(src.status);
  const statusLabel = OUTAGE_STATUS_LABELS[status];
  const rawSteps: any[] = Array.isArray(src.steps) && src.steps.length ? src.steps.filter((s: any) => s && s.label) : deriveOutageSteps(status);
  const steps = rawSteps.map((s) => ({ label: String(s.label), state: normStepState(s.state), timeText: s.timeText }));

  const kids: TileNode[] = [
    text(src.title || 'Outage status', { variant: 'h2', weight: 'bold' }),
    t('tile/row', { gap: 'sm', align: 'center', justify: 'between', wrap: true }, [
      t('tile/badge', { label: statusLabel, variant: OUTAGE_BADGE[status] }),
      ...(src.updatedText ? [text(src.updatedText, { variant: 'caption', color: 'muted' })] : []),
    ]),
  ];
  if (src.headline) kids.push(text(src.headline, { variant: 'body', weight: 'semibold' }));
  if (src.area) {
    kids.push(t('tile/row', { gap: 'xs', align: 'center' }, [
      t('tile/icon', { name: 'map-pin', size: 'sm', color: 'danger' }),
      text(src.area, { variant: 'caption', color: 'muted' }),
    ]));
  }

  const fields: { label: string; value: string }[] = [];
  if (src.cause) fields.push({ label: 'Cause', value: src.cause });
  if (src.affectedText) fields.push({ label: 'Affected', value: src.affectedText });
  if (src.crew) fields.push({ label: 'Crew', value: src.crew });
  if (src.etaText) fields.push({ label: 'Est. restore', value: src.etaText });
  if (fields.length) {
    kids.push(t('tile/divider'), t('tile/fields', { items: fields }));
  }

  if (steps.length) {
    kids.push(t('tile/divider'));
    const stepRows = steps.map((s) => t('tile/row', { gap: 'sm', align: 'center', justify: 'between' }, [
      t('tile/row', { gap: 'sm', align: 'center' }, [
        t('tile/icon', { name: STEP_ICON[s.state], size: 'sm', color: STEP_COLOR[s.state] }),
        text(s.label, s.state === 'todo' ? { variant: 'caption', color: 'muted' } : { variant: 'caption', weight: s.state === 'current' ? 'semibold' : 'regular' }),
      ]),
      ...(s.timeText ? [text(s.timeText, { variant: 'caption', color: 'muted' })] : []),
    ]));
    kids.push(t('tile/column', { gap: 'xs' }, stepRows));
  }

  if (src.submitText) kids.push(t('tile/button', { label: src.submitText, variant: 'primary' }));
  return shell(kids);
}

/* ── #2 Usage & Cost ─────────────────────────────────────────────────────── */

const USAGE_TEST = {
  title: 'Your energy this cycle',
  cycleText: 'Sep 1–30 · 8 days left',
  projectedCost: 142.5,
  currency: 'USD',
  projectedText: 'Projected bill',
  usedUnits: 612,
  unit: 'kWh',
  deltaPct: -8,
  deltaText: 'less than last month',
  bars: [
    { label: 'Wk1', value: 158 },
    { label: 'Wk2', value: 171 },
    { label: 'Wk3', value: 149 },
    { label: 'Wk4', value: 134 },
  ],
  breakdown: [
    { label: 'Heating & cooling', amount: 74.2 },
    { label: 'Water heating', amount: 31.0 },
    { label: 'Always-on', amount: 22.4 },
    { label: 'Other', amount: 14.9 },
  ],
  submitText: 'See ways to save',
};

function usageCost(p: any): TileNode {
  const hasContent = !!(num(p.projectedCost) !== null || num(p.usedUnits) !== null
    || (Array.isArray(p.bars) && p.bars.length) || (Array.isArray(p.breakdown) && p.breakdown.length));
  const src = hasContent ? p : USAGE_TEST;
  const currency = src.currency || 'USD';

  const pc = num(src.projectedCost);
  const used = num(src.usedUnits);
  const dp = num(src.deltaPct);
  const hasDelta = dp !== null && dp !== 0;
  const down = (dp ?? 0) < 0;
  const deltaWords = src.deltaText || (down ? 'less than last month' : 'more than last month');

  const bars = (src.bars ?? []).filter((b: any) => b && num(b.value) !== null).slice(0, 8);
  const maxVal = bars.reduce((m: number, b: any) => Math.max(m, num(b.value) as number), 0) || 1;
  const bd = (src.breakdown ?? []).filter((b: any) => b && b.label && num(b.amount) !== null);

  const kids: TileNode[] = [
    t('tile/row', { gap: 'sm', align: 'baseline', justify: 'between', wrap: true }, [
      text(src.title || 'Your energy this cycle', { variant: 'h2', weight: 'bold' }),
      ...(src.cycleText ? [text(src.cycleText, { variant: 'caption', color: 'muted' })] : []),
    ]),
  ];

  if (pc !== null) {
    kids.push(text(src.projectedText || 'Projected bill', { variant: 'caption', color: 'muted' }));
    const heroRow: TileNode[] = [text(money(pc, currency), { variant: 'h1', weight: 'bold' })];
    if (hasDelta) heroRow.push(t('tile/badge', { label: `${down ? '▼' : '▲'} ${Math.abs(dp as number)}% ${deltaWords}`, variant: down ? 'success' : 'warning' }));
    kids.push(t('tile/row', { gap: 'sm', align: 'center', wrap: true }, heroRow));
  }
  if (used !== null) kids.push(text(`${used.toLocaleString('en-US')} ${src.unit || 'kWh'} used`, { variant: 'caption', color: 'muted' }));

  if (bars.length) {
    kids.push(t('tile/divider'), text('Usage by week', { variant: 'h4', weight: 'semibold' }));
    const barBlocks = bars.map((b: any) => {
      const v = num(b.value) as number;
      return t('tile/column', { gap: 'xs' }, [
        t('tile/row', { gap: 'sm', align: 'baseline', justify: 'between' }, [
          text(b.label || '', { variant: 'caption', color: 'muted' }),
          text(`${v.toLocaleString('en-US')} ${src.unit || 'kWh'}`, { variant: 'caption' }),
        ]),
        t('tile/progress', { value: v, max: maxVal, variant: v >= maxVal ? 'info' : 'primary', showValue: false }),
      ]);
    });
    kids.push(t('tile/column', { gap: 'sm' }, barBlocks));
  }

  if (bd.length) {
    kids.push(t('tile/divider'));
    const rows = bd.map((b: any) => ({ label: b.label, amount: money(num(b.amount) as number, currency) }));
    kids.push(t('tile/table', {
      columns: [
        { key: 'label', header: 'Cost driver' },
        { key: 'amount', header: 'Amount' },
      ],
      rows,
      ariaLabel: 'Cost breakdown',
      variant: 'striped',
      hoverable: true,
    }));
  }

  if (src.submitText) kids.push(t('tile/button', { label: src.submitText, variant: 'primary' }));
  return shell(kids);
}

/* ── #3 Budget Billing ───────────────────────────────────────────────────── */

const BUDGET_TEST = {
  title: 'Smooth out your bill',
  subtitle: 'Budget Billing keeps your payment the same every month',
  currency: 'USD',
  monthlyAmount: 118,
  currentAvgText: 'Your bills now swing $64–$210',
  termText: 'Recalculated every 12 months',
  series: { actual: [96, 120, 168, 210, 150, 88, 64, 72, 110, 175, 190, 140], budget: 118 },
  bullets: ['No surprises in peak season', 'Cancel anytime', 'Settles up once a year'],
  submitText: 'Enroll in Budget Billing',
  secondaryText: 'Maybe later',
};

function budgetBilling(p: any): TileNode {
  const hasContent = !!(num(p.monthlyAmount) !== null
    || (p.series && Array.isArray(p.series.actual) && p.series.actual.length)
    || (Array.isArray(p.bullets) && p.bullets.length));
  const src = hasContent ? p : BUDGET_TEST;
  const currency = src.currency || 'USD';

  const m = num(src.monthlyAmount);
  const actual = (src.series && Array.isArray(src.series.actual) ? src.series.actual : []).map(Number).filter((n: number) => isFinite(n));
  const peak = actual.length ? Math.max(...actual) : null;
  const low = actual.length ? Math.min(...actual) : null;
  const bullets = (src.bullets ?? []).filter(Boolean);

  const kids: TileNode[] = [text(src.title || 'Smooth out your bill', { variant: 'h2', weight: 'bold' })];
  if (src.subtitle) kids.push(text(src.subtitle, { variant: 'body', color: 'muted' }));

  if (m !== null) {
    kids.push(
      text('Your fixed monthly payment', { variant: 'caption', color: 'muted' }),
      text(`${money(m, currency, 0)}/mo`, { variant: 'h1', weight: 'bold', color: 'success' }),
    );
  }

  // Current-vs-flat comparison.
  const currentValue = src.currentAvgText || (low != null && peak != null ? `${money(low, currency, 0)}–${money(peak, currency, 0)}` : '');
  const cmpFields: { label: string; value: string }[] = [];
  if (currentValue) cmpFields.push({ label: 'Your bills now', value: currentValue });
  if (m !== null) cmpFields.push({ label: 'Budget Billing', value: `${money(m, currency, 0)}/mo` });
  if (cmpFields.length) {
    kids.push(t('tile/divider'), t('tile/fields', { items: cmpFields }));
  }

  // Visualize the flat payment against the recent peak.
  if (m !== null && peak != null && peak > 0) {
    kids.push(
      text('Flat payment vs your recent peak', { variant: 'caption', color: 'muted' }),
      t('tile/progress', { value: m, max: peak, variant: 'success', showValue: true }),
    );
  }

  if (bullets.length) {
    kids.push(t('tile/divider'));
    const bulletRows = bullets.map((b: string) => t('tile/row', { gap: 'sm', align: 'center' }, [
      t('tile/icon', { name: 'check-circle', size: 'sm', color: 'success' }),
      text(String(b), { variant: 'caption' }),
    ]));
    kids.push(t('tile/column', { gap: 'xs' }, bulletRows));
  }

  if (src.termText) kids.push(text(src.termText, { variant: 'caption', color: 'muted' }));
  if (src.submitText) kids.push(t('tile/button', { label: src.submitText, variant: 'primary' }));
  if (src.secondaryText) kids.push(t('tile/button', { label: src.secondaryText, variant: 'default' }));
  return shell(kids);
}

/* ── #4 Rebate Offers ────────────────────────────────────────────────────── */

const REBATE_CATEGORY_LABELS: Record<string, string> = {
  thermostat: 'Thermostat', hvac: 'HVAC', heat_pump: 'Heat pump', ev_charger: 'EV charger',
  solar: 'Solar', insulation: 'Insulation', water_heater: 'Water heater', appliance: 'Appliance',
};
const REBATE_ICON: Record<string, string> = {
  thermostat: 'thermometer', hvac: 'fan', heat_pump: 'thermometer', ev_charger: 'car',
  solar: 'sun', insulation: 'home', water_heater: 'thermometer', appliance: 'box',
};

function normCat(cat?: string): string {
  return String(cat || '').toLowerCase().replace(/[^a-z_]/g, '');
}
function rebateCategoryLabel(cat?: string): string {
  const raw = normCat(cat);
  if (!raw) return '';
  return REBATE_CATEGORY_LABELS[raw] || raw.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

const REBATE_TEST = {
  title: 'Rebates you qualify for',
  subtitle: 'Save on energy-efficient upgrades',
  currency: 'USD',
  offers: [
    { id: 'thermostat', name: 'Smart thermostat', category: 'thermostat', rebateAmount: 75, detail: 'ENERGY STAR models', badge: 'Popular' },
    { id: 'heatpump', name: 'Heat pump HVAC', category: 'heat_pump', rebateAmount: 1200, detail: 'Whole-home system' },
    { id: 'evcharger', name: 'Level 2 EV charger', category: 'ev_charger', rebateAmount: 500, detail: 'Install included' },
    { id: 'insulation', name: 'Attic insulation', category: 'insulation', rebateAmount: 350, detail: 'Up to R-49' },
  ],
  submitText: 'Apply for rebate',
};

function rebateOffers(p: any): TileNode {
  const valid = Array.isArray(p.offers) ? p.offers.filter((o: any) => o && o.name) : [];
  const src = valid.length ? p : REBATE_TEST;
  const currency = src.currency || 'USD';
  const offers = (src.offers ?? []).filter((o: any) => o && o.name).slice(0, 3);
  const submitText = (src.submitText && src.submitText.trim()) || 'Apply for rebate';

  const kids: TileNode[] = [text(src.title || 'Rebates you qualify for', { variant: 'h2', weight: 'bold' })];
  if (src.subtitle) kids.push(text(src.subtitle, { variant: 'caption', color: 'muted' }));

  const cards = offers.map((o: any) => {
    const rebate = num(o.rebateAmount);
    const cat = rebateCategoryLabel(o.category);
    const icon = REBATE_ICON[normCat(o.category)] || 'zap';
    const left = t('tile/row', { gap: 'sm', align: 'center' }, [
      t('tile/icon', { name: icon, size: 'md', color: 'primary' }),
      t('tile/column', { gap: 'none' }, [
        text(o.name, { variant: 'body', weight: 'semibold' }),
        ...(cat || o.detail ? [text([cat, o.detail].filter(Boolean).join(' · '), { variant: 'caption', color: 'muted' })] : []),
      ]),
    ]);
    const rightKids: TileNode[] = [];
    if (rebate !== null) {
      rightKids.push(
        text(money(rebate, currency, 0), { variant: 'h4', weight: 'bold', color: 'success' }),
        text('rebate', { variant: 'caption', color: 'muted' }),
      );
    }
    if (o.badge) rightKids.push(t('tile/badge', { label: o.badge, variant: 'info' }));
    return t('tile/container', undefined, [
      t('tile/row', { justify: 'between', align: 'center', padding: 'sm', gap: 'sm' }, [left, t('tile/column', { gap: 'xs', align: 'end' }, rightKids)]),
    ]);
  });
  kids.push(t('tile/column', { gap: 'sm' }, cards));
  kids.push(t('tile/button', { label: submitText, variant: 'primary' }));
  return shell(kids);
}

/* ── builder map (consumed by tiles/registry) ────────────────────────────── */

/** Per-CLT Slack tile builders for Energy & Utilities, keyed by DTO field name. */
export const energyTileBuilders: Record<string, (payload: any) => TileNode> = {
  energyOutageTrackerJSON: (p) => outageTracker(p),
  energyUsageCostJSON: (p) => usageCost(p),
  energyBudgetBillingJSON: (p) => budgetBilling(p),
  energyRebateOffersJSON: (p) => rebateOffers(p),
};
