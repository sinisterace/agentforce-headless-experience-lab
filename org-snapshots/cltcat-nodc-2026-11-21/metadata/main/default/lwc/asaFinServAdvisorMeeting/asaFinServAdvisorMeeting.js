/**
 * @description ASA Financial Services · Advisor Appointment renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders the customer's matched advisor with available day/time
 * slots. The customer taps one slot and confirms; the choice is sent back to the
 * agent through embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaFinServAdvisorMeeting_Output_9b41/input/schema.json.
 * Fields: title?, advisor{ name, title?, specialty?, photoUrl?, initials? },
 * days[] of { date, slots[] of { id, time, meetingType? } }, submitText?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Renders
// when the Flow payload is missing/malformed. It is a plain object (no
// JSON.parse), so nothing here can fail.
const FALLBACK_DATA = {
    title: 'Book time with your advisor',
    advisor: {
        name: 'Jordan Lee',
        title: 'Senior Financial Advisor',
        specialty: 'Retirement & investment planning',
        initials: 'JL'
    },
    days: [
        {
            date: '2026-09-18',
            slots: [
                { id: 'slot-1', time: '09:00', meetingType: 'video' },
                { id: 'slot-2', time: '10:30', meetingType: 'phone' },
                { id: 'slot-3', time: '13:00', meetingType: 'in-branch' }
            ]
        },
        {
            date: '2026-09-19',
            slots: [
                { id: 'slot-4', time: '11:00', meetingType: 'video' },
                { id: 'slot-5', time: '14:30', meetingType: 'phone' },
                { id: 'slot-6', time: '16:00', meetingType: 'in-branch' }
            ]
        }
    ],
    submitText: 'Book appointment'
};

export default class AsaFinServAdvisorMeeting extends LightningElement {
    @api value; // Receives the AsaFinServAdvisorMeetingData object from the Lightning Type.

    @track title = '';
    @track submitText = 'Book appointment';
    @track advisor = {};
    @track days = []; // display-ready day groups (computed)
    @track errorMessage = '';

    rawDays = [];
    selectedKey = '';
    isTestMode = false;

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.finServAdvisorMeetingJSON) {
                const data = JSON.parse(this.value.finServAdvisorMeetingJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaFinServAdvisorMeeting parse error:', e.message);
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
        this.errorMessage = '';
        const days = Array.isArray(data.days) ? data.days : [];
        const hasSlots = days.some((d) => Array.isArray(d && d.slots) && d.slots.length > 0);
        // No bookable slots → show generic sample so the card is never blank.
        this.isTestMode = !hasSlots;
        const source = this.isTestMode ? FALLBACK_DATA : data;
        this.rawDays = Array.isArray(source.days) ? source.days : [];
        this.title = source.title || '';
        this.advisor = this.buildAdvisor(source.advisor);
        this.submitText = (data.submitText && String(data.submitText).trim()) || 'Book appointment';
        this.selectedKey = '';
        this.recompute();
    }

    buildAdvisor(advisor) {
        const a = advisor && typeof advisor === 'object' ? advisor : {};
        const name = a.name || 'Your advisor';
        const initials = (a.initials && String(a.initials).trim())
            || name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('')
            || 'A';
        return {
            name,
            title: a.title || '',
            specialty: a.specialty || '',
            photoUrl: a.photoUrl || '',
            initials,
            hasPhoto: !!a.photoUrl
        };
    }

    keyFor(dayIndex, slotIndex) {
        return 'd' + dayIndex + '-s' + slotIndex;
    }

    // ISO yyyy-mm-dd → "Thu, Aug 14" (parsed as a local date to avoid a tz
    // day-shift). Any non-ISO string is shown as-is.
    formatDate(value) {
        if (!value) return '';
        const s = String(value);
        const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!m) return s;
        try {
            const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
            return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(d);
        } catch (e) {
            return s;
        }
    }

    // "09:00"/"9:00" 24h → "9:00 AM". A string already carrying am/pm is shown
    // as-is (upper-cased); anything unparseable passes through unchanged.
    formatTime(value) {
        if (!value) return '';
        const s = String(value).trim();
        if (/[ap]\.?m\.?/i.test(s)) return s.toUpperCase().replace(/\s+/g, ' ');
        const m = s.match(/^(\d{1,2}):(\d{2})/);
        if (!m) return s;
        let h = Number(m[1]);
        const min = m[2];
        const period = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        return h + ':' + min + ' ' + period;
    }

    meetingTypeOf(slot) {
        const raw = String((slot && slot.meetingType) || '').toLowerCase().replace(/[^a-z]/g, '');
        if (raw === 'video' || raw === 'virtual' || raw === 'online' || raw === 'zoom') return 'video';
        if (raw === 'phone' || raw === 'call' || raw === 'audio') return 'phone';
        if (raw === 'inbranch' || raw === 'branch' || raw === 'inperson' || raw === 'office') return 'branch';
        return 'video';
    }

    meetingTypeLabel(type) {
        if (type === 'phone') return 'Phone call';
        if (type === 'branch') return 'In branch';
        return 'Video';
    }

    // ISO yyyy-mm-dd → { weekday:"Thu", day:"14", month:"August" } for the
    // calendar date tile. Returns null for non-ISO input (caller shows raw text).
    formatDateParts(value) {
        const s = String(value || '');
        const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!m) return null;
        try {
            const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
            return {
                weekday: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d),
                day: new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(d),
                month: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(d)
            };
        } catch (e) {
            return null;
        }
    }

    recompute() {
        this.days = this.rawDays.map((day, dayIndex) => {
            const slots = Array.isArray(day && day.slots) ? day.slots : [];
            const parts = this.formatDateParts(day && day.date);
            return {
                key: 'day-' + dayIndex,
                dateTile: parts,
                dateLabel: parts ? parts.month : this.formatDate(day && day.date),
                slots: slots.map((slot, slotIndex) => {
                    const key = this.keyFor(dayIndex, slotIndex);
                    const isSelected = key === this.selectedKey;
                    const type = this.meetingTypeOf(slot);
                    return {
                        key,
                        dayIndex,
                        slotIndex,
                        timeDisplay: this.formatTime(slot && slot.time),
                        typeLabel: this.meetingTypeLabel(type),
                        selected: isSelected,
                        isVideo: type === 'video',
                        isPhone: type === 'phone',
                        isBranch: type === 'branch',
                        slotClass: 'asa-appt-slot' + (isSelected ? ' selected' : '')
                    };
                })
            };
        });
    }

    get hasDays() {
        return this.days && this.days.some((d) => d.slots && d.slots.length > 0);
    }

    get showSubmit() {
        return !!this.selectedKey;
    }

    handleSelect(event) {
        const dayIndex = Number(event.currentTarget.dataset.day);
        const slotIndex = Number(event.currentTarget.dataset.slot);
        const key = this.keyFor(dayIndex, slotIndex);
        // Toggle off if the same slot is tapped again.
        this.selectedKey = this.selectedKey === key ? '' : key;
        this.recompute();
    }

    handleSubmit() {
        const parsed = this.parseSelectedKey();
        if (!parsed) return;
        const day = this.rawDays[parsed.dayIndex] || {};
        const slots = Array.isArray(day.slots) ? day.slots : [];
        const slot = slots[parsed.slotIndex];
        if (!slot) return;
        const type = this.meetingTypeOf(slot);
        const parts = [this.advisor.name];
        const dateDisplay = this.formatDate(day.date);
        const timeDisplay = this.formatTime(slot.time);
        if (dateDisplay) parts.push('on ' + dateDisplay);
        if (timeDisplay) parts.push('at ' + timeDisplay);
        parts.push('(' + this.meetingTypeLabel(type) + ')');
        const idPart = slot.id ? ` (id: ${slot.id})` : '';
        this.sendMessage(`Appointment requested with ${parts.join(' ')}${idPart}`);
    }

    parseSelectedKey() {
        const m = String(this.selectedKey).match(/^d(\d+)-s(\d+)$/);
        if (!m) return null;
        return { dayIndex: Number(m[1]), slotIndex: Number(m[2]) };
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaFinServAdvisorMeeting sent:', message))
                    .catch((err) => console.error('AsaFinServAdvisorMeeting send error:', err));
            } else {
                console.log('AsaFinServAdvisorMeeting: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaFinServAdvisorMeeting sendMessage error:', err);
        }
    }
}