import type { TileNode } from './TileRenderer';
import type {
  AutoConfiguratorPayload,
  AutoTestDrivePayload,
  AutoVehicleStatusPayload,
  AutoTradeInPayload,
} from '@/components/playground/payloads';

/**
 * Per-CLT BuilderKit tile builders for the ASA Automotive CLTs. Each returns a
 * Slack "tile/mosaic" node tree (see TileRenderer) composed from the CLT's
 * LWC-true payload — the authentic way these CLTs render in Slack (declarative
 * Block Kit tiles), distinct from the live LWC preview in the playground editors.
 * Data is resolved inline rather than left as "{!$attrs.…}" bindings since we
 * render with the payload in hand. Each builder mirrors its editor's test-mode
 * fallback so the tile still renders with an empty payload.
 */

const t = (definition: string, attributes?: Record<string, any>, children?: TileNode[]): TileNode => ({ type: 'block', definition, attributes, children });
const text = (text: string, attributes: Record<string, any> = {}): TileNode => t('tile/text', { text, ...attributes });

function money(amount?: number, currency = 'USD'): string {
  const n = Number(amount);
  if (!isFinite(n)) return '';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${currency} ${Math.round(n)}`;
  }
}

function num(v: unknown): number | null {
  const n = Number(v);
  return isFinite(n) ? n : null;
}

function trimNum(n: number): string {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

function weekdayDate(iso?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return String(iso || '');
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (isNaN(d.getTime())) return String(iso || '');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function time12(hhmm?: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || '').trim());
  if (!m) return String(hhmm || '');
  let h = Number(m[1]);
  const min = m[2];
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${min} ${ap}`;
}

/** True only when a vehicle photo URL is a real, non-empty string (else omit tile/image). */
function hasImage(url: unknown): url is string {
  return typeof url === 'string' && url.trim() !== '';
}

/** Wrap card content in a mosaic → single container → padded column (matches financialServicesTiles). */
function shell(children: TileNode[]): TileNode {
  return t('tile/mosaic', undefined, [
    t('tile/container', undefined, [t('tile/column', { gap: 'md', padding: 'md' }, children)]),
  ]);
}

/** A car-icon + name/trim header row shared by Test Drive, Status and Trade-In. */
function vehicleHead(name: string, sub?: string): TileNode {
  const stack: TileNode[] = [text(name, { variant: 'body', weight: 'semibold' })];
  if (sub) stack.push(text(sub, { variant: 'caption', color: 'muted' }));
  return t('tile/row', { gap: 'sm', align: 'center' }, [
    t('tile/icon', { name: 'car', size: 'lg', color: 'primary' }),
    t('tile/column', { gap: 'none' }, stack),
  ]);
}

/* ── #1 Vehicle Configurator (autoConfiguratorJSON) ──────────────────────────
   Vehicle model + base price → color swatches (badges) → option groups → live
   estimated price → reserve/build CTA. */
const CFG_TEST: AutoConfiguratorPayload = {
  title: 'Build your electric SUV',
  model: 'Electric SUV',
  currency: 'USD',
  basePrice: 41990,
  colors: [
    { id: 'white', label: 'Glacier White', hex: '#f3f4f6', priceDelta: 0 },
    { id: 'black', label: 'Midnight Black', hex: '#111827' },
    { id: 'red', label: 'Radiant Red', hex: '#dc2626', priceDelta: 595, selected: true },
  ],
  optionGroups: [
    { id: 'trim', label: 'Trim', selectedId: 'rs', options: [
      { id: 'lt', label: 'LT', priceDelta: 0 },
      { id: 'rs', label: 'RS', priceDelta: 3200, detail: 'Sport-tuned' },
    ] },
    { id: 'drive', label: 'Drivetrain', selectedId: 'awd', options: [
      { id: 'fwd', label: 'FWD', priceDelta: 0 },
      { id: 'awd', label: 'AWD', priceDelta: 2500 },
    ] },
    { id: 'pkg', label: 'Packages', selectedId: 'tech', options: [
      { id: 'none', label: 'None', priceDelta: 0 },
      { id: 'tech', label: 'Technology Package', priceDelta: 1800, detail: 'Adaptive cruise, HUD' },
    ] },
  ],
  submitText: 'Reserve this build',
};

