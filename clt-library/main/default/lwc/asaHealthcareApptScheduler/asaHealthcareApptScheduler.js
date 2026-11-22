/**
 * @description ASA Healthcare · Appointment Scheduler renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a booking card: a provider header, a row of selectable
 * day tabs, and a grid of time-slot chips for the chosen day. Confirming a slot
 * sends the choice back to the agent through
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaHealthcareApptScheduler_Output_e5b1/input/schema.json.
 * Fields: title, provider?{ name, specialty?, initials?, imageUrl?,
 * badge?, rating?, reviews? }, location?{ name, address? }, days[] of
 * { date, slots[] of { id, time, visitType? } }, note?, submitText?.
 * badge/rating/reviews/note are optional display-only enrichments —
 * rendered when present, hidden otherwise (carried by the seed payload).
 */
import { LightningElement, api, track } from 'lwc';
import DR_MAYA_CHEN from '@salesforce/resourceUrl/asaHealthcareDrMayaChen';

// Bundled static-resource images. A payload references these by the stable
// '/resource/<name>' path, but a raw '/resource/<name>' string does NOT reliably
// load inside Agentforce/ECv2 (the card renders on a different base URL). At
// runtime we swap the sentinel path for the versioned URL @salesforce/resourceUrl
// resolves for the current app context. Full https imageUrls pass through as-is.
const STATIC_RESOURCE_URLS = {
    asaHealthcareDrMayaChen: DR_MAYA_CHEN
};

