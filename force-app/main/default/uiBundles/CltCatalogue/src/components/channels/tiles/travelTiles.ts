import type { TileNode } from './TileRenderer';

/**
 * Per-CLT BuilderKit tile builders for the ASA Travel & Hospitality CLTs. Each
 * returns a Slack "tile/mosaic" node tree (see TileRenderer) composed from the
 * CLT's LWC-true payload — the authentic way these CLTs render in Slack
 * (declarative Block Kit tiles), distinct from the Enhanced Chat v2 LWC. Data is
 * resolved inline rather than left as "{!$attrs.…}" bindings since we render with
 * the payload in hand. Structure/helpers mirror financialServicesTiles.ts and
 * insuranceTiles.ts; empty or missing arrays fall back to the same test-mode
 * samples the editors preview so a card always renders (never crashes).
 *
 * Slack Block Kit best practices applied: a bold title, tile/fields for specs
 * (gate / seat / boarding time), muted captions, dividers, status badges, and a
 * single primary action at the bottom — kept compact (short lists, no full seat
 * grid; the seat map is summarised as a header + available-seat chips).
 */

const t = (definition: string, attributes?: Record<string, any>, children?: TileNode[]): TileNode => ({ type: 'block', definition, attributes, children });
const text = (text: string, attributes: Record<string, any> = {}): TileNode => t('tile/text', { text, ...attributes });

/** Travel money is whole-dollar (matches the editors' maximumFractionDigits: 0). */
function money(n?: number, currency = 'USD'): string {
  const v = Number(n);
  if (!isFinite(v)) return '';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v);
  } catch {
    return `$${Math.round(v)}`;
  }
}

function norm(s?: string): string {
  return String(s || '').toLowerCase().replace(/[^a-z]/g, '');
}

/** Wrap card content in a mosaic → single container → padded column. */
function shell(children: TileNode[]): TileNode {
  return t('tile/mosaic', undefined, [
    t('tile/container', undefined, [t('tile/column', { gap: 'md', padding: 'md' }, children)]),
  ]);
}

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'danger';

/* ── normalizers (mirror the editors, mapped to the allowed tile vocabulary) ── */

const SEAT_KIND_LABEL: Record<string, string> = {
  standard: 'Standard',
  extra_legroom: 'Extra legroom',
  exit: 'Exit row',
  premium: 'Premium',
};
function normSeatKind(k?: string): string {
  const raw = norm(k);
  if (raw === 'extralegroom' || raw === 'legroom') return 'extra_legroom';
  if (raw === 'exit' || raw === 'exitrow') return 'exit';
  if (raw === 'premium' || raw === 'first' || raw === 'business') return 'premium';
  return 'standard';
}
function normSeatStatus(s?: string): string {
  const raw = norm(s);
  if (raw === 'taken' || raw === 'unavailable' || raw === 'occupied') return 'taken';
  if (raw === 'selected' || raw === 'current' || raw === 'mine') return 'selected';
  return 'open';
}

const FLIGHT_STATUS_LABEL: Record<string, string> = {
  scheduled: 'Scheduled', boarding: 'Boarding', departed: 'Departed',
  in_air: 'In air', landed: 'Landed', delayed: 'Delayed', cancelled: 'Cancelled',
};
function normFlightStatus(s?: string): string {
  const raw = norm(s);
  if (raw === 'boarding' || raw === 'nowboarding') return 'boarding';
  if (raw === 'departed' || raw === 'taxiing' || raw === 'takeoff') return 'departed';
  if (raw === 'inair' || raw === 'enroute' || raw === 'airborne') return 'in_air';
  if (raw === 'landed' || raw === 'arrived') return 'landed';
  if (raw === 'delayed' || raw === 'late') return 'delayed';
  if (raw === 'cancelled' || raw === 'canceled') return 'cancelled';
  return 'scheduled';
}
function flightStatusVariant(status: string): BadgeVariant {
  if (status === 'landed') return 'success';
  if (status === 'delayed') return 'warning';
  if (status === 'cancelled') return 'danger';
  if (status === 'boarding' || status === 'in_air' || status === 'departed') return 'info';
  return 'secondary';
}
function flightProgressVariant(status: string): string {
  if (status === 'landed') return 'success';
  if (status === 'delayed') return 'warning';
  if (status === 'cancelled') return 'danger';
  return 'primary';
}

