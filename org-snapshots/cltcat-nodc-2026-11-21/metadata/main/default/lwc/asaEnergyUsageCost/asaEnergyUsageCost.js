/**
 * @description ASA Energy & Utilities · Usage & Cost renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders this cycle's energy usage: a prominent projected-bill
 * readout (monospace) with a change-vs-last-month chip, a vertical daily/weekly
 * column chart, and a segmented cost-breakdown meter with a legend. An optional
 * CTA sends a message back via embeddedservice_configuration.util.sendTextMessage().
 *
 * Contract: the field names read below MUST match the example JSON + rules in
 * genAiFunctions/asaEnergyUsageCost_Output_b8c4/input/schema.json.
 * Fields: title?, cycleText?, projectedCost?, currency?, projectedText?,
 * usedUnits?, unit?, deltaPct?, deltaText?, bars[]{label,value},
 * breakdown[]{label,amount,color?}, submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

const PALETTE = ['#d97706', '#0f766e', '#b45309', '#a16207', '#78716c', '#0369a1'];

function num(v) {
    const n = Number(v);
    return isFinite(n) ? n : null;
}

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const TEST_DATA = {
    title: 'Your energy this cycle',
    cycleText: 'Sep 1–30 · 8 days left',
    projectedCost: 142.5,
    currency: 'USD',
    projectedText: 'Projected bill',
    usedUnits: 612,
    unit: 'kWh',
    deltaPct: -8,
    deltaText: 'less than last month',
    bars: [
        { label: 'Wk1', value: 158 },
        { label: 'Wk2', value: 171 },
        { label: 'Wk3', value: 149 },
        { label: 'Wk4', value: 134 },
    ],
    breakdown: [
        { label: 'Heating & cooling', amount: 74.2, color: '#d97706' },
        { label: 'Water heating', amount: 31.0 },
        { label: 'Always-on', amount: 22.4 },
        { label: 'Other', amount: 14.9 },
    ],
    submitText: 'See ways to save',
    submitValue: 'Show me ways to lower my energy bill',
};

export default class AsaEnergyUsageCost extends LightningElement {
    @api value; // Receives the AsaEnergyUsageCostData object from the Lightning Type.

    @track title = 'Your energy this cycle';
    @track cycleText = '';
    @track projectedText = 'Projected bill';
    @track projectedCostText = '';
    @track hasProjected = false;
    @track usedText = '';
    @track hasUsed = false;
    @track hasDelta = false;
    @track deltaClass = 'asa-uc-delta';
    @track deltaArrow = '';
    @track deltaLabel = '';
    @track bars = [];
    @track breakdown = [];
    @track submitText = '';

    isTestMode = false;
    currency = 'USD';
    submitValue = '';

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.energyUsageCostJSON) {
                const data = JSON.parse(this.value.energyUsageCostJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaEnergyUsageCost parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData({});
    }

    isUsable(data) {
        return data && typeof data === 'object';
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

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = !!(num(raw.projectedCost) !== null || num(raw.usedUnits) !== null
            || (Array.isArray(raw.bars) && raw.bars.length) || (Array.isArray(raw.breakdown) && raw.breakdown.length));
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.currency = src.currency ? String(src.currency).trim() : 'USD';
        this.title = (src.title && String(src.title).trim()) || 'Your energy this cycle';
        this.cycleText = src.cycleText ? String(src.cycleText).trim() : '';
        this.projectedText = (src.projectedText && String(src.projectedText).trim()) || 'Projected bill';

        const pc = num(src.projectedCost);
        this.hasProjected = pc !== null;
        this.projectedCostText = this.hasProjected ? this.money(pc) : '';

        const used = num(src.usedUnits);
        this.hasUsed = used !== null;
        this.usedText = this.hasUsed ? `${used.toLocaleString('en-US')} ${src.unit ? String(src.unit).trim() : 'kWh'} used` : '';

        const dp = num(src.deltaPct);
        this.hasDelta = dp !== null && dp !== 0;
        if (this.hasDelta) {
            const down = dp < 0;
            this.deltaClass = `asa-uc-delta ${down ? 'is-down' : 'is-up'}`;
            this.deltaArrow = down ? '▼' : '▲';
            const words = src.deltaText ? String(src.deltaText).trim() : (down ? 'less than last month' : 'more than last month');
            this.deltaLabel = `${Math.abs(dp)}% ${words}`;
        }

        // Column chart
        const rawBars = (Array.isArray(src.bars) ? src.bars : []).filter((b) => b && num(b.value) !== null).slice(0, 8);
        const maxVal = rawBars.reduce((m, b) => Math.max(m, num(b.value)), 0) || 1;
        this.bars = rawBars.map((b, i) => {
            const v = num(b.value);
            const pct = Math.max(8, Math.round((v / maxVal) * 100));
            return {
                key: `bar-${i}`,
                label: b.label ? String(b.label).trim() : '',
                style: `height:${pct}%;`,
                barClass: v >= maxVal ? 'asa-uc-bar is-peak' : 'asa-uc-bar',
            };
        });

        // Cost breakdown → segmented meter + legend
        const rawBd = (Array.isArray(src.breakdown) ? src.breakdown : []).filter((b) => b && b.label && num(b.amount) !== null);
        const total = rawBd.reduce((s, b) => s + num(b.amount), 0) || 1;
        this.breakdown = rawBd.map((b, i) => {
            const amt = num(b.amount);
            const color = (b.color && String(b.color).trim()) || PALETTE[i % PALETTE.length];
            const pct = Math.max(2, Math.round((amt / total) * 100));
            return {
                key: `bd-${i}`,
                label: String(b.label).trim(),
                amountText: this.money(amt),
                color,
                segStyle: `width:${pct}%;background:${color};`,
                dotStyle: `background:${color};`,
            };
        });

        this.submitText = src.submitText ? String(src.submitText).trim() : '';
        this.submitValue = src.submitValue ? String(src.submitValue).trim() : '';
    }

    get hasCycle() { return !!this.cycleText; }
    get hasBars() { return this.bars.length > 0; }
    get hasBreakdown() { return this.breakdown.length > 0; }
    get hasSubmit() { return !!this.submitText; }

    handleSubmit() {
        const message = this.submitValue || this.submitText || 'Show me ways to lower my energy bill';
        this.sendMessage(message);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaEnergyUsageCost sent:', message))
                    .catch((err) => console.error('AsaEnergyUsageCost send error:', err));
            } else {
                console.log('AsaEnergyUsageCost: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaEnergyUsageCost sendMessage error:', err);
        }
    }
}