/** " +$3,200" / " −$500" / "" — compact price delta appended to an option badge. */
function priceSuffix(delta: number | undefined, currency: string): string {
  const n = Number(delta) || 0;
  if (n > 0) return ` +${money(n, currency)}`;
  if (n < 0) return ` −${money(Math.abs(n), currency)}`;
  return '';
}

function configurator(p: AutoConfiguratorPayload): TileNode {
  const hasColors = Array.isArray(p.colors) && p.colors.filter((c) => c && c.id && c.label).length > 0;
  const hasGroups = Array.isArray(p.optionGroups) && p.optionGroups.filter((g) => g && g.label && Array.isArray(g.options) && g.options.length).length > 0;
  const src = !hasColors && !hasGroups ? CFG_TEST : p;
  const currency = src.currency || 'USD';

  const colors = Array.isArray(src.colors) ? src.colors.filter((c) => c && c.id && c.label) : [];
  const groups = Array.isArray(src.optionGroups) ? src.optionGroups.filter((g) => g && g.label && Array.isArray(g.options) && g.options.length) : [];

  // Resolve the selected color + option per group and compute the running total (mirrors the editor).
  const chosenColor = colors.find((c) => c.selected) ?? colors[0];
  const sel: Record<string, string> = {};
  groups.forEach((g) => {
    const valid = g.options.some((o) => o.id === g.selectedId);
    sel[g.id] = valid && g.selectedId ? g.selectedId : g.options[0].id;
  });
  let total = Number(src.basePrice) || 0;
  if (chosenColor) total += Number(chosenColor.priceDelta) || 0;
  groups.forEach((g) => {
    const opt = g.options.find((o) => o.id === sel[g.id]);
    if (opt) total += Number(opt.priceDelta) || 0;
  });

  const hasBase = (Number(src.basePrice) || 0) > 0;
  const kids: TileNode[] = [text(src.title || 'Build your vehicle', { variant: 'h2', weight: 'bold' })];
  const subBits = [src.model, hasBase ? `Base ${money(Number(src.basePrice), currency)}` : ''].filter(Boolean) as string[];
  if (subBits.length) kids.push(text(subBits.join(' · '), { variant: 'caption', color: 'muted' }));
  kids.push(t('tile/divider'));

  if (colors.length) {
    kids.push(text('Color', { variant: 'h4', weight: 'semibold' }));
    kids.push(t('tile/row', { gap: 'sm', wrap: true }, colors.map((c) =>
      t('tile/badge', {
        label: `${c.label}${priceSuffix(c.priceDelta, currency)}`,
        variant: chosenColor && c.id === chosenColor.id ? 'info' : 'secondary',
      }))));
  }

  groups.forEach((g) => {
    kids.push(text(g.label, { variant: 'h4', weight: 'semibold' }));
    kids.push(t('tile/row', { gap: 'sm', wrap: true }, g.options.map((o) =>
      t('tile/badge', {
        label: `${o.label}${priceSuffix(o.priceDelta, currency)}`,
        variant: sel[g.id] === o.id ? 'info' : 'secondary',
      }))));
  });

  kids.push(
    t('tile/divider'),
    t('tile/row', { justify: 'between', align: 'center' }, [
      text('Estimated price', { variant: 'body', weight: 'semibold' }),
      text(money(total, currency), { variant: 'h1', weight: 'bold' }),
    ]),
    text('Estimated · excludes tax, title & fees', { variant: 'caption', color: 'muted' }),
    t('tile/button', { label: src.submitText || 'Reserve this build', variant: 'primary' }),
  );
  return shell(kids);
}

