/**
 * @description ASA Travel · Room Selector renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a list of hotel room cards the guest picks from: each
 * card shows a photo/gradient, an optional badge, the room name, meta (bed,
 * size, occupancy), amenity chips and the nightly rate. Selecting a card reveals
 * a Reserve button; tapping it sends a message back to the agent through
 * embeddedservice_configuration.util.sendTextMessage(...), including the chosen
 * room.
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaTravelRoomSelector_Output_8d4f/input/schema.json.
 * Top-level: title?, subtitle?, currency?, rooms[], submitText?, submitValue?.
 * Room: id?, name, bed?, size?, sleeps?, amenities[]?, price?, cadence?,
 * currency?, imageUrl?, badge?.
 */
import { LightningElement, api, track } from 'lwc';

// Format a price with the payload currency; falls back to a plain $ amount.
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

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Renders
// when the Flow payload is missing/malformed. Plain object (no JSON.parse).
const FALLBACK_DATA = {
    title: 'Choose your room',
    subtitle: 'The Shoreline Resort · Jul 12–15 · 2 guests',
    currency: 'USD',
    rooms: [
        { id: 'r1', name: 'Ocean View King', bed: '1 King bed', size: '420 sq ft', sleeps: 2, amenities: ['Ocean view', 'Balcony', 'Free WiFi'], price: 389, cadence: 'night', badge: 'Best value' },
        { id: 'r2', name: 'Garden Double Queen', bed: '2 Queen beds', size: '480 sq ft', sleeps: 4, amenities: ['Garden view', 'Free WiFi', 'Mini bar'], price: 329, cadence: 'night' },
        { id: 'r3', name: 'Beachfront Suite', bed: '1 King + sofa bed', size: '720 sq ft', sleeps: 3, amenities: ['Beachfront', 'Living room', 'Soaking tub'], price: 612, cadence: 'night', badge: 'Only 2 left' }
    ],
    submitText: 'Reserve',
    submitValue: 'I would like to reserve this room'
};

export default class AsaTravelRoomSelector extends LightningElement {
    @api value; // Receives the AsaTravelRoomSelectorData object from the Lightning Type.

    @track title = 'Choose your room';
    @track subtitle = '';
    @track roomsBase = [];
    @track submitText = 'Reserve';

    isTestMode = false;
    submitValue = '';
    selectedKey = '';

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.travelRoomSelectorJSON) {
                const data = JSON.parse(this.value.travelRoomSelectorJSON);
                if (data && typeof data === 'object') {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaTravelRoomSelector parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData(FALLBACK_DATA);
    }

    initializeFromData(data) {
        const validRooms = Array.isArray(data.rooms)
            ? data.rooms.filter((r) => r && (r.name || r.id))
            : [];
        // Test mode when the payload carries no rooms — never blank.
        this.isTestMode = validRooms.length === 0;
        const src = this.isTestMode ? FALLBACK_DATA : data;
        const rooms = this.isTestMode ? FALLBACK_DATA.rooms : validRooms;
        const currency = (src.currency && String(src.currency).trim()) || 'USD';

        this.title = (src.title && String(src.title).trim()) || 'Choose your room';
        this.subtitle = (src.subtitle && String(src.subtitle).trim()) || '';
        this.submitText = (src.submitText && String(src.submitText).trim()) || 'Reserve';
        this.submitValue = (src.submitValue && String(src.submitValue).trim())
            || 'I would like to reserve this room';

        this.roomsBase = rooms.map((room, index) => {
            const key = room.id ? String(room.id) : 'room-' + index;
            const amenities = (Array.isArray(room.amenities) ? room.amenities : [])
                .filter((a) => a != null && String(a).trim())
                .slice(0, 3)
                .map((a, i) => ({ key: key + '-a-' + i, label: String(a).trim() }));
            const hasSleeps = room.sleeps != null && Number(room.sleeps) > 0;
            const bed = room.bed ? String(room.bed).trim() : '';
            const size = room.size ? String(room.size).trim() : '';
            return {
                key,
                name: (room.name && String(room.name).trim()) || 'Room',
                hasImage: !!(room.imageUrl && String(room.imageUrl).trim()),
                imageUrl: room.imageUrl ? String(room.imageUrl) : '',
                hasBadge: !!(room.badge && String(room.badge).trim()),
                badge: room.badge ? String(room.badge).trim() : '',
                hasBed: !!bed,
                bed,
                hasSize: !!size,
                size,
                hasSleeps,
                sleepsLabel: hasSleeps ? 'Sleeps ' + Number(room.sleeps) : '',
                hasMeta: !!(bed || size || hasSleeps),
                amenities,
                hasAmenities: amenities.length > 0,
                priceLabel: money(room.price, (room.currency && String(room.currency).trim()) || currency),
                cadenceLabel: '/ ' + ((room.cadence && String(room.cadence).trim()) || 'night')
            };
        });
    }

    // Selection-aware view of the rooms; recomputes when selectedKey changes.
    get rooms() {
        return this.roomsBase.map((r) => {
            const isSel = this.selectedKey === r.key;
            return Object.assign({}, r, {
                cardClass: isSel ? 'asa-rm-card is-selected' : 'asa-rm-card',
                ariaPressed: isSel ? 'true' : 'false',
                checkClass: isSel ? 'asa-rm-check on' : 'asa-rm-check'
            });
        });
    }

    get hasSubtitle() {
        return !!this.subtitle;
    }
    get showSubmit() {
        return !!this.selectedKey;
    }

    handleSelect(event) {
        const key = event.currentTarget.dataset.key;
        if (key) this.selectedKey = key;
    }

    handleReserve() {
        const room = this.roomsBase.find((r) => r.key === this.selectedKey);
        const base = this.submitValue || 'I would like to reserve this room';
        let message = base;
        if (room) {
            const priceBit = room.priceLabel ? ' (' + room.priceLabel + ' ' + room.cadenceLabel + ')' : '';
            message = base + ': ' + room.name + priceBit;
        }
        this.sendMessage(message);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaTravelRoomSelector sent:', message))
                    .catch((err) => console.error('AsaTravelRoomSelector send error:', err));
            } else {
                console.log('AsaTravelRoomSelector: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaTravelRoomSelector sendMessage error:', err);
        }
    }
}