function resolveImageUrl(url) {
    if (!url) return '';
    const m = /^\/resource\/([A-Za-z0-9_]+)/.exec(url);
    if (m && STATIC_RESOURCE_URLS[m[1]]) return STATIC_RESOURCE_URLS[m[1]];
    return url;
}

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Renders
// when the Flow payload is missing/malformed. Plain object (no JSON.parse), so
// nothing here can fail.
const FALLBACK_DATA = {
    title: 'Book a visit',
    provider: { name: 'Dr. Maya Chen', specialty: 'Primary Care · Internal Medicine', initials: 'MC', imageUrl: '/resource/asaHealthcareDrMayaChen', badge: 'Accepting new patients', rating: 4.9, reviews: 320 },
    location: { name: 'Yerba Buena Medical Group', address: '150 4th St, San Francisco' },
    days: [
        { date: '2026-08-14', slots: [
            { id: 's1', time: '09:00', visitType: 'in-person' },
            { id: 's2', time: '10:30', visitType: 'video' },
            { id: 's3', time: '13:15', visitType: 'phone' }
        ] },
        { date: '2026-08-15', slots: [
            { id: 's4', time: '09:30', visitType: 'video' },
            { id: 's5', time: '11:45', visitType: 'in-person' },
            { id: 's6', time: '15:00', visitType: 'in-person' }
        ] }
    ],
    note: 'Telehealth & in-person visits · Most major insurance accepted'
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const VISIT_BUCKETS = ['inperson', 'video', 'phone'];

export default class AsaHealthcareApptScheduler extends LightningElement {
    @api value; // Receives the AsaHealthcareApptSchedulerData object from the Lightning Type.

    @track title = 'Book a visit';
    @track submitText = 'Confirm appointment';
    @track providerName = '';
    @track providerSpecialty = '';
    @track providerInitials = '';
    @track providerImageUrl = '';
    @track hasProviderImage = false;
    @track hasProvider = false;
    @track locationName = '';
    @track locationAddress = '';
    @track hasLocation = false;
    @track ratingText = '';
    @track hasRating = false;
    @track reviewsText = '';
    @track hasReviews = false;
    @track providerBadge = '';
    @track hasBadge = false;
    @track hasTrust = false;
    @track note = '';
    @track hasNote = false;
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
            if (this.value && this.value.healthcareApptSchedulerJSON) {
                const data = JSON.parse(this.value.healthcareApptSchedulerJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaHealthcareApptScheduler parse error:', e.message);
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
        this.title = (source.title && String(source.title).trim()) || 'Book a visit';
        this.submitText = (data.submitText && String(data.submitText).trim()) || 'Confirm appointment';

        const provider = source.provider && typeof source.provider === 'object' ? source.provider : null;
        this.providerName = provider && provider.name ? String(provider.name) : '';
        this.providerSpecialty = provider && provider.specialty ? String(provider.specialty) : '';
        this.providerInitials = this.initialsFor(provider);
        this.providerImageUrl = resolveImageUrl(provider && provider.imageUrl ? String(provider.imageUrl).trim() : '');
        this.hasProviderImage = !!this.providerImageUrl;
        this.hasProvider = !!this.providerName;

        const loc = source.location && typeof source.location === 'object' ? source.location : null;
        this.locationName = loc && loc.name ? String(loc.name) : '';
        this.locationAddress = loc && loc.address ? String(loc.address) : '';
        this.hasLocation = !!this.locationName;

        // Trust row (rating star + review count + badge) — optional; hidden when absent.
        const ratingNum = provider ? Number(provider.rating) : NaN;
        this.hasRating = !!provider && provider.rating != null && isFinite(ratingNum);
        this.ratingText = this.hasRating ? ratingNum.toFixed(1) : '';
        const reviewsNum = provider ? Number(provider.reviews) : NaN;
        this.hasReviews = this.hasRating && isFinite(reviewsNum) && reviewsNum > 0;
        this.reviewsText = this.hasReviews ? `(${reviewsNum})` : '';
        this.providerBadge = provider && provider.badge ? String(provider.badge).trim() : '';
        this.hasBadge = !!this.providerBadge;
        this.hasTrust = this.hasProvider && (this.hasRating || this.hasBadge);

        // Reassurance note (insurance / telehealth) — optional; hidden when absent.
        this.note = source.note ? String(source.note).trim() : '';
        this.hasNote = !!this.note;

        this.selectedDayIndex = 0;
        this.selectedSlotId = '';
        this.recompute();
    }

    initialsFor(provider) {
        if (!provider) return '';
        if (provider.initials) return String(provider.initials).trim().slice(0, 2).toUpperCase();
        const name = provider.name ? String(provider.name).replace(/^dr\.?\s+/i, '').trim() : '';
        if (!name) return '';
        const parts = name.split(/\s+/);
        const first = parts[0] ? parts[0].charAt(0) : '';
        const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
        return (first + last).toUpperCase();
    }

    visitBucket(v) {
        const raw = String(v || '').toLowerCase().replace(/[^a-z]/g, '');
        if (raw === 'video' || raw === 'telehealth' || raw === 'virtual') return 'video';
        if (raw === 'phone' || raw === 'call' || raw === 'audio') return 'phone';
        return 'inperson';
    }

    visitLabel(bucket) {
        if (bucket === 'video') return 'Video';
        if (bucket === 'phone') return 'Phone';
        return 'In person';
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
                tabClass: isSelected ? 'asa-ap-day is-selected' : 'asa-ap-day'
            };
        });

        const current = this.rawDays[dayIdx] || { slots: [] };
        const slots = Array.isArray(current.slots) ? current.slots : [];
        this.slots = slots.map((slot, index) => {
            const id = slot && slot.id ? String(slot.id) : `d${dayIdx}-s${index}`;
            const bucket = this.visitBucket(slot.visitType);
            const isSelected = id === this.selectedSlotId;
            const flags = {};
            VISIT_BUCKETS.forEach((b) => {
                flags['is' + b.charAt(0).toUpperCase() + b.slice(1)] = bucket === b;
            });
            return {
                key: id,
                id,
                dayIndex: dayIdx,
                time: this.formatTime(slot.time),
                typeLabel: this.visitLabel(bucket),
                selected: isSelected,
                ...flags,
                chipClass: 'asa-ap-slot is-' + bucket + (isSelected ? ' is-selected' : '')
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
        return this.submitText || 'Confirm appointment';
    }

    handleImageError() {
        this.hasProviderImage = false;
        this.providerImageUrl = '';
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
        const type = this.visitLabel(this.visitBucket(raw.visitType)).toLowerCase();
        const withWhom = this.providerName ? ` with ${this.providerName}` : '';
        this.sendMessage(`Book a ${type} appointment${withWhom} on ${when} at ${time}`);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaHealthcareApptScheduler sent:', message))
                    .catch((err) => console.error('AsaHealthcareApptScheduler send error:', err));
            } else {
                console.log('AsaHealthcareApptScheduler: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaHealthcareApptScheduler sendMessage error:', err);
        }
    }
}