/* ── #2 Test Drive Scheduler (autoTestDriveJSON) ─────────────────────────────
   Vehicle (photo when present) + location → per-day time/drive-type slot
   buttons → book CTA. */
const TD_TEST: AutoTestDrivePayload = {
  title: 'Book a test drive',
  vehicle: { name: 'Electric SUV', trim: 'RS AWD · Radiant Red', initials: 'EV', imageUrl: '' },
  location: { name: 'Downtown Dealership', address: '500 Market St, San Francisco' },
  days: [
    { date: '2026-09-16', slots: [
      { id: 'a', time: '09:30', driveType: 'showroom' },
      { id: 'b', time: '13:00', driveType: 'at_home' },
    ] },
    { date: '2026-09-17', slots: [
      { id: 'c', time: '10:00', driveType: 'showroom' },
      { id: 'd', time: '15:30', driveType: 'showroom' },
    ] },
    { date: '2026-09-18', slots: [
      { id: 'e', time: '11:00', driveType: 'at_home' },
      { id: 'f', time: '16:00', driveType: 'showroom' },
    ] },
  ],
  submitText: 'Book test drive',
};

function driveLabel(v?: string): string {
  const raw = String(v || '').toLowerCase().replace(/[^a-z]/g, '');
  return raw === 'athome' || raw === 'home' || raw === 'mobile' || raw === 'atyourdoor' ? 'At home' : 'Showroom';
}

function testDrive(p: AutoTestDrivePayload): TileNode {
  const usableDays = (p.days || []).filter((d) => d && Array.isArray(d.slots) && d.slots.length > 0);
  const src = usableDays.length ? p : TD_TEST;
  const days = usableDays.length ? usableDays : TD_TEST.days;
  const vehicle = src.vehicle;
  const location = src.location;

  const kids: TileNode[] = [text(src.title || 'Book a test drive', { variant: 'h2', weight: 'bold' })];

  if (hasImage(vehicle?.imageUrl)) {
    kids.push(t('tile/image', { src: vehicle!.imageUrl, alt: vehicle?.name || 'Vehicle', aspect: 'wide', rounded: true }));
  }
  if (vehicle?.name) {
    const stack: TileNode[] = [text(vehicle.name, { variant: 'body', weight: 'semibold' })];
    if (vehicle.trim) stack.push(text(vehicle.trim, { variant: 'caption', color: 'muted' }));
    if (location?.name) {
      stack.push(t('tile/row', { gap: 'xs', align: 'center' }, [
        t('tile/icon', { name: 'map-pin', size: 'xs', color: 'muted' }),
        text(location.name, { variant: 'caption', color: 'muted' }),
      ]));
    }
    kids.push(t('tile/row', { gap: 'sm', align: 'center' }, [
      t('tile/icon', { name: 'car', size: 'lg', color: 'primary' }),
      t('tile/column', { gap: 'none' }, stack),
    ]));
  }
  kids.push(t('tile/divider'));

  days.forEach((d) => {
    const slots = (d.slots || []).filter((s) => s && s.time);
    if (!slots.length) return;
    kids.push(t('tile/column', { gap: 'sm' }, [
      t('tile/row', { gap: 'xs', align: 'center' }, [
        t('tile/icon', { name: 'calendar', size: 'sm', color: 'muted' }),
        text(weekdayDate(d.date), { variant: 'h4', weight: 'semibold' }),
      ]),
      t('tile/row', { gap: 'sm', wrap: true }, slots.map((s) =>
        t('tile/button', { label: `${time12(s.time)} · ${driveLabel(s.driveType)}`, variant: 'default' }))),
    ]));
  });

  kids.push(t('tile/button', { label: src.submitText || 'Book test drive', variant: 'primary' }));
  return shell(kids);
}

/* ── #3 Connected Car Status (autoVehicleStatusJSON) ─────────────────────────
   Vehicle (photo when present) + live badge → range / battery progress → spec
   fields (odometer, service, tire pressure) → alerts → refresh + service CTA. */
