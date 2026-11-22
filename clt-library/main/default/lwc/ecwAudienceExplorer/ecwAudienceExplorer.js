/**
 * @description Agentforce Coworker · Marketing · Audience builder.
 * A live-sizing segment builder: an overlapping set/Venn of the selected criteria with
 * the estimated audience counted large in the center, a reach readout, criterion toggle
 * rows, and a minimum-engagement threshold slider. Toggling a criterion or dragging the
 * slider recomputes the estimate in real time and tweens the number to its new value —
 * all client-side (no agent round-trip). Shares the ecw family look.
 *
 * Live estimate: thresholdFraction = max(0.05, 1 - (slider/100)*0.85);
 *   audience = round(baseSize * product(fraction of each ON criterion) * thresholdFraction).
 *
 * Contract: field names below MUST match genAiFunctions/ecwAudienceExplorer_Output_m4d4/input/schema.json.
 * Fields: title?, baseLabel?, baseSize (number), criteria[]{ key, label, fraction (0-1), on (bool) },
 *   threshold{ label, min (number), max (number), value (number) }.
 */
import { LightningElement, api, track } from 'lwc';

const HUES = ['#0d6fd1', '#0f766e', '#6d28d9'];

const TEST_DATA = {
    title: 'Audience builder',
    baseLabel: 'All contacts',
    baseSize: 128000,
    criteria: [
        { key: 'industry', label: 'Healthcare & public sector', fraction: 0.34, on: true },
        { key: 'engaged', label: 'Engaged in last 90 days', fraction: 0.52, on: true },
        { key: 'nurture', label: 'Not already in a nurture', fraction: 0.61, on: false }
    ],
    threshold: { label: 'Min. engagement score', min: 0, max: 100, value: 40 }
};

function num(v, d = 0) { const n = Number(v); return isFinite(n) ? n : d; }
function reduceMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
}

export default class EcwAudienceExplorer extends LightningElement {
    @api value;

    @track title = '';
    @track baseLabel = '';
    @track baseSizeText = '';
    @track criteria = [];
    @track threshold = { label: '', min: 0, max: 100, value: 40 };
    @track thresholdValText = '';
    @track displayAudience = '0';
    @track audiencePct = '0%';
    @track vennCircles = [];
    @track hasAnyOn = false;

    baseSize = 0;
    rawCriteria = [];
    _raf = null;
    _display = 0;

    connectedCallback() { if (!this.tryLoadFromFlow()) this.initializeFromData({}); }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwAudienceExplorerJSON) {
                const data = JSON.parse(this.value.ecwAudienceExplorerJSON);
                if (data && typeof data === 'object' && Array.isArray(data.criteria)) { this.initializeFromData(data); return true; }
            }
        } catch (e) { console.error('EcwAudienceExplorer parse error:', e.message); }
        return false;
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = Array.isArray(raw.criteria) && raw.criteria.length > 0;
        const src = hasContent ? raw : TEST_DATA;

        this.title = src.title ? String(src.title).trim() : 'Audience builder';
        this.baseLabel = src.baseLabel ? String(src.baseLabel).trim() : 'All contacts';
        this.baseSize = num(src.baseSize, 0);
        this.baseSizeText = this.baseSize.toLocaleString('en-US');
        const t = src.threshold || {};
        this.threshold = {
            label: t.label ? String(t.label).trim() : 'Min. engagement score',
            min: num(t.min, 0), max: num(t.max, 100), value: num(t.value, 40)
        };
        this.rawCriteria = (Array.isArray(src.criteria) ? src.criteria : []).filter((c) => c && c.label).map((c, i) => ({
            key: c.key ? String(c.key) : `cr-${i}`,
            label: String(c.label).trim(),
            fraction: Math.max(0, Math.min(1, num(c.fraction, 0.5))),
            on: c.on !== false,
            hue: HUES[i % HUES.length]
        }));
        this._display = this.targetAudience();
        this.recompute();
        this.displayAudience = Math.round(this._display).toLocaleString('en-US');
    }

    thresholdFraction() {
        return Math.max(0.05, 1 - (num(this.threshold.value) / 100) * 0.85);
    }

    targetAudience() {
        const onList = this.rawCriteria.filter((c) => c.on);
        const product = onList.reduce((a, c) => a * c.fraction, 1);
        return Math.round(this.baseSize * product * this.thresholdFraction());
    }

    recompute() {
        const onList = this.rawCriteria.filter((c) => c.on);
        this.hasAnyOn = onList.length > 0;
        this.thresholdValText = String(this.threshold.value);

        // criterion toggle rows
        this.criteria = this.rawCriteria.map((c) => ({
            key: c.key, label: c.label, on: c.on,
            switchClass: `ecw-ae-switch${c.on ? ' is-on' : ''}`,
            fracText: `${Math.round(c.fraction * 100)}%`,
            dotStyle: `background:${c.hue};`
        }));

        // venn layout for ON criteria (uniformly scaled SVG → circles stay round)
        const n = onList.length;
        const pos = {
            1: [{ cx: 60, cy: 50 }],
            2: [{ cx: 46, cy: 50 }, { cx: 74, cy: 50 }],
            3: [{ cx: 50, cy: 42 }, { cx: 70, cy: 42 }, { cx: 60, cy: 66 }]
        }[n] || [];
        this.vennCircles = onList.map((c, i) => {
            const r = 24 + 16 * c.fraction;
            const p = pos[i] || { cx: 60, cy: 50 };
            return { key: c.key, cx: p.cx, cy: p.cy, r: Math.round(r * 10) / 10, style: `fill:${c.hue};` };
        });

        const target = this.targetAudience();
        this.audiencePct = this.baseSize ? `${Math.round((target / this.baseSize) * 100)}%` : '0%';
    }

    animateTo(target) {
        if (this._raf) cancelAnimationFrame(this._raf);
        const from = this._display;
        if (reduceMotion()) { this._display = target; this.displayAudience = Math.round(target).toLocaleString('en-US'); return; }
        const start = performance.now();
        const dur = 450;
        const step = (now) => {
            const t = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - t, 3);
            this._display = from + (target - from) * eased;
            this.displayAudience = Math.round(this._display).toLocaleString('en-US');
            if (t < 1) this._raf = requestAnimationFrame(step);
        };
        this._raf = requestAnimationFrame(step);
    }

    toggleCriterion(event) {
        const key = event.currentTarget.dataset.key;
        const c = this.rawCriteria.find((x) => x.key === key);
        if (!c) return;
        c.on = !c.on;
        this.recompute();
        this.animateTo(this.targetAudience());
    }

    onSlider(event) {
        this.threshold = { ...this.threshold, value: num(event.target.value) };
        this.recompute();
        this.animateTo(this.targetAudience());
    }

    disconnectedCallback() { if (this._raf) cancelAnimationFrame(this._raf); }
}
