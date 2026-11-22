/**
 * @description ASA Travel · Flight Status Tracker renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a live flight-status card: a plane glides along the route
 * arc between origin and destination, with a status pill, gates/terminals and
 * baggage claim, plus a get-updates action. Tapping the action sends a message
 * back to the agent through embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaTravelFlightStatus_Output_8b2d/input/schema.json.
 * Fields: title?, status?, statusLabel?, origin?/dest?{ code, city?, time?, gate?,
 * terminal?, baggage? }, progressPct?, aircraft?, durationText?, updatedText?,
 * submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Renders
// when the Flow payload is missing/malformed. Plain object (no JSON.parse).
const FALLBACK_DATA = {
    title: 'Flight AF128',
    status: 'in_air',
    origin: { code: 'SFO', city: 'San Francisco', time: '10:35 AM', gate: 'A12', terminal: '2' },
    dest: { code: 'JFK', city: 'New York', time: '7:05 PM', terminal: '4', baggage: 'Belt 6' },
    progressPct: 62,
    aircraft: 'Airbus A321neo',
    durationText: '5h 30m',
    updatedText: 'Live · updated just now',
    submitText: 'Get gate updates',
    submitValue: 'Send me gate and delay updates for flight AF128'
};

const STATUS_LABEL = {
    scheduled: 'Scheduled',
    boarding: 'Boarding',
    departed: 'Departed',
    in_air: 'In air',
    landed: 'Landed',
    delayed: 'Delayed',
    cancelled: 'Cancelled'
};

function normStatus(s) {
    const raw = String(s || '').toLowerCase().replace(/[^a-z_]/g, '');
    if (raw === 'boarding' || raw === 'nowboarding') return 'boarding';
    if (raw === 'departed' || raw === 'taxiing' || raw === 'takeoff') return 'departed';
    if (raw === 'inair' || raw === 'in_air' || raw === 'enroute' || raw === 'airborne') return 'in_air';
    if (raw === 'landed' || raw === 'arrived') return 'landed';
    if (raw === 'delayed' || raw === 'late') return 'delayed';
    if (raw === 'cancelled' || raw === 'canceled') return 'cancelled';
    return 'scheduled';
}

export default class AsaTravelFlightStatus extends LightningElement {
    @api value; // Receives the AsaTravelFlightStatusData object from the Lightning Type.

    @track title = 'Flight status';
    @track status = 'scheduled';
    @track statusLabel = 'Scheduled';
    @track aircraftLine = '';

    @track originCode = '—';
    @track originCity = '';
    @track originTime = '';
    @track destCode = '—';
    @track destCity = '';
    @track destTime = '';

    @track pct = 0;

    @track showDeparts = false;
    @track departsVal = '';
    @track showArrives = false;
    @track arrivesVal = '';
    @track showBaggage = false;
    @track baggageVal = '';

    @track updatedText = '';
    @track submitText = 'Get updates';

    isTestMode = false;
    submitValue = '';

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.travelFlightStatusJSON) {
                const data = JSON.parse(this.value.travelFlightStatusJSON);
                if (data && typeof data === 'object') {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaTravelFlightStatus parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData(FALLBACK_DATA);
    }

    initializeFromData(data) {
        // Test mode when the payload carries no identifying content — never blank.
        const hasContent = !!(
            (data.origin && data.origin.code) ||
            (data.dest && data.dest.code) ||
            data.status
        );
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? FALLBACK_DATA : data;

        const status = normStatus(src.status);
        this.status = status;
        this.statusLabel = (src.statusLabel && String(src.statusLabel).trim()) || STATUS_LABEL[status];

        const origin = src.origin && typeof src.origin === 'object' ? src.origin : { code: '—' };
        const dest = src.dest && typeof src.dest === 'object' ? src.dest : { code: '—' };

        this.pct = status === 'landed'
            ? 100
            : (status === 'scheduled' || status === 'boarding')
                ? 0
                : Math.max(0, Math.min(100, Number(src.progressPct) || 0));

        this.title = (src.title && String(src.title).trim()) || 'Flight status';
        this.submitText = (src.submitText && String(src.submitText).trim()) || 'Get updates';
        this.submitValue = (src.submitValue && String(src.submitValue).trim())
            || 'Send me gate and delay updates for this flight';

        const aircraft = src.aircraft ? String(src.aircraft).trim() : '';
        const duration = src.durationText ? String(src.durationText).trim() : '';
        this.aircraftLine = aircraft ? (duration ? `${aircraft} · ${duration}` : aircraft) : '';

        this.originCode = (origin.code && String(origin.code).trim()) || '—';
        this.originCity = origin.city ? String(origin.city).trim() : '';
        this.originTime = origin.time ? String(origin.time).trim() : '';
        this.destCode = (dest.code && String(dest.code).trim()) || '—';
        this.destCity = dest.city ? String(dest.city).trim() : '';
        this.destTime = dest.time ? String(dest.time).trim() : '';

        const originGate = origin.gate ? String(origin.gate).trim() : '';
        const originTerm = origin.terminal ? String(origin.terminal).trim() : '';
        this.showDeparts = !!(originGate || originTerm);
        this.departsVal = [originTerm && `T${originTerm}`, originGate && `Gate ${originGate}`]
            .filter(Boolean).join(' · ') || '—';

        const destGate = dest.gate ? String(dest.gate).trim() : '';
        const destTerm = dest.terminal ? String(dest.terminal).trim() : '';
        this.showArrives = !!(destGate || destTerm);
        this.arrivesVal = [destTerm && `T${destTerm}`, destGate && `Gate ${destGate}`]
            .filter(Boolean).join(' · ') || '—';

        const baggage = dest.baggage ? String(dest.baggage).trim() : '';
        this.showBaggage = !!baggage;
        this.baggageVal = baggage;

        this.updatedText = src.updatedText ? String(src.updatedText).trim() : '';
    }

    get statusClass() {
        return `asa-fs-status is-${this.status}`;
    }
    get planeClass() {
        return `asa-fs-plane is-${this.status}`;
    }
    get planeStyle() {
        return `left: ${this.pct}%;`;
    }
    get fillStyle() {
        return `width: ${this.pct}%;`;
    }
    get hasAircraft() {
        return !!this.aircraftLine;
    }
    get hasOriginCity() {
        return !!this.originCity;
    }
    get hasOriginTime() {
        return !!this.originTime;
    }
    get hasDestCity() {
        return !!this.destCity;
    }
    get hasDestTime() {
        return !!this.destTime;
    }
    get hasUpdated() {
        return !!this.updatedText;
    }
    get hasSubmit() {
        return !!this.submitText;
    }
    get hasInfo() {
        return this.showDeparts || this.showArrives || this.showBaggage;
    }

    handleSubmit() {
        this.sendMessage(this.submitValue || 'Send me gate and delay updates for this flight');
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaTravelFlightStatus sent:', message))
                    .catch((err) => console.error('AsaTravelFlightStatus send error:', err));
            } else {
                console.log('AsaTravelFlightStatus: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaTravelFlightStatus sendMessage error:', err);
        }
    }
}
