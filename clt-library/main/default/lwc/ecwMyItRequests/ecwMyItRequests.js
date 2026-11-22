/**
 * @description Agentforce Coworker · IT · My IT requests renderer.
 * Bespoke ticket-tracker cards: each request is a ticket with a type glyph, a mono
 * ticket id, and a labeled node stepper (Submitted → … → Done) with the current
 * stage highlighted, plus a detail line. (No CTAs.)
 *
 * Contract: field names below MUST match genAiFunctions/ecwMyItRequests_Output_a9b1/input/schema.json.
 * Fields: openCount?, headline?, requests[]{ id?, title, type?, stages[string], stageIndex (number), detail?, state (good|warn|info) }.
 */
import { LightningElement, api, track } from 'lwc';

function typeKind(t) {
    const s = String(t || '').toLowerCase();
    if (s.includes('hardware')) return 'hardware';
    if (s.includes('access')) return 'access';
    if (s.includes('software')) return 'software';
    return 'other';
}

const TEST_DATA = {
    openCount: 2, headline: '2 open requests',
    requests: [
        { id: 'REQ-10234', title: 'MacBook Pro 16" refresh', type: 'Hardware', stages: ['Submitted', 'Approved', 'Fulfilling', 'Done'], stageIndex: 2, detail: 'Approved by your manager; ships from the IT depot in ~2 days.', state: 'info' },
        { id: 'REQ-10251', title: 'Access: Camera Cloud admin', type: 'Access', stages: ['Submitted', 'Approved', 'Granted'], stageIndex: 1, detail: 'Pending approval from Jordan Lee (your manager).', state: 'warn' },
        { id: 'REQ-10198', title: 'Figma license', type: 'Software', stages: ['Submitted', 'Approved', 'Fulfilling', 'Done'], stageIndex: 3, detail: 'License assigned — check your email for the activation link.', state: 'good' }
    ]
};

export default class EcwMyItRequests extends LightningElement {
    @api value;

    @track headline = '';
    @track requests = [];

    isTestMode = false;

    connectedCallback() { if (!this.tryLoadFromFlow()) this.initializeFromData({}); }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwMyItRequestsJSON) {
                const data = JSON.parse(this.value.ecwMyItRequestsJSON);
                if (data && typeof data === 'object' && Array.isArray(data.requests)) { this.initializeFromData(data); return true; }
            }
        } catch (e) { console.error('EcwMyItRequests parse error:', e.message); }
        return false;
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = Array.isArray(raw.requests) && raw.requests.length > 0;
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.headline = src.headline ? String(src.headline).trim() : '';

        this.requests = (Array.isArray(src.requests) ? src.requests : []).filter((r) => r && r.title).map((r, i) => {
            const stages = Array.isArray(r.stages) && r.stages.length ? r.stages.map(String) : ['Submitted', 'Done'];
            const idx = Math.max(0, Math.min(Number(r.stageIndex) || 0, stages.length - 1));
            const state = ['good', 'warn', 'info'].includes(r.state) ? r.state : 'info';
            const kind = typeKind(r.type);
            const steps = stages.map((label, j) => ({
                key: `s-${i}-${j}`,
                label,
                nodeClass: `ecw-ir-node${j < idx ? ' is-done' : (j === idx ? ` is-current is-${state}` : '')}`,
                connClass: `ecw-ir-conn${j > 0 && j <= idx ? ' is-filled' : ''}`,
                showConn: j > 0,
            }));
            return {
                key: `req-${i}`,
                id: r.id ? String(r.id).trim() : '',
                title: String(r.title).trim(),
                type: r.type ? String(r.type).trim() : '',
                hasType: !!(r.type && String(r.type).trim()),
                typeKind: kind,
                typeClass: `ecw-ir-type is-${kind}`,
                typeHeadClass: `ecw-ir-cardhead is-${kind}`,
                isHardware: kind === 'hardware', isAccess: kind === 'access', isSoftware: kind === 'software', isOther: kind === 'other',
                steps,
                currentText: stages[idx],
                currentClass: `ecw-ir-current is-${state}`,
                detail: r.detail ? String(r.detail).trim() : '',
                hasDetail: !!(r.detail && String(r.detail).trim()),
            };
        });
    }

    get hasRequests() { return this.requests.length > 0; }
    get count() { return this.requests.length; }
    get countUnit() { return this.requests.length === 1 ? 'open request' : 'open requests'; }
}
