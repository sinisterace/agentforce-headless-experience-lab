/**
 * @description ASA HVAC · Technician ETA Tracker renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a field-service "on my way" card: a dark dispatch hero
 * (status + headline + ETA/arrival-window chips), the technician's identity row
 * (avatar + name + role + rating + skills), a horizontal en-route track, a
 * squared hairline job-detail panel, and message/reschedule actions sent back
 * via embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read below MUST match the example JSON + rules in
 * genAiFunctions/asaHvacTechTracker_Output_b3c4/input/schema.json.
 * Fields: title?, status?, headline?, etaText?, windowText?, updatedText?,
 * technician{name, role?, rating?, photoUrl?, initials?, skills?},
 * job{number?, type?, address?}, steps[]{label, state, timeText?},
 * submitText?, submitValue?, secondaryText?, secondaryValue?.
 */
import { LightningElement, api, track } from 'lwc';

const STATUS_LABELS = {
    scheduled: 'Scheduled',
    dispatched: 'Dispatched',
    enroute: 'On the way',
    arriving: 'Arriving now',
    onsite: 'On site',
    complete: 'Visit complete',
};

function normStatus(s) {
    const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
    if (raw === 'complete' || raw === 'completed' || raw === 'done' || raw === 'finished') return 'complete';
    if (raw === 'onsite' || raw === 'arrived' || raw === 'here') return 'onsite';
    if (raw === 'arriving' || raw === 'almost' || raw === 'nearby') return 'arriving';
    if (raw === 'dispatched' || raw === 'assigned') return 'dispatched';
    if (raw === 'scheduled' || raw === 'booked' || raw === 'confirmed') return 'scheduled';
    return 'enroute';
}

function normState(s) {
    const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
    if (raw === 'done' || raw === 'complete' || raw === 'completed') return 'done';
    if (raw === 'current' || raw === 'active' || raw === 'inprogress' || raw === 'progress') return 'current';
    return 'todo';
}

// Default en-route track derived from status when steps are omitted.
function deriveSteps(status) {
    const stages = [
        { label: 'Scheduled' },
        { label: 'Dispatched' },
        { label: 'En route' },
        { label: 'Arriving' },
        { label: 'On site' },
    ];
    const currentIndex = { scheduled: 0, dispatched: 1, enroute: 2, arriving: 3, onsite: 4, complete: 5 }[status];
    return stages.map((st, i) => ({
        ...st,
        state: i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'todo',
    }));
}

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const TEST_DATA = {
    title: 'Your technician is on the way',
    status: 'enroute',
    headline: 'Marcus is heading to your home',
    etaText: 'Arriving in ~15 min',
    windowText: 'Arrival window 1:00–3:00 PM',
    updatedText: 'Updated 1 min ago',
    technician: { name: 'Marcus Reed', role: 'Senior HVAC Technician', rating: 4.9, photoUrl: '', initials: 'MR', skills: 'AC repair · Heat pumps' },
    job: { number: 'WO-48213', type: 'AC not cooling', address: '128 Maple Ave' },
    steps: [
        { label: 'Scheduled', state: 'done', timeText: '9:00 AM' },
        { label: 'Dispatched', state: 'done', timeText: '12:40 PM' },
        { label: 'En route', state: 'current', timeText: '1:05 PM' },
        { label: 'Arriving', state: 'todo' },
        { label: 'On site', state: 'todo' },
    ],
    submitText: 'Message technician',
    submitValue: "I'd like to message my technician",
    secondaryText: 'Reschedule visit',
    secondaryValue: "I'd like to reschedule my service visit",
};

export default class AsaHvacTechTracker extends LightningElement {
    @api value; // Receives the AsaHvacTechTrackerData object from the Lightning Type.

    @track title = 'Your technician is on the way';
    @track status = 'enroute';
    @track statusLabel = 'On the way';
    @track headline = '';
    @track etaText = '';
    @track windowText = '';
    @track updatedText = '';

    @track techName = '';
    @track techRole = '';
    @track techInitials = '';
    @track techSkills = '';
    @track techPhoto = '';
    @track hasPhoto = false;
    @track ratingLabel = '';
    @track hasRating = false;

