/**
 * @description ASA Travel · Seat Map renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders an interactive cabin: the visitor taps an open seat to
 * pick it. Seats are colour-coded by kind (standard / extra_legroom / exit /
 * premium) and status (open / taken / selected), with column labels, an aisle
 * gap, a legend, and a live selected-seat detail bar + price. Confirming sends a
 * message back to the agent through
 * embeddedservice_configuration.util.sendTextMessage(...) using submitValue,
 * including the chosen seat id.
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaTravelSeatMap_Output_8a1c/input/schema.json.
 * Fields: title?, flight?, columns?[], aisleAfter?, seats[]{id, row, col,
 * status?, kind?, price?}, currency?, submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

const KIND_LABEL = {
    standard: 'Standard',
    extra_legroom: 'Extra legroom',
    exit: 'Exit row',
    premium: 'Premium'
};

function normKind(k) {
    const raw = String(k || 'standard').toLowerCase().replace(/[^a-z_]/g, '');
    if (raw === 'extralegroom' || raw === 'extra_legroom' || raw === 'legroom') return 'extra_legroom';
    if (raw === 'exit' || raw === 'exitrow') return 'exit';
    if (raw === 'premium' || raw === 'first' || raw === 'business') return 'premium';
    return 'standard';
}

function money(n, currency) {
    const v = Number(n) || 0;
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
            maximumFractionDigits: 0
        }).format(v);
    } catch (e) {
        return '$' + Math.round(v);
    }
}

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Mirrors
// the React preview's makeTestSeats() so the card renders when the Flow payload
// is missing/malformed. Plain object (no JSON.parse).
function makeTestSeats() {
    const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
    const taken = new Set(['12C', '13A', '13F', '14D', '15B', '15E', '16A', '17F', '18C', '18D']);
    const out = [];
    for (let row = 12; row <= 18; row++) {
        const kind = row === 12 ? 'extra_legroom' : row === 14 ? 'exit' : 'standard';
        const price = row === 12 ? 45 : row === 14 ? 30 : 0;
        for (const col of cols) {
            const id = '' + row + col;
            out.push({ id, row, col, status: taken.has(id) ? 'taken' : 'open', kind, price });
        }
    }
    return out;
}

const FALLBACK_DATA = {
    title: 'Choose your seat',
    flight: 'SFO → JFK · Flight AF128',
    columns: ['A', 'B', 'C', 'D', 'E', 'F'],
    aisleAfter: 'C',
    currency: 'USD',
    seats: makeTestSeats(),
    submitText: 'Select seat',
    submitValue: 'I would like to select this seat'
};

export default class AsaTravelSeatMap extends LightningElement {
    @api value; // Receives the AsaTravelSeatMapData object from the Lightning Type.

    @track title = 'Choose your seat';
    @track flight = '';
    @track columns = [];
    @track submitText = 'Select seat';
    @track selectedId = '';

    isTestMode = false;
    aisleAfter = 'C';
    currency = 'USD';
    submitValue = '';
    _seats = []; // normalized seat records
    _grid = []; // [{ row, cols: Map<colLetter, seat> }]

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.travelSeatMapJSON) {
                const data = JSON.parse(this.value.travelSeatMapJSON);
                if (data && typeof data === 'object') {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaTravelSeatMap parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData(FALLBACK_DATA);
    }

    initializeFromData(data) {
        const rawSeats = Array.isArray(data.seats) ? data.seats : [];
        const valid = rawSeats.filter((s) => s && s.id != null && s.row != null && s.col);
        // Test mode when the payload carries no usable seats — never blank.
        this.isTestMode = valid.length === 0;
        const src = this.isTestMode ? FALLBACK_DATA : data;
        const seats = this.isTestMode ? FALLBACK_DATA.seats : valid;

        this.currency = (src.currency && String(src.currency).trim()) || 'USD';
        this.columns = (Array.isArray(src.columns) && src.columns.length
            ? src.columns
            : ['A', 'B', 'C', 'D', 'E', 'F']).map((c) => String(c));
        this.aisleAfter = (src.aisleAfter && String(src.aisleAfter))
            || this.columns[Math.floor(this.columns.length / 2) - 1] || 'C';
        this.title = (src.title && String(src.title).trim()) || 'Choose your seat';
        this.flight = (src.flight && String(src.flight).trim()) || '';
        this.submitText = (src.submitText && String(src.submitText).trim()) || 'Select seat';
        this.submitValue = (src.submitValue && String(src.submitValue).trim())
            || 'I would like to select this seat';

        this._seats = seats.map((s) => ({
            id: String(s.id),
            row: Number(s.row),
            col: String(s.col),
            status: String(s.status || 'open').toLowerCase(),
            kind: normKind(s.kind),
            price: Number(s.price) || 0
        }));

        // row -> Map(colLetter -> seat), sorted by row number ascending.
        const rows = new Map();
        for (const s of this._seats) {
            if (!rows.has(s.row)) rows.set(s.row, new Map());
            rows.get(s.row).set(s.col, s);
        }
        this._grid = [...rows.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([row, cols]) => ({ row, cols }));

        this.selectedId = '';
    }

    // --- header ---
    get hasFlight() {
        return !!this.flight;
    }

    // --- column header labels ---
    get colLabels() {
        return this.columns.map((c) => ({
            letter: c,
            cls: c === this.aisleAfter ? 'asa-sm-collabel has-aisle' : 'asa-sm-collabel'
        }));
    }

    // --- seat grid (recomputes when selectedId changes) ---
    get displayRows() {
        return this._grid.map((r) => {
            const cells = this.columns.map((col) => {
                const seat = r.cols.get(col);
                const aisle = col === this.aisleAfter ? ' has-aisle' : '';
                if (!seat) {
                    return {
                        key: r.row + '-' + col,
                        isEmpty: true,
                        cls: 'asa-sm-seat is-empty' + aisle
                    };
                }
                const isTaken = seat.status === 'taken' || seat.status === 'unavailable';
                const isSel = seat.id === this.selectedId;
                const cls =
                    'asa-sm-seat is-' +
                    seat.kind +
                    (isTaken ? ' is-taken' : '') +
                    (isSel ? ' is-selected' : '') +
                    aisle;
                return {
                    key: r.row + '-' + col,
                    isEmpty: false,
                    seatId: seat.id,
                    col: seat.col,
                    cls,
                    disabled: isTaken,
                    isSelected: isSel,
                    ariaLabel: 'Seat ' + seat.id
                };
            });
            return { key: r.row, row: r.row, cells };
        });
    }

    // --- selected seat detail bar ---
    get selSeat() {
        return this._seats.find((s) => s.id === this.selectedId);
    }
    get hasSelection() {
        return !!this.selSeat;
    }
    get selDetail() {
        const s = this.selSeat;
        if (!s) return '';
        return [s.id, this.posLabel(s.col), KIND_LABEL[s.kind]].join(' · ');
    }
    get selPrice() {
        const s = this.selSeat;
        if (!s) return '';
        return s.price > 0 ? '+' + money(s.price, this.currency) : 'Included';
    }

    posLabel(col) {
        const i = this.columns.indexOf(col);
        if (i === 0 || i === this.columns.length - 1) return 'Window';
        const aisleIdx = this.columns.indexOf(this.aisleAfter);
        if (i === aisleIdx || i === aisleIdx + 1) return 'Aisle';
        return 'Middle';
    }

    handleSeatClick(event) {
        const id = event.currentTarget.dataset.seatid;
        if (id) this.selectedId = id;
    }

    handleSubmit() {
        const s = this.selSeat;
        if (!s) return;
        const base = this.submitValue || 'I would like to select this seat';
        this.sendMessage(base + ' Seat ' + s.id + '.');
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaTravelSeatMap sent:', message))
                    .catch((err) => console.error('AsaTravelSeatMap send error:', err));
            } else {
                console.log('AsaTravelSeatMap: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaTravelSeatMap sendMessage error:', err);
        }
    }
}