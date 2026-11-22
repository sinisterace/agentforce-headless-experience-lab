/**
 * @description Agentforce Coworker · Marketing · Campaign conversion flow.
 * A conversion funnel/Sankey — Impressions → Clicks → Leads → MQLs → SQLs → Won —
 * drawn as deepening-blue bands whose width is a compressed function of volume (so the
 * tiny bottom stages stay legible), joined by tapering flow connectors. Each gap shows
 * the step-conversion %, and the single biggest leak (lowest step conversion) is called
 * out. Hovering/focusing a stage reveals its detail inline (top channel + stage metric
 * + conversion from the prior stage). Display-only; interaction is local @track state.
 *
 * Contract: field names below MUST match genAiFunctions/ecwCampaignFunnel_Output/input/schema.json.
 * Fields: title?, campaign?, periodLabel?, outcome?,
 *   stages[]{ label, count (number), topChannel?, detail? }.
 */
import { LightningElement, api, track } from 'lwc';

// Deepening Coworker-blue ramp (top deepest → light at the close), single hue so the
// funnel reads by position + label, never needing a legend.
const RAMP = ['#0b5cae', '#1372cf', '#2f8aed', '#5aa6f5', '#86c0fa', '#a9d3fd'];

function num(v) { const n = Number(v); return isFinite(n) ? n : null; }
function strip(v) { return String(Number(v)); }
function compact(n) {
    const x = Number(n);
    if (!isFinite(x)) return '';
    const a = Math.abs(x);
    if (a >= 1e6) return `${strip((x / 1e6).toFixed(2))}M`;
    if (a >= 1e3) return `${strip((x / 1e3).toFixed(1))}K`;
    return String(Math.round(x));
}

const TEST_DATA = {
    title: 'Campaign conversion',
    campaign: 'Spring Launch — Paid + Email',
    periodLabel: 'Last 30 days',
    outcome: '128 won · $512K pipeline',
    stages: [
        { label: 'Impressions', count: 1240000, topChannel: 'Paid social', detail: '$0.004 CPM' },
        { label: 'Clicks', count: 38400, topChannel: 'Paid search', detail: '3.1% CTR' },
        { label: 'Leads', count: 5120, topChannel: 'Landing pages', detail: '$9.40 CPL' },
        { label: 'MQLs', count: 1870, topChannel: 'Email nurture', detail: '49% accept' },
        { label: 'SQLs', count: 640, topChannel: 'BDR outreach', detail: '34% accept' },
        { label: 'Won', count: 128, topChannel: 'AE', detail: '$512K pipeline' }
    ]
};

export default class EcwCampaignFunnel extends LightningElement {
    @api value;

    @track title = '';
    @track campaign = '';
    @track periodLabel = '';
    @track outcome = '';
    @track hasOutcome = false;
    @track stages = [];

    rawStages = [];
    defaultKey = '';
    @track activeKey = '';

    isTestMode = false;

    connectedCallback() { if (!this.tryLoadFromFlow()) this.initializeFromData({}); }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwCampaignFunnelJSON) {
                const data = JSON.parse(this.value.ecwCampaignFunnelJSON);
                if (data && typeof data === 'object' && Array.isArray(data.stages)) { this.initializeFromData(data); return true; }
            }
        } catch (e) { console.error('EcwCampaignFunnel parse error:', e.message); }
        return false;
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = Array.isArray(raw.stages) && raw.stages.length >= 2;
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.title = src.title ? String(src.title).trim() : 'Campaign conversion';
        this.campaign = src.campaign ? String(src.campaign).trim() : '';
        this.periodLabel = src.periodLabel ? String(src.periodLabel).trim() : '';
        this.outcome = src.outcome ? String(src.outcome).trim() : '';
        this.hasOutcome = !!this.outcome;

        this.rawStages = (Array.isArray(src.stages) ? src.stages : [])
            .filter((s) => s && s.label && num(s.count) !== null)
            .map((s, i) => ({
                key: `cf-${i}`, index: i,
                label: String(s.label).trim(),
                count: num(s.count),
                topChannel: s.topChannel ? String(s.topChannel).trim() : '',
                detail: s.detail ? String(s.detail).trim() : ''
            }));

        const max = this.rawStages.reduce((m, s) => Math.max(m, s.count), 0) || 1;
        // Compressed width: power scale keeps the long tail legible (min ~22%).
        this.rawStages.forEach((s, i) => {
            const norm = s.count / max;
            s.width = Math.round((22 + 78 * Math.pow(norm, 0.32)) * 10) / 10;
            s.color = RAMP[Math.min(i, RAMP.length - 1)];
            s.conv = i === 0 ? null : s.count / this.rawStages[i - 1].count;
        });

        // Biggest leak = lowest step conversion (ignoring the first stage).
        let leakIdx = -1, leakVal = Infinity;
        this.rawStages.forEach((s, i) => { if (i > 0 && s.conv < leakVal) { leakVal = s.conv; leakIdx = i; } });
        this.leakIdx = leakIdx;
        this.defaultKey = leakIdx >= 0 ? this.rawStages[leakIdx].key : (this.rawStages[0] && this.rawStages[0].key) || '';
        this.activeKey = this.defaultKey;
        this.recompute();
    }

    recompute() {
        const n = this.rawStages.length;
        this.stages = this.rawStages.map((s, i) => {
            const next = this.rawStages[i + 1];
            const active = s.key === this.activeKey;
            // Connector below this band represents the transition into the NEXT stage.
            const connLeak = !!next && (i + 1) === this.leakIdx;
            const taperStyle = next
                ? `clip-path: polygon(0 0, ${s.width}% 0, ${next.width}% 100%, 0 100%);`
                : '';
            const convVal = next ? next.conv : null;
            return {
                key: s.key, index: s.index, label: s.label,
                countText: compact(s.count),
                bandStyle: `width:${s.width}%;background:${s.color};animation-delay:${(s.index * 0.06).toFixed(2)}s;`,
                bandClass: active ? 'ecw-cf-band is-active' : 'ecw-cf-band',
                rowClass: active ? 'ecw-cf-stage is-active' : 'ecw-cf-stage',
                hasNext: !!next,
                taperStyle,
                convText: convVal !== null ? `${(convVal * 100).toFixed(convVal < 0.1 ? 1 : 0)}% continue` : '',
                convClass: connLeak ? 'ecw-cf-conv is-leak' : 'ecw-cf-conv',
                isLeak: connLeak,
                active,
                detailText: [s.topChannel, s.detail].filter(Boolean).join(' · '),
                hasDetail: !!(s.topChannel || s.detail)
            };
        });
    }

    handleActivate(event) {
        const key = event.currentTarget.dataset.key;
        if (key && key !== this.activeKey) { this.activeKey = key; this.recompute(); }
    }
    handleReset() {
        if (this.activeKey !== this.defaultKey) { this.activeKey = this.defaultKey; this.recompute(); }
    }

    get hasStages() { return this.stages.length > 0; }
}
