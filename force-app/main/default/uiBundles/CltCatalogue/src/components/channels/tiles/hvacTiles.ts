import type { TileNode } from './TileRenderer';
import type {
  HvacThermostatPayload,
  HvacTechTrackerPayload,
  HvacTechStep,
  HvacTechnician,
  HvacSystemHealthPayload,
  HvacSystemRow,
  HvacServicePlanPayload,
  HvacPlan,
} from '@/components/playground/payloads';

/**
 * Per-CLT BuilderKit tile builders for the ASA HVAC CLTs. Each returns a Slack
 * "tile/mosaic" node tree (see TileRenderer) composed from the CLT's LWC-true
 * payload — the authentic way these CLTs render in Slack (declarative Block Kit
 * tiles), distinct from the live LWC previews in the playground. Data is resolved
 * inline rather than left as "{!$attrs.…}" bindings since we render with the
 * payload in hand. Empty payloads fall back to the same test-mode sample the
 * editor previews use, so the surface never renders an empty shell.
 */

const t = (definition: string, attributes?: Record<string, any>, children?: TileNode[]): TileNode => ({ type: 'block', definition, attributes, children });
const text = (text: string, attributes: Record<string, any> = {}): TileNode => t('tile/text', { text, ...attributes });

/** Wrap card content in a mosaic → single container → padded column. */
function shell(children: TileNode[]): TileNode {
  return t('tile/mosaic', undefined, [
    t('tile/container', undefined, [t('tile/column', { gap: 'md', padding: 'md' }, children)]),
  ]);
}

function num(v: unknown): number | null {
  const n = Number(v);
  return isFinite(n) ? n : null;
}

