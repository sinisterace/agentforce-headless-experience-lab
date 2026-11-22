import type { TileNode } from './TileRenderer';
import type {
  MfgEquipmentMonitorPayload,
  MfgPartReorderPayload,
  MfgWorkOrderPayload,
  MfgQuoteBuilderPayload,
} from '@/components/playground/payloads';

/**
 * Per-CLT BuilderKit tile builders for the ASA Manufacturing CLTs. Each returns
 * a Slack "tile/mosaic" node tree (see TileRenderer) composed from the CLT's
 * LWC-true payload — the authentic Block Kit way these CLTs render in Slack
 * (declarative tiles), distinct from the live LWC previews in the playground.
 * Data is resolved inline rather than left as "{!$attrs.…}" bindings since we
 * render with the payload in hand. Empty arrays drop each builder into the same
 * test-mode sample data the matching editor preview uses, so a bare payload
 * still renders a complete card.
 */

const t = (definition: string, attributes?: Record<string, any>, children?: TileNode[]): TileNode => ({ type: 'block', definition, attributes, children });
const text = (text: string, attributes: Record<string, any> = {}): TileNode => t('tile/text', { text, ...attributes });

function money(amount?: number, currency = 'USD', maxFractionDigits = 2): string {
  const n = Number(amount);
  if (!isFinite(n)) return '';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: maxFractionDigits }).format(n);
  } catch {
    return `${currency} ${n.toFixed(maxFractionDigits)}`;
  }
}

/** Slack fetches image blocks by URL, so only emit a real, publicly reachable
 *  https(s) image — /resource/… static-resource paths (the demo defaults) are
 *  not reachable and are omitted, exactly as they would be in Slack. */
function httpImg(url?: string): string {
  const u = String(url || '').trim();
  return /^https?:\/\//i.test(u) ? u : '';
}
function imageBlock(src: string, alt?: string): TileNode | null {
  return src ? t('tile/image', { src, alt: alt ?? '', aspect: 'wide', rounded: true }) : null;
}

/** Wrap card content in a mosaic → single container → padded column. */
function shell(children: TileNode[]): TileNode {
  return t('tile/mosaic', undefined, [
    t('tile/container', undefined, [t('tile/column', { gap: 'md', padding: 'md' }, children)]),
  ]);
}

/* ── inline normalizers (mirror playground/mfgFormat, kept local like the FS tiles) ─ */

const MACHINE_STATUS_LABELS: Record<string, string> = {
  running: 'Running', idle: 'Idle', fault: 'Fault', maintenance: 'Maintenance', offline: 'Offline',
};
function normMachineStatus(s?: string): string {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'fault' || raw === 'error' || raw === 'alarm' || raw === 'down' || raw === 'stopped') return 'fault';
  if (raw === 'maintenance' || raw === 'service' || raw === 'servicing') return 'maintenance';
  if (raw === 'offline' || raw === 'disconnected') return 'offline';
  if (raw === 'idle' || raw === 'standby' || raw === 'paused') return 'idle';
  return 'running';
}
const STATUS_BADGE: Record<string, string> = {
  running: 'success', idle: 'info', fault: 'danger', maintenance: 'warning', offline: 'secondary',
};

function normMetricState(s?: string): string {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'bad' || raw === 'critical' || raw === 'alarm' || raw === 'high') return 'bad';
  if (raw === 'warn' || raw === 'warning' || raw === 'caution') return 'warn';
  return 'good';
}

const PRIORITY_LABELS: Record<string, string> = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' };
function normPriority(p?: string): string {
  const raw = String(p || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'urgent' || raw === 'critical' || raw === 'rush' || raw === 'expedite') return 'urgent';
  if (raw === 'high') return 'high';
  if (raw === 'low') return 'low';
  return 'normal';
}
const PRIORITY_BADGE: Record<string, string> = { low: 'secondary', normal: 'info', high: 'warning', urgent: 'danger' };

function normMilestoneState(s?: string): string {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'done' || raw === 'complete' || raw === 'completed') return 'done';
  if (raw === 'current' || raw === 'active' || raw === 'inprogress' || raw === 'progress') return 'current';
  return 'todo';
}
const MILESTONE_ICON: Record<string, Record<string, any>> = {
  done: { name: 'check-circle', size: 'md', color: 'success' },
  current: { name: 'activity', size: 'md', color: 'info' },
  todo: { name: 'clock', size: 'md', color: 'muted' },
};

/* ── test-mode fallbacks (mirror the editor previews) ─────────────────────── */

