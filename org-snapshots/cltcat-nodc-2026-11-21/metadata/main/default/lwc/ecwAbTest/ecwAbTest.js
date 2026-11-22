/**
 * @description Agentforce Coworker · Marketing · A/B test showdown.
 * A head-to-head A vs B comparison: each variant's creative preview + sent count, a
 * metric LENS (open rate / CTR / conversion / revenue) that re-duels the two variants
 * live, a statistical-confidence meter, and an animated winner reveal with lift +
 * projected impact. All interaction is local UI state (no agent round-trip).
 *
 * Contract: field names MUST match genAiFunctions/ecwAbTest_Output_m3c3/input/schema.json.
 * Fields: title?, testName, audience?, variants[]{ key, name, preview, sent (number),
 *   openRate (number %), ctr (number %), convRate (number %), revenue (number) },
 *   confidence (number 0-100), winner (A|B), lift?, projected?.
 */
import { LightningElement, api, track } from 'lwc';

const METRICS = [
    { key: 'openRate', label: 'Open rate', kind: 'pct' },
    { key: 'ctr', label: 'Click-through', kind: 'pct' },
    { key: 'convRate', label: 'Conversion', kind: 'pct' },
    { key: 'revenue', label: 'Revenue', kind: 'money' }
];

function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }
function pct(v) { const n = num(v); return (Math.round(n * 10) / 10) + '%'; }
function money(v) {
    const a = Math.abs(num(v));
    if (a >= 1e6) return '$' + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M';
    if (a >= 1e3) return '$' + Math.round(a / 1e3) + 'K';
    return '$' + Math.round(a);
}
function fmt(kind, v) { return kind === 'money' ? money(v) : pct(v); }
function sentFmt(v) {
    const n = num(v);
    return (n >= 1000 ? (Math.round(n / 100) / 10) + 'K' : String(n)) + ' sent';
}

const TEST_DATA = {
    title: 'A/B test results',
    testName: 'Nurture email — subject line',
    audience: '18,400 sent · 50/50 split',
    variants: [
        { key: 'A', name: 'Variant A', preview: 'Your Q2 playbook is ready', sent: 9200, openRate: 41, ctr: 3.2, convRate: 1.1, revenue: 28000 },
        { key: 'B', name: 'Variant B', preview: '3 moves to hit Q2 — inside', sent: 9200, openRate: 44, ctr: 5.1, convRate: 1.8, revenue: 46000 }
    ],
    confidence: 97,
    winner: 'B',
    lift: '+59% CTR',
    projected: '+$18K/qtr'
};

export default class EcwAbTest extends LightningElement {
    @api value;

    @track title = '';
    @track testName = '';
    @track audience = '';
    @track hasAudience = false;
    @track metricLabel = '';
    @track tabs = [];
    @track variants = [];
    @track compareText = '';
    @track confidence = 0;
    @track confFillStyle = 'width:0%;';
    @track confFillClass = 'ecw-ab-conf-fill';
    @track confText = '';
    @track confNote = '';
    @track confNoteClass = 'ecw-ab-conf-note';
    @track winnerName = '';
    @track lift = '';
    @track projected = '';
    @track hasWinner = false;

    isTestMode = false;
    raw = [];
    winnerKey = '';
    selectedKey = 'ctr';