function money(amount?: number, currency = 'USD'): string {
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

const cap = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** A small muted note mirroring the editor's test-mode badge. */
function testNote(label: string): TileNode {
  return text(label, { variant: 'caption', color: 'muted' });
}

/* ── #1 Smart Thermostat Control (hvacThermostatJSON) ─────────────────────── */

const MODE_LABELS: Record<string, string> = { heat: 'Heat', cool: 'Cool', auto: 'Auto', off: 'Off', fan: 'Fan' };
const MODE_ICON: Record<string, string> = { heat: 'thermometer', cool: 'fan', auto: 'gauge', off: 'gauge', fan: 'fan' };
const MODE_COLOR: Record<string, string> = { heat: 'warning', cool: 'info', auto: 'primary', off: 'muted', fan: 'info' };

function normMode(m?: string): string {
  const raw = String(m || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'heat' || raw === 'heating' || raw === 'warm') return 'heat';
  if (raw === 'cool' || raw === 'cooling' || raw === 'ac' || raw === 'cold') return 'cool';
  if (raw === 'off' || raw === 'standby') return 'off';
  if (raw === 'fan' || raw === 'fanonly') return 'fan';
  return 'auto';
}

const THERMOSTAT_TEST: HvacThermostatPayload = {
  title: 'Living room thermostat',
  currentTemp: 71,
  targetTemp: 72,
  mode: 'cool',
  unit: 'F',
  humidity: 44,
  statusText: 'Cooling to 72°',
  minTemp: 50,
  maxTemp: 90,
  presets: [
    { id: 'eco', label: 'Eco', targetTemp: 78, mode: 'cool' },
    { id: 'comfort', label: 'Comfort', targetTemp: 72, mode: 'cool' },
    { id: 'away', label: 'Away', targetTemp: 82, mode: 'off' },
    { id: 'sleep', label: 'Sleep', targetTemp: 68, mode: 'cool' },
  ],
  submitText: 'Set thermostat',
};

function thermostat(p: HvacThermostatPayload): TileNode {
  const isTestMode = num(p.currentTemp) === null;
  const src = isTestMode ? THERMOSTAT_TEST : p;

  const unit = String(src.unit || 'F').toUpperCase() === 'C' ? 'C' : 'F';
  const current = Math.round(num(src.currentTemp) ?? 70);
  const minTemp = num(src.minTemp) ?? (unit === 'C' ? 10 : 50);
  let maxTemp = num(src.maxTemp) ?? (unit === 'C' ? 32 : 90);
  if (maxTemp <= minTemp) maxTemp = minTemp + 1;
  const target = Math.round(Math.max(minTemp, Math.min(maxTemp, num(src.targetTemp) ?? current)));
  const mode = normMode(src.mode);
  const isOff = mode === 'off';
  const humidity = num(src.humidity);

  const statusLine = src.statusText?.trim()
    || (isOff ? 'System is off' : `${mode === 'heat' ? 'Heating' : mode === 'cool' ? 'Cooling' : 'Auto'} · now ${current}°${unit}`);

  const hero = t('tile/row', { gap: 'md', align: 'center' }, [
    t('tile/icon', { name: MODE_ICON[mode], size: 'lg', color: MODE_COLOR[mode] }),
    t('tile/column', { gap: 'none' }, [
      text(`${current}°${unit}`, { variant: 'h1', weight: 'bold' }),
      text(statusLine, { variant: 'caption', color: 'muted' }),
    ]),
  ]);

  const fieldItems = [
    { label: 'Target', value: isOff ? 'Off' : `${target}°${unit}` },
    { label: 'Mode', value: MODE_LABELS[mode] },
  ];
  if (humidity != null) fieldItems.push({ label: 'Humidity', value: `${Math.round(humidity)}%` });

  const presets = (Array.isArray(src.presets) ? src.presets : [])
    .filter((pr) => pr && pr.label)
    .slice(0, 4);

  const kids: TileNode[] = [text(src.title || 'Thermostat', { variant: 'h2', weight: 'bold' })];
  if (isTestMode) kids.push(testNote('Test mode — add a thermostat reading to preview your content'));
  kids.push(
    t('tile/container', undefined, [t('tile/column', { padding: 'sm' }, [hero])]),
    t('tile/fields', { items: fieldItems }),
    t('tile/divider'),
    t('tile/row', { gap: 'sm', wrap: true }, [
      t('tile/button', { label: '− Cooler', variant: 'default' }),
      t('tile/button', { label: '+ Warmer', variant: 'default' }),
    ]),
  );
  if (presets.length) {
    kids.push(t('tile/row', { gap: 'sm', wrap: true }, presets.map((pr) => t('tile/button', { label: pr.label, variant: 'default' }))));
  }
  kids.push(t('tile/button', { label: src.submitText || 'Set thermostat', variant: 'primary' }));

  return shell(kids);
}

/* ── #2 Technician ETA Tracker (hvacTechTrackerJSON) ──────────────────────── */

type TrackStatus = 'scheduled' | 'dispatched' | 'enroute' | 'arriving' | 'onsite' | 'complete';
const STATUS_LABELS: Record<TrackStatus, string> = {
  scheduled: 'Scheduled',
  dispatched: 'Dispatched',
  enroute: 'On the way',
  arriving: 'Arriving now',
  onsite: 'On site',
  complete: 'Visit complete',
};
const STATUS_BADGE: Record<TrackStatus, string> = {
  scheduled: 'secondary',
  dispatched: 'info',
  enroute: 'info',
  arriving: 'warning',
  onsite: 'success',
  complete: 'success',
};

function normStatus(s?: string): TrackStatus {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'complete' || raw === 'completed' || raw === 'done' || raw === 'finished') return 'complete';
  if (raw === 'onsite' || raw === 'arrived' || raw === 'here') return 'onsite';
  if (raw === 'arriving' || raw === 'almost' || raw === 'nearby') return 'arriving';
  if (raw === 'dispatched' || raw === 'assigned') return 'dispatched';
  if (raw === 'scheduled' || raw === 'booked' || raw === 'confirmed') return 'scheduled';
  return 'enroute';
}

type StepState = 'done' | 'current' | 'todo';
function normState(s?: string): StepState {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'done' || raw === 'complete' || raw === 'completed') return 'done';
  if (raw === 'current' || raw === 'active' || raw === 'inprogress' || raw === 'progress') return 'current';
  return 'todo';
}

function deriveSteps(status: TrackStatus): { label: string; state: StepState }[] {
  const stages = ['Scheduled', 'Dispatched', 'En route', 'Arriving', 'On site'];
  const ci: Record<TrackStatus, number> = { scheduled: 0, dispatched: 1, enroute: 2, arriving: 3, onsite: 4, complete: 5 };
  const idx = ci[status];
  return stages.map((label, i) => ({ label, state: (i < idx ? 'done' : i === idx ? 'current' : 'todo') as StepState }));
}

const STEP_ICON: Record<StepState, string> = { done: 'check-circle', current: 'navigation', todo: 'clock' };
const STEP_ICON_COLOR: Record<StepState, string> = { done: 'success', current: 'primary', todo: 'muted' };

