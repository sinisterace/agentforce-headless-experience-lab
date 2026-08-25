/**
 * @description ASA Public Sector & Education · Application Status Tracker renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a single application as a card with a horizontal step
 * tracker (Submitted → Under review → Approved → Issued; Denied is a terminal
 * Submitted → Denied track). Tapping the CTA sends a follow-up message to the
 * agent via embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaPseAppStatus_Output_f3a1/input/schema.json.
 * Fields: title?, applicationType?, referenceNumber?, status?, statusLabel?,
 * submittedText?, updatedText?, steps?[{label,state,timeText?}], nextActionText?,
 * submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Plain
// object (no JSON.parse), so nothing here can fail.
const FALLBACK_DATA = {
    title: 'Your application status',
    applicationType: 'Building permit',
    referenceNumber: 'APP-2026-1043',
    status: 'review',
    statusLabel: 'Under review',
    submittedText: 'Submitted Sep 3',
    updatedText: 'Updated 2 days ago',
    steps: [
        { label: 'Submitted', state: 'done', timeText: 'Sep 3' },
        { label: 'Under review', state: 'current' },
        { label: 'Approved', state: 'todo' },
        { label: 'Issued', state: 'todo' }
    ],
    nextActionText: 'We may request additional documents — no action needed right now.',
    submitText: 'Message the office',
    submitValue: "I'd like to message the office about my application"
};

// The canonical happy-path pipeline. Denied applications render their own
// two-step track (Submitted → Denied) built in deriveSteps().
const DEFAULT_TRACK = ['Submitted', 'Under review', 'Approved', 'Issued'];
const TRACK_BUCKETS = ['submitted', 'review', 'approved', 'issued'];

export default class AsaPseAppStatus extends LightningElement {
    @api value; // Receives the AsaPseAppStatusData object from the Lightning Type.

    @track title = 'Your application status';
    @track applicationType = '';
    @track referenceNumber = '';
    @track statusLabel = '';
    @track submittedText = '';
    @track updatedText = '';
    @track nextActionText = '';
    @track steps = [];
    @track cardClass = 'asa-ast is-review';
    @track statusClass = 'asa-ast-status is-review';
    @track submitText = '';

    isTestMode = false;
    submitValue = '';

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.pseAppStatusJSON) {
                const data = JSON.parse(this.value.pseAppStatusJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaPseAppStatus parse error:', e.message);
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
        const hasContent = !!(
            raw.referenceNumber ||
            raw.applicationType ||
            (Array.isArray(raw.steps) && raw.steps.length)
        );
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? FALLBACK_DATA : raw;

        this.title = (src.title && String(src.title).trim()) || 'Your application status';
        this.applicationType = src.applicationType ? String(src.applicationType).trim() : '';
        this.referenceNumber = src.referenceNumber ? String(src.referenceNumber).trim() : '';
        this.submittedText = src.submittedText ? String(src.submittedText).trim() : '';
        this.updatedText = src.updatedText ? String(src.updatedText).trim() : '';
        this.nextActionText = src.nextActionText ? String(src.nextActionText).trim() : '';

        const bucket = this.statusOf(src.status);
        this.cardClass = 'asa-ast is-' + bucket;
        this.statusClass = 'asa-ast-status is-' + bucket;
        this.statusLabel = this.statusLabelOf(src, bucket);
        this.steps = this.buildSteps(src, bucket);

        this.submitText = src.submitText ? String(src.submitText).trim() : '';
        this.submitValue = src.submitValue ? String(src.submitValue).trim() : this.submitText;
    }

    // Status → an accent/pill bucket. Unknown values read as review.
    statusOf(status) {
        const raw = String(status || '').toLowerCase().replace(/[^a-z]/g, '');
        if (raw === 'submitted' || raw === 'filed' || raw === 'new' || raw === 'received') return 'submitted';
        if (raw === 'review' || raw === 'inreview' || raw === 'processing' || raw === 'pending') return 'review';
        if (raw === 'approved' || raw === 'accepted') return 'approved';
        if (raw === 'issued' || raw === 'complete' || raw === 'completed' || raw === 'granted' || raw === 'enrolled') return 'issued';
        if (raw === 'denied' || raw === 'declined' || raw === 'rejected') return 'denied';
        return 'review';
    }

    stepStateOf(state) {
        const raw = String(state || '').toLowerCase().replace(/[^a-z]/g, '');
        if (raw === 'done' || raw === 'complete' || raw === 'completed' || raw === 'passed') return 'done';
        if (raw === 'current' || raw === 'active' || raw === 'inprogress') return 'current';
        if (raw === 'denied' || raw === 'declined' || raw === 'rejected') return 'denied';
        return 'upcoming';
    }

    deriveSteps(bucket) {
        if (bucket === 'denied') {
            return [
                { label: 'Submitted', state: 'done' },
                { label: 'Denied', state: 'denied' }
            ];
        }
        const currentIndex = TRACK_BUCKETS.indexOf(bucket);
        return DEFAULT_TRACK.map((label, i) => {
            let state = 'upcoming';
            if (bucket === 'issued') state = 'done';
            else if (i < currentIndex) state = 'done';
            else if (i === currentIndex) state = 'current';
            return { label, state };
        });
    }

    buildSteps(src, bucket) {
        let steps;
        if (Array.isArray(src.steps) && src.steps.length) {
            steps = src.steps
                .filter((s) => s && s.label)
                .map((s) => ({
                    label: String(s.label),
                    state: this.stepStateOf(s.state),
                    timeText: s.timeText ? String(s.timeText).trim() : ''
                }));
        } else {
            steps = this.deriveSteps(bucket).map((s) => ({ ...s, timeText: '' }));
        }
        return steps.map((s, i) => ({
            key: 'step-' + i,
            index: i,
            label: s.label,
            timeText: s.timeText,
            hasTime: !!s.timeText,
            isDone: s.state === 'done',
            isDenied: s.state === 'denied',
            dotClass: 'asa-ast-dot is-' + s.state,
            barClass: 'asa-ast-bar is-' + s.state,
            labelClass: 'asa-ast-step-label is-' + s.state
        }));
    }

    statusLabelOf(src, bucket) {
        const explicit = String(src.statusLabel || '').trim();
        if (explicit) return explicit;
        const raw = String(src.status || '').trim();
        if (raw) return raw;
        return bucket.charAt(0).toUpperCase() + bucket.slice(1);
    }

    get hasHeaderMeta() {
        return !!(this.applicationType || this.referenceNumber);
    }
    get hasFoot() {
        return !!(this.submittedText || this.updatedText);
    }
    get hasNextAction() {
        return !!this.nextActionText;
    }
    get hasSubmit() {
        return !!this.submitText;
    }

    handleSubmit() {
        this.sendMessage(this.submitValue || this.submitText || 'I have a question about my application');
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaPseAppStatus sent:', message))
                    .catch((err) => console.error('AsaPseAppStatus send error:', err));
            } else {
                console.log('AsaPseAppStatus: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaPseAppStatus sendMessage error:', err);
        }
    }
}
