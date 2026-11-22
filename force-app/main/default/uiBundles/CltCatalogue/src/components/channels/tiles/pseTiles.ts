import type { TileNode } from './TileRenderer';
import type {
  PseAppStatusPayload,
  PseProgramsFinderPayload,
  PseServiceRequestPayload,
  PseDocsChecklistPayload,
} from '@/components/playground/payloads';

/**
 * Per-CLT BuilderKit tile builders for the Public Sector & Education CLTs. Each
 * returns a Slack "tile/mosaic" node tree (see TileRenderer) composed from the
 * CLT's LWC-true payload — the authentic way these CLTs render in Slack
 * (declarative Block Kit tiles), distinct from the "Civic Records" LWC used in
 * Enhanced Chat v2. Data is resolved inline rather than left as "{!$attrs.…}"
 * bindings since we render with the payload in hand. Each builder mirrors its
 * editor's test-mode fallback: an empty list swaps in the sample payload.
 */

const t = (definition: string, attributes?: Record<string, any>, children?: TileNode[]): TileNode => ({ type: 'block', definition, attributes, children });
const text = (text: string, attributes: Record<string, any> = {}): TileNode => t('tile/text', { text, ...attributes });

/** Wrap card content in a mosaic → single container → padded column. */
function shell(children: TileNode[]): TileNode {
  return t('tile/mosaic', undefined, [
    t('tile/container', undefined, [t('tile/column', { gap: 'md', padding: 'md' }, children)]),
  ]);
}

/* ── #1 Application Status Tracker ───────────────────────────────────────── */

type Bucket = 'submitted' | 'review' | 'approved' | 'issued' | 'denied';
type StepState = 'done' | 'current' | 'upcoming' | 'denied';

const APP_TRACK = ['Submitted', 'Under review', 'Approved', 'Issued'];
const APP_BUCKETS = ['submitted', 'review', 'approved', 'issued'];

const STATUS_BADGE: Record<Bucket, string> = {
  submitted: 'info', review: 'warning', approved: 'success', issued: 'success', denied: 'danger',
};

const STEP_ICON: Record<StepState, { name: string; color: string }> = {
  done: { name: 'check-circle', color: 'success' },
  current: { name: 'activity', color: 'info' },
  upcoming: { name: 'clock', color: 'muted' },
  denied: { name: 'error', color: 'danger' },
};

function statusOf(status?: string): Bucket {
  const raw = String(status || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'submitted' || raw === 'filed' || raw === 'new' || raw === 'received') return 'submitted';
  if (raw === 'review' || raw === 'inreview' || raw === 'processing' || raw === 'pending') return 'review';
  if (raw === 'approved' || raw === 'accepted') return 'approved';
  if (raw === 'issued' || raw === 'complete' || raw === 'completed' || raw === 'granted' || raw === 'enrolled') return 'issued';
  if (raw === 'denied' || raw === 'declined' || raw === 'rejected') return 'denied';
  return 'review';
}

function stepStateOf(state?: string): StepState {
  const raw = String(state || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'done' || raw === 'complete' || raw === 'completed' || raw === 'passed') return 'done';
  if (raw === 'current' || raw === 'active' || raw === 'inprogress') return 'current';
  if (raw === 'denied' || raw === 'declined' || raw === 'rejected') return 'denied';
  return 'upcoming';
}

function deriveSteps(bucket: Bucket): { label: string; state: StepState; timeText?: string }[] {
  if (bucket === 'denied') {
    return [
      { label: 'Submitted', state: 'done' },
      { label: 'Denied', state: 'denied' },
    ];
  }
  const currentIndex = APP_BUCKETS.indexOf(bucket);
  return APP_TRACK.map((label, i) => {
    let state: StepState = 'upcoming';
    if (bucket === 'issued') state = 'done';
    else if (i < currentIndex) state = 'done';
    else if (i === currentIndex) state = 'current';
    return { label, state };
  });
}

