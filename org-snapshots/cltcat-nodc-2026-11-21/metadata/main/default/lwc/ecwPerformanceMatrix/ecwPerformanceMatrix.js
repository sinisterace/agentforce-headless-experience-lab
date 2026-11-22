/**
 * @description Agentforce Coworker · Marketing · Performance matrix.
 * A strategy quadrant: each content asset is a bubble placed by reach (x) and
 * engagement rate (y) and sized by conversions, over four quadrants — Scale /
 * Optimize / Test / Cut. Hover, focus, or tap a bubble to reveal its metrics; tap
 * to pin. Display-only; all interaction is local UI state.
 *
 * Bubbles are positioned with CSS percentages inside a relative plot box and sized
 * in rem, so they stay perfectly round (no stretched-SVG distortion).
 *
 * Contract: field names below MUST match genAiFunctions/ecwPerformanceMatrix_Output_m3n5/input/schema.json.
 * Fields: title?, xLabel?, yLabel?, items[]{ name, type?, reach (number), engagement (0-100),
 *   conversions (number), trend (up|down|flat) }.
 */
import { LightningElement, api, track } from 'lwc';

const QUAD = {
    scale: { label: 'Scale', cls: 'is-scale' },
    optimize: { label: 'Optimize', cls: 'is-optimize' },
    test: { label: 'Test', cls: 'is-test' },
    cut: { label: 'Cut', cls: 'is-cut' }
};

function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }
function compact(n) {
    const a = Math.abs(num(n));
    if (a >= 1e6) return `${Math.round(a / 1e5) / 10}M`;
    if (a >= 1e3) return `${Math.round(a / 1e2) / 10}K`;
    return `${Math.round(a)}`;
}

const TEST_DATA = {
    title: 'Content performance', xLabel: 'Reach', yLabel: 'Engagement rate',
    items: [
        { name: 'Product launch webinar', type: 'Webinar', reach: 48000, engagement: 62, conversions: 540, trend: 'up' },
        { name: 'ROI calculator', type: 'Tool', reach: 31000, engagement: 74, conversions: 880, trend: 'up' },
        { name: 'State of the industry report', type: 'Ebook', reach: 72000, engagement: 28, conversions: 210, trend: 'down' },
        { name: 'Weekly newsletter', type: 'Email', reach: 96000, engagement: 41, conversions: 320, trend: 'flat' },
        { name: 'Customer story: Northwind', type: 'Blog', reach: 12000, engagement: 58, conversions: 190, trend: 'up' },
        { name: 'Paid retargeting set', type: 'Ad', reach: 54000, engagement: 22, conversions: 140, trend: 'down' }
    ]
};

export default class EcwPerformanceMatrix extends LightningElement {
    @api value;

    @track title = '';
    @track xLabel = 'Reach';
    @track yLabel = 'Engagement rate';
    @track bubbles = [];
    @track heroStandout = '';
    @track countText = '';
    @track activeKey = '';

    isTestMode = false;
    rawItems = [];
    pinnedKey = '';

