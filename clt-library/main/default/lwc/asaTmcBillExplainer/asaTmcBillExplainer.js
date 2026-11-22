/**
 * @description ASA Technology, Media & Comms · Bill Explainer renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a statement card: the total due + due date, a stacked
 * charge-category bar, itemized line rows (colored by category, discounts shown
 * as credits), a month-over-month delta callout, and pay / autopay actions.
 * Tapping an action sends the choice back via
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaTmcBillExplainer_Output_b4d7/input/schema.json.
 * Fields: title?, currency?, total(number), dueDateText?, periodText?,
 * items[]{id?, label, amount(number), category?}, deltaAmount?(number),
 * deltaText?, note?, submitText?, submitValue?, secondaryText?, secondaryValue?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const TEST_BILL = {
    title: 'Your September bill',
    currency: 'USD',
    total: 118.4,
    dueDateText: 'Due Sep 28',
    periodText: 'Sep 1 – Sep 30',
    items: [
        { id: 'plan', label: 'Unlimited Plus plan', amount: 70, category: 'plan' },
        { id: 'device', label: 'iPhone installment', amount: 27.08, category: 'device' },
        { id: 'stream', label: 'Streaming add-on', amount: 9.99, category: 'streaming' },
        { id: 'taxes', label: 'Taxes & fees', amount: 11.33, category: 'taxes' }
    ],
    deltaAmount: 12.4,
    deltaText: 'You added the Streaming add-on this cycle.',
    note: 'Autopay is on. This amount will be charged automatically.',
    submitText: 'Pay now',
    submitValue: "I'd like to pay my bill now",
    secondaryText: 'Set up autopay',
    secondaryValue: 'Help me set up autopay'
};

const CATEGORY_COLORS = {
    plan: '#0891b2',
    data: '#6366f1',
    device: '#f59e0b',
    equipment: '#f59e0b',
    streaming: '#ec4899',
    taxes: '#64748b',
    onetime: '#8b5cf6',
    discount: '#15803d',
    other: '#94a3b8'
};

function normCategory(c) {
    const raw = String(c || '').toLowerCase().replace(/[^a-z]/g, '');
    if (raw === 'plan' || raw === 'service' || raw === 'subscription') return 'plan';
    if (raw === 'data' || raw === 'usage' || raw === 'overage') return 'data';
    if (raw === 'device' || raw === 'equipment' || raw === 'installment' || raw === 'phone' || raw === 'hardware') return 'device';
    if (raw === 'streaming' || raw === 'addon' || raw === 'addons' || raw === 'entertainment') return 'streaming';
    if (raw === 'taxes' || raw === 'tax' || raw === 'fees' || raw === 'fee' || raw === 'surcharge') return 'taxes';
    if (raw === 'onetime' || raw === 'onetimecharge' || raw === 'activation' || raw === 'setup') return 'onetime';
    if (raw === 'discount' || raw === 'credit' || raw === 'promo' || raw === 'adjustment') return 'discount';
    return 'other';
}

function num(v) {
    const n = Number(v);
    return isFinite(n) ? n : null;
}

export default class AsaTmcBillExplainer extends LightningElement {
    @api value; // Receives the AsaTmcBillExplainerData object from the Lightning Type.

    @track title = 'Your bill';
    @track totalLabel = '';
    @track hasDueDate = false;
    @track dueDateText = '';
    @track hasPeriod = false;
    @track periodText = '';

    @track segments = [];
    @track hasBar = false;
    @track items = [];

    @track hasDelta = false;
    @track deltaText = '';
    @track hasDeltaReason = false;
    @track deltaMoney = '';
    @track deltaDir = '';
    @track hasDeltaLead = false;
    @track deltaClass = 'asa-be-delta';
    @track deltaUp = false;

    @track hasNote = false;
    @track note = '';

    @track hasSubmit = false;
    @track submitText = '';
    @track hasSecondary = false;
    @track secondaryText = '';

    isTestMode = false;
    currency = 'USD';
    submitValue = '';
    secondaryValue = '';

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.tmcBillExplainerJSON) {
                const data = JSON.parse(this.value.tmcBillExplainerJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaTmcBillExplainer parse error:', e.message);
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
        const hasItems = Array.isArray(raw.items) && raw.items.filter((i) => i && i.label && num(i.amount) !== null).length > 0;
        this.isTestMode = !hasItems && num(raw.total) === null;
        const source = this.isTestMode ? TEST_BILL : raw;
        this.recompute(source);
    }

    money(amount) {
        const n = Number(amount);
        if (!isFinite(n)) return '';
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: this.currency || 'USD' }).format(n);
        } catch (e) {
            return `${this.currency || 'USD'} ${n.toFixed(2)}`;
        }
    }

    recompute(source) {
        this.title = (source.title && String(source.title).trim()) || 'Your bill';
        this.currency = source.currency ? String(source.currency).trim() : 'USD';

        const rawItems = Array.isArray(source.items)
            ? source.items.filter((i) => i && i.label && num(i.amount) !== null)
            : [];

        const providedTotal = num(source.total);
        const summed = rawItems.reduce((acc, i) => acc + num(i.amount), 0);
        const total = providedTotal !== null ? providedTotal : summed;
        this.totalLabel = this.money(total);

        this.dueDateText = source.dueDateText ? String(source.dueDateText).trim() : '';
        this.hasDueDate = !!this.dueDateText;
        this.periodText = source.periodText ? String(source.periodText).trim() : '';
        this.hasPeriod = !!this.periodText;

        // Line items (colored by category; discounts / negatives shown as credits).
        this.items = rawItems.map((i, idx) => {
            const cat = normCategory(i.category);
            const amt = num(i.amount);
            const isCredit = cat === 'discount' || amt < 0;
            const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.other;
            return {
                key: i.id ? `it-${i.id}` : `it-${idx}`,
                label: String(i.label).trim(),
                amount: isCredit ? `−${this.money(Math.abs(amt))}` : this.money(amt),
                dotStyle: `background:${color};`,
                amountClass: isCredit ? 'asa-be-amt is-credit' : 'asa-be-amt',
                _cat: cat,
                _abs: Math.abs(amt),
                _isCredit: isCredit
            };
        });

        // Stacked bar from positive charges only.
        const charges = this.items.filter((i) => !i._isCredit && i._abs > 0);
        const chargeSum = charges.reduce((acc, i) => acc + i._abs, 0) || 1;
        this.segments = charges.map((i, idx) => {
            const color = CATEGORY_COLORS[i._cat] || CATEGORY_COLORS.other;
            const pct = Math.max(3, (i._abs / chargeSum) * 100);
            return { key: `bar-${idx}`, style: `width:${pct.toFixed(2)}%;background:${color};` };
        });
        this.hasBar = this.segments.length > 1;

        // Month-over-month delta — a designed trend insight, not a flat pill.
        const delta = num(source.deltaAmount);
        this.deltaText = source.deltaText ? String(source.deltaText).trim() : '';
        this.hasDeltaReason = !!this.deltaText;
        if (delta !== null && delta !== 0) {
            this.deltaUp = delta > 0;
            this.deltaMoney = this.money(Math.abs(delta));
            this.deltaDir = delta > 0 ? 'more than last month' : 'less than last month';
            this.hasDeltaLead = true;
            this.deltaClass = delta > 0 ? 'asa-be-delta is-up' : 'asa-be-delta is-down';
            this.hasDelta = true;
        } else if (this.deltaText) {
            this.deltaUp = false;
            this.deltaMoney = '';
            this.deltaDir = '';
            this.hasDeltaLead = false;
            this.deltaClass = 'asa-be-delta is-flat';
            this.hasDelta = true;
        } else {
            this.hasDelta = false;
        }

        this.note = source.note ? String(source.note).trim() : '';
        this.hasNote = !!this.note;

        this.submitText = source.submitText ? String(source.submitText).trim() : '';
        this.hasSubmit = !!this.submitText;
        this.submitValue = source.submitValue ? String(source.submitValue).trim() : this.submitText;

        this.secondaryText = source.secondaryText ? String(source.secondaryText).trim() : '';
        this.hasSecondary = !!this.secondaryText;
        this.secondaryValue = source.secondaryValue ? String(source.secondaryValue).trim() : this.secondaryText;
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
                    .then(() => console.log('AsaTmcBillExplainer sent:', message))
                    .catch((err) => console.error('AsaTmcBillExplainer send error:', err));
            } else {
                console.log('AsaTmcBillExplainer: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaTmcBillExplainer sendMessage error:', err);
        }
    }
}
