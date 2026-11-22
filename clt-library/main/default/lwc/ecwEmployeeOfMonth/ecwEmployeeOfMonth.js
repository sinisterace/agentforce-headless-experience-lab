/**
 * @description Agentforce Coworker · Employee of the Month renderer (demo gag card).
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a celebratory card: a gold-ribbon "Employee of the Month"
 * header, a bundled headshot, name + title, a citation line, three playful stat
 * tiles, a badge strip, and two actions.
 *
 * Interactions are fully LOCAL (no agent round-trip, so they work reliably on
 * Coworker where embeddedservice sendTextMessage is unavailable):
 *  - Congratulate -> reveals "Lauren has been congratulated 4,000 times this quarter."
 *  - Nominate Someone Else -> flips to a second view whose only nominee is
 *    "Lauren Bailey, again".
 *
 * Contract: field names below MUST match genAiFunctions/ecwEmployeeOfMonth_Output_eom1/input/schema.json.
 * Fields: name, title, reason, stats[]{label,value}, badges[], congratulateText,
 * congratulateCount?, nomineeText.
 */
import { LightningElement, api, track } from 'lwc';
import LAUREN from '@salesforce/resourceUrl/ecwLaurenBailey';

// NEVER-BLANK GUARANTEE: the full gag payload, so the card renders even if the
// Flow passes an empty string.
const TEST_DATA = {
    name: 'Lauren Bailey',
    title: 'Chief Demo Officer',
    reason: 'Has appeared in every Salesforce demo since the dawn of time.',
    stats: [
        { label: 'Demos starred in', value: 'Yes' },
        { label: 'Opportunities closed', value: 'All of them' },
        { label: 'Days off', value: '0' },
    ],
    badges: ['Always Available', 'Never Churns', 'Loves Every Product'],
    congratulateText: 'Lauren has been congratulated 4,000 times this quarter.',
    congratulateCount: 4000,
    nomineeText: 'Lauren Bailey, again',
};

export default class EcwEmployeeOfMonth extends LightningElement {
    @api value; // EcwEmployeeOfMonthData object from the Lightning Type.

    photoUrl = LAUREN;

    @track name = '';
    @track title = '';
    @track reason = '';
    @track stats = [];
    @track badges = [];

    @track congratulated = false;
    @track congratulateText = '';
    @track nominateMode = false;
    @track nomineeText = '';

    connectedCallback() {
        if (!this.tryLoadFromFlow()) this.initializeFromData({});
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwEmployeeOfMonthJSON) {
                const data = JSON.parse(this.value.ecwEmployeeOfMonthJSON);
                if (data && typeof data === 'object') {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('EcwEmployeeOfMonth parse error:', e.message);
        }
        return false;
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = !!(raw.name || (Array.isArray(raw.stats) && raw.stats.length));
        const src = hasContent ? raw : TEST_DATA;

        this.name = (src.name && String(src.name).trim()) || 'Lauren Bailey';
        this.title = src.title ? String(src.title).trim() : '';
        this.reason = src.reason ? String(src.reason).trim() : '';

        this.stats = (Array.isArray(src.stats) ? src.stats : [])
            .filter((s) => s && s.label)
            .map((s, i) => ({
                key: `eom-stat-${i}`,
                label: String(s.label).trim(),
                value: s.value != null ? String(s.value).trim() : '',
            }));

        this.badges = (Array.isArray(src.badges) ? src.badges : [])
            .filter((b) => b && String(b).trim())
            .map((b, i) => ({ key: `eom-badge-${i}`, label: String(b).trim() }));

        this.congratulateText = src.congratulateText
            ? String(src.congratulateText).trim()
            : 'Lauren has been congratulated 4,000 times this quarter.';
        this.nomineeText = src.nomineeText ? String(src.nomineeText).trim() : 'Lauren Bailey, again';
    }

    get hasStats() { return this.stats.length > 0; }
    get hasBadges() { return this.badges.length > 0; }
    get congratulateLabel() { return this.congratulated ? 'Congratulated ✓' : 'Congratulate'; }
    get congratulateBtnClass() {
        return this.congratulated ? 'eom-btn eom-btn-primary is-done' : 'eom-btn eom-btn-primary';
    }

    handleCongratulate() {
        this.congratulated = true;
    }

    handleNominate() {
        this.nominateMode = true;
    }

    handleBack() {
        this.nominateMode = false;
    }
}