    connectedCallback() { if (!this.tryLoadFromFlow()) this.initializeFromData({}); }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwPerformanceMatrixJSON) {
                const data = JSON.parse(this.value.ecwPerformanceMatrixJSON);
                if (data && typeof data === 'object' && Array.isArray(data.items)) { this.initializeFromData(data); return true; }
            }
        } catch (e) { console.error('EcwPerformanceMatrix parse error:', e.message); }
        return false;
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = Array.isArray(raw.items) && raw.items.length > 0;
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.title = src.title ? String(src.title).trim() : 'Performance matrix';
        this.xLabel = src.xLabel ? String(src.xLabel).trim() : 'Reach';
        this.yLabel = src.yLabel ? String(src.yLabel).trim() : 'Engagement rate';

        const items = (Array.isArray(src.items) ? src.items : []).filter((i) => i && i.name);
        const maxReach = Math.max(1, ...items.map((i) => num(i.reach)));
        const maxConv = Math.max(1, ...items.map((i) => num(i.conversions)));
        const totalConv = items.reduce((a, i) => a + num(i.conversions), 0) || 1;

        this.rawItems = items.map((i, idx) => {
            const reach = num(i.reach), eng = Math.max(0, Math.min(100, num(i.engagement))), conv = num(i.conversions);
            const reachHigh = reach >= maxReach * 0.5;
            const engHigh = eng >= 50;
            const q = engHigh ? (reachHigh ? 'scale' : 'optimize') : (reachHigh ? 'test' : 'cut');
            // sqrt scale so bubble AREA tracks conversions; 1.1rem..2.9rem diameter.
            const d = 1.1 + Math.sqrt(conv / maxConv) * 1.8;
            const left = 8 + (reach / maxReach) * 84;
            const top = 8 + (1 - eng / 100) * 84;
            return {
                key: `pm-${idx}`, name: String(i.name).trim(), type: i.type ? String(i.type).trim() : '',
                reach, eng, conv, quad: q, trend: ['up', 'down', 'flat'].includes(i.trend) ? i.trend : 'flat',
                reachText: compact(reach), convText: compact(conv), engText: `${Math.round(eng)}%`,
                left, top, d
            };
        });

        const scale = this.rawItems.filter((b) => b.quad === 'scale');
        if (scale.length) {
            const pct = Math.round((scale.reduce((a, b) => a + b.conv, 0) / totalConv) * 100);
            this.heroStandout = `Scale · ${scale.length} ${scale.length === 1 ? 'asset' : 'assets'} driving ${pct}% of conversions`;
        } else {
            const top = [...this.rawItems].sort((a, b) => b.conv - a.conv)[0];
            this.heroStandout = top ? `Top converter · ${top.name}` : '';
        }
        this.countText = `${this.rawItems.length} ${this.rawItems.length === 1 ? 'asset' : 'assets'}`;
        this.activeKey = '';
        this.pinnedKey = '';
        this.recompute();
    }

    recompute() {
        this.bubbles = this.rawItems.map((b, i) => {
            const active = b.key === this.activeKey;
            const pinned = b.key === this.pinnedKey;
            return {
                ...b,
                trendUp: b.trend === 'up', trendDown: b.trend === 'down', trendFlat: b.trend === 'flat',
                bubbleClass: `ecw-pm-bubble ${QUAD[b.quad].cls}${active ? ' is-active' : ''}${pinned ? ' is-pinned' : ''}`,
                style: `left:${b.left.toFixed(2)}%;top:${b.top.toFixed(2)}%;width:${b.d.toFixed(2)}rem;height:${b.d.toFixed(2)}rem;--i:${i};`
            };
        });
    }

    get detail() {
        const key = this.activeKey || this.pinnedKey;
        const b = this.rawItems.find((x) => x.key === key);
        if (!b) return null;
        return {
            name: b.name, type: b.type, hasType: !!b.type, quadLabel: QUAD[b.quad].label,
            quadClass: `ecw-pm-detail-quad ${QUAD[b.quad].cls}`,
            reachText: b.reachText, engText: b.engText, convText: b.convText,
            trendUp: b.trend === 'up', trendDown: b.trend === 'down', trendFlat: b.trend === 'flat'
        };
    }
    get hasDetail() { return !!this.detail; }
    get hasBubbles() { return this.bubbles.length > 0; }

    handleEnter(event) { this.activeKey = event.currentTarget.dataset.key; this.recompute(); }
    handleLeave() { this.activeKey = this.pinnedKey; this.recompute(); }
    handleClick(event) {
        const key = event.currentTarget.dataset.key;
        this.pinnedKey = this.pinnedKey === key ? '' : key;
        this.activeKey = this.pinnedKey;
        this.recompute();
    }
}