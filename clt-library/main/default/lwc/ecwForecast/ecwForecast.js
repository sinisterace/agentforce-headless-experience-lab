/**
 * @description Agentforce Coworker · Sales · Forecast renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders forecast coverage in the Energy & Utilities design
 * language: a projected-attainment readout (monospace committed figure + a
 * coverage chip), a vertical SVG column chart of the confidence tiers over a
 * hairline baseline, and a segmented coverage meter with a hairline legend.
 *
 * Contract: field names below MUST match genAiFunctions/ecwForecast_Output_c3d5/input/schema.json.
 * Fields: currency?, committed? (number), total? (number),
 *   tiers[]{ label, amount (number), state (closed|commit|best|pipeline) }.
 */
import { LightningElement, api, track } from 'lwc';

// Warm confidence ramp (stone + amber system): banked (green) → committed
// (deep amber) → best case (amber accent) → pipeline (soft sand).
const TIER_COLOR = {
    closed: '#15803d',
    commit: '#b45309',
    best: '#d97706',
    pipeline: '#e3c08a'
};
const DEFAULT_COLOR = '#d6ccbf';

// SVG column-chart geometry (user units; the viewBox scales to the card width).
const VB_W = 320;
const VB_H = 132;
const PAD_X = 6;
const TOP = 20; // headroom for the value labels above each column
const BASE_Y = 108; // hairline baseline
const LABEL_Y = 124; // tier labels under the baseline

function num(v) {
    const n = Number(v);
    return isFinite(n) ? n : null;
}

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const TEST_DATA = {
    currency: 'USD',
    committed: 1850000,
    total: 4120000,
    tiers: [
        { label: 'Closed', amount: 620000, state: 'closed' },
        { label: 'Commit', amount: 1230000, state: 'commit' },
        { label: 'Best case', amount: 980000, state: 'best' },
        { label: 'Pipeline', amount: 1290000, state: 'pipeline' }
    ]
};

export default class EcwForecast extends LightningElement {
    @api value; // Receives the EcwForecastData object from the Lightning Type.

    @track heroValue = '';
    @track hasHero = false;
    @track summaryText = '';
    @track coverageText = '';
    @track hasCoverage = false;
    @track coverageClass = 'ecw-fc-cov';
    @track columns = [];
    @track baseLineY = BASE_Y;
    @track viewBox = `0 0 ${VB_W} ${VB_H}`;
    @track segments = [];
    @track legend = [];

    isTestMode = false;
    currency = 'USD';

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwForecastJSON) {
                const data = JSON.parse(this.value.ecwForecastJSON);
                if (data && typeof data === 'object') {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('EcwForecast parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData({});
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
        const hasContent = Array.isArray(raw.tiers) && raw.tiers.length > 0;
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.currency = src.currency ? String(src.currency).trim() : 'USD';

        const tiers = (Array.isArray(src.tiers) ? src.tiers : []).filter((t) => t && t.label);
        const total = num(src.total) || tiers.reduce((a, t) => a + (num(t.amount) || 0), 0);
        const committed = num(src.committed);

        // Hero readout: committed figure + coverage of total forecast.
        this.hasHero = committed !== null;
        this.heroValue = this.hasHero ? this.compactMoney(committed) : '';
        this.summaryText = total ? `of ${this.compactMoney(total)} forecast` : '';
        if (this.hasHero && total) {
            const cov = Math.round((committed / total) * 100);
            this.hasCoverage = true;
            this.coverageText = `${cov}% covered`;
            this.coverageClass = `ecw-fc-cov ${cov >= 50 ? 'is-strong' : 'is-soft'}`;
        }

        const denom = total || 1;
        const maxAmt = tiers.reduce((m, t) => Math.max(m, num(t.amount) || 0), 0) || 1;
        const n = tiers.length || 1;
        const slot = (VB_W - PAD_X * 2) / n;
        const barW = Math.min(44, slot * 0.56);
        const area = BASE_Y - TOP;

        // SVG column chart — one column per confidence tier.
        this.columns = tiers.map((t, i) => {
            const amt = num(t.amount) || 0;
            const color = TIER_COLOR[t.state] || DEFAULT_COLOR;
            const h = Math.max(2, (amt / maxAmt) * area);
            const cx = PAD_X + slot * i + slot / 2;
            const x = cx - barW / 2;
            const y = BASE_Y - h;
            return {
                key: `col-${i}`,
                x, y, barW, h, color,
                cx,
                valueText: this.compactMoney(amt),
                valueY: y - 5,
                label: String(t.label).trim(),
                labelY: LABEL_Y
            };
        });

        // Segmented coverage meter + hairline legend (tier share of total).
        this.segments = tiers
            .filter((t) => (num(t.amount) || 0) > 0)
            .map((t, i) => {
                const amt = num(t.amount) || 0;
                const color = TIER_COLOR[t.state] || DEFAULT_COLOR;
                return { key: `seg-${i}`, segStyle: `width:${Math.max(2, Math.round((amt / denom) * 100))}%;background:${color};` };
            });

        this.legend = tiers.map((t, i) => {
            const amt = num(t.amount) || 0;
            const pct = Math.round((amt / denom) * 100);
            return {
                key: `leg-${i}`,
                label: String(t.label).trim(),
                amountText: this.compactMoney(amt),
                pctText: `${pct}%`,
                dotStyle: `background:${TIER_COLOR[t.state] || DEFAULT_COLOR};`
            };
        });
    }

    get hasColumns() { return this.columns.length > 0; }
    get hasBar() { return this.segments.length > 0; }
}
