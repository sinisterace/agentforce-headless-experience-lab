/**
 * @description Agentforce Coworker · IT · System status renderer.
 * Adopts the ASA Energy & Utilities design language: a projected-readout hero
 * (30-day uptime), a status-mix meter, a real SVG vertical column chart of
 * per-service uptime on a labeled flat baseline (zoomed 95–100% so differences
 * read), and a hairline legend of services with exact uptime and any incident note.
 *
 * Contract: field names below MUST match genAiFunctions/ecwSystemStatus_Output_c1d2/input/schema.json.
 * Fields: overall (operational|degraded|down), headline?, opsText?, overallUptime?,
 *   services[]{ name, state, uptime?, note? }.
 */
import { LightningElement, api, track } from 'lwc';

const STATE_LABEL = { operational: 'Operational', degraded: 'Degraded', down: 'Down' };
const STATE_ORDER = ['operational', 'degraded', 'down'];

// NEVER-BLANK GUARANTEE: themed sample (seed-stable, no org-specific content).
const TEST_DATA = {
    overall: 'degraded', headline: '1 service degraded', opsText: '7 of 8 operational', overallUptime: '99.7%',
    services: [
        { name: 'Email & Calendar', state: 'operational', uptime: '99.99%' },
        { name: 'VPN / Remote Access', state: 'operational', uptime: '99.97%' },
        { name: 'Salesforce CRM', state: 'operational', uptime: '100%' },
        { name: 'Badge Access System', state: 'degraded', uptime: '98.2%', note: 'Intermittent reader timeouts at HQ east entrance. Engineering is rolling out a firmware fix.' },
        { name: 'Camera Cloud', state: 'operational', uptime: '99.95%' },
        { name: 'Visitor Kiosk Platform', state: 'operational', uptime: '99.98%' },
        { name: 'Workday / HR', state: 'operational', uptime: '99.99%' },
        { name: 'Wi-Fi (HQ)', state: 'operational', uptime: '99.9%' }
    ]
};

// Chart geometry (viewBox units). Zoomed uptime axis so 95–100% fills the plot.
const AXIS_MIN = 95;
const AXIS_MAX = 100;
const STEP = 34;      // horizontal space per column
const BAR_W = 20;     // bar width
const CHART_TOP = 8;  // top padding (100% line)
const CHART_H = 78;   // plot height
const BASELINE_Y = CHART_TOP + CHART_H;
const LABEL_Y = BASELINE_Y + 13;
const VAL_Y = LABEL_Y + 10;

function parsePct(v) {
    if (v === null || v === undefined) return null;
    const n = Number(String(v).replace(/[^0-9.]/g, ''));
    return isFinite(n) ? n : null;
}

// Compact label for a column: acronym of capitalized words, else first token.
function abbrev(name) {
    const clean = String(name || '').trim();
    const left = clean.split(/[\/|]/)[0].trim(); // part before a slash
    const words = left.split(/[\s&]+/).filter(Boolean);
    if (words.length >= 2) {
        const ac = words.map((w) => w[0]).join('').toUpperCase().slice(0, 4);
        if (ac.length >= 2) return ac;
    }
    return (words[0] || clean).slice(0, 5);
}

export default class EcwSystemStatus extends LightningElement {
    @api value;

    @track title = 'System status';
    @track cycleText = '';
    @track overallUptime = '';
    @track hasUptime = false;
    @track monitoredText = '';
    @track overallLabel = '';
    @track chipClass = 'ecw-ss-chip is-operational';

    @track mix = [];
    @track mixCaption = '';

    @track columns = [];
    @track gridLineY = CHART_TOP;
    @track baselineY = BASELINE_Y;
    @track chartW = STEP;
    @track viewBox = `0 0 ${STEP} ${VAL_Y + 2}`;
    @track axisText = `${AXIS_MIN}–${AXIS_MAX}%`;

    @track legend = [];

    isTestMode = false;

