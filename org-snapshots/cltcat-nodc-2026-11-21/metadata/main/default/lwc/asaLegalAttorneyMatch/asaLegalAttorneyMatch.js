/**
 * @description ASA Legal · Meet Your Attorney renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders attorney cards matched to the visitor's matter (name,
 * role/focus, rating, years, cases, bar number, blurb). The visitor selects one
 * and taps the book button, which sends a message back to the agent through
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaLegalAttorneyMatch_Output_7c3e/input/schema.json.
 * Fields: title?, subtitle?, attorneys[]{ id?, name, title?, focus?, photo?,
 * initials?, years?, rating?, casesWon?, bar?, blurb? }, submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';
import LAWYER_1 from '@salesforce/resourceUrl/asaLegalLawyer1';
import LAWYER_2 from '@salesforce/resourceUrl/asaLegalLawyer2';
import LAWYER_3 from '@salesforce/resourceUrl/asaLegalLawyer3';

// Bundled attorney headshots. A payload references these by a stable key
// ('lawyer-1|2|3') or a '/resource/<Name>' sentinel; a raw key/path does NOT
// load inside Agentforce/ECv2, so swap it for the versioned URL that
// @salesforce/resourceUrl resolves. Full https URLs pass through; anything else
// falls back to initials.
const PHOTO_MAP = {
    'lawyer-1': LAWYER_1,
    'lawyer-2': LAWYER_2,
    'lawyer-3': LAWYER_3,
    asaLegalLawyer1: LAWYER_1,
    asaLegalLawyer2: LAWYER_2,
    asaLegalLawyer3: LAWYER_3
};
function resolvePhoto(photo) {
    if (!photo) return '';
    const p = String(photo).trim();
    if (!p) return '';
    if (PHOTO_MAP[p]) return PHOTO_MAP[p];
    const m = /^\/resource\/([A-Za-z0-9_]+)/.exec(p);
    if (m && PHOTO_MAP[m[1]]) return PHOTO_MAP[m[1]];
    return /^https?:\/\//i.test(p) ? p : '';
}

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content, no photo
// keys — initials render instead of photos). Used when the Flow payload is
// missing/malformed. Plain object (no JSON.parse), so nothing here can fail.
const FALLBACK_DATA = {
    title: 'Meet your attorney',
    subtitle: 'Matched to your matter — book a free consult',
    attorneys: [
        { id: 'vale', name: 'Marcus Vale', title: 'Managing Partner', focus: 'Personal Injury & Litigation', years: 22, rating: 4.9, casesWon: '500+ cases', bar: 'CA #148203', blurb: 'Trial-tested advocate for serious injury and negligence claims.' },
        { id: 'tanaka', name: 'Kenji Tanaka', title: 'Associate', focus: 'Business & Immigration', years: 8, rating: 4.8, casesWon: '120+ matters', bar: 'CA #276514', blurb: 'Guides founders and families through formation, contracts and visas.' },
        { id: 'shaw', name: 'Eleanor Shaw', title: 'Partner', focus: 'Family & Estate Planning', years: 25, rating: 5.0, casesWon: '600+ cases', bar: 'CA #093117', blurb: 'Compassionate counsel for divorce, custody, wills and trusts.' }
    ]
};

export default class AsaLegalAttorneyMatch extends LightningElement {
    @api value; // Receives the AsaLegalAttorneyMatchData object from the Lightning Type.

    @track title = 'Meet your attorney';
    @track subtitle = '';
    @track attorneys = []; // display-ready rows (computed)

    isTestMode = false;
    rawAttorneys = [];
    submitTextRaw = '';
    submitValueRaw = '';
    selectedId = '';
    failed = {};

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.legalAttorneyMatchJSON) {
                const data = JSON.parse(this.value.legalAttorneyMatchJSON);
                if (data && typeof data === 'object') {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaLegalAttorneyMatch parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData(FALLBACK_DATA);
    }

    initializeFromData(data) {
        const list = Array.isArray(data.attorneys)
            ? data.attorneys.filter((a) => a && (a.name || a.id))
            : [];
        // Empty attorneys → show the neutral sample so the card is never blank.
        this.isTestMode = list.length === 0;
        const src = this.isTestMode ? FALLBACK_DATA : data;

        this.rawAttorneys = Array.isArray(src.attorneys)
            ? src.attorneys.filter((a) => a && (a.name || a.id))
            : [];
        this.title = (src.title && String(src.title).trim()) || 'Meet your attorney';
        this.subtitle = this.isTestMode
            ? 'Matched to your matter — book a free consult'
            : (data.subtitle && String(data.subtitle).trim()) || '';
        this.submitTextRaw = (data.submitText && String(data.submitText).trim()) || '';
        this.submitValueRaw = (data.submitValue && String(data.submitValue).trim()) || '';
        this.selectedId = '';
        this.failed = {};
        this.recompute();
    }

    keyFor(a, index) {
        return a && (a.id || a.name) ? String(a.id || a.name) : 'atty-' + index;
    }

    initialsOf(name) {
        return String(name || '')
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => (w[0] ? w[0].toUpperCase() : ''))
            .join('');
    }

    recompute() {
        this.attorneys = this.rawAttorneys.map((a, index) => {
            const id = this.keyFor(a, index);
            const selected = this.selectedId === id;
            const initials = (a.initials && String(a.initials).trim()) || this.initialsOf(a.name);
            const photoSrc = resolvePhoto(a.photo);
            const showImg = !!photoSrc && !this.failed[id];
            const hasRating = typeof a.rating === 'number' && !isNaN(a.rating);
            const yearsText = a.years ? String(a.years) + ' yrs' : '';
            const casesWon = a.casesWon && String(a.casesWon).trim() ? String(a.casesWon) : '';
            const focusLine = [a.title, a.focus].filter(Boolean).join(' · ');
            const blurb = a.blurb && String(a.blurb).trim() ? String(a.blurb) : '';
            const bar = a.bar && String(a.bar).trim() ? String(a.bar) : '';
            return {
                id,
                name: a.name || 'Attorney',
                initials,
                photoSrc,
                showImg,
                focusLine,
                hasFocusLine: !!focusLine,
                hasRating,
                ratingText: hasRating ? Number(a.rating).toFixed(1) : '',
                hasYears: !!yearsText,
                yearsText,
                hasCases: !!casesWon,
                casesWon,
                hasStats: hasRating || !!yearsText || !!casesWon,
                hasBlurb: !!blurb,
                blurb,
                hasBar: !!bar,
                bar,
                selected,
                cardClass: selected ? 'asa-lam-card is-selected' : 'asa-lam-card'
            };
        });
    }

    get hasSubtitle() {
        return !!this.subtitle;
    }
    get hasAttorneys() {
        return this.attorneys && this.attorneys.length > 0;
    }
    get chosen() {
        return this.rawAttorneys.find((a, i) => this.keyFor(a, i) === this.selectedId);
    }
    get showSubmit() {
        return !!this.selectedId && !!this.chosen;
    }
    get submitText() {
        const c = this.chosen;
        const firstName = c && c.name ? String(c.name).split(/\s+/)[0] : '';
        return (this.submitTextRaw || (c ? 'Book with ' + firstName : 'Book a consult')).trim();
    }

    handleSelect(event) {
        const id = event.currentTarget.dataset.id;
        this.selectedId = id;
        this.recompute();
    }

    handleImgError(event) {
        const id = event.currentTarget.dataset.id;
        if (id) {
            this.failed = { ...this.failed, [id]: true };
            this.recompute();
        }
    }

    handleSubmit() {
        const c = this.chosen;
        const name = c && c.name ? String(c.name) : '';
        let message;
        if (this.submitValueRaw) {
            message = name ? (this.submitValueRaw + ' ' + name).trim() : this.submitValueRaw;
        } else {
            message = name ? "I'd like to book a consultation with " + name : "I'd like to book a consultation";
        }
        this.sendMessage(message);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaLegalAttorneyMatch sent:', message))
                    .catch((err) => console.error('AsaLegalAttorneyMatch send error:', err));
            } else {
                console.log('AsaLegalAttorneyMatch: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaLegalAttorneyMatch sendMessage error:', err);
        }
    }
}