const APP_STATUS_TEST: PseAppStatusPayload = {
  title: 'Your application status',
  applicationType: 'Building permit',
  referenceNumber: 'APP-2026-1043',
  status: 'review',
  statusLabel: 'Under review',
  steps: [
    { label: 'Submitted', state: 'done' },
    { label: 'Under review', state: 'current' },
    { label: 'Approved', state: 'todo' },
    { label: 'Issued', state: 'todo' },
  ],
  nextActionText: 'We may request additional documents — no action needed right now.',
  submitText: 'Message the office',
};

function appStatus(p: PseAppStatusPayload): TileNode {
  const hasContent = !!(p.referenceNumber || p.applicationType || (Array.isArray(p.steps) && p.steps.length));
  const src = hasContent ? p : APP_STATUS_TEST;

  const bucket = statusOf(src.status);
  const statusLabel = src.statusLabel || src.status || bucket;
  const rawSteps = Array.isArray(src.steps) && src.steps.length ? src.steps.filter((s) => s && s.label) : deriveSteps(bucket);
  const steps = rawSteps.map((s) => ({ label: String(s.label), state: stepStateOf(s.state), timeText: s.timeText }));

  const total = steps.length;
  const doneCount = steps.filter((s) => s.state === 'done').length;
  const hasCurrent = steps.some((s) => s.state === 'current');
  const progVariant = bucket === 'denied' ? 'danger' : bucket === 'approved' || bucket === 'issued' ? 'success' : 'primary';

  const header = t('tile/row', { justify: 'between', align: 'start', gap: 'sm' }, [
    t('tile/row', { gap: 'sm', align: 'center' }, [
      t('tile/icon', { name: 'landmark', size: 'lg', color: 'primary' }),
      t('tile/column', { gap: 'none' }, [
        text('Permits & Licensing', { variant: 'caption', color: 'muted', weight: 'semibold' }),
        text(src.title || 'Your application status', { variant: 'h3', weight: 'bold' }),
      ]),
    ]),
    t('tile/badge', { label: statusLabel, variant: STATUS_BADGE[bucket] }),
  ]);

  const stepRows = steps.map((s) => {
    const ic = STEP_ICON[s.state];
    const left = t('tile/row', { gap: 'sm', align: 'center' }, [
      t('tile/icon', { name: ic.name, size: 'md', color: ic.color }),
      text(s.label, {
        variant: 'body',
        weight: s.state === 'current' || s.state === 'denied' ? 'semibold' : 'regular',
        color: s.state === 'current' ? 'default' : s.state === 'denied' ? 'danger' : 'muted',
      }),
    ]);
    return t('tile/row', { justify: 'between', align: 'center', gap: 'sm' }, s.timeText ? [left, text(s.timeText, { variant: 'caption', color: 'muted' })] : [left]);
  });

  const kids: TileNode[] = [header];

  const fieldItems: { label: string; value: string }[] = [];
  if (src.referenceNumber) fieldItems.push({ label: 'Ref no.', value: src.referenceNumber });
  if (src.applicationType) fieldItems.push({ label: 'Application', value: src.applicationType });
  if (fieldItems.length) kids.push(t('tile/fields', { items: fieldItems }));

  kids.push(t('tile/progress', { value: doneCount + (hasCurrent ? 0.5 : 0), max: total || 1, variant: progVariant, showValue: true }));
  kids.push(t('tile/column', { gap: 'sm' }, stepRows));

  if (src.nextActionText) {
    kids.push(
      t('tile/container', undefined, [
        t('tile/row', { gap: 'sm', align: 'start', padding: 'sm' }, [
          t('tile/icon', { name: 'info', size: 'md', color: 'info' }),
          t('tile/column', { gap: 'none' }, [
            text('Next step', { variant: 'caption', color: 'muted', weight: 'semibold' }),
            text(src.nextActionText, { variant: 'body' }),
          ]),
        ]),
      ]),
    );
  }

  kids.push(t('tile/divider'));
  kids.push(t('tile/button', { label: src.submitText || 'Track application', variant: 'primary' }));
  return shell(kids);
}

/* ── #2 Programs & Benefits Finder ───────────────────────────────────────── */

