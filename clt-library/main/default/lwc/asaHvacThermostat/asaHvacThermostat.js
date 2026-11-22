/**
 * @description ASA HVAC · Smart Thermostat Control renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a smart thermostat as a self-contained SVG climate dial
 * (270° arc): the current temperature reads large in the center, the target
 * setpoint below, a mode-chip row (Heat/Cool/Auto/Off), a target stepper, and
 * optional quick-set presets. The dial + accents follow a heat/cool duality —
 * heat = warm orange, cool = cool blue, auto = green, off = muted. Tapping the
 * CTA sends the chosen setpoint + mode back via
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * The dial arc uses SVG pathLength="100" so the drawn length is expressed in
 * simple 0–100 units: the 270° track is 75 units and the value arc is
 * 75 * (current-min)/(max-min). A rotate(135°) puts the gap at the bottom.
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaHvacThermostat_Output_f1a2/input/schema.json.
 * Fields: title?, currentTemp(number), targetTemp?, mode?(heat|cool|auto|off|fan),
 * unit?(F|C), humidity?, statusText?, minTemp?, maxTemp?,
 * presets?[]{id, label, targetTemp, mode?}, submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const TEST_DATA = {
    title: 'Living room thermostat',
    currentTemp: 71,
    targetTemp: 72,
    mode: 'cool',
    unit: 'F',
    humidity: 44,
    statusText: 'Cooling to 72°',
    minTemp: 50,
    maxTemp: 90,
    presets: [
        { id: 'eco', label: 'Eco', targetTemp: 78, mode: 'cool' },
        { id: 'comfort', label: 'Comfort', targetTemp: 72, mode: 'cool' },
        { id: 'away', label: 'Away', targetTemp: 82, mode: 'off' },
        { id: 'sleep', label: 'Sleep', targetTemp: 68, mode: 'cool' }
    ],
    submitText: 'Set thermostat',
    submitValue: 'Set my thermostat'
};

const MODES = ['heat', 'cool', 'auto', 'off'];
const MODE_LABELS = { heat: 'Heat', cool: 'Cool', auto: 'Auto', off: 'Off', fan: 'Fan' };
const TRACK_LENGTH = 75; // 270° of a pathLength=100 circle.

function num(v) {
    const n = Number(v);
    return isFinite(n) ? n : null;
}

function normMode(m) {
    const raw = String(m || '').toLowerCase().replace(/[^a-z]/g, '');
    if (raw === 'heat' || raw === 'heating' || raw === 'warm') return 'heat';
    if (raw === 'cool' || raw === 'cooling' || raw === 'ac' || raw === 'cold') return 'cool';
    if (raw === 'off' || raw === 'standby') return 'off';
    if (raw === 'fan' || raw === 'fanonly') return 'fan';
    return 'auto';
}

export default class AsaHvacThermostat extends LightningElement {
    @api value; // Receives the AsaHvacThermostatData object from the Lightning Type.

    @track title = 'Thermostat';
    @track unit = 'F';
    @track currentLabel = '';
    @track hasStatus = false;
    @track statusText = '';
    @track hasHumidity = false;
    @track humidityLabel = '';

    @track trackDash = `${TRACK_LENGTH} 100`;
    @track valueDash = '0 100';
    @track dialClass = 'asa-th-dial is-auto';

    @track modeChips = [];
    @track presets = [];
    @track hasPresets = false;

    @track hasSubmit = false;
    @track submitText = '';

    isTestMode = false;
    submitValue = '';
    mode = 'auto';
    currentTemp = 70;
    targetTemp = 72;
    minTemp = 50;
    maxTemp = 90;

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.hvacThermostatJSON) {
                const data = JSON.parse(this.value.hvacThermostatJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaHvacThermostat parse error:', e.message);
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
        this.isTestMode = num(raw.currentTemp) === null;
        const source = this.isTestMode ? TEST_DATA : raw;

        this.title = (source.title && String(source.title).trim()) || 'Thermostat';
        this.unit = source.unit && String(source.unit).trim().toUpperCase() === 'C' ? 'C' : 'F';

        this.currentTemp = num(source.currentTemp) != null ? num(source.currentTemp) : 70;
        this.minTemp = num(source.minTemp) != null ? num(source.minTemp) : this.unit === 'C' ? 10 : 50;
        this.maxTemp = num(source.maxTemp) != null ? num(source.maxTemp) : this.unit === 'C' ? 32 : 90;
        if (this.maxTemp <= this.minTemp) this.maxTemp = this.minTemp + 1;
        this.targetTemp = num(source.targetTemp) != null ? num(source.targetTemp) : this.currentTemp;
        this.targetTemp = Math.max(this.minTemp, Math.min(this.maxTemp, this.targetTemp));

        this.mode = normMode(source.mode);

        this.statusText = source.statusText ? String(source.statusText).trim() : '';
        this.hasStatus = !!this.statusText;

        const hum = num(source.humidity);
        this.hasHumidity = hum != null;
        this.humidityLabel = hum != null ? `${Math.round(hum)}%` : '';

        const rawPresets = Array.isArray(source.presets)
            ? source.presets.filter((p) => p && p.id && p.label && num(p.targetTemp) != null)
            : [];
        this.presets = rawPresets.slice(0, 4).map((p) => ({
            id: String(p.id),
            label: String(p.label).trim(),
            targetTemp: num(p.targetTemp),
            mode: normMode(p.mode || this.mode)
        }));
        this.hasPresets = this.presets.length > 0;

        this.submitText = source.submitText ? String(source.submitText).trim() : 'Set thermostat';
        this.submitValue = source.submitValue ? String(source.submitValue).trim() : '';
        this.hasSubmit = true;

        this.recompute();
    }

    // Recompute derived render state (dial geometry + labels + chips) after any change.
    recompute() {
        this.currentLabel = String(Math.round(this.currentTemp));

        const frac = Math.max(0, Math.min(1, (this.currentTemp - this.minTemp) / (this.maxTemp - this.minTemp)));
        const drawn = (TRACK_LENGTH * frac).toFixed(2);
        this.valueDash = `${drawn} 100`;
        this.dialClass = `asa-th-dial is-${this.mode}`;

        this.modeChips = MODES.map((m) => ({
            key: m,
            mode: m,
            label: MODE_LABELS[m],
            _class: m === this.mode ? `asa-th-mode is-${m} is-on` : 'asa-th-mode'
        }));

        this.presets = this.presets.map((p) => ({
            ...p,
            _class:
                p.targetTemp === this.targetTemp && p.mode === this.mode
                    ? 'asa-th-preset is-on'
                    : 'asa-th-preset'
        }));
    }

    get targetReadout() {
        if (this.mode === 'off') return 'System off';
        return `Set to ${Math.round(this.targetTemp)}°${this.unit}`;
    }

    get modeLabel() {
        return MODE_LABELS[this.mode] || 'Auto';
    }

    handleMode(event) {
        const m = event.currentTarget.dataset.mode;
        if (!m) return;
        this.mode = normMode(m);
        this.recompute();
    }

    handleStep(event) {
        const dir = Number(event.currentTarget.dataset.dir) || 0;
        const next = Math.max(this.minTemp, Math.min(this.maxTemp, this.targetTemp + dir));
        this.targetTemp = next;
        this.recompute();
    }

    handlePreset(event) {
        const id = event.currentTarget.dataset.id;
        const p = this.presets.find((x) => x.id === id);
        if (!p) return;
        this.targetTemp = Math.max(this.minTemp, Math.min(this.maxTemp, p.targetTemp));
        this.mode = p.mode;
        this.recompute();
    }

    handleSubmit() {
        const base = this.submitValue || this.submitText || 'Set my thermostat';
        const detail =
            this.mode === 'off'
                ? ' to Off'
                : ` to ${Math.round(this.targetTemp)}°${this.unit} (${this.modeLabel})`;
        this.sendMessage(`${base}${detail}`);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaHvacThermostat sent:', message))
                    .catch((err) => console.error('AsaHvacThermostat send error:', err));
            } else {
                console.log('AsaHvacThermostat: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaHvacThermostat sendMessage error:', err);
        }
    }
}
