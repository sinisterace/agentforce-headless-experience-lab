import type { TileNode } from './TileRenderer';
import lawyer1 from '@/assets/legal/lawyer-1.jpg';
import lawyer2 from '@/assets/legal/lawyer-2.jpg';
import lawyer3 from '@/assets/legal/lawyer-3.jpg';

/**
 * Per-CLT BuilderKit tile builders for the ASA Legal CLTs. Each returns a Slack
 * "tile/mosaic" node tree (see TileRenderer) composed from the CLT's LWC-true
 * payload — the authentic way these CLTs render in Slack (declarative Block Kit
 * tiles), distinct from the Enhanced Chat v2 LWC. Data is resolved inline rather
 * than left as "{!$attrs.…}" bindings since we render with the payload in hand.
 * Structure/helpers mirror financialServicesTiles.ts / insuranceTiles.ts; empty
 * or missing arrays fall back to the same test-mode samples the editors preview
 * so a card always renders (never crashes). Cards follow Block Kit best practice:
 * a bold title, a muted caption, compact list (capped), badges for signals, a
 * divider, and a single primary action at the bottom.
 */

const t = (definition: string, attributes?: Record<string, any>, children?: TileNode[]): TileNode => ({ type: 'block', definition, attributes, children });
const text = (text: string, attributes: Record<string, any> = {}): TileNode => t('tile/text', { text, ...attributes });

/** Wrap card content in a mosaic → single container → padded column. */
function shell(children: TileNode[]): TileNode {
  return t('tile/mosaic', undefined, [
    t('tile/container', undefined, [t('tile/column', { gap: 'md', padding: 'md' }, children)]),
  ]);
}

function norm(s?: string): string {
  return String(s || '').toLowerCase().replace(/[^a-z]/g, '');
}

// Bundled headshots so a payload (or the test-mode sample) can reference a stable
// key and still render; any other value is treated as a direct image URL.
const PHOTO_MAP: Record<string, string> = { 'lawyer-1': lawyer1, 'lawyer-2': lawyer2, 'lawyer-3': lawyer3 };
function resolvePhoto(photo?: string): string {
  if (!photo) return '';
  return PHOTO_MAP[photo] || photo;
}

/** Practice-area key → an allowed TileRenderer icon name. */
const AREA_ICON: Record<string, string> = {
  injury: 'heart',
  family: 'users',
  estate: 'file',
  business: 'building',
  immigration: 'map-pin',
  criminal: 'gavel',
  employment: 'briefcase',
  realestate: 'home',
  other: 'scale',
};
function areaIcon(key?: string): string {
  return AREA_ICON[norm(key)] || 'scale';
}

/** Consultation mode key → an allowed TileRenderer icon name. */
const MODE_ICON: Record<string, string> = { inperson: 'map-pin', phone: 'phone', video: 'video' };
function modeIcon(key?: string): string {
  return MODE_ICON[norm(key)] || 'calendar';
}

/* ── test-mode fallbacks (mirror the editors) ─────────────────────────────── */

const TEST_AREAS: any[] = [
  { id: 'injury', name: 'Personal Injury', blurb: 'Accidents, negligence & claims', icon: 'injury', stat: '$50M+ recovered' },
  { id: 'family', name: 'Family Law', blurb: 'Divorce, custody & support', icon: 'family', stat: '1,200+ families helped' },
  { id: 'estate', name: 'Estate Planning', blurb: 'Wills, trusts & probate', icon: 'estate', stat: 'Flat-fee packages' },
  { id: 'business', name: 'Business & Corporate', blurb: 'Formation, contracts & disputes', icon: 'business', stat: '500+ businesses advised' },
  { id: 'criminal', name: 'Criminal Defense', blurb: 'Charges, DUI & expungement', icon: 'criminal', stat: 'Available 24/7' },
];