    connectedCallback() { if (!this.tryLoadFromFlow()) this.initializeFromData({}); }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwSystemStatusJSON) {
                const data = JSON.parse(this.value.ecwSystemStatusJSON);
                if (data && typeof data === 'object' && Array.isArray(data.services)) { this.initializeFromData(data); return true; }
            }
        } catch (e) { console.error('EcwSystemStatus parse error:', e.message); }
        return false;
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = Array.isArray(raw.services) && raw.services.length > 0;
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        const overall = STATE_ORDER.includes(src.overall) ? src.overall : 'operational';
        this.overallLabel = STATE_LABEL[overall];
        this.chipClass = `ecw-ss-chip is-${overall}`;

        const services = (Array.isArray(src.services) ? src.services : [])
            .filter((s) => s && s.name)
            .map((s) => {
                const state = STATE_ORDER.includes(s.state) ? s.state : 'operational';
                return {
                    name: String(s.name).trim(),
                    state,
                    uptime: s.uptime ? String(s.uptime).trim() : '',
                    pct: parsePct(s.uptime),
                    note: s.note ? String(s.note).trim() : ''
                };
            });

        // Hero
        this.overallUptime = src.overallUptime ? String(src.overallUptime).trim() : '';
        this.hasUptime = !!this.overallUptime;
        const total = services.length;
        this.monitoredText = total
            ? `${total} ${total === 1 ? 'service' : 'services'} monitored`
            : (src.headline ? String(src.headline).trim() : '');
        this.cycleText = src.opsText ? String(src.opsText).trim() : (src.headline ? String(src.headline).trim() : '');

        // Status-mix meter
        const counts = { operational: 0, degraded: 0, down: 0 };
        services.forEach((s) => { counts[s.state] += 1; });
        const denom = total || 1;
        this.mix = STATE_ORDER
            .filter((k) => counts[k] > 0)
            .map((k) => ({ key: `mix-${k}`, cls: `ecw-ss-mix-seg is-${k}`, style: `width:${(counts[k] / denom) * 100}%;` }));
        this.mixCaption = STATE_ORDER
            .filter((k) => counts[k] > 0)
            .map((k) => `${counts[k]} ${k}`)
            .join(' · ');

        // SVG column chart (only services with a parseable uptime)
        const cols = services.filter((s) => s.pct !== null);
        const n = cols.length;
        const vbW = Math.max(n * STEP, STEP);
        this.chartW = vbW;
        this.gridLineY = CHART_TOP;
        this.baselineY = BASELINE_Y;
        this.viewBox = `0 0 ${vbW} ${VAL_Y + 2}`;
        this.columns = cols.map((s, i) => {
            const frac = Math.min(1, Math.max(0, (s.pct - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)));
            const h = Math.max(3, Math.round(frac * CHART_H));
            const x = i * STEP + (STEP - BAR_W) / 2;
            const cx = i * STEP + STEP / 2;
            const valText = Number.isInteger(s.pct) ? `${s.pct}` : `${s.pct}`;
            return {
                key: `col-${i}`,
                x, y: BASELINE_Y - h, w: BAR_W, h,
                barClass: `ecw-ss-bar is-${s.state}`,
                cx,
                label: abbrev(s.name),
                labelY: LABEL_Y,
                valText,
                valY: VAL_Y
            };
        });

        // Legend — per service, full name + exact uptime + any note
        this.legend = services.map((s, i) => ({
            key: `leg-${i}`,
            dotClass: `ecw-ss-leg-dot is-${s.state}`,
            name: s.name,
            uptime: s.uptime || '—',
            note: s.note,
            hasNote: !!s.note
        }));
    }

    get hasMix() { return this.mix.length > 0; }
    get hasColumns() { return this.columns.length > 0; }
    get hasLegend() { return this.legend.length > 0; }
    get hasMonitored() { return !!this.monitoredText; }
    get hasCycle() { return !!this.cycleText; }
}
