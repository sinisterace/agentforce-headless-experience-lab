import type { TileNode } from './TileRenderer';

/**
 * Per-CLT BuilderKit tile builders for the ASA Insurance CLTs. Each returns a
 * Slack "tile/mosaic" node tree (see TileRenderer) composed from the CLT's
 * LWC-true payload — the authentic way these CLTs render in Slack (declarative
 * Block Kit tiles), distinct from the Enhanced Chat v2 LWC. Data is resolved
 * inline rather than left as "{!$attrs.…}" bindings since we render with the
 * payload in hand. Structure/helpers mirror financialServicesTiles.ts; empty or
 * missing arrays fall back to the same test-mode samples the editors preview so
 * a card always renders (never crashes).
 */

const t = (definition: string, attributes?: Record<string, any>, children?: TileNode[]): TileNode => ({ type: 'block', definition, attributes, children });
const text = (text: string, attributes: Record<string, any> = {}): TileNode => t('tile/text', { text, ...attributes });

function money(amount?: number, currency = 'USD'): string {
  const n = Number(amount);
  if (!isFinite(n)) return '';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

/** ISO yyyy-mm-dd → "Nov 1, 2026"; already-formatted strings pass through. */
function fmtDate(value?: string): string {
  if (!value) return '';
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  try {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  } catch {
    return s;
  }
}

/** Wrap card content in a mosaic → single container → padded column. */
function shell(children: TileNode[]): TileNode {
  return t('tile/mosaic', undefined, [
    t('tile/container', undefined, [t('tile/column', { gap: 'md', padding: 'md' }, children)]),
  ]);
}

/* ── normalizers (mirror the editors' *Format.ts helpers, mapped to the allowed
      TileRenderer icon vocabulary + badge variants) ─────────────────────────── */

function norm(s?: string): string {
  return String(s || '').toLowerCase().replace(/[^a-z]/g, '');
}

/** Policy type → an allowed icon name. */
function policyIcon(type?: string): string {
  const raw = norm(type);
  if (raw === 'home' || raw === 'homeowners' || raw === 'property' || raw === 'dwelling') return 'home';
  if (raw === 'renters' || raw === 'rental' || raw === 'tenant') return 'home';
  if (raw === 'life' || raw === 'termlife' || raw === 'wholelife') return 'heart';
  if (raw === 'health' || raw === 'medical' || raw === 'dental' || raw === 'vision') return 'heart';
  if (raw === 'umbrella' || raw === 'liability') return 'shield';
  if (raw === 'pet') return 'heart';
  if (raw === 'travel') return 'plane';
  return 'car';
}

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'danger';

/** Policy status → badge variant. */
function policyStatusVariant(status?: string): BadgeVariant {
  const raw = norm(status);
  if (raw === 'active' || raw === 'inforce' || raw === 'current') return 'success';
  if (raw === 'pending' || raw === 'inreview' || raw === 'processing') return 'warning';
  if (raw === 'lapsed' || raw === 'expired' || raw === 'pastdue') return 'danger';
  if (raw === 'cancelled' || raw === 'canceled' || raw === 'terminated') return 'secondary';
  return 'secondary';
}

/** Incident icon hint → an allowed icon name. */
function incidentIconName(icon?: string): string {
  const raw = norm(icon);
  if (raw === 'collision' || raw === 'crash' || raw === 'accident') return 'car';
  if (raw === 'theft' || raw === 'stolen' || raw === 'burglary' || raw === 'breakin') return 'shield';
  if (raw === 'weather' || raw === 'storm' || raw === 'hail' || raw === 'wind') return 'wind';
  if (raw === 'water' || raw === 'flood' || raw === 'leak') return 'alert';
  if (raw === 'fire' || raw === 'smoke') return 'alert';
  if (raw === 'glass' || raw === 'windshield' || raw === 'window') return 'car';
  if (raw === 'liability' || raw === 'injury' || raw === 'thirdparty') return 'scale';
  if (raw === 'medical' || raw === 'health' || raw === 'illness') return 'stethoscope';
  return 'clipboard';
}

type ClaimBucket = 'submitted' | 'review' | 'approved' | 'paid' | 'denied';
type StepState = 'done' | 'current' | 'upcoming' | 'denied';

const DEFAULT_TRACK = ['Submitted', 'Review', 'Approved', 'Paid'];

function claimBucket(status?: string): ClaimBucket {
  const raw = norm(status);
  if (raw === 'submitted' || raw === 'filed' || raw === 'new' || raw === 'received') return 'submitted';
  if (raw === 'review' || raw === 'inreview' || raw === 'processing' || raw === 'investigating' || raw === 'pending') return 'review';
  if (raw === 'approved' || raw === 'accepted') return 'approved';
  if (raw === 'paid' || raw === 'settled' || raw === 'closed' || raw === 'complete' || raw === 'completed') return 'paid';
  if (raw === 'denied' || raw === 'declined' || raw === 'rejected') return 'denied';
  return 'review';
}

function claimStatusVariant(bucket: ClaimBucket): BadgeVariant {
  switch (bucket) {
    case 'submitted': return 'info';
    case 'review': return 'warning';
    case 'approved': return 'success';
    case 'paid': return 'success';
    case 'denied': return 'danger';
  }
}

function normalizeStepState(state?: string): StepState {
  const raw = norm(state);
  if (raw === 'done' || raw === 'complete' || raw === 'completed' || raw === 'passed') return 'done';
  if (raw === 'current' || raw === 'active' || raw === 'inprogress') return 'current';
  if (raw === 'denied' || raw === 'declined' || raw === 'rejected') return 'denied';
  return 'upcoming';
}

/** Derive a step track from a status bucket when no explicit steps are given. */
function deriveSteps(bucket: ClaimBucket): { label: string; state: StepState }[] {
  if (bucket === 'denied') {
    return [
      { label: 'Submitted', state: 'done' },
      { label: 'Denied', state: 'denied' },
    ];
  }
  const currentIndex = DEFAULT_TRACK.map((s) => s.toLowerCase()).indexOf(bucket);
  return DEFAULT_TRACK.map((label, i) => {
    let state: StepState = 'upcoming';
    if (bucket === 'paid') state = 'done';
    else if (i < currentIndex) state = 'done';
    else if (i === currentIndex) state = 'current';
    return { label, state };
  });
}

/* ── test-mode fallbacks (mirror the editors) ─────────────────────────────── */

const TEST_POLICIES: any[] = [
  { id: 'test-auto', name: 'Auto — 2022 Tesla Model 3', type: 'Auto', policyNumber: '8842', premium: 142.5, cadence: 'monthly', currency: 'USD', renewalDate: '2026-11-01', status: 'Active', coverage: 'Collision + Comprehensive · $500 deductible', badge: 'Primary' },
  { id: 'test-home', name: 'Homeowners — 14 Elm St', type: 'Home', policyNumber: '3391', premium: 1820.0, cadence: 'annual', currency: 'USD', renewalDate: '2027-02-15', status: 'Active', coverage: 'Dwelling $420k · $1,000 deductible' },
  { id: 'test-life', name: 'Term Life — 20yr', type: 'Life', policyNumber: '5567', premium: 48.0, cadence: 'monthly', currency: 'USD', renewalDate: '2038-06-01', status: 'Active', coverage: '$500,000 benefit' },
];

const TEST_INCIDENTS: any[] = [
  { id: 'collision', label: 'Collision', description: 'Accident with another vehicle or object', icon: 'collision' },
  { id: 'theft', label: 'Theft or break-in', description: 'Vehicle or contents stolen', icon: 'theft' },
  { id: 'weather', label: 'Weather or storm', description: 'Hail, wind, flood, or fallen tree', icon: 'weather' },
  { id: 'glass', label: 'Glass or windshield', description: 'Cracked or shattered glass', icon: 'glass' },
];
const TEST_CLAIM_POLICY: any = { label: 'Auto — 2022 Tesla Model 3', policyNumber: '8842', imageUrl: '/resource/asaInsuranceTeslaModel3' };

const TEST_CLAIMS: any[] = [
  { id: 'clm-4471', claimNumber: 'CLM-4471', type: 'Collision', policyLabel: 'Auto — 2022 Tesla Model 3', filedDate: '2026-07-28', amount: 3200.0, currency: 'USD', status: 'Review', statusLabel: 'In review', updatedDate: '2026-08-05', nextActionText: 'Upload the repair estimate' },
  { id: 'clm-3120', claimNumber: 'CLM-3120', type: 'Water damage', policyLabel: 'Homeowners — 14 Elm St', filedDate: '2026-06-10', amount: 8750.0, currency: 'USD', status: 'Paid', statusLabel: 'Paid', updatedDate: '2026-07-02' },
];

const TEST_ID_CARD: any = {
  title: 'Proof of insurance', carrier: 'Meridian Mutual', policyType: 'Auto', policyholder: 'Jordan Rivera',
  policyNumber: 'AUTO-8842-XY', vehicle: '2022 Tesla Model 3', plate: '8ABC123', effectiveDate: 'Jan 1, 2026',
  expirationDate: 'Jul 1, 2026', status: 'Active',
  coverages: [{ label: 'Liability' }, { label: 'Collision', detail: '$500 ded.' }, { label: 'Comprehensive', detail: '$500 ded.' }, { label: 'Uninsured motorist' }],
  submitText: 'Email me a copy', secondaryText: 'Add to wallet',
};

/* ── #1 Policy Selector (insurancePolicySelectorJSON) ─────────────────────── */
function policySelector(p: any): TileNode {
  const list = (p?.policies ?? []).filter((x: any) => x && x.name);
  const isTest = list.length === 0;
  const policies: any[] = (isTest ? TEST_POLICIES : list).slice(0, 4);
  const title = (isTest ? 'Which policy can I help you with?' : p?.title) || 'Which policy can I help you with?';

  const cards = policies.map((pol) => {
    const header = t('tile/row', { justify: 'between', align: 'center' }, [
      t('tile/row', { gap: 'sm', align: 'center' }, [
        t('tile/icon', { name: policyIcon(pol.type), size: 'md', color: 'primary' }),
        t('tile/column', { gap: 'none' }, [
          text(pol.name, { variant: 'body', weight: 'semibold' }),
          text([pol.type, pol.policyNumber ? `•• ${pol.policyNumber}` : ''].filter(Boolean).join(' · '), { variant: 'caption', color: 'muted' }),
        ]),
      ]),
      ...(pol.status ? [t('tile/badge', { label: pol.status, variant: policyStatusVariant(pol.status) })] : []),
    ]);

    const kids: TileNode[] = [header];
    if (pol.coverage) kids.push(text(pol.coverage, { variant: 'caption', color: 'muted' }));

    const foot: TileNode[] = [];
    if (typeof pol.premium === 'number') {
      foot.push(t('tile/row', { gap: 'xs', align: 'baseline' }, [
        text(money(pol.premium, pol.currency), { variant: 'body', weight: 'bold' }),
        ...(pol.cadence ? [text(`/${pol.cadence}`, { variant: 'caption', color: 'muted' })] : []),
      ]));
    }
    if (pol.renewalDate) foot.push(text(`Renews ${fmtDate(pol.renewalDate)}`, { variant: 'caption', color: 'muted' }));
    if (pol.badge) foot.push(t('tile/badge', { label: pol.badge, variant: 'primary' }));
    if (foot.length) kids.push(t('tile/row', { gap: 'sm', align: 'center', wrap: true }, foot));

    return t('tile/container', undefined, [t('tile/column', { gap: 'xs', padding: 'sm' }, kids)]);
  });

  return shell([
    text(title, { variant: 'h2', weight: 'bold' }),
    t('tile/column', { gap: 'sm' }, cards),
    t('tile/button', { label: p?.submitText || 'Continue', variant: 'primary' }),
  ]);
}

/* ── #2 File a Claim (insuranceFileClaimJSON) ─────────────────────────────── */
function fileClaim(p: any): TileNode {
  const list = (p?.incidentTypes ?? []).filter((x: any) => x && x.label);
  const isTest = list.length === 0;
  const incidents: any[] = (isTest ? TEST_INCIDENTS : list).slice(0, 5);
  const policy = isTest ? TEST_CLAIM_POLICY : p?.policy;
  const title = (p?.title || '').trim() || 'What happened?';

  const kids: TileNode[] = [text(title, { variant: 'h2', weight: 'bold' })];

  // Insured-item hero photo — only when a real image URL is present.
  if (policy?.imageUrl) {
    kids.push(t('tile/image', { src: policy.imageUrl, alt: policy.label || 'Insured item', aspect: 'wide', rounded: true }));
  }

  // Policy context card.
  if (policy?.label) {
    kids.push(t('tile/container', undefined, [
      t('tile/column', { padding: 'sm' }, [
        t('tile/row', { gap: 'sm', align: 'center' }, [
          t('tile/icon', { name: 'shield', size: 'md', color: 'primary' }),
          t('tile/column', { gap: 'none' }, [
            text(policy.label, { variant: 'body', weight: 'semibold' }),
            ...(policy.policyNumber ? [text(`•• ${policy.policyNumber}`, { variant: 'caption', color: 'muted' })] : []),
          ]),
        ]),
      ]),
    ]));
  }

  kids.push(t('tile/divider'));

  const tiles = incidents.map((inc) =>
    t('tile/container', undefined, [
      t('tile/row', { gap: 'sm', align: 'center', padding: 'sm' }, [
        t('tile/icon', { name: incidentIconName(inc.icon), size: 'md', color: 'primary' }),
        t('tile/column', { gap: 'none' }, [
          text(inc.label, { variant: 'body', weight: 'semibold' }),
          ...(inc.description ? [text(inc.description, { variant: 'caption', color: 'muted' })] : []),
        ]),
      ]),
    ]),
  );
  kids.push(t('tile/column', { gap: 'sm' }, tiles));
  kids.push(t('tile/button', { label: p?.submitText || 'Start claim', variant: 'primary' }));

  return shell(kids);
}

/* ── #3 Claim Status Tracker (insuranceClaimStatusJSON) ───────────────────── */
function claimStatus(p: any): TileNode {
  const list = (p?.claims ?? []).filter((x: any) => x && x.claimNumber);
  const isTest = list.length === 0;
  const claims: any[] = (isTest ? TEST_CLAIMS : list).slice(0, 3);
  const title = (isTest ? 'Your claims' : p?.title) || 'Your claims';

  const blocks: TileNode[] = [text(title, { variant: 'h2', weight: 'bold' })];

  claims.forEach((claim, idx) => {
    const bucket = claimBucket(claim.status);
    const statusLabel = claim.statusLabel || claim.status || bucket;
    const steps = (claim.steps && claim.steps.length)
      ? claim.steps.map((s: any) => ({ label: s.label, state: normalizeStepState(s.state) }))
      : deriveSteps(bucket);

    const head = t('tile/row', { justify: 'between', align: 'center' }, [
      t('tile/column', { gap: 'none' }, [
        text(claim.claimNumber, { variant: 'h4', weight: 'semibold' }),
        text([claim.type, claim.policyLabel].filter(Boolean).join(' · '), { variant: 'caption', color: 'muted' }),
      ]),
      t('tile/badge', { label: statusLabel, variant: claimStatusVariant(bucket) }),
    ]);

    // Stepper — a compact chip row of icon + label per step (mirrors the LWC dots).
    const stepChips = steps.map((step: { label: string; state: StepState }) => {
      const parts: TileNode[] = [];
      if (step.state === 'done') parts.push(t('tile/icon', { name: 'check-circle', size: 'xs', color: 'success' }));
      else if (step.state === 'current') parts.push(t('tile/icon', { name: 'clock', size: 'xs', color: 'info' }));
      else if (step.state === 'denied') parts.push(t('tile/icon', { name: 'error', size: 'xs', color: 'danger' }));
      const labelColor = step.state === 'done' ? 'success' : step.state === 'current' ? 'info' : step.state === 'denied' ? 'danger' : 'muted';
      parts.push(text(step.label, { variant: 'caption', color: labelColor }));
      return t('tile/row', { gap: 'xs', align: 'center' }, parts);
    });

    const card: TileNode[] = [head, t('tile/row', { gap: 'md', align: 'center', wrap: true }, stepChips)];

    if (claim.nextActionText) {
      card.push(t('tile/row', { gap: 'xs', align: 'center' }, [
        t('tile/icon', { name: 'alert', size: 'sm', color: 'warning' }),
        text(claim.nextActionText, { variant: 'caption', color: 'default' }),
      ]));
    }

    const foot: TileNode[] = [];
    if (typeof claim.amount === 'number') foot.push(text(money(claim.amount, claim.currency), { variant: 'body', weight: 'bold' }));
    if (claim.filedDate) foot.push(text(`Filed ${fmtDate(claim.filedDate)}`, { variant: 'caption', color: 'muted' }));
    if (claim.updatedDate) foot.push(text(`Updated ${fmtDate(claim.updatedDate)}`, { variant: 'caption', color: 'muted' }));
    if (foot.length) card.push(t('tile/row', { gap: 'sm', align: 'baseline', wrap: true }, foot));

    blocks.push(t('tile/container', undefined, [t('tile/column', { gap: 'sm', padding: 'sm' }, card)]));
    if (idx < claims.length - 1) blocks.push(t('tile/divider'));
  });

  blocks.push(t('tile/button', { label: p?.submitText || 'Ask about a claim', variant: 'primary' }));
  return shell(blocks);
}

/* ── #4 Digital ID Card (insuranceIdCardJSON) ─────────────────────────────── */
function idCard(p: any): TileNode {
  const isTest = !(p && (p.policyNumber || p.carrier || (Array.isArray(p.coverages) && p.coverages.length > 0)));
  const src: any = isTest ? TEST_ID_CARD : p;

  const title = (src.title || 'Proof of insurance').trim();
  const carrier = (src.carrier || 'Your insurer').trim();
  const status = (src.status || '').trim();
  const coverages: any[] = (src.coverages ?? []).filter((c: any) => c && c.label);
  const submitText = (src.submitText || 'Email me a copy').trim() || 'Email me a copy';
  const secondaryText = (src.secondaryText || '').trim();

  const fieldDefs: [string, any][] = [
    ['Policyholder', src.policyholder],
    ['Policy #', src.policyNumber],
    ['Vehicle', src.vehicle],
    ['Plate', src.plate],
    ['Effective', src.effectiveDate ? fmtDate(src.effectiveDate) : ''],
    ['Expires', src.expirationDate ? fmtDate(src.expirationDate) : ''],
  ];
  const items = fieldDefs
    .filter(([, v]) => v != null && String(v).trim())
    .map(([label, v]) => ({ label, value: String(v) }));

  // Wallet-like "card": carrier + line-of-business header, key/value fields, coverage chips.
  const cardKids: TileNode[] = [
    t('tile/row', { justify: 'between', align: 'center' }, [
      t('tile/row', { gap: 'sm', align: 'center' }, [
        t('tile/icon', { name: 'shield', size: 'md', color: 'primary' }),
        text(carrier, { variant: 'h3', weight: 'bold' }),
      ]),
      ...(status ? [t('tile/badge', { label: status, variant: policyStatusVariant(status) })] : []),
    ]),
  ];
  if (src.policyType) cardKids.push(text(`${src.policyType} · ID Card`, { variant: 'caption', color: 'muted' }));
  cardKids.push(t('tile/divider'));
  if (items.length) cardKids.push(t('tile/fields', { items }));
  if (coverages.length) {
    cardKids.push(t('tile/row', { gap: 'sm', align: 'center', wrap: true },
      coverages.map((c) => t('tile/badge', { label: c.detail ? `${c.label} · ${c.detail}` : c.label, variant: 'secondary' })),
    ));
  }

  const actions: TileNode[] = [t('tile/button', { label: submitText, variant: 'primary' })];
  if (secondaryText) actions.push(t('tile/button', { label: secondaryText, variant: 'default' }));

  return shell([
    text(title, { variant: 'caption', color: 'muted' }),
    t('tile/container', undefined, [t('tile/column', { gap: 'sm', padding: 'md' }, cardKids)]),
    t('tile/row', { gap: 'sm', align: 'center', wrap: true }, actions),
  ]);
}

/* ── builder map (consumed by tiles/registry) ─────────────────────────────── */

/** Per-CLT Slack tile builders for ASA Insurance, keyed by DTO field name. */
export const insuranceTileBuilders: Record<string, (payload: any) => TileNode> = {
  insurancePolicySelectorJSON: (p) => policySelector(p),
  insuranceFileClaimJSON: (p) => fileClaim(p),
  insuranceClaimStatusJSON: (p) => claimStatus(p),
  insuranceIdCardJSON: (p) => idCard(p),
};