const TEST_QUESTIONS: any[] = [
  { id: 'when', label: 'When did this happen?', type: 'choice', options: ['Past week', 'Past month', '1–6 months ago', 'Over 6 months ago'] },
  { id: 'injured', label: 'Was anyone injured?', type: 'choice', options: ['Yes', 'No', 'Not sure'] },
  { id: 'represented', label: 'Have you hired a lawyer for this?', type: 'choice', options: ['No', 'Yes'] },
];
const DEFAULT_CONSENT = 'I agree to the Privacy Policy and Terms of Use.';
const DEFAULT_DISCLAIMER =
  'Submitting this form does not create an attorney–client relationship. Please don’t share confidential or time-sensitive details until we’ve agreed to represent you.';
const DEFAULT_FOOTER = 'An attorney will review your request and respond within 1 business day.';

const TEST_ATTORNEYS: any[] = [
  { id: 'vale', name: 'Marcus Vale', title: 'Managing Partner', focus: 'Personal Injury & Litigation', photo: 'lawyer-1', years: 22, rating: 4.9, casesWon: '500+ cases', bar: 'CA #148203', blurb: 'Trial-tested advocate for serious injury and negligence claims.' },
  { id: 'tanaka', name: 'Kenji Tanaka', title: 'Associate', focus: 'Business & Immigration', photo: 'lawyer-2', years: 8, rating: 4.8, casesWon: '120+ matters', bar: 'CA #276514', blurb: 'Guides founders and families through formation, contracts and visas.' },
  { id: 'shaw', name: 'Eleanor Shaw', title: 'Partner', focus: 'Family & Estate Planning', photo: 'lawyer-3', years: 25, rating: 5.0, casesWon: '600+ cases', bar: 'CA #093117', blurb: 'Compassionate counsel for divorce, custody, wills and trusts.' },
];

const TEST_MODES: any[] = [
  { id: 'in_person', label: 'In person', icon: 'in_person' },
  { id: 'phone', label: 'Phone', icon: 'phone' },
  { id: 'video', label: 'Video', icon: 'video' },
];
const TEST_DAYS: any[] = [
  { id: 'mon', label: 'Mon', sublabel: 'Aug 17', slots: [{ id: 'm1', label: '9:00 AM' }, { id: 'm2', label: '11:30 AM' }, { id: 'm3', label: '2:00 PM' }] },
  { id: 'tue', label: 'Tue', sublabel: 'Aug 18', slots: [{ id: 't1', label: '10:00 AM' }, { id: 't2', label: '1:00 PM', disabled: true }, { id: 't3', label: '3:30 PM' }] },
  { id: 'wed', label: 'Wed', sublabel: 'Aug 19', slots: [{ id: 'w1', label: '9:30 AM' }, { id: 'w2', label: '12:00 PM' }, { id: 'w3', label: '4:00 PM' }] },
];

/* ── #1 Practice-Area Selector (legalPracticeAreasJSON) ───────────────────── */
function practiceAreas(p: any): TileNode {
  const list = (p?.areas ?? []).filter((a: any) => a && a.name);
  const isTest = list.length === 0;
  const areas: any[] = (isTest ? TEST_AREAS : list).slice(0, 5);
  const title = (isTest ? 'How can we help?' : p?.title) || 'How can we help?';
  const subtitle = isTest ? "Choose an area and we'll start your conversation" : p?.subtitle;
  const submitRaw = (p?.submitText || 'Get help').trim() || 'Get help';
  const submit = submitRaw.includes('{name}') ? submitRaw.replace('{name}', 'your matter') : submitRaw;

  const rows = areas.map((a) => {
    const left = t('tile/row', { gap: 'sm', align: 'center' }, [
      t('tile/icon', { name: areaIcon(a.icon || a.id), size: 'md', color: 'primary' }),
      t('tile/column', { gap: 'none' }, [
        text(a.name, { variant: 'body', weight: 'semibold' }),
        ...(a.blurb ? [text(a.blurb, { variant: 'caption', color: 'muted' })] : []),
      ]),
    ]);
    const right = a.stat ? [t('tile/badge', { label: a.stat, variant: 'info' })] : [];
    return t('tile/container', undefined, [
      t('tile/row', { justify: 'between', align: 'center', gap: 'sm', padding: 'sm' }, [left, ...right]),
    ]);
  });

  const kids: TileNode[] = [text(title, { variant: 'h2', weight: 'bold' })];
  if (subtitle) kids.push(text(subtitle, { variant: 'caption', color: 'muted' }));
  kids.push(t('tile/column', { gap: 'sm' }, rows));
  kids.push(t('tile/divider'));
  kids.push(t('tile/button', { label: submit, variant: 'primary' }));
  return shell(kids);
}

