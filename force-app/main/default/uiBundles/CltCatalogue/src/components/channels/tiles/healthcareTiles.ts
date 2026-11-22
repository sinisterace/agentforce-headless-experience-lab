import type { TileNode } from './TileRenderer';

/**
 * Per-CLT BuilderKit tile builders for the Healthcare CLTs. Each returns a Slack
 * "tile/mosaic" node tree (see TileRenderer) composed from the CLT's LWC-true
 * payload — the authentic way these CLTs render in Slack (declarative Block Kit
 * tiles), distinct from the Enhanced Chat v2 LWC. Data is resolved inline rather
 * than left as "{!$attrs.…}" bindings since we render with the payload in hand.
 *
 * Mirrors financialServicesTiles.ts in helper set and style. Empty arrays are
 * handled gracefully (sections simply don't render), like the editors' previews.
 */

const t = (definition: string, attributes?: Record<string, any>, children?: TileNode[]): TileNode => ({ type: 'block', definition, attributes, children });
const text = (text: string, attributes: Record<string, any> = {}): TileNode => t('tile/text', { text, ...attributes });

/** Wrap card content in a mosaic → single container → padded column. */
function shell(children: TileNode[]): TileNode {
  return t('tile/mosaic', undefined, [
    t('tile/container', undefined, [t('tile/column', { gap: 'md', padding: 'md' }, children)]),
  ]);
}