const VS_TEST: AutoVehicleStatusPayload = {
  title: 'Your vehicle',
  vehicle: { name: 'Electric SUV', trim: 'RS AWD', imageUrl: '', initials: 'EV' },
  isElectric: true,
  range: { value: 248, total: 312, unit: 'mi' },
  battery: 78,
  odometer: 18452,
  odometerUnit: 'mi',
  tires: [
    { pos: 'FL', psi: 34, status: 'good' },
    { pos: 'FR', psi: 33, status: 'good' },
    { pos: 'RL', psi: 28, status: 'low' },
    { pos: 'RR', psi: 35, status: 'good' },
  ],
  items: [
    { label: 'Charge', value: '78%', status: 'good' },
    { label: 'Next service', value: 'in 1,200 mi', status: 'good' },
    { label: 'Oil life', value: 'N/A', status: 'good' },
    { label: 'Tire pressure', value: '1 low', status: 'watch' },
  ],
  alerts: ['Rear-left tire pressure is low (28 psi)'],
  updatedText: 'Updated 3 min ago',
  submitText: 'Schedule service',
};

const TIRE_ORDER = ['FL', 'FR', 'RL', 'RR'];
const TIRE_LABELS: Record<string, string> = { FL: 'Front L', FR: 'Front R', RL: 'Rear L', RR: 'Rear R' };

function normStatus(s: string | undefined, badWords: string[]): 'good' | 'watch' | 'bad' {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (badWords.includes(raw)) return 'bad';
  if (raw === 'watch' || raw === 'warn' || raw === 'warning' || raw === 'soon') return 'watch';
  return 'good';
}
const normTire = (s?: string) => normStatus(s, ['low', 'high', 'bad', 'flat', 'critical']);
const normItem = (s?: string) => normStatus(s, ['bad', 'critical', 'low', 'due']);

/** Append a human status suffix to a spec value for watch/bad readouts. */
function statusNote(value: string, st: 'good' | 'watch' | 'bad'): string {
  if (st === 'bad') return `${value} · Low`;
  if (st === 'watch') return `${value} · Watch`;
  return value;
}