/* ── #2 Free Case Evaluation (legalCaseEvaluationJSON) ────────────────────── */
function caseEvaluation(p: any): TileNode {
  const list = (p?.questions ?? []).filter((q: any) => q && q.label);
  const isTest = list.length === 0;
  const questions: any[] = (isTest ? TEST_QUESTIONS : list).slice(0, 5);
  const title = (isTest ? 'Free case review' : p?.title) || 'Free case review';
  const subtitle = isTest ? "Tell us a little and we'll assess your options" : p?.subtitle;
  const matter = isTest ? 'Personal Injury' : p?.matter;
  const describeLabel = (p?.describeLabel || 'Briefly describe your situation').trim();
  const describePlaceholder = (p?.describePlaceholder || 'Share what happened, in your own words…').trim();
  const consentText = (p?.consentText || DEFAULT_CONSENT).trim();
  const disclaimer = p?.disclaimer === '' ? '' : (p?.disclaimer || DEFAULT_DISCLAIMER).trim();
  const footerNote = p?.footerNote === '' ? '' : (p?.footerNote || DEFAULT_FOOTER).trim();
  const submitText = (p?.submitText || 'Request my free review').trim() || 'Request my free review';

  const kids: TileNode[] = [text(title, { variant: 'h2', weight: 'bold' })];
  if (subtitle) kids.push(text(subtitle, { variant: 'caption', color: 'muted' }));

  if (matter) {
    kids.push(t('tile/container', undefined, [
      t('tile/row', { gap: 'sm', align: 'center', padding: 'sm' }, [
        t('tile/icon', { name: 'scale', size: 'md', color: 'primary' }),
        t('tile/column', { gap: 'none' }, [
          text('Matter', { variant: 'caption', color: 'muted' }),
          text(matter, { variant: 'body', weight: 'semibold' }),
        ]),
      ]),
    ]));
  }

  kids.push(text('About your matter', { variant: 'h4', weight: 'semibold' }));

  questions.forEach((q) => {
    const isDate = norm(q.type || 'choice') === 'date';
    const opts = (q.options ?? [])
      .filter((o: any) => o != null && String(o).trim())
      .map((o: any) => String(o).trim());
    const block: TileNode[] = [text(q.label, { variant: 'body', weight: 'semibold' })];
    if (isDate) {
      block.push(t('tile/row', { gap: 'xs', align: 'center' }, [
        t('tile/icon', { name: 'calendar', size: 'sm', color: 'muted' }),
        text('Choose a date', { variant: 'caption', color: 'muted' }),
      ]));
    } else if (opts.length) {
      block.push(t('tile/row', { gap: 'sm', wrap: true }, opts.slice(0, 6).map((o: string) => t('tile/button', { label: o, variant: 'default' }))));
    }
    kids.push(t('tile/column', { gap: 'xs' }, block));
  });

  // Free-text "describe your situation" field (label + placeholder hint).
  kids.push(t('tile/column', { gap: 'xs' }, [
    text(describeLabel, { variant: 'body', weight: 'semibold' }),
    text(describePlaceholder, { variant: 'caption', color: 'muted' }),
  ]));

  kids.push(t('tile/divider'));

  kids.push(t('tile/row', { gap: 'xs', align: 'center' }, [
    t('tile/icon', { name: 'check-circle', size: 'sm', color: 'success' }),
    text(consentText, { variant: 'caption', color: 'default' }),
  ]));

  if (disclaimer) kids.push(text(disclaimer, { variant: 'caption', color: 'muted' }));

  kids.push(t('tile/button', { label: submitText, variant: 'primary' }));

  if (footerNote) kids.push(text(footerNote, { variant: 'caption', color: 'muted' }));

  return shell(kids);
}

