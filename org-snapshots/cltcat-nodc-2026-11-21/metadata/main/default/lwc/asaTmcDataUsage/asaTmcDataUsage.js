/**
 * @description ASA Technology, Media & Comms · Data Usage Meter renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a self-contained SVG radial gauge (270° arc) showing
 * how much of an allowance has been used, the billing-cycle status, a
 * per-category breakdown bar, and an optional add-on CTA. Tapping the CTA sends
 * the choice back via embeddedservice_configuration.util.sendTextMessage(...).
 *
 * The gauge arc uses SVG pathLength="100" so the drawn length is expressed in
 * simple 0–100 units: the 270° track is 75 units and the value arc is
 * 75 * (used/total). A rotate(135°) puts the gap at the bottom-center.
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaTmcDataUsage_Output_f2b5/input/schema.json.
 * Fields: title?, cycleText?, used(number), total(number), unit?(GB|min|texts),
 * categories?[]{label, amount(number), color?}, note?, submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const TEST_USAGE = {
    title: 'Your data this cycle',
    cycleText: '12 days left · resets Sep 30',
    used: 42.1,
    total: 50,
    unit: 'GB',
    categories: [
        { label: 'Streaming', amount: 24.6 },
        { label: 'Social', amount: 9.8 },
        { label: 'Other', amount: 7.7 }
    ],
    note: "You're on track to stay under your limit.",
    submitText: 'Add a data pass',
    submitValue: "I'd like to add a data pass to my plan"
};

// Default hue cycle for category segments without an explicit color.
const CATEGORY_COLORS = ['#0891b2', '#6366f1', '#f59e0b', '#ec4899', '#10b981', '#64748b'];

const TRACK_LENGTH = 75; // 270° of a pathLength=100 circle.

function num(v) {
    const n = Number(v);
    return isFinite(n) ? n : null;
}

function trimNum(n) {
    // Show up to one decimal, no trailing ".0".
    const r = Math.round(n * 10) / 10;
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

export default class AsaTmcDataUsage extends LightningElement {
    @api value; // Receives the AsaTmcDataUsageData object from the Lightning Type.

    @track title = 'Your usage';
    @track hasCycle = false;
    @track cycleText = '';

    @track unit = 'GB';
    @track isUnlimited = false;
    @track usedLabel = '';
    @track totalLabel = '';
    @track remainingLabel = '';
    @track hasRemaining = false;

    @track trackDash = `${TRACK_LENGTH} 100`;
    @track valueDash = '0 100';
    @track gaugeClass = 'asa-du-gauge is-ok';

    @track segments = [];
    @track legend = [];
    @track hasBreakdown = false;

    @track hasNote = false;
    @track note = '';
    @track noteClass = 'asa-du-note';

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
            if (this.value && this.value.tmcDataUsageJSON) {
                const data = JSON.parse(this.value.tmcDataUsageJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaTmcDataUsage parse error:', e.message);
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
        this.isTestMode = num(raw.used) === null;
        const source = this.isTestMode ? TEST_USAGE : raw;
        this.recompute(source);
    }

    recompute(source) {
        this.title = (source.title && String(source.title).trim()) || 'Your usage';
        this.cycleText = source.cycleText ? String(source.cycleText).trim() : '';
        this.hasCycle = !!this.cycleText;
        this.unit = source.unit ? String(source.unit).trim() : 'GB';

        const used = Math.max(0, num(source.used) || 0);
        const total = num(source.total);
        this.isUnlimited = total === null || total <= 0;

        this.usedLabel = trimNum(used);
        if (this.isUnlimited) {
            this.totalLabel = 'Unlimited';
            this.remainingLabel = `${trimNum(used)} ${this.unit} used`;
            this.hasRemaining = true;
            this.valueDash = `${TRACK_LENGTH} 100`;
            this.gaugeClass = 'asa-du-gauge is-unlimited';
        } else {
            const frac = Math.max(0, Math.min(1, used / total));
            this.totalLabel = `of ${trimNum(total)} ${this.unit}`;
            const remaining = Math.max(0, total - used);
            this.remainingLabel = used >= total
                ? `${trimNum(used - total)} ${this.unit} over`
                : `${trimNum(remaining)} ${this.unit} left`;
            this.hasRemaining = true;
            const drawn = (TRACK_LENGTH * frac).toFixed(2);
            this.valueDash = `${drawn} 100`;
            const over = used >= total;
            const warn = frac >= 0.8;
            this.gaugeClass = `asa-du-gauge ${over ? 'is-over' : warn ? 'is-warn' : 'is-ok'}`;
        }

        this.buildBreakdown(source.categories);

        this.note = source.note ? String(source.note).trim() : '';
        this.hasNote = !!this.note;
        this.noteClass = this.gaugeClass.includes('is-over')
            ? 'asa-du-note is-over'
            : this.gaugeClass.includes('is-warn')
                ? 'asa-du-note is-warn'
                : 'asa-du-note';

        this.submitText = source.submitText ? String(source.submitText).trim() : '';
        this.hasSubmit = !!this.submitText;
        this.submitValue = source.submitValue ? String(source.submitValue).trim() : this.submitText;
    }

    buildBreakdown(categories) {
        const list = Array.isArray(categories)
            ? categories.filter((c) => c && c.label && num(c.amount) !== null && num(c.amount) > 0)
            : [];
        if (!list.length) {
            this.segments = [];
            this.legend = [];
            this.hasBreakdown = false;
            return;
        }
        const sum = list.reduce((acc, c) => acc + num(c.amount), 0) || 1;
        this.segments = list.map((c, i) => {
            const color = c.color ? String(c.color).trim() : CATEGORY_COLORS[i % CATEGORY_COLORS.length];
            const pct = Math.max(2, (num(c.amount) / sum) * 100);
            return {
                key: `seg-${i}`,
                style: `width:${pct.toFixed(2)}%;background:${color};`
            };
        });
        this.legend = list.map((c, i) => {
            const color = c.color ? String(c.color).trim() : CATEGORY_COLORS[i % CATEGORY_COLORS.length];
            return {
                key: `leg-${i}`,
                label: String(c.label).trim(),
                amount: `${trimNum(num(c.amount))} ${this.unit}`,
                dotStyle: `background:${color};`
            };
        });
        this.hasBreakdown = true;
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
                    .then(() => console.log('AsaTmcDataUsage sent:', message))
                    .catch((err) => console.error('AsaTmcDataUsage send error:', err));
            } else {
                console.log('AsaTmcDataUsage: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaTmcDataUsage sendMessage error:', err);
        }
    }
}