/** Free-text boarding-pass status (e.g. "Boarding", "On time") → badge variant. */
function passStatusVariant(s?: string): BadgeVariant {
  const raw = norm(s);
  if (raw === 'boarded' || raw === 'ontime' || raw === 'departed') return 'success';
  if (raw === 'boarding' || raw === 'scheduled') return 'info';
  if (raw === 'delayed' || raw === 'late') return 'warning';
  if (raw === 'cancelled' || raw === 'canceled') return 'danger';
  return 'secondary';
}

/* ── test-mode fallbacks (mirror the editors so a card always renders) ────────── */

function makeTestSeats(): any[] {
  const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
  const taken = new Set(['12C', '13A', '13F', '14D', '15B', '15E', '16A', '17F', '18C', '18D']);
  const out: any[] = [];
  for (let row = 12; row <= 18; row++) {
    const kind = row === 12 ? 'extra_legroom' : row === 14 ? 'exit' : 'standard';
    const price = row === 12 ? 45 : row === 14 ? 30 : 0;
    for (const col of cols) {
      const id = `${row}${col}`;
      out.push({ id, row, col, status: taken.has(id) ? 'taken' : 'open', kind, price });
    }
  }
  return out;
}
const TEST_SEATMAP: any = {
  title: 'Choose your seat',
  flight: 'SFO → JFK · Flight AF128',
  columns: ['A', 'B', 'C', 'D', 'E', 'F'],
  aisleAfter: 'C',
  currency: 'USD',
  seats: makeTestSeats(),
  submitText: 'Select seat',
};

const TEST_FLIGHT_STATUS: any = {
  title: 'Flight AF128',
  status: 'in_air',
  origin: { code: 'SFO', city: 'San Francisco', time: '10:35 AM', gate: 'A12', terminal: '2' },
  dest: { code: 'JFK', city: 'New York', time: '7:05 PM', terminal: '4', baggage: 'Belt 6' },
  progressPct: 62,
  aircraft: 'Airbus A321neo',
  durationText: '5h 30m',
  updatedText: 'Live · updated just now',
  submitText: 'Get gate updates',
};

const TEST_BOARDING_PASS: any = {
  title: 'Boarding pass',
  airline: 'Aero Air',
  passenger: 'J. RIVERA',
  from: 'SFO', fromCity: 'San Francisco',
  to: 'JFK', toCity: 'New York',
  flight: 'AF128',
  date: 'Jul 12',
  boardingTime: '10:05 AM',
  departTime: '10:35 AM',
  gate: 'A12', terminal: '2', seat: '12A', group: 'B',
  status: 'Boarding',
  submitText: 'Add to wallet',
  secondaryText: 'Email pass',
};

const TEST_ROOMS: any = {
  title: 'Choose your room',
  subtitle: 'The Shoreline Resort · Jul 12–15 · 2 guests',
  currency: 'USD',
  rooms: [
    { id: 'r1', name: 'Ocean View King', bed: '1 King bed', size: '420 sq ft', sleeps: 2, amenities: ['Ocean view', 'Balcony', 'Free WiFi'], price: 389, cadence: 'night', badge: 'Best value' },
    { id: 'r2', name: 'Garden Double Queen', bed: '2 Queen beds', size: '480 sq ft', sleeps: 4, amenities: ['Garden view', 'Free WiFi', 'Mini bar'], price: 329, cadence: 'night' },
    { id: 'r3', name: 'Beachfront Suite', bed: '1 King + sofa bed', size: '720 sq ft', sleeps: 3, amenities: ['Beachfront', 'Living room', 'Soaking tub'], price: 612, cadence: 'night', badge: 'Only 2 left' },
  ],
  submitText: 'Reserve',
};

