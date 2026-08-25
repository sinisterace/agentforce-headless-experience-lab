/**
 * @description ASA Automotive · Test Drive Scheduler renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a booking card: a vehicle header, a row of selectable
 * day tabs, and a grid of time-slot chips (showroom or at-home) for the chosen
 * day. Confirming a slot sends the choice back to the agent through
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaAutoTestDrive_Output_a3b4/input/schema.json.
 * Fields: title, vehicle?{ name, trim?, initials?, imageUrl? },
 * location?{ name, address? }, days[] of { date, slots[] of
 * { id, time, driveType? } }, submitText?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Renders
// when the Flow payload is missing/malformed. Plain object (no JSON.parse), so
// nothing here can fail.
const FALLBACK_DATA = {
    title: 'Book a test drive',
    vehicle: { name: 'Electric SUV', trim: 'RS AWD · Radiant Red', initials: 'EV', imageUrl: '' },
    location: { name: 'Downtown Dealership', address: '500 Market St, San Francisco' },
    days: [
        { date: '2026-09-16', slots: [
            { id: 'a', time: '09:30', driveType: 'showroom' },
            { id: 'b', time: '13:00', driveType: 'at_home' }
        ] },
        { date: '2026-09-17', slots: [
            { id: 'c', time: '10:00', driveType: 'showroom' },
            { id: 'd', time: '15:30', driveType: 'showroom' }
        ] },
        { date: '2026-09-18', slots: [
            { id: 'e', time: '11:00', driveType: 'at_home' },
            { id: 'f', time: '16:00', driveType: 'showroom' }
        ] },
        { date: '2026-09-21', slots: [
            { id: 'g', time: '09:00', driveType: 'showroom' },
            { id: 'h', time: '14:00', driveType: 'at_home' }
        ] },
        { date: '2026-09-22', slots: [
            { id: 'i', time: '10:30', driveType: 'showroom' },
            { id: 'j', time: '17:00', driveType: 'showroom' }
        ] }
    ]
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default class AsaAutoTestDrive extends LightningElement {
    @api value; // Receives the AsaAutoTestDriveData object from the Lightning Type.

    @track title = 'Book a test drive';
    @track submitText = 'Book test drive';
    @track vehicleName = '';
    @track vehicleTrim = '';
    @track vehicleInitials = '';
    @track vehicleImageUrl = '';
    @track hasVehicleImage = false;
    @track hasVehicle = false;
    @track locationName = '';
    @track locationAddress = '';
    @track hasLocation = false;
    @track days = []; // display-ready day tabs (computed)
    @track slots = []; // display-ready slots for the selected day (computed)

    rawDays = [];
    selectedDayIndex = 0;
    selectedSlotId = '';
    isTestMode = false;

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.autoTestDriveJSON) {
                const data = JSON.parse(this.value.autoTestDriveJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaAutoTestDrive parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData(FALLBACK_DATA);
    }

    isUsable(data) {
        return data && typeof data === 'object';
    }

    initializeFromData(data) {
        const list = Array.isArray(data.days) ? data.days.filter((d) => d && Array.isArray(d.slots) && d.slots.length) : [];
        // No usable days → show generic sample so it is never blank.
        this.isTestMode = list.length === 0;
        const source = this.isTestMode ? FALLBACK_DATA : { ...data, days: list };
        this.rawDays = Array.isArray(source.days) ? source.days : [];
        this.title = (source.title && String(source.title).trim()) || 'Book a test drive';
        this.submitText = (data.submitText && String(data.submitText).trim()) || 'Book test drive';

        const vehicle = source.vehicle && typeof source.vehicle === 'object' ? source.vehicle : null;
        this.vehicleName = vehicle && vehicle.name ? String(vehicle.name) : '';
        this.vehicleTrim = vehicle && vehicle.trim ? String(vehicle.trim) : '';
        this.vehicleInitials = this.initialsFor(vehicle);
        this.vehicleImageUrl = vehicle && vehicle.imageUrl ? String(vehicle.imageUrl).trim() : '';
        this.hasVehicleImage = !!this.vehicleImageUrl;
        this.hasVehicle = !!this.vehicleName;

        const loc = source.location && typeof source.location === 'object' ? source.location : null;
        this.locationName = loc && loc.name ? String(loc.name) : '';
        this.locationAddress = loc && loc.address ? String(loc.address) : '';
        this.hasLocation = !!this.locationName;

        this.selectedDayIndex = 0;
        this.selectedSlotId = '';
        this.recompute();
    }

    initialsFor(vehicle) {
        if (!vehicle) return '';
        if (vehicle.initials) return String(vehicle.initials).trim().slice(0, 2).toUpperCase();
        const name = vehicle.name ? String(vehicle.name).trim() : '';
        if (!name) return '';
        const parts = name.split(/\s+/);
        const first = parts[0] ? parts[0].charAt(0) : '';
        const last = parts.length > 1 ? parts[1].charAt(0) : '';
        return (first + last).toUpperCase();
    }

    driveBucket(v) {
        const raw = String(v || '').toLowerCase().replace(/[^a-z]/g, '');
        if (raw === 'athome' || raw === 'home' || raw === 'mobile' || raw === 'atyourdoor') return 'athome';
        return 'showroom';
    }

    driveLabel(bucket) {
        return bucket === 'athome' ? 'At home' : 'Showroom';
    }

    formatDate(iso) {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
        if (!m) return { weekday: '', dayNum: String(iso || ''), long: String(iso || '') };
        const y = Number(m[1]);
        const mo = Number(m[2]) - 1;
        const d = Number(m[3]);
        const dt = new Date(Date.UTC(y, mo, d));
        const wd = WEEKDAYS[dt.getUTCDay()] || '';
        return { weekday: wd, dayNum: String(d), long: `${wd}, ${MONTHS[mo] || ''} ${d}` };
    }

    formatTime(hhmm) {
        const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
        if (!m) return String(hhmm || '');
        let h = Number(m[1]);
        const min = m[2];
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        return `${h}:${min} ${ampm}`;
    }

    recompute() {
        const dayIdx = this.selectedDayIndex;
        this.days = this.rawDays.map((day, index) => {
            const fmt = this.formatDate(day.date);
            const isSelected = index === dayIdx;
            return {
                key: 'day-' + index,
                index,
                weekday: fmt.weekday,
                dayNum: fmt.dayNum,
                selected: isSelected,
                tabClass: isSelected ? 'asa-td-day is-selected' : 'asa-td-day'
            };
        });

        const current = this.rawDays[dayIdx] || { slots: [] };
        const slots = Array.isArray(current.slots) ? current.slots : [];
        this.slots = slots.map((slot, index) => {
            const id = slot && slot.id ? String(slot.id) : `d${dayIdx}-s${index}`;
            const bucket = this.driveBucket(slot.driveType);
            const isSelected = id === this.selectedSlotId;
            return {
                key: id,
                id,
                dayIndex: dayIdx,
                time: this.formatTime(slot.time),
                typeLabel: this.driveLabel(bucket),
                selected: isSelected,
                isShowroom: bucket === 'showroom',
                isAthome: bucket === 'athome',
                chipClass: 'asa-td-slot is-' + bucket + (isSelected ? ' is-selected' : '')
            };
        });
    }

    get hasDays() {
        return this.days && this.days.length > 0;
    }

    get monthLabel() {
        const day = this.rawDays[this.selectedDayIndex] || this.rawDays[0];
        if (!day) return '';
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day.date || ''));
        if (!m) return '';
        return `${MONTHS[Number(m[2]) - 1] || ''} ${m[1]}`;
    }

    get hasSlots() {
        return this.slots && this.slots.length > 0;
    }

    get showSubmit() {
        return !!this.selectedSlotId;
    }

    get submitLabel() {
        return this.submitText || 'Book test drive';
    }

    handleImageError() {
        this.hasVehicleImage = false;
        this.vehicleImageUrl = '';
    }

    handleDaySelect(event) {
        const index = Number(event.currentTarget.dataset.index);
        if (Number.isNaN(index) || index === this.selectedDayIndex) return;
        this.selectedDayIndex = index;
        this.selectedSlotId = '';
        this.recompute();
    }

    handleSlotSelect(event) {
        const id = String(event.currentTarget.dataset.id || '');
        if (!id) return;
        this.selectedSlotId = id;
        this.recompute();
    }

    handleSubmit() {
        const day = this.rawDays[this.selectedDayIndex];
        if (!day) return;
        const slots = Array.isArray(day.slots) ? day.slots : [];
        const raw = slots.find((s, i) => (s && s.id ? String(s.id) : `d${this.selectedDayIndex}-s${i}`) === this.selectedSlotId);
        if (!raw) return;
        const when = this.formatDate(day.date).long;
        const time = this.formatTime(raw.time);
        const bucket = this.driveBucket(raw.driveType);
        const where = bucket === 'athome' ? 'at home' : 'at the showroom';
        const vehicle = this.vehicleName ? ` of the ${this.vehicleName}` : '';
        this.sendMessage(`Book a test drive${vehicle} on ${when} at ${time} (${where}) (id: ${this.selectedSlotId})`);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaAutoTestDrive sent:', message))
                    .catch((err) => console.error('AsaAutoTestDrive send error:', err));
            } else {
                console.log('AsaAutoTestDrive: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaAutoTestDrive sendMessage error:', err);
        }
    }
}
