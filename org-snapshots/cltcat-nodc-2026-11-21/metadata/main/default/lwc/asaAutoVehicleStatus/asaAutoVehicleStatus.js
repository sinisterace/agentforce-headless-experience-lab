/**
 * @description ASA Automotive · Connected Car Status renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a connected-vehicle status card: a self-contained SVG
 * ring gauge (270° arc) for driving range / charge, an odometer + service item
 * grid, a four-corner tire-pressure diagram, an alerts banner, and a
 * schedule-service CTA sent back via
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * The ring uses SVG pathLength="100" so the drawn length is in 0–100 units:
 * the 270° track is 75 units and the value arc is 75 * frac. rotate(135) puts
 * the gap at the bottom-center. (Same geometry as the TMC Data Usage gauge.)
 *
 * Contract: the field names read below MUST match the example JSON + rules in
 * genAiFunctions/asaAutoVehicleStatus_Output_c7d8/input/schema.json.
 * Fields: title?, vehicle{name, trim?, imageUrl?, initials?}, isElectric?,
 * range{value, total?, unit?}, battery?, odometer?, odometerUnit?,
 * tires[]{pos, psi, status}, items[]{label, value, status}, alerts[],
 * updatedText?, submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

const TRACK_LENGTH = 75; // 270° of a pathLength=100 circle.

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const TEST_DATA = {
    title: 'Your vehicle',
    vehicle: { name: 'Electric SUV', trim: 'RS AWD', imageUrl: '', initials: 'EV' },
    isElectric: true,
    range: { value: 248, total: 312, unit: 'mi' },
    battery: 78,
    odometer: 18452,
    odometerUnit: 'mi',
    tires: [
        { pos: 'FL', psi: 34, status: 'good' },
        { pos: 'FR', psi: 33, status: 'good' },
        { pos: 'RL', psi: 28, status: 'low' },
        { pos: 'RR', psi: 35, status: 'good' }
    ],
    items: [
        { label: 'Charge', value: '78%', status: 'good' },
        { label: 'Next service', value: 'in 1,200 mi', status: 'good' },
        { label: 'Oil life', value: 'N/A', status: 'good' },
        { label: 'Tire pressure', value: '1 low', status: 'watch' }
    ],
    alerts: ['Rear-left tire pressure is low (28 psi)'],
    updatedText: 'Updated 3 min ago',
    submitText: 'Schedule service',
    submitValue: "I'd like to schedule service for my vehicle"
};

const TIRE_ORDER = ['FL', 'FR', 'RL', 'RR'];
const TIRE_LABELS = { FL: 'Front L', FR: 'Front R', RL: 'Rear L', RR: 'Rear R' };

function num(v) {
    const n = Number(v);
    return isFinite(n) ? n : null;
}

function trimNum(n) {
    const r = Math.round(n * 10) / 10;
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

function normTireStatus(s) {
    const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
    if (raw === 'low' || raw === 'high' || raw === 'bad' || raw === 'flat' || raw === 'critical') return 'bad';
    if (raw === 'watch' || raw === 'warn' || raw === 'warning') return 'watch';
    return 'good';
}

function normItemStatus(s) {
    const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
    if (raw === 'bad' || raw === 'critical' || raw === 'low' || raw === 'due') return 'bad';
    if (raw === 'watch' || raw === 'warn' || raw === 'warning' || raw === 'soon') return 'watch';
    return 'good';
}

export default class AsaAutoVehicleStatus extends LightningElement {
    @api value; // Receives the AsaAutoVehicleStatusData object from the Lightning Type.

    @track title = 'Your vehicle';
    @track vehicleName = '';
    @track vehicleTrim = '';
    @track hasImage = false;
    @track imageUrl = '';
    @track initials = '';

    @track hasUpdated = false;
    @track updatedText = '';

    @track trackDash = `${TRACK_LENGTH} 100`;
    @track valueDash = '0 100';
    @track gaugeClass = 'asa-vs-gauge is-ok';
    @track centerMain = '';
    @track centerUnit = '';
    @track centerSub = '';

    @track hasSubline = false;
    @track subline = '';

    @track tires = [];
    @track hasTires = false;

    @track items = [];
    @track hasItems = false;

    @track alerts = [];
    @track hasAlerts = false;

    @track hasSubmit = false;
    @track submitText = '';

    // Top-down vehicle image shown centered in the tire diagram; falls back to
    // the outline silhouette if the static resource fails to load.
    @track carImageError = false;

    isTestMode = false;
    submitValue = '';

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.autoVehicleStatusJSON) {
                const data = JSON.parse(this.value.autoVehicleStatusJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaAutoVehicleStatus parse error:', e.message);
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
        const vehicle = raw.vehicle || {};
        const range = raw.range || {};
        const hasName = !!(vehicle.name && String(vehicle.name).trim());
        const hasRange = num(range.value) !== null || num(raw.battery) !== null;
        this.isTestMode = !hasName && !hasRange;
        const source = this.isTestMode ? TEST_DATA : raw;
        this.recompute(source);
    }

    recompute(source) {
        this.title = (source.title && String(source.title).trim()) || 'Your vehicle';

        const vehicle = source.vehicle || {};
        this.vehicleName = vehicle.name ? String(vehicle.name).trim() : 'Your vehicle';
        this.vehicleTrim = vehicle.trim ? String(vehicle.trim).trim() : '';
        this.imageUrl = vehicle.imageUrl ? String(vehicle.imageUrl).trim() : '';
        this.hasImage = !!this.imageUrl;
        const parts = this.vehicleName.split(/\s+/).filter(Boolean);
        this.initials = (vehicle.initials && String(vehicle.initials).trim().slice(0, 2).toUpperCase())
            || ((parts[0] ? parts[0][0] : '') + (parts[1] ? parts[1][0] : '')).toUpperCase()
            || 'CAR';

        this.updatedText = source.updatedText ? String(source.updatedText).trim() : '';
        this.hasUpdated = !!this.updatedText;

        this.buildGauge(source);
        this.buildTires(source.tires);
        this.buildItems(source.items);

        const alerts = Array.isArray(source.alerts)
            ? source.alerts.map((a) => (a == null ? '' : String(a).trim())).filter(Boolean)
            : [];
        this.alerts = alerts.map((a, i) => ({ key: `al-${i}`, text: a }));
        this.hasAlerts = this.alerts.length > 0;

        this.submitText = source.submitText ? String(source.submitText).trim() : '';
        this.hasSubmit = !!this.submitText;
        this.submitValue = source.submitValue ? String(source.submitValue).trim() : this.submitText;
    }

    buildGauge(source) {
        const range = source.range || {};
        const rangeValue = num(range.value);
        const rangeTotal = num(range.total);
        const battery = num(source.battery);
        const unit = range.unit ? String(range.unit).trim() : 'mi';

        let frac = null;
        if (rangeValue !== null && rangeTotal !== null && rangeTotal > 0) {
            frac = rangeValue / rangeTotal;
            this.centerMain = trimNum(rangeValue);
            this.centerUnit = unit;
            this.centerSub = `of ${trimNum(rangeTotal)} ${unit}`;
        } else if (rangeValue !== null) {
            // No total: draw a healthy near-full arc and show the range value.
            frac = 0.9;
            this.centerMain = trimNum(rangeValue);
            this.centerUnit = unit;
            this.centerSub = source.isElectric ? 'range' : 'range';
        } else if (battery !== null) {
            frac = battery / 100;
            this.centerMain = trimNum(battery);
            this.centerUnit = '%';
            this.centerSub = source.isElectric ? 'charge' : 'fuel';
        } else {
            frac = 0;
            this.centerMain = '—';
            this.centerUnit = '';
            this.centerSub = '';
        }

        frac = Math.max(0, Math.min(1, frac));
        const drawn = (TRACK_LENGTH * frac).toFixed(2);
        this.valueDash = `${drawn} 100`;
        const warn = frac <= 0.2;
        this.gaugeClass = `asa-vs-gauge ${warn ? 'is-warn' : 'is-ok'}`;

        // Subline: battery/charge when the ring shows range (avoid duplicating).
        if (rangeValue !== null && battery !== null) {
            this.subline = `${trimNum(battery)}% ${source.isElectric ? 'charged' : 'fuel'}`;
            this.hasSubline = true;
        } else if (num(source.odometer) !== null) {
            const ou = source.odometerUnit ? String(source.odometerUnit).trim() : 'mi';
            this.subline = `${Number(source.odometer).toLocaleString()} ${ou} on the odometer`;
            this.hasSubline = true;
        } else {
            this.subline = '';
            this.hasSubline = false;
        }
    }

    buildTires(tires) {
        const list = Array.isArray(tires) ? tires.filter((t) => t && t.pos) : [];
        if (!list.length) {
            this.tires = [];
            this.hasTires = false;
            return;
        }
        const byPos = {};
        list.forEach((t) => {
            const pos = String(t.pos).toUpperCase().replace(/[^A-Z]/g, '');
            if (TIRE_ORDER.includes(pos)) byPos[pos] = t;
        });
        this.tires = TIRE_ORDER.filter((pos) => byPos[pos]).map((pos) => {
            const t = byPos[pos];
            const status = normTireStatus(t.status);
            const psi = num(t.psi);
            return {
                key: `tire-${pos}`,
                pos,
                label: TIRE_LABELS[pos],
                psi: psi !== null ? trimNum(psi) : '—',
                cellClass: `asa-vs-tire is-${pos.toLowerCase()} is-${status}`
            };
        });
        this.hasTires = this.tires.length > 0;
    }

    buildItems(items) {
        const list = Array.isArray(items) ? items.filter((m) => m && m.label) : [];
        this.items = list.slice(0, 4).map((m, i) => {
            const status = normItemStatus(m.status);
            return {
                key: `it-${i}`,
                label: String(m.label).trim(),
                value: m.value != null ? String(m.value).trim() : '—',
                tileClass: `asa-vs-item is-${status}`
            };
        });
        this.hasItems = this.items.length > 0;
    }

    handleImageError() {
        this.hasImage = false;
    }

    handleCarImageError() {
        this.carImageError = true;
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
                    .then(() => console.log('AsaAutoVehicleStatus sent:', message))
                    .catch((err) => console.error('AsaAutoVehicleStatus send error:', err));
            } else {
                console.log('AsaAutoVehicleStatus: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaAutoVehicleStatus sendMessage error:', err);
        }
    }
}