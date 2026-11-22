/**
 * @description Agentforce Coworker · Service · CSAT pulse renderer.
 * A satisfaction pulse rebuilt to a premium standard: a precise semicircular arc gauge
 * (score of max, colored by threshold) with an end marker and a split delta, a refined
 * trend sparkline (round HTML end-dot), a hairline-divided stat strip derived from the
 * meta line, and an editorial verbatim table (typographic theme tag, SVG star rating,
 * click-to-expand). Display-only.
 *
 * Contract: field names below MUST match genAiFunctions/ecwCsatPulse_Output_b8c0/input/schema.json.
 * Fields: score, scoreMax?, label?, deltaText?, deltaState (good|bad), metaText?,
 *   trend[number], comments[]{ text, full?, who?, caseNumber?, caseSubject?, rating?,
 *   state (good|bad), theme? }.
 */
import { LightningElement, api, track } from 'lwc';

const SEMI = 157.08; // length of the semicircle gauge path (π·50)

function num(v) {
    const n = Number(v);
    return isFinite(n) ? n : null;
}

// NEVER-BLANK GUARANTEE: mirrors the live feed shape (seed-stable names).
const TEST_DATA = {
    score: '4.6',
    scoreMax: '5',
    label: 'CSAT · last 30 days',
    deltaText: '+0.3 vs last month',
    deltaState: 'good',
    metaText: 'last 30 days · 42 responses · 88% positive',
    trend: [4.0, 4.1, 4.2, 4.1, 4.4, 4.6],
    comments: [
        { text: 'Tech resolved it the same day — great service.', full: 'Your technician diagnosed and fixed the issue on the first visit and walked our team through prevention.', who: 'Arroyo Medical Group', caseNumber: '00001074', caseSubject: 'Badge reader intermittent failure', rating: 5, state: 'good', theme: 'Speed' },
        { text: 'Clear, quick answer — very helpful.', full: 'Got a clear, well-documented answer within the hour — no back-and-forth needed.', who: 'Union Gate Apartments', caseNumber: '00001124', caseSubject: 'Camera retention policy question', rating: 5, state: 'good', theme: 'Knowledge' },
        { text: 'Still unresolved after the visit — needs follow-up.', full: 'The issue recurred the day after the visit and we are still waiting on a follow-up.', who: 'Alta Canyon Clinics', caseNumber: '00001129', caseSubject: 'Visitor kiosk check-in delay', rating: 2, state: 'bad', theme: 'Follow-up' }
    ]
};

export default class EcwCsatPulse extends LightningElement {
    @api value;

    @track score = '';
    @track scoreMax = '';
    @track label = '';
    // delta
    @track deltaValue = '';
    @track deltaRest = '';
    @track deltaClass = 'ecw-csat-delta';
    @track deltaUp = true;
    @track hasDelta = false;
    // gauge
    @track gaugeDash = `0 ${SEMI}`;
    @track gaugeClass = 'ecw-csat-arc is-good';
    @track scoreClass = 'ecw-csat-score is-good';
    @track markerX = '60';
    @track markerY = '12';
    @track markerClass = 'ecw-csat-marker is-good';
    @track hasMarker = false;
    // sparkline
    @track sparkPoints = '';
    @track sparkArea = '';
    @track sparkDotStyle = '';
    @track hasSpark = false;
    // stats + comments
    @track stats = [];
    @track comments = [];

