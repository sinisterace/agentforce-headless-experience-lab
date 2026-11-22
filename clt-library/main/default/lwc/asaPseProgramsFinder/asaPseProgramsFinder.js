/**
 * @description ASA Public Sector & Education · Programs & Benefits Finder renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders the programs / benefits / scholarships a resident or
 * student may qualify for in a "Civic Records" style: a navy agency masthead
 * over an official-paper panel of ruled, selectable program rows — each with a
 * seal-tinted category glyph, name/detail, and an eligibility "stamp" tag. The
 * customer selects one, then the CTA applies. The choice is sent back via
 * embeddedservice_configuration.util.sendTextMessage().
 *
 * Contract: the field names read below MUST match the example JSON + rules in
 * genAiFunctions/asaPseProgramsFinder_Output_b5c2/input/schema.json.
 * Fields: title?, subtitle?, programs[]{id, name, category?, detail?,
 * eligibility?, badge?}, submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

const CATEGORY_LABELS = {
    assistance: 'Assistance',
    education: 'Education',
    health: 'Health',
    housing: 'Housing',
    tax: 'Tax',
    employment: 'Employment',
    utility: 'Utility',
};

function titleCase(s) {
    return String(s || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

// Classify an eligibility note into a stamp variant: green (confirmed), amber
// (conditional), or navy (neutral/other).
function eligBucket(s) {
    const t = String(s || '').toLowerCase();
    if (/likely|qualif|eligible/.test(t)) return 'good';
    if (/may|might|possible|pending|review/.test(t)) return 'maybe';
    return 'navy';
}

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const TEST_DATA = {
    title: 'Programs & benefits you may qualify for',
    subtitle: "Based on what you've told us",
    programs: [
        { id: 'snap', name: 'Food assistance (SNAP)', category: 'assistance', detail: 'Monthly grocery benefits', eligibility: 'Likely eligible', badge: 'Popular' },
        { id: 'liheap', name: 'Energy bill relief (LIHEAP)', category: 'utility', detail: 'Help with heating & cooling costs', eligibility: 'May be eligible' },
        { id: 'grant', name: 'State tuition grant', category: 'education', detail: 'Up to $4,000/yr for residents', eligibility: 'Likely eligible' },
        { id: 'childcare', name: 'Childcare subsidy', category: 'assistance', detail: 'Sliding-scale childcare help' },
    ],
    submitText: 'Apply for selected',
    submitValue: "I'd like to apply for the selected program",
};

export default class AsaPseProgramsFinder extends LightningElement {
    @api value; // Receives the AsaPseProgramsFinderData object from the Lightning Type.

    @track title = 'Programs & benefits you may qualify for';
    @track subtitle = '';
    @track programs = [];
    @track submitText = 'Apply for selected';
    @track selectedId = '';

    isTestMode = false;
    submitValue = '';
    rawPrograms = [];

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.pseProgramsFinderJSON) {
                const data = JSON.parse(this.value.pseProgramsFinderJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaPseProgramsFinder parse error:', e.message);
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
        this.isTestMode = !(Array.isArray(raw.programs) && raw.programs.filter((p) => p && p.name).length);
        const src = this.isTestMode ? TEST_DATA : raw;

        this.title = (src.title && String(src.title).trim()) || 'Programs & benefits you may qualify for';
        this.subtitle = src.subtitle ? String(src.subtitle).trim() : '';
        this.submitText = src.submitText ? String(src.submitText).trim() : 'Apply for selected';
        this.submitValue = src.submitValue ? String(src.submitValue).trim() : '';

        this.rawPrograms = (Array.isArray(src.programs) ? src.programs : []).filter((p) => p && p.name);
        this.selectedId = '';
        this.rebuild();
    }

    rebuild() {
        this.programs = this.rawPrograms.map((p, i) => {
            const id = p.id ? String(p.id) : `program-${i}`;
            const cat = String(p.category || '').toLowerCase().replace(/[^a-z_]/g, '');
            const known = !!CATEGORY_LABELS[cat];
            const selected = id === this.selectedId;
            return {
                key: id,
                id,
                name: String(p.name).trim(),
                category: cat,
                categoryLabel: cat ? (CATEGORY_LABELS[cat] || titleCase(cat)) : '',
                hasCategory: !!cat,
                iAssistance: cat === 'assistance',
                iEducation: cat === 'education',
                iHealth: cat === 'health',
                iHousing: cat === 'housing',
                iTax: cat === 'tax',
                iEmployment: cat === 'employment',
                iUtility: cat === 'utility',
                iOther: !known,
                detail: p.detail ? String(p.detail).trim() : '',
                hasDetail: !!p.detail,
                eligibility: p.eligibility ? String(p.eligibility).trim() : '',
                hasEligibility: !!p.eligibility,
                eligClass: `asa-pf-stamp is-${eligBucket(p.eligibility)}`,
                badge: p.badge ? String(p.badge).trim() : '',
                hasBadge: !!p.badge,
                selected,
                rowClass: `asa-pf-row${selected ? ' is-selected' : ''}`,
                iconClass: `asa-pf-icon is-${cat || 'other'}`,
            };
        });
    }

    get hasSubtitle() { return !!this.subtitle; }
    get hasPrograms() { return this.programs.length > 0; }
    get ctaDisabled() { return !this.selectedId; }

    get selectedName() {
        const found = this.rawPrograms.find((p, i) => (p.id ? String(p.id) : `program-${i}`) === this.selectedId);
        return found ? String(found.name).trim() : '';
    }

    handleSelect(event) {
        const id = event.currentTarget.dataset.id;
        this.selectedId = this.selectedId === id ? '' : id;
        this.rebuild();
    }

    handleKey(event) {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
            event.preventDefault();
            this.handleSelect(event);
        }
    }

    handleSubmit() {
        if (!this.selectedId) return;
        const name = this.selectedName;
        const base = this.submitValue || 'I\'d like to apply for the selected program';
        const message = `${base} — ${name} (id: ${this.selectedId})`;
        this.sendMessage(message);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaPseProgramsFinder sent:', message))
                    .catch((err) => console.error('AsaPseProgramsFinder send error:', err));
            } else {
                console.log('AsaPseProgramsFinder: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaPseProgramsFinder sendMessage error:', err);
        }
    }
}
