/**
 * @description Agentforce Coworker · Service · Case 360 — a case dossier.
 * Premium dossier: a header lockup (monogram, case id, subject, a typographic status
 * line), a hairline-ruled spec grid of key facts, the "ask", a suggested next step, an
 * activity timeline, and a related-cases list. Display-only; related-cases accordion.
 *
 * Contract: field names below MUST match genAiFunctions/ecwCase360_Output_f6a8/input/schema.json.
 * Existing fields (unchanged): caseNumber, subject, description?, priority, status, origin?,
 *   ageText?, account?, contactName?, contactEmail?, contactPhone?, accountOpen?,
 *   related[]{ caseNumber, subject, account?, priority, ageText }.
 * Optional dossier fields (all degrade gracefully): sentiment (positive|neutral|negative),
 *   contactRole?, product?, slaText?, owner?, nextAction?,
 *   timeline[]{ label, time?, state (info|good|warn|bad) }.
 */
import { LightningElement, api, track } from 'lwc';

const STATUS_STATE = { 'New': 'info', 'Working': 'info', 'On Hold': 'warn', 'Escalated': 'bad', 'Closed': 'good' };
const PRIORITY_STATE = { 'High': 'bad', 'Medium': 'warn', 'Low': 'neutral', 'Normal': 'neutral' };
const SENTIMENT = {
    positive: { label: 'Positive', cls: 'is-pos' },
    neutral: { label: 'Neutral', cls: 'is-neu' },
    negative: { label: 'Frustrated', cls: 'is-neg' }
};