const CATEGORY_LABELS: Record<string, string> = {
  assistance: 'Assistance', education: 'Education', health: 'Health', housing: 'Housing',
  tax: 'Tax', employment: 'Employment', utility: 'Utility',
};

const PROGRAM_ICON: Record<string, string> = {
  assistance: 'cash', education: 'file', health: 'heart', housing: 'home',
  tax: 'receipt', employment: 'briefcase', utility: 'zap',
};

function categoryLabel(cat?: string): string {
  const raw = String(cat || '').toLowerCase().replace(/[^a-z_]/g, '');
  if (!raw) return '';
  return CATEGORY_LABELS[raw] || raw.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

function eligVariant(s?: string): string {
  const tt = String(s || '').toLowerCase();
  if (/likely|qualif|eligible/.test(tt)) return 'success';
  if (/may|might|possible|pending|review/.test(tt)) return 'warning';
  return 'info';
}

const PROGRAMS_TEST: PseProgramsFinderPayload = {
  title: 'Programs & benefits you may qualify for',
  subtitle: "Based on what you've told us",
  programs: [
    { id: 'snap', name: 'Food assistance (SNAP)', category: 'assistance', detail: 'Monthly grocery benefits', eligibility: 'Likely eligible', badge: 'Popular' },
    { id: 'liheap', name: 'Energy bill relief (LIHEAP)', category: 'utility', detail: 'Help with heating & cooling costs', eligibility: 'May be eligible' },
    { id: 'grant', name: 'State tuition grant', category: 'education', detail: 'Up to $4,000/yr for residents', eligibility: 'Likely eligible' },
    { id: 'childcare', name: 'Childcare subsidy', category: 'assistance', detail: 'Sliding-scale childcare help' },
  ],
  submitText: 'Apply for selected',
};

function programsFinder(p: PseProgramsFinderPayload): TileNode {
  const usable = (p.programs ?? []).filter((x) => x && x.name);
  const src = usable.length ? p : PROGRAMS_TEST;
  const programs = (src.programs ?? []).filter((x) => x && x.name).slice(0, 3);

  const cards = programs.map((pr) => {
    const cat = String(pr.category || '').toLowerCase().replace(/[^a-z_]/g, '');
    const icon = PROGRAM_ICON[cat] || 'landmark';
    const label = categoryLabel(pr.category);

    const nameLine = t('tile/row', { gap: 'sm', align: 'center', wrap: true }, [
      text(pr.name, { variant: 'body', weight: 'semibold' }),
      ...(pr.badge ? [t('tile/badge', { label: pr.badge, variant: 'info' })] : []),
    ]);

    const col: TileNode[] = [];
    if (label) col.push(text(label, { variant: 'caption', color: 'muted' }));
    col.push(nameLine);
    if (pr.detail) col.push(text(pr.detail, { variant: 'caption', color: 'muted' }));
    if (pr.eligibility) col.push(t('tile/row', { gap: 'xs', align: 'center' }, [t('tile/badge', { label: pr.eligibility, variant: eligVariant(pr.eligibility) })]));

    return t('tile/container', undefined, [
      t('tile/row', { gap: 'sm', align: 'start', padding: 'sm' }, [
        t('tile/icon', { name: icon, size: 'md', color: 'primary' }),
        t('tile/column', { gap: 'xs' }, col),
      ]),
    ]);
  });

  const kids: TileNode[] = [text(src.title || 'Programs & benefits you may qualify for', { variant: 'h2', weight: 'bold' })];
  if (src.subtitle) kids.push(text(src.subtitle, { variant: 'caption', color: 'muted' }));
  kids.push(t('tile/column', { gap: 'sm' }, cards));
  kids.push(t('tile/divider'));
  kids.push(t('tile/button', { label: (src.submitText && src.submitText.trim()) || 'Apply for selected', variant: 'primary' }));
  return shell(kids);
}

/* ── #3 Service Request ──────────────────────────────────────────────────── */

type ReqBucket = 'road' | 'light' | 'graffiti' | 'trash' | 'water' | 'building' | 'tree' | 'sidewalk' | 'noise' | 'other';

const REQ_ICON: Record<ReqBucket, string> = {
  road: 'car', light: 'zap', graffiti: 'alert', trash: 'truck', water: 'wrench',
  building: 'building', tree: 'leaf', sidewalk: 'footprints', noise: 'signal', other: 'help',
};

function normReqIcon(icon?: string): ReqBucket {
  const raw = String(icon || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'road' || raw === 'pothole' || raw === 'pavement' || raw === 'street') return 'road';
  if (raw === 'light' || raw === 'streetlight' || raw === 'lamp' || raw === 'lighting') return 'light';
  if (raw === 'graffiti' || raw === 'vandalism' || raw === 'tagging') return 'graffiti';
  if (raw === 'trash' || raw === 'garbage' || raw === 'dumping' || raw === 'waste' || raw === 'litter') return 'trash';
  if (raw === 'water' || raw === 'leak' || raw === 'flood' || raw === 'hydrant' || raw === 'sewer') return 'water';
  if (raw === 'building' || raw === 'facility' || raw === 'facilities' || raw === 'maintenance') return 'building';
  if (raw === 'tree' || raw === 'park' || raw === 'landscaping' || raw === 'vegetation') return 'tree';
  if (raw === 'sidewalk' || raw === 'curb' || raw === 'walkway') return 'sidewalk';
  if (raw === 'noise' || raw === 'sound' || raw === 'nuisance') return 'noise';
  return 'other';
}

const SERVICE_TEST: PseServiceRequestPayload = {
  title: 'Report a problem',
  subtitle: "Choose what you'd like to report",
  locationText: 'Near 123 Main St',
  requestTypes: [
    { id: 'pothole', label: 'Pothole / road', description: 'Damaged road or pavement', icon: 'road' },
    { id: 'streetlight', label: 'Streetlight out', description: 'Broken or flickering light', icon: 'light' },
    { id: 'graffiti', label: 'Graffiti', description: 'Vandalism or tagging', icon: 'graffiti' },
    { id: 'trash', label: 'Trash / dumping', description: 'Missed pickup or illegal dumping', icon: 'trash' },
    { id: 'water', label: 'Water / leak', description: 'Leak, flooding, or hydrant', icon: 'water' },
    { id: 'facility', label: 'Facilities', description: 'Building or campus maintenance', icon: 'building' },
  ],
};

function serviceRequest(p: PseServiceRequestPayload): TileNode {
  const has = Array.isArray(p.requestTypes) && p.requestTypes.length > 0;
  const src = has ? p : SERVICE_TEST;
  const requests = (src.requestTypes ?? []).filter((r) => r && (r.label || r.id));

  const rows = requests.map((r) => {
    const icon = REQ_ICON[normReqIcon(r.icon)];
    return t('tile/container', undefined, [
      t('tile/row', { gap: 'sm', align: 'center', padding: 'sm' }, [
        t('tile/icon', { name: icon, size: 'md', color: 'primary' }),
        t('tile/column', { gap: 'none' }, r.description
          ? [text(r.label, { variant: 'body', weight: 'semibold' }), text(r.description, { variant: 'caption', color: 'muted' })]
          : [text(r.label, { variant: 'body', weight: 'semibold' })]),
      ]),
    ]);
  });

  const kids: TileNode[] = [text(src.title || 'Report a problem', { variant: 'h2', weight: 'bold' })];
  if (src.subtitle) kids.push(text(src.subtitle, { variant: 'caption', color: 'muted' }));
  if (src.locationText) {
    kids.push(t('tile/row', { gap: 'xs', align: 'center' }, [
      t('tile/icon', { name: 'map-pin', size: 'sm', color: 'info' }),
      text(src.locationText, { variant: 'caption', color: 'muted' }),
    ]));
  }
  kids.push(t('tile/column', { gap: 'sm' }, rows));
  kids.push(t('tile/divider'));
  kids.push(t('tile/button', { label: src.submitText || 'Start report', variant: 'primary' }));
  return shell(kids);
}

/* ── #4 Documents Checklist ──────────────────────────────────────────────── */

type DocBucket = 'required' | 'received' | 'optional';

function statusBucket(s?: string): DocBucket {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'received' || raw === 'have' || raw === 'provided' || raw === 'done' || raw === 'complete' || raw === 'uploaded') return 'received';
  if (raw === 'optional' || raw === 'ifapplicable' || raw === 'ifneeded') return 'optional';
  return 'required';
}