const TECH_TRACKER_TEST: HvacTechTrackerPayload = {
  title: 'Your technician is on the way',
  status: 'enroute',
  headline: 'Marcus is heading to your home',
  etaText: 'Arriving in ~15 min',
  windowText: 'Arrival window 1:00–3:00 PM',
  updatedText: 'Updated 1 min ago',
  technician: { name: 'Marcus Reed', role: 'Senior HVAC Technician', rating: 4.9, initials: 'MR', skills: 'AC repair · Heat pumps' },
  job: { number: 'WO-48213', type: 'AC not cooling', address: '128 Maple Ave' },
  steps: [
    { label: 'Scheduled', state: 'done', timeText: '9:00 AM' },
    { label: 'Dispatched', state: 'done', timeText: '12:40 PM' },
    { label: 'En route', state: 'current', timeText: '1:05 PM' },
    { label: 'Arriving', state: 'todo' },
    { label: 'On site', state: 'todo' },
  ],
  submitText: 'Message technician',
  secondaryText: 'Reschedule visit',
};

function techTracker(p: HvacTechTrackerPayload): TileNode {
  const tech0: Partial<HvacTechnician> = p.technician ?? {};
  const hasContent = !!(p.headline || tech0.name || (Array.isArray(p.steps) && p.steps.length));
  const isTestMode = !hasContent;
  const src = isTestMode ? TECH_TRACKER_TEST : p;

  const status = normStatus(src.status);
  const tech: Partial<HvacTechnician> = src.technician ?? {};

  const rawSteps: HvacTechStep[] = Array.isArray(src.steps) && src.steps.length
    ? src.steps.filter((s) => s && s.label)
    : deriveSteps(status);
  const steps = rawSteps.map((s) => ({ label: String(s.label), state: normState(s.state), timeText: s.timeText }));

  const job = src.job ?? {};
  const jobItems: { label: string; value: string }[] = [];
  if (job.number) jobItems.push({ label: 'Job', value: String(job.number) });
  if (job.type) jobItems.push({ label: 'Service', value: String(job.type) });
  if (job.address) jobItems.push({ label: 'Address', value: String(job.address) });

  const kids: TileNode[] = [text(src.title || 'Technician on the way', { variant: 'h2', weight: 'bold' })];
  if (isTestMode) kids.push(testNote('Test mode — add a technician + status to preview your content'));

  // Status badge + last-updated caption.
  const statusRow: TileNode[] = [t('tile/badge', { label: STATUS_LABELS[status], variant: STATUS_BADGE[status] })];
  if (src.updatedText) statusRow.push(text(src.updatedText, { variant: 'caption', color: 'muted' }));
  kids.push(t('tile/row', { gap: 'sm', align: 'center', justify: 'between' }, statusRow));

  if (src.headline) kids.push(text(src.headline, { variant: 'h4', weight: 'semibold' }));

  const chips: TileNode[] = [];
  if (src.etaText) {
    chips.push(t('tile/row', { gap: 'xs', align: 'center' }, [
      t('tile/icon', { name: 'clock', size: 'sm', color: 'info' }),
      text(src.etaText, { variant: 'caption', weight: 'semibold', color: 'info' }),
    ]));
  }
  if (src.windowText) {
    chips.push(t('tile/row', { gap: 'xs', align: 'center' }, [
      t('tile/icon', { name: 'calendar', size: 'sm', color: 'muted' }),
      text(src.windowText, { variant: 'caption', color: 'muted' }),
    ]));
  }
  if (chips.length) kids.push(t('tile/row', { gap: 'md', wrap: true }, chips));

  // Technician identity.
  if (tech.name) {
    const nameLine: TileNode[] = [text(tech.name, { variant: 'body', weight: 'semibold' })];
    const rating = num(tech.rating);
    if (rating != null && rating > 0) {
      nameLine.push(t('tile/row', { gap: 'xs', align: 'center' }, [
        t('tile/icon', { name: 'star', size: 'sm', color: 'warning' }),
        text((Math.round(rating * 10) / 10).toFixed(1), { variant: 'caption', weight: 'semibold' }),
      ]));
    }
    const techCol: TileNode[] = [t('tile/row', { gap: 'sm', align: 'center' }, nameLine)];
    const sub = [tech.role, tech.skills].filter(Boolean).join(' · ');
    if (sub) techCol.push(text(sub, { variant: 'caption', color: 'muted' }));
    kids.push(t('tile/container', undefined, [
      t('tile/row', { gap: 'sm', align: 'center', padding: 'sm' }, [
        t('tile/icon', { name: 'user', size: 'lg', color: 'primary' }),
        t('tile/column', { gap: 'none' }, techCol),
      ]),
    ]));
  }

  if (jobItems.length) kids.push(t('tile/fields', { items: jobItems }));

  // Status timeline.
  if (steps.length) {
    kids.push(t('tile/divider'));
    kids.push(t('tile/column', { gap: 'sm' }, steps.map((s) => {
      const row: TileNode[] = [
        t('tile/icon', { name: STEP_ICON[s.state], size: 'md', color: STEP_ICON_COLOR[s.state] }),
        text(s.label, { variant: 'body', weight: s.state === 'current' ? 'semibold' : 'regular', color: s.state === 'todo' ? 'muted' : 'default' }),
      ];
      const right: TileNode[] = [];
      if (s.timeText) right.push(text(s.timeText, { variant: 'caption', color: 'muted' }));
      return t('tile/row', { gap: 'sm', align: 'center', justify: 'between' }, [
        t('tile/row', { gap: 'sm', align: 'center' }, row),
        ...right,
      ]);
    })));
  }

  kids.push(t('tile/divider'));
  kids.push(t('tile/button', { label: src.submitText || 'Message technician', variant: 'primary' }));
  if (src.secondaryText) kids.push(t('tile/button', { label: src.secondaryText, variant: 'default' }));

  return shell(kids);
}