    isTestMode = false;

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwCsatPulseJSON) {
                const data = JSON.parse(this.value.ecwCsatPulseJSON);
                if (data && typeof data === 'object' && data.score != null) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('EcwCsatPulse parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData({});
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = raw.score != null;
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.score = String(src.score);
        const scoreNum = num(src.score) || 0;
        const maxNum = num(src.scoreMax) || 5;
        this.scoreMax = src.scoreMax != null ? `/${String(src.scoreMax)}` : '';
        this.label = src.label ? String(src.label).trim() : 'CSAT';

        // Delta — split the value from its qualifier for typographic hierarchy.
        const dt = src.deltaText ? String(src.deltaText).trim() : '';
        this.hasDelta = !!dt;
        this.deltaUp = src.deltaState !== 'bad';
        const sp = dt.indexOf(' ');
        this.deltaValue = sp > 0 ? dt.slice(0, sp) : dt;
        this.deltaRest = sp > 0 ? dt.slice(sp + 1) : '';
        this.deltaClass = `ecw-csat-delta is-${this.deltaUp ? 'good' : 'bad'}`;

        // Arc gauge: fraction of max, colored by threshold, with an end marker.
        const frac = Math.max(0, Math.min(1, maxNum ? scoreNum / maxNum : 0));
        const ratioState = frac >= 0.9 ? 'good' : (frac >= 0.8 ? 'warn' : 'bad');
        this.gaugeDash = `${(frac * SEMI).toFixed(2)} ${SEMI.toFixed(2)}`;
        this.gaugeClass = `ecw-csat-arc is-${ratioState}`;
        this.scoreClass = `ecw-csat-score is-${ratioState}`;
        const theta = Math.PI * (1 - frac);
        this.markerX = (60 + 50 * Math.cos(theta)).toFixed(2);
        this.markerY = (62 - 50 * Math.sin(theta)).toFixed(2);
        this.markerClass = `ecw-csat-marker is-${ratioState}`;
        this.hasMarker = frac > 0;

        // Trend sparkline + area (end-dot is a round HTML overlay, never an SVG circle).
        const vals = (Array.isArray(src.trend) ? src.trend.map(num).filter((v) => v !== null) : []);
        if (vals.length >= 2) {
            const min = Math.min(...vals);
            const max = Math.max(...vals);
            const range = max - min || 1;
            const pts = vals.map((v, i) => {
                const x = 1 + (i / (vals.length - 1)) * 98;
                const y = 4 + (1 - (v - min) / range) * 20;
                return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
            });
            const line = pts.map((p) => `${p.x},${p.y}`).join(' ');
            this.sparkPoints = line;
            this.sparkArea = `1,30 ${line} 99,30`;
            const end = pts[pts.length - 1];
            this.sparkDotStyle = `left:${end.x}%;top:${((end.y / 32) * 100).toFixed(2)}%;`;
            this.hasSpark = true;
        }

        // Stat strip — derive discrete cells from the meta line, dropping any
        // segment already stated in the eyebrow label; split leading figure from label.
        const labelLow = this.label.toLowerCase();
        const metaRaw = src.metaText ? String(src.metaText).trim() : '';
        this.stats = metaRaw
            .split(/[·•|]/)
            .map((s) => s.trim())
            .filter(Boolean)
            .filter((s) => !labelLow.includes(s.toLowerCase()))
            .map((s, i) => {
                const m = s.match(/^([\d.,%+-]+)\s*(.*)$/);
                return { key: `st-${i}`, hasNum: !!(m && m[1]), num: m ? m[1] : '', text: m && m[2] ? m[2] : (m ? '' : s) };
            });

        const list = Array.isArray(src.comments) ? src.comments.filter((c) => c && c.text) : [];
        this.comments = list.map((c, i) => {
            const rating = num(c.rating);
            const caseRef = [c.caseNumber, c.caseSubject].filter((x) => x && String(x).trim()).join(' · ');
            const bad = c.state === 'bad';
            const theme = c.theme ? String(c.theme).trim() : (bad ? 'Follow-up' : 'Positive');
            const r = rating !== null ? Math.round(rating) : 0;
            const stars = [1, 2, 3, 4, 5].map((n) => ({ key: `s-${i}-${n}`, cls: `ecw-csat-star${n <= r ? ' is-on' : ''}` }));
            return {
                key: `cm-${i}`,
                text: String(c.text).trim(),
                full: c.full ? String(c.full).trim() : '',
                hasFull: !!(c.full && String(c.full).trim()),
                who: c.who ? String(c.who).trim() : '',
                hasWho: !!(c.who && String(c.who).trim()),
                caseRef: caseRef,
                hasCaseRef: !!caseRef,
                theme,
                themeClass: `ecw-csat-theme is-${bad ? 'bad' : 'good'}`,
                stars,
                hasRating: rating !== null,
                expanded: false,
                rowClass: 'ecw-csat-row',
                railClass: `ecw-csat-rail is-${bad ? 'bad' : 'good'}`,
                caretClass: 'ecw-csat-caret'
            };
        });
    }

    toggleComment(event) {
        const key = event.currentTarget.dataset.key;
        this.comments = this.comments.map((c) =>
            c.key === key
                ? { ...c, expanded: !c.expanded, rowClass: `ecw-csat-row${!c.expanded ? ' is-open' : ''}`, caretClass: `ecw-csat-caret${!c.expanded ? ' is-open' : ''}` }
                : c
        );
    }

    get hasStats() { return this.stats.length > 0; }
    get hasComments() { return this.comments.length > 0; }
}
