/**
 * @description Agentforce Coworker · IT · Known issues renderer.
 * Bespoke incident-alert cards: each active incident is a card with a severity
 * color spine, a live pulse, an elapsed timer, and structured Impact / Workaround /
 * Latest-update fields. (No CTAs.)
 *
 * Contract: field names below MUST match genAiFunctions/ecwKnownIssues_Output_d3e4/input/schema.json.
 * Fields: openCount?, headline?, incidents[]{ id?, title, severity (P1|P2|P3), state?, started?, impact?, workaround?, update? }.
 */
import { LightningElement, api, track } from 'lwc';

const SEV_STATE = { P1: 'bad', P2: 'warn', P3: 'info' };

const TEST_DATA = {
    openCount: 2, headline: '2 active incidents',
    incidents: [
        { id: 'INC-20481', title: 'Badge Access System — intermittent reader timeouts', severity: 'P2', state: 'Investigating', started: '1h 20m ago', impact: 'HQ east-entrance badge readers; some employees see delayed unlocks.', workaround: 'Use the main-lobby reader or ask the front desk for a manual override.', update: 'Engineering identified a firmware regression; a fix is rolling out across readers.' },
        { id: 'INC-20474', title: 'Camera Cloud — slower video uploads', severity: 'P3', state: 'Monitoring', started: '3h ago', impact: 'Recorded clips take longer than usual to appear in Camera Cloud.', workaround: 'No action needed; uploads are completing, just delayed.', update: 'A capacity fix was applied; latency is recovering and being monitored.' }
    ]
};

export default class EcwKnownIssues extends LightningElement {
    @api value;

    @track headline = '';
    @track incidents = [];

    isTestMode = false;

    connectedCallback() { if (!this.tryLoadFromFlow()) this.initializeFromData({}); }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwKnownIssuesJSON) {
                const data = JSON.parse(this.value.ecwKnownIssuesJSON);
                if (data && typeof data === 'object' && Array.isArray(data.incidents)) { this.initializeFromData(data); return true; }
            }
        } catch (e) { console.error('EcwKnownIssues parse error:', e.message); }
        return false;
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = Array.isArray(raw.incidents) && raw.incidents.length > 0;
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.headline = src.headline ? String(src.headline).trim() : '';

        this.incidents = (Array.isArray(src.incidents) ? src.incidents : []).filter((i) => i && i.title).map((i, idx) => {
            const sev = ['P1', 'P2', 'P3'].includes(i.severity) ? i.severity : 'P3';
            const st = SEV_STATE[sev];
            const fields = [];
            if (i.impact) fields.push({ key: `f-${idx}-i`, label: 'Impact', value: String(i.impact).trim() });
            if (i.workaround) fields.push({ key: `f-${idx}-w`, label: 'Workaround', value: String(i.workaround).trim() });
            if (i.update) fields.push({ key: `f-${idx}-u`, label: 'Latest update', value: String(i.update).trim() });
            return {
                key: `inc-${idx}`,
                title: String(i.title).trim(),
                sev,
                rowClass: `ecw-ki-row is-${st}`,
                sevClass: `ecw-ki-sev is-${st}`,
                state: i.state ? String(i.state).trim() : '',
                hasState: !!(i.state && String(i.state).trim()),
                started: i.started ? String(i.started).trim() : '',
                hasStarted: !!(i.started && String(i.started).trim()),
                id: i.id ? String(i.id).trim() : '',
                fields
            };
        });
    }

    get hasIncidents() { return this.incidents.length > 0; }
    get count() { return this.incidents.length; }
    get countUnit() { return this.incidents.length === 1 ? 'open incident' : 'open incidents'; }
}