/* ── #1 Seat Map (travelSeatMapJSON) ──────────────────────────────────────────
   Compact: header (title + flight) + status badge, a fields summary, and a short
   set of available-seat chips — NOT a full cabin grid. */
function seatMap(p: any): TileNode {
  const valid = (p?.seats ?? []).filter((s: any) => s && s.id != null && s.row != null && s.col);
  const isTest = valid.length === 0;
  const src: any = isTest ? TEST_SEATMAP : p;
  const seats: any[] = isTest ? TEST_SEATMAP.seats : valid;
  const currency = src.currency || 'USD';
  const title = (src.title || 'Choose your seat').trim() || 'Choose your seat';
  const submitText = (src.submitText || 'Select seat').trim() || 'Select seat';

  const open = seats.filter((s) => normSeatStatus(s.status) === 'open');
  const selected = seats.find((s) => normSeatStatus(s.status) === 'selected');

  const header = t('tile/row', { justify: 'between', align: 'center' }, [
    t('tile/row', { gap: 'sm', align: 'center' }, [
      t('tile/icon', { name: 'plane', size: 'lg', color: 'primary' }),
      t('tile/column', { gap: 'none' }, [
        text(title, { variant: 'h2', weight: 'bold' }),
        ...(src.flight ? [text(String(src.flight), { variant: 'caption', color: 'muted' })] : []),
      ]),
    ]),
    t('tile/badge', { label: `${open.length} available`, variant: open.length ? 'success' : 'secondary' }),
  ]);

  const summary: { label: string; value: string }[] = [
    { label: 'Available', value: `${open.length} of ${seats.length}` },
  ];
  if (selected) {
    summary.push({ label: 'Your seat', value: [selected.id, SEAT_KIND_LABEL[normSeatKind(selected.kind)]].filter(Boolean).join(' · ') });
  }

  const kids: TileNode[] = [header, t('tile/fields', { items: summary })];

  if (open.length) {
    const chips = open.slice(0, 6).map((s) => {
      const price = Number(s.price) > 0 ? ` · +${money(s.price, currency)}` : '';
      return t('tile/button', { label: `${s.id}${price}`, variant: 'default' });
    });
    kids.push(
      t('tile/divider'),
      text('Available seats', { variant: 'h4', weight: 'semibold' }),
      t('tile/row', { gap: 'sm', align: 'center', wrap: true }, chips),
    );
  }
  kids.push(t('tile/button', { label: submitText, variant: 'primary' }));

  return shell(kids);
}

/* ── #2 Flight Status Tracker (travelFlightStatusJSON) ────────────────────────
   Route (origin → dest), a status badge, a progress bar along the route, and
   gate / terminal / times / baggage as fields. */