function statusText(bucket: DocBucket): string {
  if (bucket === 'received') return 'Received';
  if (bucket === 'optional') return 'Optional';
  return 'Required';
}

const DOC_BADGE: Record<DocBucket, string> = { received: 'success', optional: 'info', required: 'warning' };

const DOCS_TEST: PseDocsChecklistPayload = {
  title: 'Required documents',
  subtitle: 'For your building permit application',
  documents: [
    { id: 'id', name: 'Government-issued ID', detail: "Driver's license or passport", status: 'received' },
    { id: 'proof', name: 'Proof of residency', detail: 'Utility bill within 60 days', status: 'required' },
    { id: 'site', name: 'Site plan', detail: 'PDF, drawn to scale', status: 'required' },
    { id: 'insurance', name: 'Contractor insurance', detail: 'Only if using a contractor', status: 'optional' },
  ],
};

function docsChecklist(p: PseDocsChecklistPayload): TileNode {
  const usable = (p.documents ?? []).filter((d) => d && (d.name || d.id));
  const src = usable.length ? { ...p, documents: usable } : DOCS_TEST;
  const docs = src.documents ?? [];
  const total = docs.length;
  const receivedCount = docs.reduce((n, d) => (statusBucket(d.status) === 'received' ? n + 1 : n), 0);

  const rows = docs.map((d) => {
    const bucket = statusBucket(d.status);
    const received = bucket === 'received';
    const left = t('tile/row', { gap: 'sm', align: 'center' }, [
      t('tile/icon', { name: received ? 'check-circle' : 'file', size: 'md', color: received ? 'success' : 'muted' }),
      t('tile/column', { gap: 'none' }, d.detail
        ? [text(d.name || 'Document', { variant: 'body', weight: 'semibold' }), text(d.detail, { variant: 'caption', color: 'muted' })]
        : [text(d.name || 'Document', { variant: 'body', weight: 'semibold' })]),
    ]);
    return t('tile/container', undefined, [
      t('tile/row', { justify: 'between', align: 'center', gap: 'sm', padding: 'sm' }, [
        left,
        t('tile/badge', { label: statusText(bucket), variant: DOC_BADGE[bucket] }),
      ]),
    ]);
  });

  const title = (src.title || 'Required documents').trim() || 'Required documents';
  const kids: TileNode[] = [text(title, { variant: 'h2', weight: 'bold' })];
  if (src.subtitle) kids.push(text(src.subtitle, { variant: 'caption', color: 'muted' }));
  kids.push(text(`${receivedCount} of ${total} provided`, { variant: 'caption', color: 'muted', weight: 'semibold' }));
  kids.push(t('tile/progress', { value: receivedCount, max: total || 1, variant: 'success', showValue: true }));
  kids.push(t('tile/column', { gap: 'sm' }, rows));
  kids.push(t('tile/divider'));
  kids.push(t('tile/button', { label: (p.submitText && p.submitText.trim()) || 'Upload documents', variant: 'primary' }));
  return shell(kids);
}

/* ── builder map (consumed by tiles/registry) ────────────────────────────── */

/** Per-CLT Slack tile builders for Public Sector & Education, keyed by DTO field name. */
export const pseTileBuilders: Record<string, (payload: any) => TileNode> = {
  pseAppStatusJSON: (p) => appStatus(p as PseAppStatusPayload),
  pseProgramsFinderJSON: (p) => programsFinder(p as PseProgramsFinderPayload),
  pseServiceRequestJSON: (p) => serviceRequest(p as PseServiceRequestPayload),
  pseDocsChecklistJSON: (p) => docsChecklist(p as PseDocsChecklistPayload),
};