    connectedCallback() { if (!this.tryLoadFromFlow()) this.initializeFromData({}); }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwAbTestJSON) {
                const data = JSON.parse(this.value.ecwAbTestJSON);
                if (data && typeof data === 'object' && Array.isArray(data.variants)) { this.initializeFromData(data); return true; }
            }
        } catch (e) { console.error('EcwAbTest parse error:', e.message); }
        return false;
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = Array.isArray(raw.variants) && raw.variants.length >= 2;
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.title = src.title ? String(src.title).trim() : 'A/B test results';
        this.testName = src.testName ? String(src.testName).trim() : '';
        this.audience = src.audience ? String(src.audience).trim() : '';
        this.hasAudience = !!this.audience;

        this.raw = (Array.isArray(src.variants) ? src.variants : []).slice(0, 2).map((v, i) => ({
            key: v.key ? String(v.key).trim() : (i === 0 ? 'A' : 'B'),
            name: v.name ? String(v.name).trim() : `Variant ${i === 0 ? 'A' : 'B'}`,
            preview: v.preview ? String(v.preview).trim() : '',
            sent: num(v.sent),
            openRate: num(v.openRate), ctr: num(v.ctr), convRate: num(v.convRate), revenue: num(v.revenue)
        }));

        this.winnerKey = (src.winner && String(src.winner).trim()) || this.computeWinnerKey();
        const w = this.raw.find((v) => v.key === this.winnerKey);
        this.winnerName = w ? w.name : '';
        this.hasWinner = !!w;
        this.lift = src.lift ? String(src.lift).trim() : '';
        this.projected = src.projected ? String(src.projected).trim() : '';

        this.confidence = Math.max(0, Math.min(100, Math.round(num(src.confidence))));
        const sig = this.confidence >= 95;
        this.confFillStyle = `width:${this.confidence}%;`;
        this.confFillClass = `ecw-ab-conf-fill${sig ? ' is-sig' : ''}`;
        this.confText = `${this.confidence}% confidence`;
        this.confNote = sig ? 'Statistically significant' : (this.confidence >= 90 ? 'Approaching significance' : 'Not yet significant');
        this.confNoteClass = `ecw-ab-conf-note${sig ? ' is-sig' : ''}`;

        this.recompute();
    }

    computeWinnerKey() {
        if (this.raw.length < 2) return 'A';
        return this.raw[1].convRate > this.raw[0].convRate ? this.raw[1].key : this.raw[0].key;
    }

    recompute() {
        const metric = METRICS.find((m) => m.key === this.selectedKey) || METRICS[1];
        this.metricLabel = metric.label;
        this.tabs = METRICS.map((m) => ({
            key: m.key, label: m.label,
            cls: `ecw-ab-tab${m.key === this.selectedKey ? ' is-active' : ''}`
        }));

        const vals = this.raw.map((v) => num(v[metric.key]));
        const max = Math.max(...vals, 0) || 1;
        const leaderKey = vals[1] > vals[0] ? this.raw[1].key : this.raw[0].key;

        this.variants = this.raw.map((v, i) => {
            const val = vals[i];
            const isLeader = v.key === leaderKey;
            const isWinner = v.key === this.winnerKey;
            return {
                key: v.key, name: v.name, preview: v.preview, hasPreview: !!v.preview,
                sentText: sentFmt(v.sent),
                valText: fmt(metric.kind, val),
                barStyle: `width:${Math.max(4, Math.round((val / max) * 100))}%;`,
                barClass: `ecw-ab-bar-fill${isLeader ? ' is-leader' : ''}`,
                cardClass: `ecw-ab-variant${isWinner ? ' is-winner' : ''}`,
                valClass: `ecw-ab-val${isLeader ? ' is-leader' : ''}`
            };
        });

        // Relative lift of leader over the other, on the selected metric.
        const lo = Math.min(...vals), hi = Math.max(...vals);
        const leader = this.raw.find((v) => v.key === leaderKey);
        if (lo > 0 && hi !== lo && leader) {
            const relative = Math.round(((hi - lo) / lo) * 100);
            this.compareText = `${leader.name} leads on ${metric.label.toLowerCase()} by ${relative}%`;
        } else if (hi === lo) {
            this.compareText = `Even on ${metric.label.toLowerCase()}`;
        } else {
            this.compareText = `${leader ? leader.name : ''} leads on ${metric.label.toLowerCase()}`;
        }
    }

    handleLens(event) {
        const key = event.currentTarget.dataset.key;
        if (key && key !== this.selectedKey) { this.selectedKey = key; this.recompute(); }
    }

    get hasVariants() { return this.variants.length >= 2; }
}