/* ── #3 Comfort System Health Report (hvacSystemHealthJSON) ───────────────── */

function normSysStatus(s?: string): 'good' | 'watch' | 'due' | 'fault' {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'fault' || raw === 'bad' || raw === 'critical' || raw === 'alarm' || raw === 'fail') return 'fault';
  if (raw === 'due' || raw === 'overdue' || raw === 'replace' || raw === 'service') return 'due';
  if (raw === 'watch' || raw === 'warn' || raw === 'warning' || raw === 'caution' || raw === 'soon') return 'watch';
  return 'good';
}

const SYS_BADGE: Record<string, string> = { good: 'success', watch: 'warning', due: 'warning', fault: 'danger' };

function normSysIcon(s?: string): string {
  const raw = String(s || '').toLowerCase().replace(/[^a-z_]/g, '');
  if (raw === 'ac' || raw === 'aircon' || raw === 'condenser' || raw === 'cooling') return 'fan';
  if (raw === 'furnace' || raw === 'heater' || raw === 'heating' || raw === 'boiler') return 'thermometer';
  if (raw === 'thermostat' || raw === 'stat' || raw === 'control') return 'gauge';
  if (raw === 'ductwork' || raw === 'ducts' || raw === 'duct' || raw === 'vents' || raw === 'airflow') return 'wind';
  if (raw === 'filter' || raw === 'airfilter') return 'wind';
  if (raw === 'heatpump' || raw === 'pump') return 'fan';
  if (raw === 'waterheater' || raw === 'water_heater' || raw === 'water') return 'thermometer';
  return 'wrench';
}

const SYSTEM_HEALTH_TEST: HvacSystemHealthPayload = {
  title: 'Your comfort system checkup',
  score: 82,
  scoreLabel: 'Good',
  statusText: 'One item needs attention soon',
  updatedText: 'Checked today',
  systems: [
    { label: 'Furnace', status: 'good', detail: 'Operating normally', icon: 'furnace' },
    { label: 'AC condenser', status: 'watch', detail: 'Coil could use a cleaning', icon: 'ac' },
    { label: 'Thermostat', status: 'good', detail: 'Firmware up to date', icon: 'thermostat' },
    { label: 'Air filter', status: 'due', detail: 'Replace within a week', icon: 'filter' },
  ],
  filter: { lifePct: 18, daysLeft: 6, label: '20×25×1 filter' },
  nextServiceText: 'Next maintenance due Nov 3',
  recommendationText: 'Book a tune-up to clean the AC coil before summer.',
  submitText: 'Book maintenance',
};

