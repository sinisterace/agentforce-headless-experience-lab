/**
 * @description ASA Energy & Utilities · Outage Tracker renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders an active outage: a dark control-room hero (status +
 * headline + area) over a horizontal restoration "power-line" track, a squared
 * hairline info panel (cause / affected / crew / ETA), and an optional notify
 * action sent back via embeddedservice_configuration.util.sendTextMessage().
 *
 * Contract: the field names read below MUST match the example JSON + rules in
 * genAiFunctions/asaEnergyOutageTracker_Output_a7f3/input/schema.json.
 * Fields: title?, status?, headline?, area?, cause?, affectedText?, etaText?,
 * updatedText?, crew?, steps[]{label, state, timeText?}, submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

const STATUS_LABELS = {
    investigating: 'Investigating',
    outage: 'Power outage',
    restoring: 'Restoring power',
    restored: 'Power restored',
};

function normStatus(s) {
    const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
    if (raw === 'restored' || raw === 'resolved' || raw === 'back') return 'restored';
    if (raw === 'restoring' || raw === 'repairing' || raw === 'onsite') return 'restoring';
    if (raw === 'investigating' || raw === 'assessing' || raw === 'reported') return 'investigating';
    return 'outage';
}

function normState(s) {
    const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
    if (raw === 'done' || raw === 'complete' || raw === 'completed') return 'done';
    if (raw === 'current' || raw === 'active' || raw === 'inprogress' || raw === 'progress') return 'current';
    return 'todo';
}

// Default restoration track derived from status when steps are omitted.
function deriveSteps(status) {
    const stages = [
        { label: 'Outage detected' },
        { label: 'Crew dispatched' },
        { label: 'On site — repairing' },
        { label: 'Power restored' },
    ];
    const currentIndex = { investigating: 0, outage: 1, restoring: 2, restored: 4 }[status];
    return stages.map((st, i) => ({
        ...st,
        state: i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'todo',
    }));
}

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const TEST_DATA = {
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
    submitValue: 'Please text me when power is restored',
};

export default class AsaEnergyOutageTracker extends LightningElement {
    @api value; // Receives the AsaEnergyOutageTrackerData object from the Lightning Type.

    @track title = 'Outage status';
    @track status = 'outage';
    @track statusLabel = 'Power outage';
    @track headline = '';
    @track area = '';
    @track cause = '';
    @track affectedText = '';
    @track etaText = '';
    @track updatedText = '';
    @track crew = '';
    @track steps = [];
    @track submitText = '';

    isTestMode = false;
    submitValue = '';

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.energyOutageTrackerJSON) {
                const data = JSON.parse(this.value.energyOutageTrackerJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaEnergyOutageTracker parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData({});
    }

    isUsable(data) {
        return data && typeof data === 'object';
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = !!(raw.headline || raw.area || raw.cause || (Array.isArray(raw.steps) && raw.steps.length));
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.title = (src.title && String(src.title).trim()) || 'Outage status';
        this.status = normStatus(src.status);
        this.statusLabel = STATUS_LABELS[this.status];
        this.headline = src.headline ? String(src.headline).trim() : '';
        this.area = src.area ? String(src.area).trim() : '';
        this.cause = src.cause ? String(src.cause).trim() : '';
        this.affectedText = src.affectedText ? String(src.affectedText).trim() : '';
        this.etaText = src.etaText ? String(src.etaText).trim() : '';
        this.updatedText = src.updatedText ? String(src.updatedText).trim() : '';
        this.crew = src.crew ? String(src.crew).trim() : '';

        const rawSteps = Array.isArray(src.steps) && src.steps.length
            ? src.steps.filter((s) => s && s.label)
            : deriveSteps(this.status);
        this.steps = rawSteps.map((s, i) => {
            const state = normState(s.state);
            return {
                key: `step-${i}`,
                label: String(s.label).trim(),
                timeText: s.timeText ? String(s.timeText).trim() : '',
                hasTime: !!s.timeText,
                nodeClass: `asa-out-node is-${state}`,
                isDone: state === 'done',
                isCurrent: state === 'current',
            };
        });

        this.submitText = src.submitText ? String(src.submitText).trim() : '';
        this.submitValue = src.submitValue ? String(src.submitValue).trim() : '';
    }

    get heroClass() {
        return `asa-out-hero is-${this.status}`;
    }
    get statusPillClass() {
        return `asa-out-status is-${this.status}`;
    }
    get hasHeadline() { return !!this.headline; }
    get hasArea() { return !!this.area; }
    get hasCause() { return !!this.cause; }
    get hasAffected() { return !!this.affectedText; }
    get hasEta() { return !!this.etaText; }
    get hasUpdated() { return !!this.updatedText; }
    get hasCrew() { return !!this.crew; }
    get hasInfo() { return this.hasCause || this.hasAffected || this.hasEta || this.hasCrew; }
    get hasSteps() { return this.steps.length > 0; }
    get hasSubmit() { return !!this.submitText; }

    handleSubmit() {
        const message = this.submitValue || this.submitText || 'Notify me when power is restored';
        this.sendMessage(message);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaEnergyOutageTracker sent:', message))
                    .catch((err) => console.error('AsaEnergyOutageTracker send error:', err));
            } else {
                console.log('AsaEnergyOutageTracker: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaEnergyOutageTracker sendMessage error:', err);
        }
    }
}