function monogram(name) {
    const parts = String(name || '').trim().split(/\s+/);
    if (!parts[0]) return '—';
    return ((parts[0][0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

// NEVER-BLANK GUARANTEE: mirrors real seed data (physical-security case org).
const TEST_DATA = {
    caseNumber: '00001074',
    subject: 'Badge reader intermittent failure at east entrance',
    description: 'Badge readers at the east entrance intermittently fail to register valid credentials during morning peak. Customer requests a diagnostic and firmware check before the account sync meeting.',
    priority: 'High',
    status: 'Escalated',
    origin: 'Web',
    ageText: '36d open',
    account: 'Arroyo Medical Group',
    contactName: 'Alex Garcia',
    contactRole: 'Facilities Manager',
    contactEmail: 'alex.garcia@example.com',
    contactPhone: '(636) 555-9171',
    accountOpen: 1,
    product: 'Badge Access System',
    slaText: 'Response due in 2h',
    owner: 'Priya Nair',
    sentiment: 'negative',
    nextAction: 'Run a remote diagnostic on the east-entrance readers, then schedule a firmware check ahead of the account sync.',
    timeline: [
        { label: 'Case opened via Web', time: '36d ago', state: 'info' },
        { label: 'Assigned to Priya Nair', time: '35d ago', state: 'info' },
        { label: 'Customer replied — "still happening every morning"', time: '2d ago', state: 'warn' },
        { label: 'Escalated to Tier 2 hardware', time: '1d ago', state: 'bad' }
    ],
    related: [
        { caseNumber: '00001124', subject: 'Camera retention policy question', account: 'Union Gate Apartments', priority: 'High', ageText: '34d open' },
        { caseNumber: '00001119', subject: 'Smart lock battery alert', account: 'Pacific Ridge Builders', priority: 'High', ageText: '33d open' },
        { caseNumber: '00001129', subject: 'Visitor kiosk check-in delay', account: 'Alta Canyon Clinics', priority: 'High', ageText: '30d open' }
    ]
};

export default class EcwCase360 extends LightningElement {
    @api value;

    @track eyebrow = '';
    @track subject = '';
    @track monogram = '';
    @track hasDescription = false;
    @track description = '';
    @track ageText = '';
    @track hasAge = false;
    @track priorityLabel = '';
    @track priorityClass = 'ecw-c3-prio';
    @track statusLabel = '';
    @track statusDotClass = 'ecw-c3-dot';
    @track hasSentiment = false;
    @track sentimentLabel = '';
    @track sentimentClass = 'ecw-c3-sent';
    @track strip = [];
    @track contactName = '';
    @track hasContactName = false;
    @track contactLines = [];
    @track timeline = [];
    @track nextAction = '';
    @track hasNextAction = false;
    @track related = [];

    isTestMode = false;

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwCase360JSON) {
                const data = JSON.parse(this.value.ecwCase360JSON);
                if (data && typeof data === 'object' && data.subject) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('EcwCase360 parse error:', e.message);
        }
        return false;
    }

    loadFallback() { this.initializeFromData({}); }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = !!(raw.subject && String(raw.subject).trim());
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        const caseNumber = src.caseNumber ? String(src.caseNumber).trim() : '';
        const origin = src.origin ? String(src.origin).trim() : '';
        this.eyebrow = caseNumber ? `Case ${caseNumber}` : 'Case';
        this.subject = String(src.subject).trim();
        this.monogram = monogram(src.account || src.contactName || src.subject);
        this.description = src.description ? String(src.description).trim() : '';
        this.hasDescription = !!this.description;
        this.ageText = src.ageText ? String(src.ageText).trim() : '';
        this.hasAge = !!this.ageText;

        this.priorityLabel = src.priority ? String(src.priority).trim() : 'Normal';
        this.priorityClass = `ecw-c3-prio is-${PRIORITY_STATE[this.priorityLabel] || 'neutral'}`;
        const status = src.status ? String(src.status).trim() : 'New';
        this.statusLabel = status;
        this.statusDotClass = `ecw-c3-dot is-${STATUS_STATE[status] || 'info'}`;

        const sent = SENTIMENT[String(src.sentiment || '').toLowerCase()];
        this.hasSentiment = !!sent;
        if (sent) { this.sentimentLabel = sent.label; this.sentimentClass = `ecw-c3-sent ${sent.cls}`; }

        // hairline-ruled spec grid — only the facts that are present
        const account = src.account ? String(src.account).trim() : '';
        const ao = Number(src.accountOpen);
        const owner = src.owner ? String(src.owner).trim() : '';
        const sla = src.slaText ? String(src.slaText).trim() : '';
        const product = src.product ? String(src.product).trim() : '';
        const opened = [origin, this.ageText].filter(Boolean).join(' · ');
        const strip = [];
        if (account) strip.push({ key: 's-acct', label: 'Account', value: account, sub: (isFinite(ao) && ao > 0 ? `${ao} open` : '') });
        if (owner) strip.push({ key: 's-owner', label: 'Owner', value: owner, sub: '' });
        if (sla) strip.push({ key: 's-sla', label: 'SLA', value: sla, sub: '' });
        if (product) strip.push({ key: 's-prod', label: 'Product', value: product, sub: '' });
        if (opened) strip.push({ key: 's-open', label: 'Opened', value: opened, sub: '' });
        this.strip = strip.map((s) => ({ ...s, hasSub: !!s.sub }));

        const cn = src.contactName ? String(src.contactName).trim() : '';
        const cr = src.contactRole ? String(src.contactRole).trim() : '';
        this.contactName = cn ? (cr ? `${cn} · ${cr}` : cn) : '';
        this.hasContactName = !!cn;
        const lines = [];
        if (src.contactEmail) lines.push({ key: 'l-email', value: String(src.contactEmail).trim(), isEmail: true, isPhone: false });
        if (src.contactPhone) lines.push({ key: 'l-phone', value: String(src.contactPhone).trim(), isEmail: false, isPhone: true });
        this.contactLines = lines;

        const tl = Array.isArray(src.timeline) ? src.timeline.filter((t) => t && t.label) : [];
        this.timeline = tl.map((t, i) => {
            const state = ['info', 'good', 'warn', 'bad'].includes(t.state) ? t.state : 'info';
            return {
                key: `tl-${i}`,
                label: String(t.label).trim(),
                time: t.time ? String(t.time).trim() : '',
                hasTime: !!t.time,
                nodeClass: `ecw-c3-tnode is-${state}`,
                itemClass: i === tl.length - 1 ? 'ecw-c3-titem is-last' : 'ecw-c3-titem'
            };
        });

        this.nextAction = src.nextAction ? String(src.nextAction).trim() : '';
        this.hasNextAction = !!this.nextAction;

        const rel = Array.isArray(src.related) ? src.related.filter((r) => r && r.subject) : [];
        this.related = rel.map((r, i) => ({
            key: `rel-${i}`,
            caseNumber: r.caseNumber ? String(r.caseNumber).trim() : '',
            subject: String(r.subject).trim(),
            account: r.account ? String(r.account).trim() : '',
            priority: r.priority ? String(r.priority).trim() : '',
            tickClass: `ecw-c3-rtick is-${PRIORITY_STATE[r.priority] || 'neutral'}`,
            ageText: r.ageText ? String(r.ageText).trim() : '',
            meta: [r.priority, r.ageText].filter((x) => x && String(x).trim()).join(' · '),
            expanded: false,
            rowClass: 'ecw-c3-related-row',
            caretClass: 'ecw-c3-caret'
        }));
    }

    toggleRelated(event) {
        const key = event.currentTarget.dataset.key;
        this.related = this.related.map((r) =>
            r.key === key
                ? { ...r, expanded: !r.expanded, rowClass: `ecw-c3-related-row${!r.expanded ? ' is-open' : ''}`, caretClass: `ecw-c3-caret${!r.expanded ? ' is-open' : ''}` }
                : r
        );
    }

    get hasStrip() { return this.strip.length > 0; }
    get hasTimeline() { return this.timeline.length > 0; }
    get hasContactLines() { return this.contactLines.length > 0; }
    get hasContact() { return this.hasContactName || this.contactLines.length > 0; }
    get hasRelated() { return this.related.length > 0; }
}