function systemHealth(p: HvacSystemHealthPayload): TileNode {
  const isTestMode = num(p.score) === null;
  const src = isTestMode ? SYSTEM_HEALTH_TEST : p;

  const score = Math.round(Math.max(0, Math.min(100, num(src.score) ?? 0)));
  const bucket = score >= 80 ? 'good' : score >= 50 ? 'fair' : 'poor';
  const scoreLabel = src.scoreLabel?.trim() || (bucket === 'good' ? 'Good' : bucket === 'fair' ? 'Fair' : 'Needs attention');
  const scoreVariant = bucket === 'good' ? 'success' : bucket === 'fair' ? 'info' : 'primary';
  const scoreColor = bucket === 'good' ? 'success' : bucket === 'fair' ? 'info' : 'warning';

  const systems: HvacSystemRow[] = (src.systems ?? []).filter((s) => s && s.label).slice(0, 6);

  const kids: TileNode[] = [text((src.title && src.title.trim()) || 'Your comfort system checkup', { variant: 'h2', weight: 'bold' })];
  if (isTestMode) kids.push(testNote('Test mode — add a system score to preview your content'));
  if (src.updatedText) kids.push(text(src.updatedText, { variant: 'caption', color: 'muted' }));

  // Health score gauge.
  kids.push(t('tile/row', { gap: 'sm', align: 'center' }, [
    t('tile/icon', { name: 'gauge', size: 'lg', color: scoreColor }),
    t('tile/column', { gap: 'none' }, [
      text(`${score}`, { variant: 'h1', weight: 'bold' }),
      text('Comfort health score', { variant: 'caption', color: 'muted' }),
    ]),
    t('tile/badge', { label: scoreLabel, variant: scoreVariant }),
  ]));
  kids.push(t('tile/progress', { value: score, max: 100, variant: scoreVariant, showValue: true }));
  if (src.statusText) kids.push(text(src.statusText, { variant: 'caption', color: 'muted' }));

  // Component checks.
  if (systems.length) {
    kids.push(t('tile/divider'));
    kids.push(t('tile/column', { gap: 'sm' }, systems.map((s) => {
      const st = normSysStatus(s.status);
      const left: TileNode[] = [
        t('tile/icon', { name: normSysIcon(s.icon), size: 'md', color: 'primary' }),
        t('tile/column', { gap: 'none' }, [
          text(s.label, { variant: 'body', weight: 'semibold' }),
          ...(s.detail ? [text(s.detail, { variant: 'caption', color: 'muted' })] : []),
        ]),
      ];
      return t('tile/row', { gap: 'sm', align: 'center', justify: 'between' }, [
        t('tile/row', { gap: 'sm', align: 'center' }, left),
        t('tile/badge', { label: cap(st), variant: SYS_BADGE[st] }),
      ]);
    })));
  }

  // Air-filter life.
  const lifePct = num(src.filter?.lifePct);
  if (lifePct != null) {
    const pct = Math.round(Math.max(0, Math.min(100, lifePct)));
    const daysLeft = num(src.filter?.daysLeft);
    const filterKids: TileNode[] = [
      t('tile/row', { gap: 'sm', align: 'center', justify: 'between' }, [
        text(src.filter?.label?.trim() || 'Air filter', { variant: 'body', weight: 'semibold' }),
        text(`${pct}%`, { variant: 'body', weight: 'bold' }),
      ]),
      t('tile/progress', { value: pct, max: 100, variant: pct > 50 ? 'success' : 'info' }),
      text(daysLeft != null ? `${Math.round(daysLeft)} days of life left` : 'filter life remaining', { variant: 'caption', color: 'muted' }),
    ];
    kids.push(t('tile/container', undefined, [t('tile/column', { gap: 'xs', padding: 'sm' }, filterKids)]));
  }

  if (src.nextServiceText) {
    kids.push(t('tile/row', { gap: 'sm', align: 'center' }, [
      t('tile/icon', { name: 'calendar', size: 'md', color: 'info' }),
      text(src.nextServiceText, { variant: 'caption' }),
    ]));
  }
  if (src.recommendationText) {
    kids.push(t('tile/row', { gap: 'sm', align: 'center' }, [
      t('tile/icon', { name: 'info', size: 'md', color: 'primary' }),
      text(src.recommendationText, { variant: 'caption' }),
    ]));
  }

  kids.push(t('tile/button', { label: src.submitText || 'Book maintenance', variant: 'primary' }));

  return shell(kids);
}

/* ── #4 Service Plan Selector (hvacServicePlanJSON) ───────────────────────── */

