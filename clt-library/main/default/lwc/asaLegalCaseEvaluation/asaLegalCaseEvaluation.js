/**
 * @description ASA Legal · Free Case Evaluation renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders the signature law-firm-site intake as a real sectioned
 * form: a matter banner, quick structured questions (choice pills or a date),
 * a "describe your situation" textarea, your-details fields, a consent checkbox,
 * an accurate no-attorney-client-relationship disclaimer, and a submit button.
 * Tapping submit sends a message back to the agent through
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaLegalCaseEvaluation_Output_7b2d/input/schema.json.
 * Fields: title?, subtitle?, matter?, questions[]{id, label, type?(choice|date),
 * options?[]}, describeLabel?, describePlaceholder?, consentText?, disclaimer?,
 * footerNote?, submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample questions (no client-specific content).
// Renders when the Flow payload is missing/malformed. Plain object (no JSON.parse).
const TEST_QUESTIONS = [
    { id: 'when', label: 'When did this happen?', type: 'choice', options: ['Past week', 'Past month', '1-6 months ago', 'Over 6 months ago'] },
    { id: 'injured', label: 'Was anyone injured?', type: 'choice', options: ['Yes', 'No', 'Not sure'] },
    { id: 'represented', label: 'Have you hired a lawyer for this?', type: 'choice', options: ['No', 'Yes'] }
];

const DEFAULT_CONSENT = 'I agree to the Privacy Policy and Terms of Use.';
const DEFAULT_DISCLAIMER =
    'Submitting this form does not create an attorney-client relationship. Please don’t share confidential or time-sensitive details until we’ve agreed to represent you.';
const DEFAULT_FOOTER = 'An attorney will review your request and respond within 1 business day.';

export default class AsaLegalCaseEvaluation extends LightningElement {
    @api value; // Receives the AsaLegalCaseEvaluationData object from the Lightning Type.

    @track title = 'Free case review';
    @track subtitle = '';
    @track matter = '';
    @track questions = [];
    @track describeLabel = 'Briefly describe your situation';
    @track describePlaceholder = 'Share what happened, in your own words…';
    @track consentText = DEFAULT_CONSENT;
    @track disclaimer = DEFAULT_DISCLAIMER;
    @track footerNote = DEFAULT_FOOTER;
    @track submitText = 'Request my free review';

    isTestMode = false;
    submitValue = 'I would like a free case review';

    // Local intake state (mirrors the React preview's controlled inputs).
    answers = {};
    text = '';
    agree = false;
    contact = { first: '', last: '', email: '', phone: '' };

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.legalCaseEvaluationJSON) {
                const data = JSON.parse(this.value.legalCaseEvaluationJSON);
                if (data && typeof data === 'object') {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaLegalCaseEvaluation parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData({});
    }

    initializeFromData(data) {
        // Test mode when there are no real questions — never blank.
        const hasQuestions = Array.isArray(data.questions) && data.questions.length > 0;
        this.isTestMode = !hasQuestions;

        this.title = (this.isTestMode ? 'Free case review' : data.title) || 'Free case review';
        this.subtitle = this.isTestMode
            ? 'Tell us a little and we’ll assess your options'
            : (data.subtitle ? String(data.subtitle).trim() : '');
        this.matter = this.isTestMode ? 'Personal Injury' : (data.matter ? String(data.matter).trim() : '');

        const rawQuestions = this.isTestMode ? TEST_QUESTIONS : data.questions;
        this.questions = this.buildQuestions(rawQuestions);

        this.describeLabel = (data.describeLabel || 'Briefly describe your situation').trim();
        this.describePlaceholder = data.describePlaceholder || 'Share what happened, in your own words…';
        this.consentText = (data.consentText || DEFAULT_CONSENT).trim();
        this.disclaimer = data.disclaimer === '' ? '' : (data.disclaimer || DEFAULT_DISCLAIMER).trim();
        this.footerNote = data.footerNote === '' ? '' : (data.footerNote || DEFAULT_FOOTER).trim();
        this.submitText = (data.submitText || 'Request my free review').trim() || 'Request my free review';
        this.submitValue = (data.submitValue && String(data.submitValue).trim()) || 'I would like a free case review';
    }

    buildQuestions(list) {
        const arr = Array.isArray(list) ? list : [];
        return arr
            .filter((q) => q && q.label)
            .map((q, index) => {
                const qid = q.id || 'q-' + index;
                const isDate = String(q.type || 'choice').toLowerCase() === 'date';
                const options = (Array.isArray(q.options) ? q.options : [])
                    .filter((o) => o != null && String(o).trim())
                    .map((opt, oi) => {
                        const v = String(opt).trim();
                        return {
                            key: qid + '-' + oi,
                            value: v,
                            optClass: this.answers[qid] === v ? 'asa-lce-opt is-selected' : 'asa-lce-opt'
                        };
                    });
                return {
                    qid: qid,
                    label: q.label,
                    isDate: isDate,
                    isChoice: !isDate,
                    dateValue: this.answers[qid] || '',
                    options: options
                };
            });
    }

    get hasSubtitle() {
        return !!this.subtitle;
    }
    get hasMatter() {
        return !!this.matter;
    }
    get hasQuestions() {
        return this.questions && this.questions.length > 0;
    }
    get hasDisclaimer() {
        return !!this.disclaimer;
    }
    get hasFooter() {
        return !!this.footerNote;
    }

    handleOption(event) {
        const qid = event.currentTarget.dataset.qid;
        const value = event.currentTarget.dataset.value;
        this.answers = { ...this.answers, [qid]: value };
        // Rebuild so option pill selected-state re-renders.
        this.questions = this.buildQuestions(
            this.questions.map((q) => ({
                id: q.qid,
                label: q.label,
                type: q.isDate ? 'date' : 'choice',
                options: q.options.map((o) => o.value)
            }))
        );
    }

    handleDate(event) {
        const qid = event.currentTarget.dataset.qid;
        this.answers = { ...this.answers, [qid]: event.target.value };
    }

    handleText(event) {
        this.text = event.target.value;
    }

    handleContact(event) {
        const field = event.currentTarget.dataset.field;
        this.contact = { ...this.contact, [field]: event.target.value };
    }

    handleConsent(event) {
        this.agree = event.target.checked;
    }

    handleSubmit() {
        this.sendMessage(this.submitValue || 'I would like a free case review');
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaLegalCaseEvaluation sent:', message))
                    .catch((err) => console.error('AsaLegalCaseEvaluation send error:', err));
            } else {
                console.log('AsaLegalCaseEvaluation: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaLegalCaseEvaluation sendMessage error:', err);
        }
    }
}