function flightStatus(p: any): TileNode {
  const isTest = !(p && (p.origin?.code || p.dest?.code || p.status));
  const src: any = isTest ? TEST_FLIGHT_STATUS : p;
  const status = normFlightStatus(src.status);
  const statusLabel = (src.statusLabel && String(src.statusLabel).trim()) || FLIGHT_STATUS_LABEL[status];
  const origin: any = src.origin || { code: '—' };
  const dest: any = src.dest || { code: '—' };
  const pct = status === 'landed' ? 100
    : status === 'scheduled' || status === 'boarding' ? 0
    : Math.max(0, Math.min(100, Number(src.progressPct) || 0));
  const title = (src.title || 'Flight status').trim() || 'Flight status';
  const submitText = (src.submitText || 'Get updates').trim() || 'Get updates';

  const subParts = [src.aircraft, src.durationText].filter(Boolean).join(' · ');

  const end = (pt: any, align: string): TileNode =>
    t('tile/column', { gap: 'none', align }, [
      text(String(pt.code || '—'), { variant: 'h2', weight: 'bold' }),
      ...(pt.city ? [text(String(pt.city), { variant: 'caption', color: 'muted' })] : []),
      ...(pt.time ? [text(String(pt.time), { variant: 'caption', color: 'default' })] : []),
    ]);

  const gateVal = (pt: any): string =>
    [pt.terminal && `T${pt.terminal}`, pt.gate && `Gate ${pt.gate}`].filter(Boolean).join(' · ');

  const fields: { label: string; value: string }[] = [];
  if (gateVal(origin)) fields.push({ label: `${origin.code || 'Departs'} departs`, value: gateVal(origin) });
  if (gateVal(dest)) fields.push({ label: `${dest.code || 'Arrives'} arrives`, value: gateVal(dest) });
  if (dest.baggage) fields.push({ label: 'Baggage', value: String(dest.baggage) });

  const kids: TileNode[] = [
    t('tile/row', { justify: 'between', align: 'center' }, [
      t('tile/column', { gap: 'none' }, [
        text(title, { variant: 'h2', weight: 'bold' }),
        ...(subParts ? [text(subParts, { variant: 'caption', color: 'muted' })] : []),
      ]),
      t('tile/badge', { label: statusLabel, variant: flightStatusVariant(status) }),
    ]),
    t('tile/row', { justify: 'between', align: 'center' }, [
      end(origin, 'start'),
      t('tile/icon', { name: 'plane', size: 'lg', color: 'primary' }),
      end(dest, 'end'),
    ]),
    t('tile/progress', { value: pct, max: 100, variant: flightProgressVariant(status), showValue: false }),
  ];
  if (fields.length) kids.push(t('tile/fields', { items: fields }));
  if (src.updatedText) kids.push(text(String(src.updatedText), { variant: 'caption', color: 'muted' }));
  kids.push(t('tile/button', { label: submitText, variant: 'primary' }));

  return shell(kids);
}

/* ── #3 Digital Boarding Pass (travelBoardingPassJSON) ────────────────────────
   Passenger + flight, a wallet-style route, a tile/fields block for the specs
   (seat / gate / boarding time / group), and an add-to-wallet action. No barcode
   image field exists in the payload, so no image is rendered. */
function boardingPass(p: any): TileNode {
  const isTest = !(p && (p.flight || p.from || p.to || p.passenger));
  const src: any = isTest ? TEST_BOARDING_PASS : p;
  const title = (src.title || 'Boarding pass').trim();
  const airline = (src.airline || 'Airline').trim();
  const status = (src.status || '').trim();
  const submitText = (src.submitText || 'Add to wallet').trim() || 'Add to wallet';
  const secondaryText = (src.secondaryText || '').trim();

  const cardKids: TileNode[] = [
    t('tile/row', { justify: 'between', align: 'center' }, [
      t('tile/row', { gap: 'sm', align: 'center' }, [
        t('tile/icon', { name: 'plane', size: 'md', color: 'primary' }),
        text(airline, { variant: 'h3', weight: 'bold' }),
      ]),
      ...(status ? [t('tile/badge', { label: status, variant: passStatusVariant(status) })] : []),
    ]),
    t('tile/divider'),
    t('tile/row', { justify: 'between', align: 'center' }, [
      t('tile/column', { gap: 'none', align: 'start' }, [
        text(String(src.from || '—'), { variant: 'h2', weight: 'bold' }),
        ...(src.fromCity ? [text(String(src.fromCity), { variant: 'caption', color: 'muted' })] : []),
      ]),
      t('tile/icon', { name: 'plane', size: 'md', color: 'muted' }),
      t('tile/column', { gap: 'none', align: 'end' }, [
        text(String(src.to || '—'), { variant: 'h2', weight: 'bold' }),
        ...(src.toCity ? [text(String(src.toCity), { variant: 'caption', color: 'muted' })] : []),
      ]),
    ]),
  ];

  const fieldDefs: [string, any][] = [
    ['Passenger', src.passenger],
    ['Flight', src.flight],
    ['Date', src.date],
    ['Boards', src.boardingTime],
    ['Departs', src.departTime],
    ['Gate', src.gate],
    ['Terminal', src.terminal],
    ['Seat', src.seat],
    ['Group', src.group],
  ];
  const items = fieldDefs
    .filter(([, v]) => v != null && String(v).trim())
    .map(([label, v]) => ({ label, value: String(v) }));
  if (items.length) cardKids.push(t('tile/fields', { items }));

  const actions: TileNode[] = [t('tile/button', { label: submitText, variant: 'primary' })];
  if (secondaryText) actions.push(t('tile/button', { label: secondaryText, variant: 'default' }));

  const kids: TileNode[] = [];
  if (title) kids.push(text(title, { variant: 'caption', color: 'muted' }));
  kids.push(
    t('tile/container', undefined, [t('tile/column', { gap: 'sm', padding: 'md' }, cardKids)]),
    t('tile/row', { gap: 'sm', align: 'center', wrap: true }, actions),
  );

  return shell(kids);
}

