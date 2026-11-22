/**
 * @description ASA Travel · Digital Boarding Pass renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a wallet-style airline boarding pass: airline + status,
 * an origin→destination route with a plane line, a times row (date, boards,
 * departs, passenger), a stub with flight / gate / seat / group and a barcode
 * strip, and primary/secondary actions. Tapping an action sends a message back
 * to the agent through embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaTravelBoardingPass_Output_8c3e/input/schema.json.
 * Fields: title?, airline?, passenger?, from?, fromCity?, to?, toCity?, flight?,
 * date?, boardingTime?, departTime?, gate?, terminal?, seat?, group?, status?,
 * submitText?, submitValue?, secondaryText?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Renders
// when the Flow payload is missing/malformed. Plain object (no JSON.parse).
const FALLBACK_DATA = {
    title: 'Boarding pass',
    airline: 'Aero Air',
    passenger: 'J. RIVERA',
    from: 'SFO',
    fromCity: 'San Francisco',
    to: 'JFK',
    toCity: 'New York',
    flight: 'AF128',
    date: 'Jul 12',
    boardingTime: '10:05 AM',
    departTime: '10:35 AM',
    gate: 'A12',
    terminal: '2',
    seat: '12A',
    group: 'B',
    status: 'Boarding',
    submitText: 'Add to wallet',
    submitValue: 'Add my boarding pass to my wallet',
    secondaryText: 'Email pass'
};

export default class AsaTravelBoardingPass extends LightningElement {
    @api value; // Receives the AsaTravelBoardingPassData object from the Lightning Type.

    @track title = 'Boarding pass';
    @track airline = '';
    @track status = '';
    @track fromCode = '—';
    @track fromCity = '';
    @track toCode = '—';
    @track toCity = '';
    @track times = [];
    @track stub = [];
    @track submitText = 'Add to wallet';
    @track secondaryText = '';

    isTestMode = false;
    submitValue = '';

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.travelBoardingPassJSON) {
                const data = JSON.parse(this.value.travelBoardingPassJSON);
                if (data && typeof data === 'object') {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaTravelBoardingPass parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData(FALLBACK_DATA);
    }

    initializeFromData(data) {
        // Test mode when the payload carries no identifying content — never blank.
        this.isTestMode = !(data.flight || data.from || data.to || data.passenger);
        const src = this.isTestMode ? FALLBACK_DATA : data;

        this.title = (src.title && String(src.title).trim()) || 'Boarding pass';
        this.airline = (src.airline && String(src.airline).trim()) || 'Airline';
        this.status = (src.status && String(src.status).trim()) || '';
        this.submitText = (src.submitText && String(src.submitText).trim()) || 'Add to wallet';
        this.submitValue = (src.submitValue && String(src.submitValue).trim())
            || 'Add my boarding pass to my wallet';
        this.secondaryText = (src.secondaryText && String(src.secondaryText).trim()) || '';

        this.fromCode = (src.from && String(src.from).trim()) || '—';
        this.fromCity = (src.fromCity && String(src.fromCity).trim()) || '';
        this.toCode = (src.to && String(src.to).trim()) || '—';
        this.toCity = (src.toCity && String(src.toCity).trim()) || '';

        const timesRaw = [
            ['Date', src.date],
            ['Boards', src.boardingTime],
            ['Departs', src.departTime],
            ['Passenger', src.passenger]
        ];
        this.times = timesRaw
            .filter((f) => f[1] != null && String(f[1]).trim())
            .map((f) => ({ label: f[0], value: String(f[1]) }));

        const stubRaw = [
            ['Flight', src.flight],
            ['Gate', src.gate],
            ['Seat', src.seat],
            ['Group', src.group]
        ];
        this.stub = stubRaw
            .filter((f) => f[1] != null && String(f[1]).trim())
            .map((f) => ({ label: f[0], value: String(f[1]) }));
    }

    get hasStatus() {
        return !!this.status;
    }
    get hasFromCity() {
        return !!this.fromCity;
    }
    get hasToCity() {
        return !!this.toCity;
    }
    get hasSecondary() {
        return !!this.secondaryText;
    }

    handleSubmit() {
        this.sendMessage(this.submitValue || 'Add my boarding pass to my wallet');
    }

    handleSecondary() {
        this.sendMessage('Email me my boarding pass');
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaTravelBoardingPass sent:', message))
                    .catch((err) => console.error('AsaTravelBoardingPass send error:', err));
            } else {
                console.log('AsaTravelBoardingPass: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaTravelBoardingPass sendMessage error:', err);
        }
    }
}