function cadenceSuffix(cadence?: string): string {
  const raw = String(cadence || 'mo').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'yr' || raw === 'year' || raw === 'yearly' || raw === 'annual' || raw === 'annually') return '/yr';
  if (raw === 'wk' || raw === 'week' || raw === 'weekly') return '/wk';
  return '/mo';
}

const SERVICE_PLAN_TEST: HvacPlan[] = [
  { id: 'basic', name: 'Comfort Basic', price: 149, tagline: 'Seasonal peace of mind', features: ['1 annual tune-up', 'Priority scheduling', '10% off repairs'] },
  { id: 'plus', name: 'Comfort Plus', price: 249, tagline: 'Most popular', badge: 'Most popular', recommended: true, features: ['2 tune-ups (heating + cooling)', 'Priority scheduling', '15% off repairs', 'No overtime fees'] },
  { id: 'total', name: 'Comfort Total', price: 399, tagline: 'Total protection', features: ['2 tune-ups + mid-season check', '24/7 priority dispatch', '20% off repairs', 'Free diagnostics'] },
];

function servicePlan(p: HvacServicePlanPayload): TileNode {
  const rawPlans = (p.plans ?? []).filter((pl) => pl && pl.id && pl.name);
  const isTestMode = rawPlans.length === 0;
  const title = (isTestMode ? 'Choose a comfort plan' : p.title) || 'Choose a comfort plan';
  const subtitle = isTestMode ? 'Annual maintenance memberships that keep your system running' : p.subtitle;
  const currency = p.currency || 'USD';
  const cadence = cadenceSuffix(p.cadence);
  const currentPlanId = isTestMode ? '' : (p.currentPlanId || '');
  const plans = (isTestMode ? SERVICE_PLAN_TEST : rawPlans).slice(0, 3);

  const kids: TileNode[] = [text(title, { variant: 'h2', weight: 'bold' })];
  if (isTestMode) kids.push(testNote('Test mode — add plans to preview your content'));
  if (subtitle) kids.push(text(subtitle, { variant: 'caption', color: 'muted' }));

  plans.forEach((pl) => {
    const isCurrent = !!currentPlanId && pl.id === currentPlanId;
    const recommended = !!pl.recommended && !isCurrent;
    const badge = isCurrent ? 'Current plan' : (pl.badge?.trim() || (recommended ? 'Recommended' : ''));
    const features = (pl.features ?? []).filter(Boolean).slice(0, 5);

    const header = t('tile/row', { gap: 'sm', align: 'center', justify: 'between' }, [
      t('tile/column', { gap: 'none' }, [
        text(pl.name, { variant: 'h4', weight: 'bold' }),
        ...(pl.tagline ? [text(pl.tagline, { variant: 'caption', color: 'muted' })] : []),
      ]),
      t('tile/row', { gap: 'xs', align: 'baseline' }, [
        text(money(pl.price, pl.currency || currency), { variant: 'h3', weight: 'bold' }),
        text(cadence, { variant: 'caption', color: 'muted' }),
      ]),
    ]);

    const cardKids: TileNode[] = [];
    if (badge) cardKids.push(t('tile/badge', { label: badge, variant: isCurrent ? 'secondary' : 'info' }));
    cardKids.push(header);
    if (features.length) {
      cardKids.push(t('tile/column', { gap: 'xs' }, features.map((f) => t('tile/row', { gap: 'sm', align: 'center' }, [
        t('tile/icon', { name: 'check-circle', size: 'sm', color: 'success' }),
        text(f, { variant: 'caption' }),
      ]))));
    }
    kids.push(t('tile/container', undefined, [t('tile/column', { gap: 'sm', padding: 'sm' }, cardKids)]));
  });

  kids.push(t('tile/button', { label: (p.submitText && p.submitText.trim()) || 'Enroll in plan', variant: 'primary' }));

  return shell(kids);
}

/* ── builder map (consumed by tiles/registry) ────────────────────────────── */

/** Per-CLT Slack tile builders for ASA HVAC, keyed by DTO field name. */
export const hvacTileBuilders: Record<string, (payload: any) => TileNode> = {
  hvacThermostatJSON: (p) => thermostat(p as HvacThermostatPayload),
  hvacTechTrackerJSON: (p) => techTracker(p as HvacTechTrackerPayload),
  hvacSystemHealthJSON: (p) => systemHealth(p as HvacSystemHealthPayload),
  hvacServicePlanJSON: (p) => servicePlan(p as HvacServicePlanPayload),
};