const EQ_TEST: MfgEquipmentMonitorPayload = {
  title: 'Assembly Cell',
  asset: { name: 'Assembly Cell', model: 'TB-9000', assetId: 'LINE-3', location: 'Plant 2 · Bay 4', imageUrl: '/resource/asaMfgTrailblazerCell' },
  status: 'running',
  statusLabel: 'Running',
  updatedText: 'Live · updated 12s ago',
  metrics: [
    { label: 'OEE', value: '87', unit: '%', state: 'good' },
    { label: 'Spindle temp', value: '62', unit: '°C', state: 'warn' },
    { label: 'Throughput', value: '142', unit: '/hr', state: 'good' },
    { label: 'Uptime', value: '6d 4h', state: 'good' },
  ],
  trend: { label: 'OEE · last 12h', points: [72, 78, 74, 80, 83, 81, 85, 84, 86, 88, 87, 87] },
  submitText: 'Create work order',
};

const PR_TEST: MfgPartReorderPayload = {
  title: 'Reorder part',
  part: { name: 'Industrial I/O Controller', sku: 'IOC-4820-DIN', category: 'controller', imageUrl: '/resource/asaMfgIoController', unitPrice: 486, currency: 'USD', leadTime: 'Ships in 3–5 business days', inStock: 142, minOrder: 1, incrementStep: 1 },
  quantity: 2,
  submitText: 'Reorder',
};

const WO_TEST: MfgWorkOrderPayload = {
  title: 'Work order WO-4821',
  orderNumber: 'WO-4821',
  product: 'Assembly Cell · 2 units',
  priority: 'high',
  etaText: 'Est. ship Oct 2',
  updatedText: 'Updated 1h ago',
  milestones: [
    { label: 'Order received', state: 'done', timeText: 'Sep 10', owner: 'Intake' },
    { label: 'Machining', state: 'done', timeText: 'Sep 14', owner: 'Cell A' },
    { label: 'Assembly', state: 'current', timeText: 'In progress', owner: 'Bay 4' },
    { label: 'Quality check', state: 'todo' },
    { label: 'Ready to ship', state: 'todo' },
  ],
  submitText: 'Message production team',
};

const DEFAULT_ACK = 'I acknowledge that pricing is an estimate pending a formal quote and confirm the configuration is correct.';
const QB_TEST: MfgQuoteBuilderPayload = {
  title: 'Quote',
  cartId: 'QT-00042',
  statusLabel: 'Draft quote',
  shipTo: 'Rivera Robotics · Plant 2',
  shipToId: '#PL-2-0192',
  billTo: 'Rivera Manufacturing, Inc.',
  currency: 'USD',
  lineItems: [
    { id: 'frame', itemNumber: 'TB-9000-FRM', description: 'Assembly cell frame, powder-coated steel', uom: 'EA', unitPrice: 4800, quantity: 2 },
    { id: 'plc', itemNumber: 'PLC-ADV-24', description: 'Advanced PLC + HMI control package', uom: 'EA', unitPrice: 5400, quantity: 1 },
    { id: 'conv', itemNumber: 'CONV-3M', description: 'Conveyor belt module, 3 m span', uom: 'EA', unitPrice: 1260, quantity: 3 },
    { id: 'safety', itemNumber: 'SAF-LC-KIT', description: 'Light-curtain safety kit', uom: 'KIT', unitPrice: 980, quantity: 1 },
  ],
  poLabel: 'Purchase Order #',
  poPlaceholder: 'Enter PO number…',
  acknowledgeText: DEFAULT_ACK,
  submitText: 'Request quote',
  secondaryText: 'Save & close',
};

