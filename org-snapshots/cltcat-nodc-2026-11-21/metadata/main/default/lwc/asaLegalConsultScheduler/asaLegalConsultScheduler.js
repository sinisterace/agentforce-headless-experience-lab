/**
 * @description ASA Legal · Consultation Scheduler renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a consultation booking flow: an attorney hero header
 * (headshot/initials + name + focus), a meeting-mode toggle (in person / phone /
 * video), a horizontal day picker, and a grid of time slots. Picking a slot
 * reveals the confirm button; tapping it sends the chosen slot back to the agent
 * through embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaLegalConsultScheduler_Output_7d4f/input/schema.json.
 * Fields: title?, subtitle?, attorneyName?, attorneyTitle?, attorneyPhoto?,
 * modes[]{id,label,icon?}, days[]{id,label,sublabel?,slots[]{id,label,disabled?}},
 * note?, submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';
import LAWYER_1 from '@salesforce/resourceUrl/asaLegalLawyer1';
import LAWYER_2 from '@salesforce/resourceUrl/asaLegalLawyer2';
import LAWYER_3 from '@salesforce/resourceUrl/asaLegalLawyer3';

// Bundled attorney headshots (see asaLegalAttorneyMatch for the full note).
const PHOTO_MAP = {
    'lawyer-1': LAWYER_1,
    'lawyer-2': LAWYER_2,
    'lawyer-3': LAWYER_3,
    asaLegalLawyer1: LAWYER_1,
    asaLegalLawyer2: LAWYER_2,
    asaLegalLawyer3: LAWYER_3
};

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Renders
// when the Flow payload is missing/malformed or has no days-with-slots. Plain
// object (no JSON.parse).
const FALLBACK_DATA = {
    title: 'Book your free consultation',
    attorneyName: 'Marcus Vale',
    attorneyTitle: 'Managing Partner · Personal Injury',
    attorneyPhoto: 'lawyer-1',
    modes: [
        { id: 'in_person', label: 'In person', icon: 'in_person' },
        { id: 'phone', label: 'Phone', icon: 'phone' },
        { id: 'video', label: 'Video', icon: 'video' }
    ],
    days: [
        { id: 'mon', label: 'Mon', sublabel: 'Sep 21', slots: [{ id: 'm1', label: '9:00 AM' }, { id: 'm2', label: '11:30 AM' }, { id: 'm3', label: '2:00 PM' }] },
        { id: 'tue', label: 'Tue', sublabel: 'Sep 22', slots: [{ id: 't1', label: '10:00 AM' }, { id: 't2', label: '1:00 PM', disabled: true }, { id: 't3', label: '3:30 PM' }] },
        { id: 'wed', label: 'Wed', sublabel: 'Sep 23', slots: [{ id: 'w1', label: '9:30 AM' }, { id: 'w2', label: '12:00 PM' }, { id: 'w3', label: '4:00 PM' }] },
        { id: 'thu', label: 'Thu', sublabel: 'Sep 24', slots: [{ id: 'h1', label: '11:00 AM' }, { id: 'h2', label: '2:30 PM' }] },
        { id: 'fri', label: 'Fri', sublabel: 'Sep 25', slots: [{ id: 'f1', label: '9:00 AM' }, { id: 'f2', label: '10:30 AM' }, { id: 'f3', label: '1:30 PM' }] }
    ],
    note: 'Free 30-minute consultation · no obligation',
    submitText: 'Confirm consultation',
    submitValue: 'I would like to book'
};

function resolvePhoto(photo) {
    // Swap a bundled headshot key ('lawyer-1|2|3') or '/resource/<Name>' sentinel
    // for the versioned static-resource URL; honour real https URLs; else fall
    // back to initials.
    if (!photo) return '';
    const p = String(photo).trim();
    if (!p) return '';
    if (PHOTO_MAP[p]) return PHOTO_MAP[p];
    const m = /^\/resource\/([A-Za-z0-9_]+)/.exec(p);
    if (m && PHOTO_MAP[m[1]]) return PHOTO_MAP[m[1]];
    return /^https?:\/\//i.test(p) ? p : '';
}

function initialsOf(name) {
    return String(name || '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => (w[0] ? w[0].toUpperCase() : ''))
        .join('');
}

export default class AsaLegalConsultScheduler extends LightningElement {
    @api value; // Receives the AsaLegalConsultSchedulerData object from the Lightning Type.

    @track title = 'Book your free consultation';
    @track subtitle = '';
    @track attorneyName = '';
    @track attorneyTitle = '';
    @track photoSrc = '';
    @track initials = '';
    @track note = '';

    @track _modes = [];
    @track _days = [];

    submitText = 'Confirm consultation';
    submitValue = 'I would like to book';
    isTestMode = false;

    selectedModeId = '';
    selectedDayIndex = 0;
    selectedSlotId = '';

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.legalConsultSchedulerJSON) {
                const data = JSON.parse(this.value.legalConsultSchedulerJSON);
                if (data && typeof data === 'object') {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaLegalConsultScheduler parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData(FALLBACK_DATA);
    }

    initializeFromData(data) {
        const allDays = Array.isArray(data.days) ? data.days : [];
        const usableDays = allDays.filter((d) => d && Array.isArray(d.slots) && d.slots.length > 0);
        // Test mode when no day carries selectable slots — never blank.
        this.isTestMode = usableDays.length === 0;

        this.title = (this.isTestMode ? FALLBACK_DATA.title : (data.title && String(data.title).trim())) || FALLBACK_DATA.title;
        this.attorneyName = this.isTestMode ? FALLBACK_DATA.attorneyName : ((data.attorneyName && String(data.attorneyName).trim()) || '');
        this.attorneyTitle = this.isTestMode ? FALLBACK_DATA.attorneyTitle : ((data.attorneyTitle && String(data.attorneyTitle).trim()) || '');
        this.photoSrc = resolvePhoto(this.isTestMode ? FALLBACK_DATA.attorneyPhoto : data.attorneyPhoto);
        this.initials = initialsOf(this.attorneyName);
        // Subtitle only shows when there is no attorney hero (mirrors the editor).
        this.subtitle = this.attorneyName ? '' : ((data.subtitle && String(data.subtitle).trim()) || '');

        this.note = ((data.note && String(data.note).trim()) || FALLBACK_DATA.note);
        this.submitText = ((data.submitText && String(data.submitText).trim()) || 'Confirm consultation');
        this.submitValue = ((data.submitValue && String(data.submitValue).trim()) || 'I would like to book');

        const modesRaw = (Array.isArray(data.modes) && data.modes.length)
            ? data.modes
            : (this.isTestMode ? FALLBACK_DATA.modes : []);
        this._modes = modesRaw
            .filter((m) => m && (m.id || m.label))
            .map((m) => ({
                id: m.id || m.label,
                label: (m.label && String(m.label).trim()) || String(m.id || ''),
                icon: (m.icon || m.id || '').toString().toLowerCase()
            }));

        const daysRaw = this.isTestMode ? FALLBACK_DATA.days : usableDays;
        this._days = daysRaw.map((d, i) => ({
            id: d.id || `day-${i}`,
            label: (d.label && String(d.label).trim()) || `Day ${i + 1}`,
            sublabel: d.sublabel ? String(d.sublabel).trim() : '',
            slots: (Array.isArray(d.slots) ? d.slots : [])
                .filter((s) => s && (s.label || s.id))
                .map((s, j) => ({
                    id: s.id || `s-${i}-${j}`,
                    label: (s.label && String(s.label).trim()) || String(s.id || ''),
                    disabled: !!s.disabled
                }))
        }));

        this.selectedModeId = this._modes.length ? this._modes[0].id : '';
        this.selectedDayIndex = 0;
        this.selectedSlotId = '';
    }

    get hasModes() {
        return this._modes && this._modes.length > 0;
    }

    get modesView() {
        return this._modes.map((m) => {
            const selected = m.id === this.selectedModeId;
            return {
                id: m.id,
                label: m.label,
                selected,
                cssClass: selected ? 'asa-lcs-mode is-selected' : 'asa-lcs-mode',
                iconMap: m.icon === 'in_person',
                iconPhone: m.icon === 'phone',
                iconVideo: m.icon === 'video',
                iconCal: !['in_person', 'phone', 'video'].includes(m.icon)
            };
        });
    }

    get daysView() {
        const active = Math.min(this.selectedDayIndex, this._days.length - 1);
        return this._days.map((d, index) => {
            const selected = index === active;
            return {
                key: d.id,
                index: String(index),
                label: d.label,
                sublabel: d.sublabel,
                hasSublabel: !!d.sublabel,
                selected,
                cssClass: selected ? 'asa-lcs-day is-selected' : 'asa-lcs-day'
            };
        });
    }

    get activeDay() {
        if (!this._days.length) return { slots: [] };
        return this._days[Math.min(this.selectedDayIndex, this._days.length - 1)] || { slots: [] };
    }

    get activeSlotsView() {
        return (this.activeDay.slots || []).map((s) => {
            const selected = s.id === this.selectedSlotId && !s.disabled;
            return {
                key: s.id,
                id: s.id,
                label: s.label,
                disabled: s.disabled,
                selected,
                cssClass: selected ? 'asa-lcs-slot is-selected' : 'asa-lcs-slot'
            };
        });
    }

    get hasSelectedSlot() {
        return !!this.selectedSlotId;
    }

    handleModeClick(event) {
        this.selectedModeId = event.currentTarget.dataset.id;
    }

    handleDayClick(event) {
        this.selectedDayIndex = parseInt(event.currentTarget.dataset.index, 10) || 0;
        this.selectedSlotId = '';
    }

    handleSlotClick(event) {
        this.selectedSlotId = event.currentTarget.dataset.id;
    }

    handleSubmit() {
        this.sendMessage(this.buildMessage());
    }

    // A scheduler sends the chosen slot: base intent + selected mode / day / time.
    buildMessage() {
        const base = this.submitValue || 'I would like to book';
        const mode = this._modes.find((m) => m.id === this.selectedModeId);
        const day = this.activeDay;
        const slot = (this.activeDay.slots || []).find((s) => s.id === this.selectedSlotId);

        const parts = [];
        if (mode && mode.label) parts.push(mode.label);
        if (day && day.label) {
            parts.push(day.sublabel ? `${day.label} ${day.sublabel}` : day.label);
        }
        if (slot && slot.label) parts.push('at ' + slot.label);

        return parts.length ? `${base} — ${parts.join(', ')}` : base;
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaLegalConsultScheduler sent:', message))
                    .catch((err) => console.error('AsaLegalConsultScheduler send error:', err));
            } else {
                console.log('AsaLegalConsultScheduler: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaLegalConsultScheduler sendMessage error:', err);
        }
    }
}