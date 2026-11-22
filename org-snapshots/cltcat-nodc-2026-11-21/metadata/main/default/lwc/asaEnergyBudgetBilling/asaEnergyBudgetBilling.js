/**
 * @description ASA Energy & Utilities · Budget Billing renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and pitches a levelized Budget Billing plan: the flat monthly amount
 * (monospace), a self-contained SVG chart contrasting the customer's jagged
 * actual bills with the flat budget line, a benefits checklist, and primary +
 * secondary actions sent back via embeddedservice_configuration.util.sendTextMessage().
 *
 * Contract: the field names read below MUST match the example JSON + rules in
 * genAiFunctions/asaEnergyBudgetBilling_Output_c9d5/input/schema.json.
 * Fields: title?, subtitle?, currency?, monthlyAmount?, currentAvgText?,
 * termText?, series{actual[],budget}, bullets[], submitText?, submitValue?,
 * secondaryText?, secondaryValue?.
 */
import { LightningElement, api, track } from 'lwc';

function num(v) {
    const n = Number(v);
    return isFinite(n) ? n : null;
}

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const TEST_DATA = {
    title: 'Smooth out your bill',
    subtitle: 'Budget Billing keeps your payment the same every month',
    currency: 'USD',
    monthlyAmount: 118,
    currentAvgText: 'Your bills now swing $64–$210',
    termText: 'Recalculated every 12 months',
    series: { actual: [96, 120, 168, 210, 150, 88, 64, 72, 110, 175, 190, 140], budget: 118 },
    bullets: ['No surprises in peak season', 'Cancel anytime', 'Settles up once a year'],
    submitText: 'Enroll in Budget Billing',
    submitValue: 'Enroll me in Budget Billing',
    secondaryText: 'Maybe later',
    secondaryValue: "I'd like to think about Budget Billing",
};

export default class AsaEnergyBudgetBilling extends LightningElement {
    @api value; // Receives the AsaEnergyBudgetBillingData object from the Lightning Type.

    @track title = 'Smooth out your bill';
    @track subtitle = '';
    @track monthlyAmountText = '';
    @track hasMonthly = false;
    @track currentAvgText = '';
    @track termText = '';
    @track bullets = [];
    @track submitText = '';
    @track secondaryText = '';

    // Chart geometry
    @track hasChart = false;
    @track actualLine = '';
    @track actualArea = '';
    @track budgetLine = '';

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
            if (this.value && this.value.energyBudgetBillingJSON) {
                const data = JSON.parse(this.value.energyBudgetBillingJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaEnergyBudgetBilling parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData({});
    }

    isUsable(data) {
        return data && typeof data === 'object';
    }

    money(amount, maxFrac = 0) {
        const n = Number(amount);
        if (!isFinite(n)) return '';
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: this.currency || 'USD', maximumFractionDigits: maxFrac }).format(n);
        } catch (e) {
            return `${this.currency || 'USD'} ${n.toFixed(maxFrac)}`;
        }
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = !!(num(raw.monthlyAmount) !== null
            || (raw.series && Array.isArray(raw.series.actual) && raw.series.actual.length)
            || (Array.isArray(raw.bullets) && raw.bullets.length));
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.currency = src.currency ? String(src.currency).trim() : 'USD';
        this.title = (src.title && String(src.title).trim()) || 'Smooth out your bill';
        this.subtitle = src.subtitle ? String(src.subtitle).trim() : '';

        const m = num(src.monthlyAmount);
        this.hasMonthly = m !== null;
        this.monthlyAmountText = this.hasMonthly ? this.money(m) : '';

        this.currentAvgText = src.currentAvgText ? String(src.currentAvgText).trim() : '';
        this.termText = src.termText ? String(src.termText).trim() : '';

        this.bullets = (Array.isArray(src.bullets) ? src.bullets : [])
            .filter(Boolean)
            .map((b, i) => ({ key: `bul-${i}`, text: String(b).trim() }));

        this.buildChart(src.series);

        this.submitText = src.submitText ? String(src.submitText).trim() : '';
        this.submitValue = src.submitValue ? String(src.submitValue).trim() : '';
        this.secondaryText = src.secondaryText ? String(src.secondaryText).trim() : '';
        this.secondaryValue = src.secondaryValue ? String(src.secondaryValue).trim() : '';
    }

    buildChart(series) {
        const actual = (series && Array.isArray(series.actual) ? series.actual : []).map(num).filter((n) => n !== null);
        const budget = series ? num(series.budget) : null;
        if (actual.length < 2) {
            this.hasChart = false;
            return;
        }
        const w = 100;
        const h = 44;
        const pad = 4;
        const all = budget !== null ? actual.concat([budget]) : actual.slice();
        const min = Math.min(...all);
        const max = Math.max(...all);
        const span = max - min || 1;
        const step = (w - pad * 2) / (actual.length - 1);
        const yFor = (v) => Math.round((pad + (h - pad * 2) * (1 - (v - min) / span)) * 100) / 100;
        const pts = actual.map((v, i) => [Math.round((pad + i * step) * 100) / 100, yFor(v)]);
        this.actualLine = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
        const last = pts[pts.length - 1];
        this.actualArea = `${this.actualLine} L${last[0]},${h} L${pts[0][0]},${h} Z`;
        if (budget !== null) {
            const by = yFor(budget);
            this.budgetLine = `M${pad},${by} L${w - pad},${by}`;
        } else {
            this.budgetLine = '';
        }
        this.hasChart = true;
    }

    get hasSubtitle() { return !!this.subtitle; }
    get hasCurrentAvg() { return !!this.currentAvgText; }
    get hasTerm() { return !!this.termText; }
    get hasBullets() { return this.bullets.length > 0; }
    get hasBudgetLine() { return !!this.budgetLine; }
    get hasSubmit() { return !!this.submitText; }
    get hasSecondary() { return !!this.secondaryText; }

    handleSubmit() {
        this.sendMessage(this.submitValue || this.submitText || 'Enroll me in Budget Billing');
    }

    handleSecondary() {
        this.sendMessage(this.secondaryValue || this.secondaryText || 'Tell me more about Budget Billing');
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaEnergyBudgetBilling sent:', message))
                    .catch((err) => console.error('AsaEnergyBudgetBilling send error:', err));
            } else {
                console.log('AsaEnergyBudgetBilling: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaEnergyBudgetBilling sendMessage error:', err);
        }
    }
}