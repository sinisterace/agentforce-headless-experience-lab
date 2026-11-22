/**
 * @description Agentforce Coworker · Sales · My pipeline renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a sales-pipeline snapshot: a lightly-tinted hero with
 * the one headline open-pipeline number + a quarter-over-quarter trend chip, a
 * stage breakdown drawn as one direct-labeled horizontal bar per stage
 * (sequential blue, no legend), and a 2×2 semantic stat grid.
 *
 * Contract: the field names read below MUST match the example JSON + rules in
 * genAiFunctions/ecwSalesPipeline_Output_a1f7/input/schema.json.
 * Fields: title?, periodLabel?, updatedText?, currency?, openTotal?, deltaPct?,
 * deltaText?, stages[]{label,amount}, stats[]{label,value,state?}, submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

// Sequential Coworker-blue ramp (deep → light), stepped by stage ORDER so the
// funnel leads with the deepest, boldest band and lightens toward the close.
// Single-hue: stage identity rides on the row label + value, so color never has
// to be told apart (colorblind-safe, no legend).
const PIPE_RAMP = ['#0b5cae', '#1372cf', '#2f8aed', '#5aa6f5', '#86c0fa', '#a9d3fd'];

function num(v) {
    const n = Number(v);
    return isFinite(n) ? n : null;
}

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const TEST_DATA = {
    title: 'My pipeline',
    periodLabel: 'This quarter · QTD',
    updatedText: 'Updated 2 min ago',
    currency: 'USD',
    openTotal: 1420000,
    deltaPct: 8,
    deltaText: 'vs last quarter',
    stages: [
        { label: 'Prospecting', amount: 420000 },
        { label: 'Qualification', amount: 380000 },
        { label: 'Proposal', amount: 350000 },
        { label: 'Negotiation', amount: 270000 },
    ],
    stats: [
        { label: 'Open opportunities', value: '12' },
        { label: 'Closing this month', value: '$320K' },
        { label: 'Win rate (QTD)', value: '34%', state: 'good' },
        { label: 'Avg deal size', value: '$118K' },
    ],
    submitText: 'Open in CRM',
};

export default class EcwSalesPipeline extends LightningElement {
    @api value; // Receives the EcwSalesPipelineData object from the Lightning Type.

    @track title = 'My pipeline';
    @track periodLabel = '';
    @track updatedText = '';
    @track hasUpdated = false;
    @track heroValue = '';
    @track hasHero = false;
    @track hasDelta = false;
    @track deltaClass = 'ecw-pipe-delta';
    @track deltaArrow = '';
    @track deltaLabel = '';
    @track stages = [];
    @track stats = [];
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
            if (this.value && this.value.ecwSalesPipelineJSON) {
                const data = JSON.parse(this.value.ecwSalesPipelineJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('EcwSalesPipeline parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData({});
    }

    isUsable(data) {
        return data && typeof data === 'object';
    }

    money(amount, maxFractionDigits) {
        const n = Number(amount);
        if (!isFinite(n)) return '';
        const frac = maxFractionDigits == null ? 0 : maxFractionDigits;
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: this.currency || 'USD', maximumFractionDigits: frac }).format(n);
        } catch (e) {
            return `${this.currency || 'USD'} ${n.toFixed(frac)}`;
        }
    }

    // 1_420_000 → "$1.42M", 320000 → "$320K". Non-USD falls back to full money().
    compactMoney(amount) {
        const n = Number(amount);
        if (!isFinite(n)) return '';
        if (this.currency && this.currency !== 'USD') return this.money(n, 0);
        const abs = Math.abs(n);
        const sign = n < 0 ? '-' : '';
        const strip = (v) => String(Number(v.toFixed(2)));
        if (abs >= 1e9) return `${sign}$${strip(abs / 1e9)}B`;
        if (abs >= 1e6) return `${sign}$${strip(abs / 1e6)}M`;
        if (abs >= 1e3) return `${sign}$${Math.round(abs / 1e3)}K`;
        return this.money(n, 0);
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = !!(num(raw.openTotal) !== null
            || (Array.isArray(raw.stages) && raw.stages.length)
            || (Array.isArray(raw.stats) && raw.stats.length));
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.currency = src.currency ? String(src.currency).trim() : 'USD';
        this.title = (src.title && String(src.title).trim()) || 'My pipeline';
        this.periodLabel = src.periodLabel ? String(src.periodLabel).trim() : '';
        this.updatedText = src.updatedText ? String(src.updatedText).trim() : '';
        this.hasUpdated = !!this.updatedText;

        const open = num(src.openTotal);
        this.hasHero = open !== null;
        this.heroValue = this.hasHero ? this.compactMoney(open) : '';

        const dp = num(src.deltaPct);
        this.hasDelta = dp !== null;
        if (this.hasDelta) {
            const up = dp >= 0;
            this.deltaClass = `ecw-pipe-delta ${up ? 'is-up' : 'is-down'}`;
            this.deltaArrow = up ? '↗' : '↘';
            const words = src.deltaText ? String(src.deltaText).trim() : 'vs last quarter';
            this.deltaLabel = `${Math.abs(dp)}% ${words}`;
        }

        // Stage breakdown → one direct-labeled horizontal bar per stage.
        // Width is each stage's share of the LARGEST stage (common baseline, so
        // magnitudes compare directly); color steps along the ramp in order.
        const rawStages = (Array.isArray(src.stages) ? src.stages : []).filter((s) => s && s.label && num(s.amount) !== null);
        const maxAmt = rawStages.reduce((m, s) => Math.max(m, num(s.amount)), 0) || 1;
        this.stages = rawStages.map((s, i) => {
            const amt = num(s.amount);
            const color = PIPE_RAMP[Math.min(i, PIPE_RAMP.length - 1)];
            const pct = Math.max(6, Math.round((amt / maxAmt) * 100));
            return {
                key: `st-${i}`,
                label: String(s.label).trim(),
                amountText: this.money(amt, 0),
                fillStyle: `width:${pct}%;background:${color};`,
            };
        });

        // 2×2 semantic stat tiles
        const rawStats = (Array.isArray(src.stats) ? src.stats : []).filter((s) => s && s.label);
        this.stats = rawStats.map((s, i) => {
            const state = (s.state === 'good' || s.state === 'warn' || s.state === 'bad') ? s.state : 'neutral';
            return {
                key: `stat-${i}`,
                label: String(s.label).trim(),
                value: s.value != null ? String(s.value) : '',
                tileClass: `ecw-pipe-tile is-${state}`,
            };
        });

        this.submitText = src.submitText ? String(src.submitText).trim() : '';
        this.submitValue = src.submitValue ? String(src.submitValue).trim() : '';
    }

    get hasStages() { return this.stages.length > 0; }
    get hasStats() { return this.stats.length > 0; }
    get hasSubmit() { return !!this.submitText; }

    handleSubmit() {
        const message = this.submitValue || this.submitText || 'Open in CRM';
        this.sendMessage(message);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('EcwSalesPipeline sent:', message))
                    .catch((err) => console.error('EcwSalesPipeline send error:', err));
            } else {
                console.log('EcwSalesPipeline: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('EcwSalesPipeline sendMessage error:', err);
        }
    }
}