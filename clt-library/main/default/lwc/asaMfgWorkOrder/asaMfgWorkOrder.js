/**
 * @description ASA Manufacturing · Work Order Tracker renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a work-order header (order number + priority chip +
 * product) above a vertical milestone timeline (done / current / todo dots with
 * a connecting rail, each with an optional timestamp + owner), an estimated
 * ship-date callout, and a message-team CTA. Tapping the CTA sends the choice
 * back via embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaMfgWorkOrder_Output_c7d4/input/schema.json.
 * Fields: title?, orderNumber?, product?, priority?(low|normal|high|urgent),
 * etaText?, updatedText?, milestones[]{label, state(done|current|todo),
 * timeText?, owner?}, submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const TEST_WO = {
    title: 'Work order WO-4821',
    orderNumber: 'WO-4821',
    product: 'Trailblazer Assembly Cell · 2 units',
    priority: 'high',
    etaText: 'Est. ship Oct 2',
    updatedText: 'Updated 1h ago',
    milestones: [
        { label: 'Order received', state: 'done', timeText: 'Sep 18', owner: 'Intake' },
        { label: 'Machining', state: 'done', timeText: 'Sep 22', owner: 'Cell A' },
        { label: 'Assembly', state: 'current', timeText: 'In progress', owner: 'Bay 4' },
        { label: 'Quality check', state: 'todo' },
        { label: 'Ready to ship', state: 'todo' }
    ],
    submitText: 'Message production team',
    submitValue: 'I have a question about work order WO-4821'
};

const PRIORITY_LABELS = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' };

function normPriority(p) {
    const raw = String(p || '').toLowerCase().replace(/[^a-z]/g, '');
    if (raw === 'urgent' || raw === 'critical' || raw === 'rush' || raw === 'expedite') return 'urgent';
    if (raw === 'high') return 'high';
    if (raw === 'low') return 'low';
    return 'normal';
}

function normMilestoneState(s) {
    const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
    if (raw === 'done' || raw === 'complete' || raw === 'completed') return 'done';
    if (raw === 'current' || raw === 'active' || raw === 'inprogress' || raw === 'progress') return 'current';
    return 'todo';
}

export default class AsaMfgWorkOrder extends LightningElement {
    @api value; // Receives the AsaMfgWorkOrderData object from the Lightning Type.

    @track title = 'Work order';
    @track hasProduct = false;
    @track product = '';
    @track hasPriority = false;
    @track priorityLabel = '';
    @track priorityClass = 'asa-wo-priority';
    @track hasUpdated = false;
    @track updatedText = '';

    @track milestones = [];

    @track hasEta = false;
    @track etaText = '';

    @track hasSubmit = false;
    @track submitText = '';

    isTestMode = false;
    submitValue = '';

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.mfgWorkOrderJSON) {
                const data = JSON.parse(this.value.mfgWorkOrderJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaMfgWorkOrder parse error:', e.message);
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
        const hasMs = Array.isArray(raw.milestones) && raw.milestones.filter((m) => m && m.label).length > 0;
        this.isTestMode = !hasMs;
        const source = this.isTestMode ? TEST_WO : raw;
        this.recompute(source);
    }

    recompute(source) {
        const orderNumber = source.orderNumber ? String(source.orderNumber).trim() : '';
        this.title = (source.title && String(source.title).trim()) || (orderNumber ? `Work order ${orderNumber}` : 'Work order');

        this.product = source.product ? String(source.product).trim() : '';
        this.hasProduct = !!this.product;

        const priority = normPriority(source.priority);
        this.hasPriority = !!source.priority;
        this.priorityLabel = PRIORITY_LABELS[priority];
        this.priorityClass = `asa-wo-priority is-${priority}`;

        this.updatedText = source.updatedText ? String(source.updatedText).trim() : '';
        this.hasUpdated = !!this.updatedText;

        const raw = Array.isArray(source.milestones) ? source.milestones.filter((m) => m && m.label) : [];
        this.milestones = raw.map((m, index) => {
            const state = normMilestoneState(m.state);
            const meta = [m.timeText, m.owner].filter(Boolean).map((x) => String(x).trim()).join(' · ');
            return {
                key: `ms-${index}`,
                label: String(m.label).trim(),
                hasMeta: !!meta,
                meta,
                isDone: state === 'done',
                isCurrent: state === 'current',
                itemClass: `asa-wo-step is-${state}${index === raw.length - 1 ? ' is-last' : ''}`
            };
        });

        this.etaText = source.etaText ? String(source.etaText).trim() : '';
        this.hasEta = !!this.etaText;

        this.submitText = source.submitText ? String(source.submitText).trim() : '';
        this.hasSubmit = !!this.submitText;
        this.submitValue = source.submitValue ? String(source.submitValue).trim() : this.submitText;
    }

    handleSubmit() {
        if (!this.hasSubmit) return;
        this.sendMessage(this.submitValue || this.submitText);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaMfgWorkOrder sent:', message))
                    .catch((err) => console.error('AsaMfgWorkOrder send error:', err));
            } else {
                console.log('AsaMfgWorkOrder: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaMfgWorkOrder sendMessage error:', err);
        }
    }
}
