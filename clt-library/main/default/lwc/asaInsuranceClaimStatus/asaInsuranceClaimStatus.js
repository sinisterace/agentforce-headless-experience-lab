/**
 * @description ASA Insurance · Claim Status Tracker renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders each claim as a card with a horizontal step tracker
 * (Submitted → Review → Approved → Paid; Denied is a terminal state). Tapping a
 * claim sends a follow-up message to the agent through
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaInsuranceClaimStatus_Output_c3e9/input/schema.json.
 * Fields: title, claims[] of { id, claimNumber, type?, policyLabel?, filedDate?,
 * amount?, currency?, status, statusLabel?, updatedDate?, nextActionText?,
 * steps?[{ label, state }] }, submitText?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Renders
// when the Flow payload is missing/malformed. Plain object (no JSON.parse), so
// nothing here can fail.
const FALLBACK_DATA = {
    title: 'Your claims',
    claims: [
        {
            id: 'clm-4471', claimNumber: 'CLM-4471', type: 'Collision', policyLabel: 'Auto — 2022 Tesla Model 3',
            filedDate: '2026-07-28', amount: 3200.0, currency: 'USD', status: 'Review', statusLabel: 'In review',
            updatedDate: '2026-08-05', nextActionText: 'Upload the repair estimate'
        },
        {
            id: 'clm-3120', claimNumber: 'CLM-3120', type: 'Water damage', policyLabel: 'Homeowners — 14 Elm St',
            filedDate: '2026-06-10', amount: 8750.0, currency: 'USD', status: 'Paid', statusLabel: 'Paid',
            updatedDate: '2026-07-02'
        }
    ]
};

// The canonical happy-path pipeline. Denied claims render their own two-step
// track (Submitted → Denied) built in deriveSteps().
const DEFAULT_TRACK = ['Submitted', 'Review', 'Approved', 'Paid'];

export default class AsaInsuranceClaimStatus extends LightningElement {
    @api value; // Receives the AsaInsuranceClaimStatusData object from the Lightning Type.

    @track title = 'Your claims';
    @track submitText = 'Ask about a claim';
    @track claims = []; // display-ready cards (computed)

    rawClaims = [];
    isTestMode = false;

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.insuranceClaimStatusJSON) {
                const data = JSON.parse(this.value.insuranceClaimStatusJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaInsuranceClaimStatus parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData(FALLBACK_DATA);
    }

    isUsable(data) {
        return data && typeof data === 'object';
    }

    initializeFromData(data) {
        const list = Array.isArray(data.claims) ? data.claims : [];
        // Empty claims → show generic sample so the card is never blank.
        this.isTestMode = list.length === 0;
        const source = this.isTestMode ? FALLBACK_DATA : data;
        this.rawClaims = Array.isArray(source.claims) ? source.claims : [];
        this.title = (source.title && String(source.title).trim()) || 'Your claims';
        this.submitText = (data.submitText && String(data.submitText).trim()) || 'Ask about a claim';
        this.recompute();
    }

    keyFor(claim, index) {
        return claim && claim.id ? String(claim.id) : 'idx-' + index;
    }

    // Status → an accent/pill bucket. Unknown values read as neutral.
    statusOf(status) {
        const raw = String(status || '').toLowerCase().replace(/[^a-z]/g, '');
        if (raw === 'submitted' || raw === 'filed' || raw === 'new' || raw === 'received') return 'submitted';
        if (raw === 'review' || raw === 'inreview' || raw === 'processing' || raw === 'investigating' || raw === 'pending') return 'review';
        if (raw === 'approved' || raw === 'accepted') return 'approved';
        if (raw === 'paid' || raw === 'settled' || raw === 'closed' || raw === 'complete' || raw === 'completed') return 'paid';
        if (raw === 'denied' || raw === 'declined' || raw === 'rejected') return 'denied';
        return 'review';
    }

    // Build a step track from an explicit `steps` array, or derive one from the
    // claim's status bucket. Each step becomes { label, isDone, isCurrent,
    // isUpcoming, stepClass, index }.
    buildSteps(claim, bucket) {
        let steps;
        if (Array.isArray(claim.steps) && claim.steps.length) {
            steps = claim.steps.map((s) => ({
                label: (s && s.label) ? String(s.label) : '',
                state: this.stepStateOf(s && s.state)
            }));
        } else {
            steps = this.deriveSteps(bucket);
        }
        return steps.map((s, i) => ({
            key: 'step-' + i,
            index: i,
            label: s.label,
            isDone: s.state === 'done',
            isCurrent: s.state === 'current',
            isUpcoming: s.state === 'upcoming',
            isDenied: s.state === 'denied',
            dotClass: 'asa-cs-dot is-' + s.state,
            barClass: 'asa-cs-bar is-' + s.state,
            labelClass: 'asa-cs-step-label is-' + s.state
        }));
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
        const currentIndex = DEFAULT_TRACK.map((s) => s.toLowerCase()).indexOf(bucket);
        return DEFAULT_TRACK.map((label, i) => {
            let state = 'upcoming';
            if (bucket === 'paid') {
                state = 'done';
            } else if (i < currentIndex) {
                state = 'done';
            } else if (i === currentIndex) {
                state = 'current';
            }
            return { label, state };
        });
    }

    formatMoney(amount, currency) {
        const cur = currency || 'USD';
        const num = Number(amount);
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(isNaN(num) ? 0 : num);
        } catch (e) {
            return cur + ' ' + (isNaN(num) ? '0.00' : num.toFixed(2));
        }
    }

    // ISO yyyy-mm-dd → "Jul 28, 2026" (parsed as a local date to avoid a tz
    // day-shift). Any non-ISO string is shown as-is.
    formatDate(value) {
        if (!value) return '';
        const s = String(value);
        const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!m) return s;
        try {
            const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
            return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
        } catch (e) {
            return s;
        }
    }

    statusLabelOf(claim, bucket) {
        const explicit = String(claim.statusLabel || '').trim();
        if (explicit) return explicit;
        const raw = String(claim.status || '').trim();
        if (raw) return raw;
        return bucket.charAt(0).toUpperCase() + bucket.slice(1);
    }

    recompute() {
        this.claims = this.rawClaims.map((claim, index) => {
            const key = this.keyFor(claim, index);
            const bucket = this.statusOf(claim.status);
            const hasAmount = typeof claim.amount === 'number' && !isNaN(claim.amount);
            const filedDisplay = this.formatDate(claim.filedDate);
            const updatedDisplay = this.formatDate(claim.updatedDate);
            const nextAction = String(claim.nextActionText || '').trim();
            return {
                key,
                index,
                claimNumber: claim.claimNumber || 'Claim',
                type: claim.type || '',
                hasType: !!(claim.type && String(claim.type).trim()),
                policyLabel: claim.policyLabel || '',
                hasPolicy: !!(claim.policyLabel && String(claim.policyLabel).trim()),
                hasAmount,
                amountDisplay: hasAmount ? this.formatMoney(claim.amount, claim.currency) : '',
                filedDisplay,
                hasFiled: !!filedDisplay,
                updatedDisplay,
                hasUpdated: !!updatedDisplay,
                nextAction,
                hasNextAction: !!nextAction,
                statusLabel: this.statusLabelOf(claim, bucket),
                steps: this.buildSteps(claim, bucket),
                cardClass: 'asa-cs is-' + bucket,
                statusClass: 'asa-cs-status is-' + bucket
            };
        });
    }

    get hasClaims() {
        return this.claims && this.claims.length > 0;
    }

    get submitLabel() {
        return this.submitText || 'Ask about a claim';
    }

    handleClaimTap(event) {
        const index = Number(event.currentTarget.dataset.index);
        const claim = this.rawClaims[index];
        if (!claim) return;
        const ref = claim.claimNumber || claim.id || 'my claim';
        this.sendMessage(`Tell me more about claim ${ref}`);
    }

    handleSubmit() {
        this.sendMessage('I have a question about one of my claims');
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaInsuranceClaimStatus sent:', message))
                    .catch((err) => console.error('AsaInsuranceClaimStatus send error:', err));
            } else {
                console.log('AsaInsuranceClaimStatus: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaInsuranceClaimStatus sendMessage error:', err);
        }
    }
}