function vehicleStatus(p: AutoVehicleStatusPayload): TileNode {
  const hasName = !!(p.vehicle?.name && String(p.vehicle.name).trim());
  const hasReadout = num(p.range?.value) !== null || num(p.battery) !== null;
  const src = !hasName && !hasReadout ? VS_TEST : p;

  const veh = src.vehicle;
  const vehicleName = veh?.name ? String(veh.name).trim() : 'Your vehicle';
  const rv = num(src.range?.value);
  const rt = num(src.range?.total);
  const unit = src.range?.unit ? String(src.range.unit).trim() : 'mi';
  const battery = num(src.battery);

  const kids: TileNode[] = [text(src.title ? String(src.title) : 'Your vehicle', { variant: 'h2', weight: 'bold' })];

  if (hasImage(veh?.imageUrl)) {
    kids.push(t('tile/image', { src: veh!.imageUrl, alt: vehicleName, aspect: 'wide', rounded: true }));
  }
  const headKids: TileNode[] = [vehicleHead(vehicleName, veh?.trim ? String(veh.trim) : undefined)];
  if (src.updatedText) headKids.push(t('tile/badge', { label: String(src.updatedText), variant: 'secondary' }));
  kids.push(t('tile/row', { justify: 'between', align: 'center' }, headKids));
  kids.push(t('tile/divider'));

  // Range gauge → progress bar.
  if (rv !== null) {
    const max = rt !== null && rt > 0 ? rt : rv;
    const low = max > 0 ? rv / max <= 0.2 : false;
    const valLabel = rt !== null && rt > 0 ? `${trimNum(rv)} of ${trimNum(rt)} ${unit}` : `${trimNum(rv)} ${unit}`;
    kids.push(t('tile/row', { justify: 'between', align: 'baseline' }, [
      text('Range', { variant: 'h4', weight: 'semibold' }),
      text(valLabel, { variant: 'caption', color: low ? 'danger' : 'muted' }),
    ]));
    kids.push(t('tile/progress', { value: rv, max, variant: low ? 'info' : 'success', showValue: true }));
  }
  // Battery / fuel → progress bar.
  if (battery !== null) {
    const low = battery <= 20;
    kids.push(t('tile/row', { justify: 'between', align: 'baseline' }, [
      text(src.isElectric ? 'Charge' : 'Fuel', { variant: 'h4', weight: 'semibold' }),
      text(`${trimNum(battery)}%`, { variant: 'caption', color: low ? 'danger' : 'muted' }),
    ]));
    kids.push(t('tile/progress', { value: battery, max: 100, variant: low ? 'info' : 'success', showValue: true }));
  }

  // Spec fields: odometer + status items.
  const specs: { label: string; value: string }[] = [];
  if (num(src.odometer) !== null) {
    specs.push({ label: 'Odometer', value: `${Number(src.odometer).toLocaleString()} ${src.odometerUnit ? String(src.odometerUnit).trim() : 'mi'}` });
  }
  (Array.isArray(src.items) ? src.items.filter((m) => m && m.label) : []).slice(0, 4).forEach((m) => {
    const value = m.value != null ? String(m.value).trim() : '—';
    specs.push({ label: String(m.label).trim(), value: statusNote(value, normItem(m.status)) });
  });
  if (specs.length) kids.push(t('tile/fields', { items: specs }));

  // Tire pressures → fields.
  const byPos: Record<string, { psi?: number; status?: string }> = {};
  (Array.isArray(src.tires) ? src.tires.filter((tr) => tr && tr.pos) : []).forEach((tr) => {
    const pos = String(tr.pos).toUpperCase().replace(/[^A-Z]/g, '');
    if (TIRE_ORDER.includes(pos)) byPos[pos] = tr;
  });
  const tireItems = TIRE_ORDER.filter((pos) => byPos[pos]).map((pos) => {
    const tr = byPos[pos];
    const psi = num(tr.psi);
    return { label: TIRE_LABELS[pos], value: statusNote(`${psi !== null ? trimNum(psi) : '—'} psi`, normTire(tr.status)) };
  });
  if (tireItems.length) {
    kids.push(text('Tire pressure', { variant: 'h4', weight: 'semibold' }));
    kids.push(t('tile/fields', { items: tireItems }));
  }

  // Alerts.
  (Array.isArray(src.alerts) ? src.alerts : []).map((a) => (a == null ? '' : String(a).trim())).filter(Boolean).forEach((a) => {
    kids.push(t('tile/row', { gap: 'xs', align: 'center' }, [
      t('tile/icon', { name: 'alert', size: 'sm', color: 'danger' }),
      text(a, { variant: 'caption', color: 'danger' }),
    ]));
  });

  // Actions — primary last.
  const actions: TileNode[] = [t('tile/button', { label: 'Refresh', variant: 'default' })];
  if (src.submitText) actions.push(t('tile/button', { label: String(src.submitText), variant: 'primary' }));
  kids.push(t('tile/divider'), t('tile/row', { gap: 'sm', wrap: true }, actions));
  return shell(kids);
}

/* ── #4 Trade-In Estimator (autoTradeInJSON) ─────────────────────────────────
   Vehicle → big estimated value → low/high range fields → offer note → value
   factors (up/down glyphs) → apply / appraisal CTAs. */
const TI_TEST: AutoTradeInPayload = {
  title: 'Your trade-in estimate',
  vehicle: { name: '2021 Midsize SUV', detail: '42,300 mi · Good condition', initials: 'SV' },
  currency: 'USD',
  estimate: 18400,
  low: 16900,
  high: 19800,
  offerText: 'Instant offer good for 7 days',
  factors: [
    { label: 'Mileage', detail: '42,300 mi — below average', impact: 'positive' },
    { label: 'Condition', detail: 'Good', impact: 'neutral' },
    { label: 'Market demand', detail: 'High for this trim', impact: 'positive' },
  ],
  submitText: 'Apply to a purchase',
  secondaryText: 'Book an appraisal',
};

