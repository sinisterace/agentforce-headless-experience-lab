/**
 * @description Agentforce Coworker · IT · Change calendar renderer.
 * Bespoke vertical timeline: a date/time rail with connected nodes and risk-colored
 * change blocks (title, impact, status). (No CTAs.)
 *
 * Contract: field names below MUST match genAiFunctions/ecwChangeCalendar_Output_e5a6/input/schema.json.
 * Fields: headline?, changes[]{ title, when, risk (low|medium|high), state?, impact? }.
 */
import { LightningElement, api, track } from 'lwc';

const RISK_STATE = { low: 'low', medium: 'med', high: 'high' };

const TEST_DATA = {
    headline: '3 changes this week',
    changes: [
        { title: 'VPN gateway upgrade', when: 'Sat 11:00 PM', risk: 'low', state: 'Scheduled', impact: 'Remote access briefly unavailable (~15 min) during the cutover.' },
        { title: 'Workday quarterly update', when: 'Sun 6:00 AM', risk: 'medium', state: 'Scheduled', impact: 'HR self-service read-only for ~2 hours; payroll unaffected.' },
        { title: 'Badge system firmware patch', when: 'Tue 7:00 PM', risk: 'low', state: 'Approved', impact: 'No expected downtime; readers update in rolling batches.' }
    ]
};

export default class EcwChangeCalendar extends LightningElement {
    @api value;

    @track headline = '';
    @track changes = [];

    isTestMode = false;

    connectedCallback() { if (!this.tryLoadFromFlow()) this.initializeFromData({}); }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwChangeCalendarJSON) {
                const data = JSON.parse(this.value.ecwChangeCalendarJSON);
                if (data && typeof data === 'object' && Array.isArray(data.changes)) { this.initializeFromData(data); return true; }
            }
        } catch (e) { console.error('EcwChangeCalendar parse error:', e.message); }
        return false;
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = Array.isArray(raw.changes) && raw.changes.length > 0;
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.headline = src.headline ? String(src.headline).trim() : '';

        const list = (Array.isArray(src.changes) ? src.changes : []).filter((c) => c && c.title);
        this.changes = list.map((c, i) => {
            const risk = ['low', 'medium', 'high'].includes(c.risk) ? c.risk : 'low';
            const when = (c.when ? String(c.when).trim() : '').split(/\s+/);
            return {
                key: `chg-${i}`,
                day: when[0] || '',
                time: when.slice(1).join(' '),
                title: String(c.title).trim(),
                riskLabel: `${risk.charAt(0).toUpperCase()}${risk.slice(1)} risk`,
                riskClass: `ecw-cc-risk is-${RISK_STATE[risk]}`,
                calClass: `ecw-cc-cal is-${RISK_STATE[risk]}`,
                nodeClass: `ecw-cc-node is-${RISK_STATE[risk]}`,
                state: c.state ? String(c.state).trim() : '',
                hasState: !!(c.state && String(c.state).trim()),
                impact: c.impact ? String(c.impact).trim() : '',
                hasImpact: !!(c.impact && String(c.impact).trim()),
                itemClass: i === list.length - 1 ? 'ecw-cc-item is-last' : 'ecw-cc-item'
            };
        });
    }

    get hasChanges() { return this.changes.length > 0; }
    get count() { return this.changes.length; }
    get countUnit() { return this.changes.length === 1 ? 'upcoming change' : 'upcoming changes'; }
}