    @track jobRows = [];
    @track steps = [];

    @track submitText = '';
    @track secondaryText = '';

    isTestMode = false;
    submitValue = '';
    secondaryValue = '';

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.hvacTechTrackerJSON) {
                const data = JSON.parse(this.value.hvacTechTrackerJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaHvacTechTracker parse error:', e.message);
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
        const tech = raw.technician || {};
        const hasContent = !!(raw.headline || tech.name || (Array.isArray(raw.steps) && raw.steps.length));
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.title = (src.title && String(src.title).trim()) || 'Your technician is on the way';
        this.status = normStatus(src.status);
        this.statusLabel = STATUS_LABELS[this.status];
        this.headline = src.headline ? String(src.headline).trim() : '';
        this.etaText = src.etaText ? String(src.etaText).trim() : '';
        this.windowText = src.windowText ? String(src.windowText).trim() : '';
        this.updatedText = src.updatedText ? String(src.updatedText).trim() : '';

        const t = src.technician || {};
        this.techName = t.name ? String(t.name).trim() : '';
        this.techRole = t.role ? String(t.role).trim() : '';
        this.techSkills = t.skills ? String(t.skills).trim() : '';
        this.techPhoto = t.photoUrl ? String(t.photoUrl).trim() : '';
        this.hasPhoto = !!this.techPhoto;
        if (t.initials && String(t.initials).trim()) {
            this.techInitials = String(t.initials).trim().slice(0, 2).toUpperCase();
        } else {
            const parts = this.techName.split(/\s+/).filter(Boolean);
            this.techInitials = ((parts[0] ? parts[0][0] : '') + (parts[1] ? parts[1][0] : '')).toUpperCase() || 'HV';
        }
        const rating = Number(t.rating);
        this.hasRating = isFinite(rating) && rating > 0;
        this.ratingLabel = this.hasRating ? (Math.round(rating * 10) / 10).toFixed(1) : '';

        const job = src.job || {};
        const rows = [];
        if (job.number) rows.push({ key: 'job-num', k: 'Job', v: String(job.number).trim() });
        if (job.type) rows.push({ key: 'job-type', k: 'Service', v: String(job.type).trim() });
        if (job.address) rows.push({ key: 'job-addr', k: 'Address', v: String(job.address).trim() });
        this.jobRows = rows;

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
                nodeClass: `asa-tt-node is-${state}`,
                isDone: state === 'done',
                isCurrent: state === 'current',
            };
        });

        this.submitText = src.submitText ? String(src.submitText).trim() : '';
        this.submitValue = src.submitValue ? String(src.submitValue).trim() : this.submitText;
        this.secondaryText = src.secondaryText ? String(src.secondaryText).trim() : '';
        this.secondaryValue = src.secondaryValue ? String(src.secondaryValue).trim() : this.secondaryText;
    }

    get heroClass() {
        return `asa-tt-hero is-${this.status}`;
    }
    get statusPillClass() {
        return `asa-tt-status is-${this.status}`;
    }
    get hasHeadline() { return !!this.headline; }
    get hasEta() { return !!this.etaText; }
    get hasWindow() { return !!this.windowText; }
    get hasUpdated() { return !!this.updatedText; }
    get hasChips() { return this.hasEta || this.hasWindow; }
    get hasTech() { return !!this.techName; }
    get hasRole() { return !!this.techRole; }
    get hasSkills() { return !!this.techSkills; }
    get hasJob() { return this.jobRows.length > 0; }
    get hasSteps() { return this.steps.length > 0; }
    get hasSubmit() { return !!this.submitText; }
    get hasSecondary() { return !!this.secondaryText; }

    handlePhotoError() {
        this.hasPhoto = false;
    }

    handleSubmit() {
        if (!this.hasSubmit) return;
        this.sendMessage(this.submitValue || this.submitText);
    }

    handleSecondary() {
        if (!this.hasSecondary) return;
        this.sendMessage(this.secondaryValue || this.secondaryText);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaHvacTechTracker sent:', message))
                    .catch((err) => console.error('AsaHvacTechTracker send error:', err));
            } else {
                console.log('AsaHvacTechTracker: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaHvacTechTracker sendMessage error:', err);
        }
    }
}