function normImpact(s?: string): 'positive' | 'neutral' | 'negative' {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'positive' || raw === 'up' || raw === 'good') return 'positive';
  if (raw === 'negative' || raw === 'down' || raw === 'bad') return 'negative';
  return 'neutral';
}

function tradeIn(p: AutoTradeInPayload): TileNode {
  const src = num(p.estimate) === null ? TI_TEST : p;
  const veh = src.vehicle || { name: '' };
  const vehicleName = veh.name ? String(veh.name) : 'Your vehicle';
  const currency = src.currency || 'USD';

  const estimate = Math.max(0, num(src.estimate) ?? 0);
  let low = num(src.low);
  let high = num(src.high);
  if (low === null) low = Math.round(estimate * 0.9);
  if (high === null) high = Math.round(estimate * 1.1);
  low = Math.min(low, estimate);
  high = Math.max(high, estimate);

  const kids: TileNode[] = [text(src.title || 'Your trade-in estimate', { variant: 'h2', weight: 'bold' })];

  if (hasImage(veh.imageUrl)) {
    kids.push(t('tile/image', { src: veh.imageUrl, alt: vehicleName, aspect: 'wide', rounded: true }));
  }
  kids.push(vehicleHead(vehicleName, veh.detail ? String(veh.detail) : undefined));
  kids.push(t('tile/divider'));

  kids.push(t('tile/column', { gap: 'none' }, [
    text('Estimated trade-in value', { variant: 'caption', color: 'muted' }),
    text(money(estimate, currency), { variant: 'h1', weight: 'bold', color: 'success' }),
  ]));
  kids.push(t('tile/fields', { items: [
    { label: 'Low', value: money(low, currency) },
    { label: 'High', value: money(high, currency) },
  ] }));
  if (src.offerText) {
    kids.push(t('tile/row', { gap: 'xs', align: 'center' }, [
      t('tile/icon', { name: 'clock', size: 'sm', color: 'info' }),
      text(String(src.offerText), { variant: 'caption', color: 'info' }),
    ]));
  }

  const factors = Array.isArray(src.factors) ? src.factors.filter((f) => f && f.label) : [];
  if (factors.length) {
    kids.push(t('tile/divider'));
    factors.forEach((f) => {
      const impact = normImpact(f.impact);
      const iconName = impact === 'positive' ? 'up' : impact === 'negative' ? 'down' : 'check';
      const iconColor = impact === 'positive' ? 'success' : impact === 'negative' ? 'danger' : 'muted';
      const line: TileNode[] = [text(f.label, { variant: 'body', weight: 'semibold' })];
      if (f.detail) line.push(text(String(f.detail), { variant: 'caption', color: 'muted' }));
      kids.push(t('tile/row', { gap: 'sm', align: 'center' }, [
        t('tile/icon', { name: iconName, size: 'sm', color: iconColor }),
        t('tile/column', { gap: 'none' }, line),
      ]));
    });
  }

  kids.push(t('tile/divider'));
  if (src.secondaryText) kids.push(t('tile/button', { label: String(src.secondaryText), variant: 'default' }));
  kids.push(t('tile/button', { label: src.submitText || 'Continue', variant: 'primary' }));
  return shell(kids);
}

/* ── builder map (consumed by tiles/registry) ────────────────────────────── */

/** Per-CLT Slack tile builders for ASA Automotive, keyed by DTO field name. */
export const autoTileBuilders: Record<string, (payload: any) => TileNode> = {
  autoConfiguratorJSON: (p) => configurator(p as AutoConfiguratorPayload),
  autoTestDriveJSON: (p) => testDrive(p as AutoTestDrivePayload),
  autoVehicleStatusJSON: (p) => vehicleStatus(p as AutoVehicleStatusPayload),
  autoTradeInJSON: (p) => tradeIn(p as AutoTradeInPayload),
};