/* ── #4 Room Selector (travelRoomSelectorJSON) ────────────────────────────────
   Up to 3 room cards (photo when imageUrl present, name, rate, key amenities) +
   a reserve action. */
function roomSelector(p: any): TileNode {
  const valid = (p?.rooms ?? []).filter((r: any) => r && (r.name || r.id));
  const isTest = valid.length === 0;
  const src: any = isTest ? TEST_ROOMS : p;
  const rooms: any[] = (isTest ? TEST_ROOMS.rooms : valid).slice(0, 3);
  const currency = src.currency || 'USD';
  const title = (src.title || 'Choose your room').trim() || 'Choose your room';
  const submitText = (src.submitText || 'Reserve').trim() || 'Reserve';

  const kids: TileNode[] = [text(title, { variant: 'h2', weight: 'bold' })];
  if (src.subtitle) kids.push(text(String(src.subtitle), { variant: 'caption', color: 'muted' }));

  const cards = rooms.map((room) => {
    const roomKids: TileNode[] = [];
    if (room.imageUrl) {
      roomKids.push(t('tile/image', { src: room.imageUrl, alt: room.name || 'Room', aspect: 'wide', rounded: true }));
    }

    roomKids.push(
      t('tile/row', { justify: 'between', align: 'center' }, [
        t('tile/row', { gap: 'sm', align: 'center' }, [
          t('tile/icon', { name: 'bed', size: 'md', color: 'primary' }),
          text(room.name || 'Room', { variant: 'body', weight: 'semibold' }),
        ]),
        ...(room.badge ? [t('tile/badge', { label: String(room.badge), variant: 'primary' })] : []),
      ]),
    );

    const meta = [room.bed, room.size, room.sleeps ? `Sleeps ${room.sleeps}` : ''].filter(Boolean).join(' · ');
    if (meta) roomKids.push(text(meta, { variant: 'caption', color: 'muted' }));

    const amenities = (room.amenities ?? []).filter((a: any) => a != null && String(a).trim()).slice(0, 3);
    if (amenities.length) {
      roomKids.push(t('tile/row', { gap: 'sm', align: 'center', wrap: true },
        amenities.map((a: any) => t('tile/badge', { label: String(a).trim(), variant: 'secondary' })),
      ));
    }

    if (room.price != null && isFinite(Number(room.price))) {
      roomKids.push(t('tile/row', { gap: 'xs', align: 'baseline' }, [
        text(money(room.price, room.currency || currency), { variant: 'body', weight: 'bold' }),
        text(`/ ${room.cadence || 'night'}`, { variant: 'caption', color: 'muted' }),
      ]));
    }

    return t('tile/container', undefined, [t('tile/column', { gap: 'sm', padding: 'sm' }, roomKids)]);
  });

  kids.push(t('tile/column', { gap: 'sm' }, cards));
  kids.push(t('tile/button', { label: submitText, variant: 'primary' }));

  return shell(kids);
}

/* ── builder map (consumed by tiles/registry) ─────────────────────────────────── */

/** Per-CLT Slack tile builders for ASA Travel & Hospitality, keyed by DTO field name. */
export const travelTileBuilders: Record<string, (payload: any) => TileNode> = {
  travelSeatMapJSON: (p) => seatMap(p),
  travelFlightStatusJSON: (p) => flightStatus(p),
  travelBoardingPassJSON: (p) => boardingPass(p),
  travelRoomSelectorJSON: (p) => roomSelector(p),
};