/* ── #3 Meet Your Attorney (legalAttorneyMatchJSON) ───────────────────────── */
function attorneyMatch(p: any): TileNode {
  const list = (p?.attorneys ?? []).filter((a: any) => a && a.name);
  const isTest = list.length === 0;
  const attorneys: any[] = (isTest ? TEST_ATTORNEYS : list).slice(0, 3);
  const title = (isTest ? 'Meet your attorney' : p?.title) || 'Meet your attorney';
  const subtitle = isTest ? 'Matched to your matter — book a free consult' : p?.subtitle;
  const submitText = (p?.submitText || 'Book a consult').trim() || 'Book a consult';

  const kids: TileNode[] = [text(title, { variant: 'h2', weight: 'bold' })];
  if (subtitle) kids.push(text(subtitle, { variant: 'caption', color: 'muted' }));

  attorneys.forEach((a, idx) => {
    const src = resolvePhoto(a.photo);
    const card: TileNode[] = [];
    // Full-width headshot (the Slack image block is width:100%, so it sits on top).
    if (src) card.push(t('tile/image', { src, alt: a.name || 'Attorney', aspect: 'wide', rounded: true }));

    card.push(t('tile/row', { justify: 'between', align: 'center', gap: 'sm' }, [
      t('tile/column', { gap: 'none' }, [
        text(a.name || 'Attorney', { variant: 'h4', weight: 'semibold' }),
        ...((a.title || a.focus) ? [text([a.title, a.focus].filter(Boolean).join(' · '), { variant: 'caption', color: 'muted' })] : []),
      ]),
      ...(typeof a.rating === 'number' ? [t('tile/row', { gap: 'xs', align: 'center' }, [
        t('tile/icon', { name: 'star', size: 'sm', color: 'warning' }),
        text(a.rating.toFixed(1), { variant: 'body', weight: 'semibold' }),
      ])] : []),
    ]));

    const meta: TileNode[] = [];
    if (a.years) meta.push(t('tile/badge', { label: `${a.years} yrs experience`, variant: 'secondary' }));
    if (a.casesWon) meta.push(t('tile/badge', { label: String(a.casesWon), variant: 'secondary' }));
    if (meta.length) card.push(t('tile/row', { gap: 'sm', align: 'center', wrap: true }, meta));

    if (a.blurb) card.push(text(a.blurb, { variant: 'caption', color: 'default' }));
    if (a.bar) card.push(t('tile/row', { gap: 'xs', align: 'center' }, [
      t('tile/icon', { name: 'scale', size: 'sm', color: 'muted' }),
      text(String(a.bar), { variant: 'caption', color: 'muted' }),
    ]));

    kids.push(t('tile/container', undefined, [t('tile/column', { gap: 'sm', padding: 'sm' }, card)]));
    if (idx < attorneys.length - 1) kids.push(t('tile/divider'));
  });

  kids.push(t('tile/button', { label: submitText, variant: 'primary' }));
  return shell(kids);
}