/* ── #1 Equipment Monitor ─────────────────────────────────────────────────── */
function equipmentMonitor(p: MfgEquipmentMonitorPayload): TileNode {
  const hasAsset = !!(p.asset && p.asset.name);
  const hasMetrics = Array.isArray(p.metrics) && p.metrics.length > 0;
  const src = !hasAsset && !hasMetrics ? EQ_TEST : p;

  const asset = src.asset || { name: 'Asset' };
  const title = (src.title && src.title.trim()) || asset.name || 'Assembly Cell';
  const status = normMachineStatus(src.status);
  const statusLabel = (src.statusLabel && src.statusLabel.trim()) || MACHINE_STATUS_LABELS[status] || 'Running';
  const meta = [asset.model, asset.assetId, asset.location].filter(Boolean).join(' · ');
  const metrics = (src.metrics ?? []).filter((m) => m && m.label).slice(0, 4);
  const isPct = (u?: string, v?: string | number) => String(u || '').trim() === '%' && isFinite(Number(v));
  const gauges = metrics.filter((m) => isPct(m.unit, m.value));
  const specs = metrics.filter((m) => !isPct(m.unit, m.value));

  const kids: TileNode[] = [
    t('tile/row', { justify: 'between', align: 'center', gap: 'sm' }, [
      t('tile/row', { gap: 'sm', align: 'center' }, [
        t('tile/icon', { name: 'factory', size: 'md', color: 'primary' }),
        text(title, { variant: 'h2', weight: 'bold' }),
      ]),
      t('tile/badge', { label: statusLabel, variant: STATUS_BADGE[status] || 'secondary' }),
    ]),
  ];
  if (meta) kids.push(text(meta, { variant: 'caption', color: 'muted' }));
  if (src.updatedText) {
    kids.push(t('tile/row', { gap: 'xs', align: 'center' }, [
      t('tile/icon', { name: 'clock', size: 'xs', color: 'muted' }),
      text(src.updatedText, { variant: 'caption', color: 'muted' }),
    ]));
  }
  const image = imageBlock(httpImg(asset.imageUrl), asset.name);
  if (image) kids.push(image);

  gauges.forEach((m) => {
    const good = normMetricState(m.state) === 'good';
    kids.push(t('tile/column', { gap: 'xs' }, [
      t('tile/row', { justify: 'between', align: 'baseline', gap: 'sm' }, [
        text(m.label, { variant: 'caption', color: 'muted' }),
        text(`${m.value}${m.unit || ''}`, { variant: 'body', weight: 'semibold' }),
      ]),
      t('tile/progress', { value: Number(m.value), max: 100, variant: good ? 'success' : 'info', showValue: false }),
    ]));
  });

  if (specs.length) {
    kids.push(t('tile/fields', { items: specs.map((m) => ({ label: m.label, value: `${m.value}${m.unit || ''}` })) }));
  }

  const pts = (src.trend?.points ?? []).map(Number).filter((n) => isFinite(n));
  if (pts.length >= 2) {
    const first = pts[0];
    const last = pts[pts.length - 1];
    const icon = last > first ? 'up' : last < first ? 'down' : 'activity';
    const color = last > first ? 'success' : last < first ? 'danger' : 'muted';
    const label = (src.trend?.label && src.trend.label.trim()) || 'Trend';
    kids.push(t('tile/row', { gap: 'xs', align: 'center' }, [
      t('tile/icon', { name: icon, size: 'xs', color }),
      text(`${label}: ${first} → ${last}`, { variant: 'caption', color: 'muted' }),
    ]));
  }

  kids.push(t('tile/divider'));
  kids.push(t('tile/button', { label: (src.submitText && src.submitText.trim()) || 'Create work order', variant: 'primary' }));
  return shell(kids);
}

