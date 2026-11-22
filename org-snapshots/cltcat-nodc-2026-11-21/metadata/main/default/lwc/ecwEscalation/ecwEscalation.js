/**
 * @description Agentforce Coworker · Service · Escalate case.
 * A case-escalation report in the asaMfgQuoteBuilder "ledger with totals" language:
 * a case header (account, mono case number, severity pill), the escalation reason, a
 * bordered IMPACT table (impacted accounts / users / revenue / SLA window) resolving to
 * a prominent business-impact total, the on-call route, an acknowledgement checkbox that
 * gates the Escalate CTA, and a local confirmation on escalate.
 *
 * CURATED / seed-stable payload (no org Ids) — same template-safe pattern as the other
 * ecw CLTs. Acknowledgement + confirm are local UI state.
 *
 * Contract: field names below MUST match genAiFunctions/ecwEscalation_Output_h8k2/input/schema.json.
 */
import { LightningElement, api, track } from 'lwc';

const SEV = { ok: 'is-ok', warn: 'is-warn', bad: 'is-bad' };

const TEST_DATA = {
    title: 'Escalate case',
    caseInfo: { number: '00043219', subject: 'SSO login outage — enterprise', account: 'PixelArc', priority: 'High', opened: 'Opened 2h 10m ago', channel: 'Web' },
    severity: { label: 'Sev 1', state: 'bad' },
    reason: "Multiple enterprise customers can't authenticate via SSO; impact is widening.",
    lines: [
        { item: 'Affected accounts', detail: 'PixelArc, Northwind, Acme +4', metric: '7' },
        { item: 'Users impacted', detail: 'SSO authentication failures', metric: '~2,400' },
        { item: 'Revenue at risk', detail: 'Enterprise SLA credits', metric: '$48K' },
        { item: 'SLA window', detail: 'P1 response SLA', metric: '22m left' }
    ],
    summary: { label: 'Business impact', total: 'High', note: '7 accounts · ~2,400 users · $48K at risk' },
    routeTo: 'Tier 2 · Platform on-call',
    ackText: 'I confirm this meets Sev 1 escalation criteria.',
    action: 'Escalate to Tier 2'
};

export default class EcwEscalation extends LightningElement {
    @api value;
    @track model = {};
    @track lines = [];
    @track acked = false;
    @track done = false;
    @track doneText = '';
    @track rootClass = 'ecw-esc';

    isTestMode = false;

    connectedCallback() { if (!this.tryLoadFromFlow()) this.initializeFromData({}); }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwEscalationJSON) {
                const data = JSON.parse(this.value.ecwEscalationJSON);
                if (data && typeof data === 'object' && Array.isArray(data.lines)) { this.initializeFromData(data); return true; }
            }
        } catch (e) { console.error('EcwEscalation parse error:', e.message); }
        return false;
    }

    initializeFromData(data) {
        const raw = data || {};
        const has = Array.isArray(raw.lines) && raw.lines.length > 0;
        this.isTestMode = !has;
        const src = this.isTestMode ? TEST_DATA : raw;

        const ci = src.caseInfo || {};
        const sev = src.severity || {};
        const sevState = ['ok', 'warn', 'bad'].includes(sev.state) ? sev.state : 'warn';
        this.rootClass = `ecw-esc is-${sevState}`;
        const sum = src.summary || {};

        this.model = {
            title: src.title ? String(src.title).trim() : 'Escalate case',
            number: ci.number ? String(ci.number).trim() : '',
            subject: ci.subject ? String(ci.subject).trim() : '', hasSubject: !!ci.subject,
            account: ci.account ? String(ci.account).trim() : '', hasAccount: !!ci.account,
            priority: ci.priority ? String(ci.priority).trim() : '', hasPriority: !!ci.priority,
            opened: ci.opened ? String(ci.opened).trim() : '', hasOpened: !!ci.opened,
            channel: ci.channel ? String(ci.channel).trim() : '', hasChannel: !!ci.channel,
            sevLabel: sev.label ? String(sev.label).trim() : '', sevClass: `ecw-esc-sev ${SEV[sevState]}`,
            reason: src.reason ? String(src.reason).trim() : '', hasReason: !!src.reason,
            summaryLabel: sum.label ? String(sum.label).trim() : 'Business impact',
            summaryTotal: sum.total ? String(sum.total).trim() : '',
            summaryNote: sum.note ? String(sum.note).trim() : '', hasNote: !!sum.note,
            routeTo: src.routeTo ? String(src.routeTo).trim() : '', hasRoute: !!src.routeTo,
            ackText: src.ackText ? String(src.ackText).trim() : 'I confirm this escalation.',
            action: src.action ? String(src.action).trim() : 'Escalate'
        };
        this.lines = (Array.isArray(src.lines) ? src.lines : []).filter((l) => l && l.item).map((l, i) => ({
            key: `l-${i}`,
            item: String(l.item).trim(),
            detail: l.detail ? String(l.detail).trim() : '', hasDetail: !!l.detail,
            metric: l.metric ? String(l.metric).trim() : ''
        }));
        this.acked = false;
        this.done = false;
    }

    handleAck(event) { this.acked = !!event.target.checked; }

    handleEscalate() {
        if (!this.acked || this.done) return;
        this.done = true;
        const route = this.model.routeTo || 'Tier 2';
        this.doneText = `Escalated to ${route} · ref ESC-20481`;

        // Primary (Agentforce / Coworker surface): feed the raiseEscalation user_input
        // tool via the valuechange CustomEvent (matches Apex c__EcwEscalationInput).
        this.dispatchEvent(new CustomEvent('valuechange', {
            detail: { value: { caseNumber: this.model.number || '', severity: this.model.sevLabel || '', routeTo: route, subject: this.model.subject || '' } }
        }));
        // Fallback (ECv2 web-messaging surface, where valuechange does not apply).
        this.sendMessage(`Escalate case ${this.model.number || ''} to ${route} — ${this.model.sevLabel || 'escalation'}`.trim());
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('EcwEscalation sent:', message))
                    .catch((err) => console.error('EcwEscalation send error:', err));
            } else {
                console.log('EcwEscalation: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) { console.error('EcwEscalation sendMessage error:', err); }
    }

    get hasLines() { return this.lines.length > 0; }
    get canEscalate() { return this.acked && !this.done; }
    get escalateDisabled() { return !this.acked || this.done; }
}