/* ── #4 Consultation Scheduler (legalConsultSchedulerJSON) ────────────────── */
function consultScheduler(p: any): TileNode {
  const usableDays = (Array.isArray(p?.days) ? p.days : []).filter((d: any) => d && Array.isArray(d.slots) && d.slots.length > 0);
  const isTest = usableDays.length === 0;
  const title = (isTest ? 'Book your free consultation' : p?.title) || 'Book your free consultation';
  const attorneyName = isTest ? 'Marcus Vale' : p?.attorneyName;
  const attorneyTitle = isTest ? 'Managing Partner · Personal Injury' : p?.attorneyTitle;
  const photoSrc = resolvePhoto(isTest ? 'lawyer-1' : p?.attorneyPhoto);
  const subtitle = attorneyName ? '' : (p?.subtitle || '');
  const modes: any[] = (p?.modes && p.modes.length) ? p.modes : (isTest ? TEST_MODES : []);
  const days: any[] = (isTest ? TEST_DAYS : usableDays).slice(0, 4);
  const note = (p?.note || 'Free 30-minute consultation · no obligation').trim();
  const submitText = (p?.submitText || 'Confirm consultation').trim() || 'Confirm consultation';

  const kids: TileNode[] = [text(title, { variant: 'h2', weight: 'bold' })];
  if (subtitle) kids.push(text(subtitle, { variant: 'caption', color: 'muted' }));

  // Attorney "hero" — a person to book, not just a slot.
  if (attorneyName) {
    const hero: TileNode[] = [];
    if (photoSrc) hero.push(t('tile/image', { src: photoSrc, alt: attorneyName, aspect: 'wide', rounded: true }));
    hero.push(text(attorneyName, { variant: 'h3', weight: 'bold' }));
    if (attorneyTitle) hero.push(text(attorneyTitle, { variant: 'caption', color: 'muted' }));
    hero.push(t('tile/row', { gap: 'xs', align: 'center' }, [
      t('tile/icon', { name: 'calendar', size: 'sm', color: 'primary' }),
      text('Free 30-min consult', { variant: 'caption', weight: 'semibold' }),
    ]));
    kids.push(t('tile/container', undefined, [t('tile/column', { gap: 'xs', padding: 'sm' }, hero)]));
  }

  // Consultation type — icon chips (in person / phone / video).
  if (modes.length) {
    kids.push(text('Consultation type', { variant: 'caption', color: 'muted' }));
    kids.push(t('tile/row', { gap: 'sm', wrap: true }, modes.map((m) =>
      t('tile/container', undefined, [
        t('tile/row', { gap: 'xs', align: 'center', padding: 'sm' }, [
          t('tile/icon', { name: modeIcon(m.icon || m.id), size: 'sm', color: 'primary' }),
          text(m.label || m.id, { variant: 'caption', weight: 'semibold' }),
        ]),
      ]),
    )));
  }

  // Day + time slots (disabled slots omitted — tiles can't convey a disabled state).
  days.forEach((d) => {
    const slots = (d.slots ?? []).filter((s: any) => s && s.label && !s.disabled);
    if (!slots.length) return;
    const header = [d.label, d.sublabel].filter(Boolean).join(', ') || 'Availability';
    kids.push(t('tile/column', { gap: 'sm' }, [
      text(header, { variant: 'h4', weight: 'semibold' }),
      t('tile/row', { gap: 'sm', wrap: true }, slots.map((s: any) => t('tile/button', { label: String(s.label), variant: 'default' }))),
    ]));
  });

  if (note) kids.push(t('tile/row', { gap: 'xs', align: 'center' }, [
    t('tile/icon', { name: 'shield', size: 'sm', color: 'success' }),
    text(note, { variant: 'caption', color: 'muted' }),
  ]));

  kids.push(t('tile/button', { label: submitText, variant: 'primary' }));
  return shell(kids);
}

/* ── builder map (consumed by tiles/registry) ─────────────────────────────── */

/** Per-CLT Slack tile builders for ASA Legal, keyed by DTO field name. */
export const legalTileBuilders: Record<string, (payload: any) => TileNode> = {
  legalPracticeAreasJSON: (p) => practiceAreas(p),
  legalCaseEvaluationJSON: (p) => caseEvaluation(p),
  legalAttorneyMatchJSON: (p) => attorneyMatch(p),
  legalConsultSchedulerJSON: (p) => consultScheduler(p),
};