/* ── #2 Part Reorder ──────────────────────────────────────────────────────── */
function partReorder(p: MfgPartReorderPayload): TileNode {
  const src = p.part && p.part.name ? p : PR_TEST;
  const part = src.part || { name: 'Part' };
  const currency = part.currency || 'USD';
  const minOrder = Math.max(1, Number(part.minOrder) || 1);
  const inStock = Number.isFinite(part.inStock as number) ? (part.inStock as number) : null;
  const maxQty = inStock !== null && inStock > 0 ? inStock : null;
  const hasUnit = Number.isFinite(part.unitPrice as number);
  const clamp = (q: number): number => {
    let v = Math.round(q);
    if (v < minOrder) v = minOrder;
    if (maxQty !== null && v > maxQty) v = maxQty;
    return v;
  };
  const qty = clamp(Number(src.quantity) || minOrder);
  const units = qty === 1 ? 'unit' : 'units';
  const submit = (src.submitText && src.submitText.trim()) || 'Reorder';
  const subtotal = hasUnit ? money((part.unitPrice as number) * qty, currency) : '';
  const ctaLabel = hasUnit ? `${submit} · ${subtotal}` : `${submit} ${qty} ${units}`;

  const out = inStock !== null && inStock <= 0;
  const low = inStock !== null && inStock <= 10 && inStock > 0;

  const kids: TileNode[] = [text((src.title && src.title.trim()) || 'Reorder part', { variant: 'h2', weight: 'bold' })];

  const image = imageBlock(httpImg(part.imageUrl), part.name);
  if (image) kids.push(image);

  const cardCol: TileNode[] = [text(part.name, { variant: 'body', weight: 'semibold' })];
  if (part.sku) cardCol.push(text(`SKU ${part.sku}`, { variant: 'caption', color: 'muted' }));
  if (hasUnit) cardCol.push(text(`${money(part.unitPrice as number, currency)} each`, { variant: 'caption', color: 'muted' }));
  kids.push(t('tile/container', undefined, [
    t('tile/row', { gap: 'sm', align: 'center', padding: 'sm' }, [
      t('tile/icon', { name: 'package', size: 'lg', color: 'primary' }),
      t('tile/column', { gap: 'none' }, cardCol),
    ]),
  ]));

  if (inStock !== null) {
    kids.push(t('tile/column', { gap: 'xs' }, [
      t('tile/row', { justify: 'between', align: 'center', gap: 'sm' }, [
        t('tile/badge', { label: out ? 'Out of stock' : `${inStock} in stock`, variant: out ? 'danger' : low ? 'warning' : 'success' }),
        ...(part.leadTime ? [text(part.leadTime, { variant: 'caption', color: 'muted' })] : []),
      ]),
      t('tile/progress', { value: Math.max(0, Math.min(inStock, 150)), max: 150, variant: out || low ? 'info' : 'success', showValue: false }),
    ]));
  } else if (part.leadTime) {
    kids.push(t('tile/row', { gap: 'xs', align: 'center' }, [
      t('tile/icon', { name: 'truck', size: 'xs', color: 'muted' }),
      text(part.leadTime, { variant: 'caption', color: 'muted' }),
    ]));
  }

  const fields: { label: string; value: string }[] = [];
  if (hasUnit) fields.push({ label: 'Unit price', value: money(part.unitPrice as number, currency) });
  fields.push({ label: 'Quantity', value: `${qty} ${units}` });
  if (minOrder > 1) fields.push({ label: 'Min order', value: `${minOrder} units` });
  if (part.category) fields.push({ label: 'Category', value: part.category });
  kids.push(t('tile/fields', { items: fields }));

  kids.push(t('tile/divider'));
  kids.push(t('tile/button', { label: ctaLabel, variant: 'primary' }));
  return shell(kids);
}

/* ── #3 Work Order Tracker ────────────────────────────────────────────────── */
function workOrder(p: MfgWorkOrderPayload): TileNode {
  const raw = (p.milestones ?? []).filter((m) => m && m.label);
  const src = raw.length === 0 ? WO_TEST : p;
  const orderNumber = (src.orderNumber || '').trim();
  const title = (src.title && src.title.trim()) || (orderNumber ? `Work order ${orderNumber}` : 'Work order');
  const priority = normPriority(src.priority);
  const all = raw.length === 0 ? WO_TEST.milestones : raw;
  const milestones = all.slice(0, 6);
  const extra = all.length - milestones.length;

  const headMain: TileNode[] = [text(title, { variant: 'h2', weight: 'bold' })];
  if (src.product) headMain.push(text(src.product, { variant: 'caption', color: 'muted' }));

  const kids: TileNode[] = [
    t('tile/row', { justify: 'between', align: 'center', gap: 'sm' }, [
      t('tile/column', { gap: 'none' }, headMain),
      ...(src.priority ? [t('tile/badge', { label: PRIORITY_LABELS[priority] || 'Normal', variant: PRIORITY_BADGE[priority] || 'info' })] : []),
    ]),
  ];

  const steps = milestones.map((m) => {
    const state = normMilestoneState(m.state);
    const meta = [m.timeText, m.owner].filter(Boolean).join(' · ');
    const col: TileNode[] = [text(m.label, state === 'todo' ? { variant: 'body', color: 'muted' } : { variant: 'body', weight: 'semibold' })];
    if (meta) col.push(text(meta, { variant: 'caption', color: 'muted' }));
    return t('tile/row', { gap: 'sm', align: 'start' }, [
      t('tile/icon', MILESTONE_ICON[state]),
      t('tile/column', { gap: 'none' }, col),
    ]);
  });
  kids.push(t('tile/column', { gap: 'sm' }, steps));
  if (extra > 0) kids.push(text(`+${extra} more`, { variant: 'caption', color: 'muted' }));

  kids.push(t('tile/divider'));
  if (src.etaText) {
    const etaCol: TileNode[] = [text(src.etaText, { variant: 'body', weight: 'semibold' })];
    if (src.updatedText) etaCol.push(text(src.updatedText, { variant: 'caption', color: 'muted' }));
    kids.push(t('tile/row', { gap: 'sm', align: 'center' }, [
      t('tile/icon', { name: 'truck', size: 'md', color: 'primary' }),
      t('tile/column', { gap: 'none' }, etaCol),
    ]));
  }
  kids.push(t('tile/button', { label: (src.submitText && src.submitText.trim()) || 'Message production team', variant: 'primary' }));
  return shell(kids);
}