/* ── shared formatting (mirrors the playground format helpers) ────────────── */

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "HH:MM" (24h) → "9:00 AM"; passes through anything it can't parse. */
function apptTime(hhmm?: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || '').trim());
  if (!m) return String(hhmm || '');
  let h = Number(m[1]);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ap}`;
}

/** ISO yyyy-mm-dd → "Thu, Sep 18" (UTC so the day never drifts). */
function dayLabel(iso?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return String(iso || '');
  const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  const wd = WEEKDAYS[dt.getUTCDay()] || '';
  const mo = MONTHS[Number(m[2]) - 1] || '';
  return `${wd}, ${mo} ${Number(m[3])}`;
}

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'danger';

/* ── #1 Appointment Scheduler ─────────────────────────────────────────────── */

function visitLabel(v?: string): string {
  const raw = String(v || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'video' || raw === 'telehealth' || raw === 'virtual') return 'Video';
  if (raw === 'phone' || raw === 'call' || raw === 'audio') return 'Phone';
  return 'In person';
}

function apptScheduler(p: any): TileNode {
  const provider = p?.provider;
  const location = p?.location;
  const days = (Array.isArray(p?.days) ? p.days : [])
    .filter((d: any) => d && Array.isArray(d.slots) && d.slots.some((s: any) => s && s.time))
    .slice(0, 3);

  const kids: TileNode[] = [text(p?.title || 'Book a visit', { variant: 'h2', weight: 'bold' })];

  if (provider?.name) {
    const col: TileNode[] = [text(provider.name, { variant: 'body', weight: 'semibold' })];
    if (provider.specialty) col.push(text(provider.specialty, { variant: 'caption', color: 'muted' }));
    const trust: TileNode[] = [];
    if (provider.rating != null) {
      const rat = `${Number(provider.rating).toFixed(1)}${provider.reviews ? ` (${provider.reviews})` : ''}`;
      trust.push(t('tile/row', { gap: 'xs', align: 'center' }, [
        t('tile/icon', { name: 'star', size: 'xs', color: 'warning' }),
        text(rat, { variant: 'caption', color: 'muted' }),
      ]));
    }
    if (provider.badge) trust.push(t('tile/badge', { label: provider.badge, variant: 'success' }));
    if (trust.length) col.push(t('tile/row', { gap: 'sm', align: 'center', wrap: true }, trust));
    if (location?.name) {
      col.push(t('tile/row', { gap: 'xs', align: 'center' }, [
        t('tile/icon', { name: 'map-pin', size: 'xs', color: 'muted' }),
        text([location.name, location.address].filter(Boolean).join(' · '), { variant: 'caption', color: 'muted' }),
      ]));
    }
    kids.push(t('tile/container', undefined, [
      t('tile/row', { gap: 'sm', align: 'center', padding: 'sm' }, [
        t('tile/icon', { name: 'stethoscope', size: 'lg', color: 'primary' }),
        t('tile/column', { gap: 'xs' }, col),
      ]),
    ]));
  }

  if (days.length) {
    kids.push(t('tile/divider'));
    kids.push(text('Available times', { variant: 'caption', color: 'muted' }));
    days.forEach((d: any) => {
      const slots = (d.slots as any[]).filter((s) => s && s.time).slice(0, 4);
      kids.push(t('tile/column', { gap: 'sm' }, [
        text(dayLabel(d.date), { variant: 'h4', weight: 'semibold' }),
        t('tile/row', { gap: 'sm', wrap: true }, slots.map((s) =>
          t('tile/button', { label: `${apptTime(s.time)} · ${visitLabel(s.visitType)}`, variant: 'default' }),
        )),
      ]));
    });
  }

  if (p?.note) {
    kids.push(t('tile/row', { gap: 'xs', align: 'center' }, [
      t('tile/icon', { name: 'shield', size: 'sm', color: 'success' }),
      text(p.note, { variant: 'caption', color: 'muted' }),
    ]));
  }

  kids.push(t('tile/button', { label: p?.submitText || 'Confirm appointment', variant: 'primary' }));
  return shell(kids);
}

/* ── #2 Find Care Near You ────────────────────────────────────────────────── */

const FACILITY_ICON: Record<string, string> = {
  urgentcare: 'heart', er: 'alert', primarycare: 'stethoscope', pharmacy: 'pill',
  hospital: 'building', lab: 'activity', telehealth: 'video', clinic: 'building',
};
const FACILITY_LABEL: Record<string, string> = {
  urgentcare: 'Urgent care', er: 'Emergency room', primarycare: 'Primary care', pharmacy: 'Pharmacy',
  hospital: 'Hospital', lab: 'Lab', telehealth: 'Telehealth', clinic: 'Clinic',
};

function facilityBucket(ty?: string): string {
  const raw = String(ty || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'urgentcare' || raw === 'urgent') return 'urgentcare';
  if (raw === 'er' || raw === 'emergency' || raw === 'emergencyroom') return 'er';
  if (raw === 'primarycare' || raw === 'primary' || raw === 'doctor' || raw === 'gp') return 'primarycare';
  if (raw === 'pharmacy' || raw === 'drugstore' || raw === 'rx') return 'pharmacy';
  if (raw === 'hospital') return 'hospital';
  if (raw === 'lab' || raw === 'laboratory' || raw === 'labs') return 'lab';
  if (raw === 'telehealth' || raw === 'video' || raw === 'virtual') return 'telehealth';
  return 'clinic';
}

function findCare(p: any): TileNode {
  const facilities = (Array.isArray(p?.facilities) ? p.facilities : [])
    .filter((f: any) => f && (f.name || f.id))
    .slice(0, 4);

  const kids: TileNode[] = [text(p?.title || 'Care near you', { variant: 'h2', weight: 'bold' })];
  if (p?.subtitle) kids.push(text(p.subtitle, { variant: 'caption', color: 'muted' }));

  facilities.forEach((f: any) => {
    const bucket = facilityBucket(f.type);
    const meta = [FACILITY_LABEL[bucket], f.distance].filter(Boolean).join(' · ');
    const head: TileNode[] = [
      t('tile/icon', { name: FACILITY_ICON[bucket] || 'building', size: 'md', color: 'primary' }),
      t('tile/column', { gap: 'none' }, [
        text(f.name || 'Care facility', { variant: 'body', weight: 'semibold' }),
        ...(meta ? [text(meta, { variant: 'caption', color: 'muted' })] : []),
      ]),
    ];
    const card: TileNode[] = [
      t('tile/row', { gap: 'sm', align: 'center', justify: 'between' }, [
        t('tile/row', { gap: 'sm', align: 'center' }, head),
        ...(f.openNow === true || f.openNow === false
          ? [t('tile/badge', { label: f.openNow ? 'Open now' : 'Closed', variant: (f.openNow ? 'success' : 'danger') as BadgeVariant })]
          : []),
      ]),
    ];
    if (f.hours) card.push(t('tile/row', { gap: 'xs', align: 'center' }, [
      t('tile/icon', { name: 'clock', size: 'xs', color: 'muted' }), text(f.hours, { variant: 'caption', color: 'muted' }),
    ]));
    if (f.waitTime) card.push(t('tile/row', { gap: 'xs', align: 'center' }, [
      t('tile/icon', { name: 'clock', size: 'xs', color: 'warning' }), text(f.waitTime, { variant: 'caption', color: 'warning' }),
    ]));
    if (f.address) card.push(t('tile/row', { gap: 'xs', align: 'center' }, [
      t('tile/icon', { name: 'map-pin', size: 'xs', color: 'muted' }), text(f.address, { variant: 'caption', color: 'muted' }),
    ]));
    const services = (Array.isArray(f.services) ? f.services : []).filter((s: any) => s != null && String(s).trim()).slice(0, 3);
    if (services.length) card.push(t('tile/row', { gap: 'xs', wrap: true }, services.map((s: any) =>
      t('tile/badge', { label: String(s).trim(), variant: 'secondary' as BadgeVariant }))));
    const actions: TileNode[] = [];
    if (f.mapsUrl) actions.push(t('tile/button', { label: 'Directions', variant: 'primary' }));
    if (f.phone) actions.push(t('tile/button', { label: 'Call', variant: 'default' }));
    if (actions.length) card.push(t('tile/row', { gap: 'sm', wrap: true }, actions));
    kids.push(t('tile/container', undefined, [t('tile/column', { gap: 'sm', padding: 'sm' }, card)]));
  });

  return shell(kids);
}

/* ── #3 Care Options ──────────────────────────────────────────────────────── */

const CHANNEL_ICON: Record<string, string> = {
  nurseline: 'phone', video: 'video', inperson: 'calendar', urgent: 'heart', er: 'alert', pharmacy: 'pill', message: 'message',
};

function channelBucket(c?: string): string {
  const raw = String(c || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'nurseline' || raw === 'nurse' || raw === 'advice') return 'nurseline';
  if (raw === 'video' || raw === 'telehealth' || raw === 'virtual') return 'video';
  if (raw === 'inperson' || raw === 'clinic' || raw === 'office') return 'inperson';
  if (raw === 'urgent' || raw === 'urgentcare') return 'urgent';
  if (raw === 'er' || raw === 'emergency' || raw === 'ers') return 'er';
  if (raw === 'pharmacy' || raw === 'rx') return 'pharmacy';
  return 'message';
}

function actionKind(a?: string): 'call' | 'link' | 'book' {
  const raw = String(a || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'call' || raw === 'phone') return 'call';
  if (raw === 'link' || raw === 'url' || raw === 'web') return 'link';
  return 'book';
}

function careOptions(p: any): TileNode {
  const options = (Array.isArray(p?.options) ? p.options : [])
    .filter((o: any) => o && (o.label || o.id))
    .slice(0, 5);

  const kids: TileNode[] = [text(p?.title || 'How would you like to get care?', { variant: 'h2', weight: 'bold' })];
  if (p?.subtitle) kids.push(text(p.subtitle, { variant: 'caption', color: 'muted' }));

  options.forEach((o: any) => {
    const bucket = channelBucket(o.channel);
    const kind = actionKind(o.actionType);
    const labelRow: TileNode[] = [text(o.label || 'Care option', { variant: 'body', weight: 'semibold' })];
    if (o.recommended) labelRow.push(t('tile/badge', { label: 'Recommended', variant: 'primary' as BadgeVariant }));
    const col: TileNode[] = [t('tile/row', { gap: 'sm', align: 'center', wrap: true }, labelRow)];
    if (o.description) col.push(text(o.description, { variant: 'caption', color: 'muted' }));
    if (o.meta) col.push(text(o.meta, { variant: 'caption', color: 'info' }));
    const ctaLabel = kind === 'call' ? 'Call' : kind === 'link' ? 'Open' : 'Choose';
    kids.push(t('tile/container', undefined, [
      t('tile/column', { gap: 'sm', padding: 'sm' }, [
        t('tile/row', { gap: 'sm', align: 'center' }, [
          t('tile/icon', { name: CHANNEL_ICON[bucket] || 'message', size: 'md', color: bucket === 'er' ? 'danger' : 'primary' }),
          t('tile/column', { gap: 'xs' }, col),
        ]),
        t('tile/button', { label: ctaLabel, variant: (o.recommended ? 'primary' : 'default') }),
      ]),
    ]));
  });

  if (p?.disclaimer) {
    kids.push(t('tile/divider'));
    kids.push(t('tile/row', { gap: 'xs', align: 'center' }, [
      t('tile/icon', { name: 'alert', size: 'sm', color: 'warning' }),
      text(p.disclaimer, { variant: 'caption', color: 'muted' }),
    ]));
  }

  return shell(kids);
}

/* ── #4 Prescription Refill ───────────────────────────────────────────────── */

function rxStatusBucket(s?: string): 'ok' | 'low' | 'out' {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'low' || raw === 'runninglow' || raw === 'warn') return 'low';
  if (raw === 'out' || raw === 'norefills' || raw === 'none' || raw === 'empty') return 'out';
  return 'ok';
}
function rxStatusText(bucket: string): string {
  if (bucket === 'low') return 'Running low';
  if (bucket === 'out') return 'No refills';
  return 'In stock';
}
function refillsNote(n?: number): string {
  if (n == null || Number.isNaN(Number(n))) return '';
  return Number(n) === 1 ? '1 refill left' : `${Number(n)} refills left`;
}
const RX_BADGE: Record<string, BadgeVariant> = { ok: 'success', low: 'warning', out: 'danger' };
const RX_FILL: Record<string, number> = { ok: 88, low: 26, out: 6 };
const RX_PROGRESS: Record<string, BadgeVariant> = { ok: 'success', low: 'warning', out: 'danger' };

function rxRefill(p: any): TileNode {
  const meds = (Array.isArray(p?.medications) ? p.medications : [])
    .filter((m: any) => m && (m.name || m.id))
    .slice(0, 5);

  const kids: TileNode[] = [text(p?.title || 'Refill prescriptions', { variant: 'h2', weight: 'bold' })];
  if (p?.subtitle) kids.push(text(p.subtitle, { variant: 'caption', color: 'muted' }));

  meds.forEach((m: any) => {
    const bucket = rxStatusBucket(m.status);
    const supply = m.supplyText ? String(m.supplyText).trim() : rxStatusText(bucket);
    const note = refillsNote(m.refillsLeft);
    const col: TileNode[] = [
      t('tile/row', { gap: 'sm', align: 'center', justify: 'between' }, [
        text(m.name || 'Medication', { variant: 'body', weight: 'semibold' }),
        ...(note ? [text(note, { variant: 'caption', color: 'muted' })] : []),
      ]),
    ];
    if (m.dosage) col.push(text(m.dosage, { variant: 'caption', color: 'muted' }));
    col.push(t('tile/progress', { value: RX_FILL[bucket], max: 100, variant: RX_PROGRESS[bucket] }));
    col.push(t('tile/badge', { label: supply, variant: RX_BADGE[bucket] }));
    kids.push(t('tile/container', undefined, [
      t('tile/row', { gap: 'sm', align: 'center', padding: 'sm' }, [
        t('tile/icon', { name: 'pill', size: 'md', color: bucket === 'out' ? 'muted' : bucket === 'low' ? 'warning' : 'success' }),
        t('tile/column', { gap: 'xs' }, col),
      ]),
    ]));
  });

  const pharmacy = p?.pharmacy;
  if (pharmacy?.name) {
    const phCol: TileNode[] = [
      text('Pickup at', { variant: 'caption', color: 'muted' }),
      text(pharmacy.name, { variant: 'body', weight: 'semibold' }),
    ];
    if (pharmacy.address) phCol.push(text(pharmacy.address, { variant: 'caption', color: 'muted' }));
    if (pharmacy.hours) phCol.push(text(pharmacy.hours, { variant: 'caption', color: 'muted' }));
    kids.push(t('tile/divider'));
    kids.push(t('tile/container', undefined, [
      t('tile/row', { gap: 'sm', align: 'center', padding: 'sm' }, [
        t('tile/icon', { name: 'map-pin', size: 'md', color: 'primary' }),
        t('tile/column', { gap: 'none' }, phCol),
      ]),
    ]));
  }

  kids.push(t('tile/button', { label: p?.submitText || 'Request refill', variant: 'primary' }));
  return shell(kids);
}

/* ── builder map (consumed by tiles/registry) ────────────────────────────── */

/** Per-CLT Slack tile builders for Healthcare, keyed by DTO field name. */
export const healthcareTileBuilders: Record<string, (payload: any) => TileNode> = {
  healthcareApptSchedulerJSON: (p) => apptScheduler(p),
  healthcareFindCareJSON: (p) => findCare(p),
  healthcareCareOptionsJSON: (p) => careOptions(p),
  healthcareRxRefillJSON: (p) => rxRefill(p),
};
