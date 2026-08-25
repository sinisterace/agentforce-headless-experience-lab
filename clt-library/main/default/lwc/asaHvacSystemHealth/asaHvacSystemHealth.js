/**
 * @description ASA HVAC · Comfort System Health Report renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a whole-home comfort checkup: an overall health SCORE
 * radial gauge (270° arc), per-system status rows (furnace / AC / thermostat /
 * ductwork / filter) with a colored status rail, a filter-life bar, a
 * next-maintenance callout + recommendation, and a book-maintenance CTA. Tapping
 * the CTA sends the choice back via
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * The score gauge arc uses SVG pathLength="100" so the drawn length is expressed
 * in simple 0–100 units: the 270° track is 75 units and the value arc is
 * 75 * (score/100). A rotate(135°) puts the gap at the bottom-center.
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaHvacSystemHealth_Output_c5d6/input/schema.json.
 * Fields: title?, score(number 0-100), scoreLabel?, statusText?, updatedText?,
 * systems[]{label, status(good|watch|due|fault), detail?, icon?}, filter{lifePct,
 * daysLeft?, label?}, nextServiceText?, recommendationText?, submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

const TRACK_LENGTH = 75; // 270° of a pathLength=100 circle.

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const TEST_DATA = {
    title: 'Your comfort system checkup',
    score: 82,
    scoreLabel: 'Good',
    statusText: 'One item needs attention soon',
    updatedText: 'Checked today',
    systems: [
        { label: 'Furnace', status: 'good', detail: 'Operating normally', icon: 'furnace' },
        { label: 'AC condenser', status: 'watch', detail: 'Coil could use a cleaning', icon: 'ac' },
        { label: 'Thermostat', status: 'good', detail: 'Firmware up to date', icon: 'thermostat' },
        { label: 'Air filter', status: 'due', detail: 'Replace within a week', icon: 'filter' }
    ],
    filter: { lifePct: 18, daysLeft: 6, label: '20×25×1 filter' },
    nextServiceText: 'Next maintenance due Nov 3',
    recommendationText: 'Book a tune-up to clean the AC coil before summer.',
    submitText: 'Book maintenance',
    submitValue: "I'd like to book a maintenance visit"
};

// Small 24x24 stroke glyphs per system icon (fill=none). Default = ring.
const ICON_PATHS = {
    furnace: 'M12 3c2 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 1 1 2 2 2 0-2 0-4-2-6Z',
    ac: 'M12 2v20 M2 12h20 M5 5l14 14 M19 5 5 19',
    thermostat: 'M14 4a2 2 0 0 0-4 0v9a4 4 0 1 0 4 0V4Z',
    ductwork: 'M3 8h11a3 3 0 1 0-3-3 M3 13h15a3 3 0 1 1-3 3 M3 17h8a2.5 2.5 0 1 1-2.5 2.5',
    filter: 'M3 4h18l-7 8v7l-4 2v-9L3 4Z',
    heatpump: 'M4 5h16v14H4z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
    water_heater: 'M12 3s6 6 6 11a6 6 0 0 1-12 0c0-5 6-11 6-11Z'
};

function num(v) {
    const n = Number(v);
    return isFinite(n) ? n : null;
}

function normStatus(s) {
    const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
    if (raw === 'fault' || raw === 'bad' || raw === 'critical' || raw === 'alarm' || raw === 'fail') return 'fault';
    if (raw === 'due' || raw === 'overdue' || raw === 'replace' || raw === 'service') return 'due';
    if (raw === 'watch' || raw === 'warn' || raw === 'warning' || raw === 'caution' || raw === 'soon') return 'watch';
    return 'good';
}

function normIcon(s) {
    const raw = String(s || '').toLowerCase().replace(/[^a-z_]/g, '');
    if (raw === 'ac' || raw === 'aircon' || raw === 'condenser' || raw === 'cooling') return 'ac';
    if (raw === 'furnace' || raw === 'heater' || raw === 'heating' || raw === 'boiler') return 'furnace';
    if (raw === 'thermostat' || raw === 'stat' || raw === 'control') return 'thermostat';
    if (raw === 'ductwork' || raw === 'ducts' || raw === 'duct' || raw === 'vents' || raw === 'airflow') return 'ductwork';
    if (raw === 'filter' || raw === 'airfilter') return 'filter';
    if (raw === 'heatpump' || raw === 'pump') return 'heatpump';
    if (raw === 'waterheater' || raw === 'water_heater' || raw === 'water') return 'water_heater';
    return 'furnace';
}

export default class AsaHvacSystemHealth extends LightningElement {
    @api value; // Receives the AsaHvacSystemHealthData object from the Lightning Type.

    @track title = 'Your comfort system checkup';
    @track scoreLabel = '';
    @track scoreValue = '';
    @track hasStatus = false;
    @track statusText = '';
    @track hasUpdated = false;
    @track updatedText = '';

    @track trackDash = `${TRACK_LENGTH} 100`;
    @track valueDash = '0 100';
    @track gaugeClass = 'asa-sh-gauge is-good';

    @track systems = [];
    @track hasSystems = false;

    @track hasFilter = false;
    @track filterLabel = '';
    @track filterCaption = '';
    @track filterBarStyle = '';
    @track filterClass = 'asa-sh-filter is-good';
    @track filterPctLabel = '';

    @track hasNextService = false;
    @track nextServiceText = '';
    @track hasRecommendation = false;
    @track recommendationText = '';

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
            if (this.value && this.value.hvacSystemHealthJSON) {
                const data = JSON.parse(this.value.hvacSystemHealthJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaHvacSystemHealth parse error:', e.message);
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
        this.isTestMode = num(raw.score) === null;
        const source = this.isTestMode ? TEST_DATA : raw;
        this.recompute(source);
    }

    recompute(source) {
        this.title = (source.title && String(source.title).trim()) || 'Your comfort system checkup';

        const score = Math.max(0, Math.min(100, num(source.score) || 0));
        this.scoreValue = String(Math.round(score));
        const frac = score / 100;
        const drawn = (TRACK_LENGTH * frac).toFixed(2);
        this.valueDash = `${drawn} 100`;
        const bucket = score >= 80 ? 'good' : score >= 50 ? 'fair' : 'poor';
        this.gaugeClass = `asa-sh-gauge is-${bucket}`;
        this.scoreLabel = source.scoreLabel
            ? String(source.scoreLabel).trim()
            : score >= 80 ? 'Good' : score >= 50 ? 'Fair' : 'Needs attention';

        this.statusText = source.statusText ? String(source.statusText).trim() : '';
        this.hasStatus = !!this.statusText;
        this.updatedText = source.updatedText ? String(source.updatedText).trim() : '';
        this.hasUpdated = !!this.updatedText;

        const rawSystems = Array.isArray(source.systems) ? source.systems.filter((s) => s && s.label) : [];
        this.systems = rawSystems.slice(0, 6).map((s, i) => {
            const status = normStatus(s.status);
            const icon = normIcon(s.icon);
            return {
                key: `sys-${i}`,
                label: String(s.label).trim(),
                detail: s.detail ? String(s.detail).trim() : '',
                hasDetail: !!s.detail,
                statusLabel: status.charAt(0).toUpperCase() + status.slice(1),
                iconPath: ICON_PATHS[icon] || ICON_PATHS.furnace,
                rowClass: `asa-sh-sys is-${status}`,
                pillClass: `asa-sh-pill is-${status}`
            };
        });
        this.hasSystems = this.systems.length > 0;

        const filter = source.filter || {};
        const lifePct = num(filter.lifePct);
        if (lifePct !== null) {
            const pct = Math.max(0, Math.min(100, lifePct));
            const state = pct > 50 ? 'good' : pct >= 20 ? 'watch' : 'low';
            this.hasFilter = true;
            this.filterClass = `asa-sh-filter is-${state}`;
            this.filterBarStyle = `width:${pct.toFixed(0)}%;`;
            this.filterPctLabel = `${Math.round(pct)}%`;
            this.filterLabel = filter.label ? String(filter.label).trim() : 'Air filter';
            const daysLeft = num(filter.daysLeft);
            this.filterCaption = daysLeft !== null ? `${Math.round(daysLeft)} days of life left` : 'filter life remaining';
        } else {
            this.hasFilter = false;
        }

        this.nextServiceText = source.nextServiceText ? String(source.nextServiceText).trim() : '';
        this.hasNextService = !!this.nextServiceText;
        this.recommendationText = source.recommendationText ? String(source.recommendationText).trim() : '';
        this.hasRecommendation = !!this.recommendationText;

        this.submitText = source.submitText ? String(source.submitText).trim() : '';
        this.hasSubmit = !!this.submitText;
        this.submitValue = source.submitValue ? String(source.submitValue).trim() : this.submitText;
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
                    .then(() => console.log('AsaHvacSystemHealth sent:', message))
                    .catch((err) => console.error('AsaHvacSystemHealth send error:', err));
            } else {
                console.log('AsaHvacSystemHealth: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaHvacSystemHealth sendMessage error:', err);
        }
    }
}