/* ── #4 Quote Builder ─────────────────────────────────────────────────────── */
function quoteBuilder(p: MfgQuoteBuilderPayload): TileNode {
  const valid = (p.lineItems ?? []).filter((li) => li && li.description);
  const src = valid.length === 0 ? QB_TEST : p;
  const currency = src.currency || 'USD';
  const allLines = (valid.length === 0 ? QB_TEST.lineItems : valid).map((li, i) => ({
    ...li,
    id: li.id || `li-${i}`,
    quantity: Math.max(1, Number(li.quantity) || 1),
  }));
  const lines = allLines.slice(0, 5);
  const extra = allLines.length - lines.length;
  const subtotal = allLines.reduce((sum, l) => sum + (Number(l.unitPrice) || 0) * (Number(l.quantity) || 0), 0);

  const title = (src.title && src.title.trim()) || 'Quote';
  const cartId = (src.cartId || '').trim();

  const kids: TileNode[] = [
    t('tile/row', { justify: 'between', align: 'center', gap: 'sm' }, [
      t('tile/row', { gap: 'sm', align: 'center' }, [
        t('tile/icon', { name: 'package', size: 'md', color: 'primary' }),
        text(cartId || title, { variant: 'h2', weight: 'bold' }),
      ]),
      ...(src.statusLabel ? [t('tile/badge', { label: src.statusLabel, variant: 'info' })] : []),
    ]),
  ];

  const hdrFields: { label: string; value: string }[] = [];
  if (src.shipTo) hdrFields.push({ label: 'Ship-To', value: [src.shipTo, src.shipToId].filter(Boolean).join(' · ') });
  if (src.billTo) hdrFields.push({ label: 'Bill-To', value: src.billTo });
  if (hdrFields.length) kids.push(t('tile/fields', { items: hdrFields }));

  const rows = lines.map((l) => ({
    item: l.itemNumber || '—',
    desc: l.uom ? `${l.description} · ${l.uom}` : l.description,
    qty: String(l.quantity),
    total: money((Number(l.unitPrice) || 0) * (Number(l.quantity) || 0), currency),
    totalClass: 'debit',
  }));
  kids.push(t('tile/table', {
    columns: [
      { key: 'item', header: 'Item #' },
      { key: 'desc', header: 'Description' },
      { key: 'qty', header: 'Qty' },
      { key: 'total', header: 'Amount' },
    ],
    rows,
    ariaLabel: 'Quote line items',
    variant: 'striped',
    hoverable: true,
  }));
  if (extra > 0) kids.push(text(`+${extra} more line items`, { variant: 'caption', color: 'muted' }));

  kids.push(t('tile/divider'));
  kids.push(t('tile/row', { justify: 'between', align: 'baseline', gap: 'sm' }, [
    text('Estimated total', { variant: 'body', weight: 'semibold' }),
    text(money(subtotal, currency), { variant: 'h4', weight: 'bold', color: 'primary' }),
  ]));

  const ack = src.acknowledgeText === '' ? '' : (src.acknowledgeText || DEFAULT_ACK).trim();
  if (ack) {
    kids.push(t('tile/row', { gap: 'xs', align: 'start' }, [
      t('tile/icon', { name: 'info', size: 'xs', color: 'muted' }),
      text(ack, { variant: 'caption', color: 'muted' }),
    ]));
  }

  const actions: TileNode[] = [];
  if (src.secondaryText && src.secondaryText.trim()) actions.push(t('tile/button', { label: src.secondaryText.trim(), variant: 'default' }));
  actions.push(t('tile/button', { label: (src.submitText && src.submitText.trim()) || 'Request quote', variant: 'primary' }));
  kids.push(t('tile/row', { gap: 'sm', wrap: true, justify: 'end' }, actions));
  return shell(kids);
}

/* ── builder map (consumed by tiles/registry) ─────────────────────────────── */

/** Per-CLT Slack tile builders for ASA Manufacturing, keyed by DTO field name. */
export const mfgTileBuilders: Record<string, (payload: any) => TileNode> = {
  mfgEquipmentMonitorJSON: (p) => equipmentMonitor(p as MfgEquipmentMonitorPayload),
  mfgPartReorderJSON: (p) => partReorder(p as MfgPartReorderPayload),
  mfgWorkOrderJSON: (p) => workOrder(p as MfgWorkOrderPayload),
  mfgQuoteBuilderJSON: (p) => quoteBuilder(p as MfgQuoteBuilderPayload),
};
