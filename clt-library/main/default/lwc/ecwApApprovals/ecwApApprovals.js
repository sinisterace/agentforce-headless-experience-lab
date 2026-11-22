/**
 * @description Agentforce Coworker · Finance · AP approvals renderer.
 * Vendor invoices / POs awaiting the finance team's approval: a hero total, then one
 * selectable row per item (vendor, amount, due chip, aging). The finance user selects
 * one or more rows and taps Approve or Hold; the choice is sent back to the agent.
 * "Approval list" archetype, interactive via multi-select + Approve/Hold actions.
 *
 * This component is dual-registered (ecwApApprovals.js-meta.xml):
 *  - lightning__AgentforceOutput (sourceType c__ecwApApprovals) — the read-only card.
 *  - lightning__AgentforceInput  (targetType  c__ecwApApprovalsInput) — the interactive
 *    editor. On Approve/Hold it dispatches the Agentforce `valuechange` CustomEvent with
 *    { decision, invoices, count, totalAmount } (matching Apex c__EcwApApprovalsInput),
 *    which the agent's approveApInvoices user_input tool consumes. It also calls
 *    embeddedservice_configuration.util.sendTextMessage(...) as a fallback on the ECv2
 *    web-messaging surface (where valuechange does not apply).
 *
 * Contract: field names below MUST match genAiFunctions/ecwApApprovals_Output_c2d4/input/schema.json.
 * Fields: headline?, totalAmount (number), items[]{ id?, vendor, type?, amount (number), due?, aging?, state (ok|warn|bad) }.
 */
import { LightningElement, api, track } from 'lwc';

function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }
function compact(n) {
    const a = Math.abs(num(n)); const s = n < 0 ? '-' : '';
    if (a >= 1e6) return `${s}$${String(Number((a / 1e6).toFixed(2)))}M`;
    if (a >= 1e3) return `${s}$${Math.round(a / 1e3)}K`;
    return `${s}$${Math.round(a)}`;
}

// NEVER-BLANK GUARANTEE: themed vendors (seed-stable).
const TEST_DATA = {
    headline: '5 awaiting approval', totalAmount: 284000,
    items: [
        { id: 'INV-4821', vendor: 'Sentinel Hardware Co.', type: 'Invoice', amount: 82000, due: 'Due in 2 days', aging: 'Received 3d ago', state: 'warn' },
        { id: 'PO-2290', vendor: 'NorthGate Camera Supply', type: 'PO', amount: 64000, due: 'Due in 5 days', aging: 'Received 1d ago', state: 'ok' },
        { id: 'INV-4809', vendor: 'Veritas Access Controls', type: 'Invoice', amount: 58000, due: 'Overdue 1 day', aging: 'Received 9d ago', state: 'bad' },
        { id: 'INV-4815', vendor: 'BluePeak Installations', type: 'Invoice', amount: 46000, due: 'Due in 6 days', aging: 'Received 2d ago', state: 'ok' },
        { id: 'PO-2284', vendor: 'Cedar Signal Networks', type: 'PO', amount: 34000, due: 'Due in 8 days', aging: 'Received 4d ago', state: 'ok' }
    ]
};

export default class EcwApApprovals extends LightningElement {
    @api value;

    @track heroValue = '';
    @track headline = '';
    @track items = [];
    @track done = false;
    @track doneText = '';

    isTestMode = false;
    rawItems = [];
    selectedKeys = [];

    connectedCallback() { if (!this.tryLoadFromFlow()) this.initializeFromData({}); }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwApApprovalsJSON) {
                const data = JSON.parse(this.value.ecwApApprovalsJSON);
                if (data && typeof data === 'object' && Array.isArray(data.items)) { this.initializeFromData(data); return true; }
            }
        } catch (e) { console.error('EcwApApprovals parse error:', e.message); }
        return false;
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = Array.isArray(raw.items) && raw.items.length > 0;
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.heroValue = compact(src.totalAmount);
        this.headline = src.headline ? String(src.headline).trim() : '';

        this.rawItems = (Array.isArray(src.items) ? src.items : []).filter((i) => i && i.vendor).map((i, idx) => {
            const state = ['ok', 'warn', 'bad'].includes(i.state) ? i.state : 'ok';
            return {
                key: `ap-${idx}`,
                id: i.id ? String(i.id).trim() : '',
                vendor: String(i.vendor).trim(),
                type: i.type ? String(i.type).trim() : '',
                amount: num(i.amount),
                due: i.due ? String(i.due).trim() : '',
                aging: i.aging ? String(i.aging).trim() : '',
                state
            };
        });
        this.selectedKeys = [];
        this.recompute();
    }

    recompute() {
        const selected = new Set(this.selectedKeys);
        this.items = this.rawItems.map((i) => {
            const isSelected = selected.has(i.key);
            const sub = [i.type, i.id].filter((x) => x && String(x).trim()).join(' · ');
            return {
                key: i.key,
                vendor: i.vendor,
                sub,
                amountText: compact(i.amount),
                due: i.due,
                dueClass: `ecw-ap-due is-${i.state}`,
                aging: i.aging,
                hasAging: !!i.aging,
                selected: isSelected,
                rowClass: isSelected ? 'ecw-ap-row selected' : 'ecw-ap-row',
                dotClass: isSelected ? 'ecw-ap-dot on' : 'ecw-ap-dot'
            };
        });
    }

    handleSelect(event) {
        const key = event.currentTarget.dataset.key;
        if (!key) return;
        const set = new Set(this.selectedKeys);
        if (set.has(key)) set.delete(key); else set.add(key);
        this.selectedKeys = Array.from(set);
        this.recompute();
    }

    get selectedItems() {
        const set = new Set(this.selectedKeys);
        return this.rawItems.filter((i) => set.has(i.key));
    }

    get hasItems() { return this.items.length > 0; }
    get hasSelection() { return this.selectedKeys.length > 0; }
    get showActions() { return this.hasSelection && !this.done; }
    get selectedCount() { return this.selectedKeys.length; }
    get approveLabel() { return `Approve · ${this.selectedCount}`; }
    get holdLabel() { return `Hold · ${this.selectedCount}`; }

    labelFor(i, withAmount) {
        const amt = withAmount ? `, ${compact(i.amount)}` : '';
        if (i.id) return `${i.id} (${i.vendor}${amt})`;
        return withAmount ? `${i.vendor} (${compact(i.amount)})` : i.vendor;
    }

    handleApprove() { this.submitDecision('approve'); }
    handleHold() { this.submitDecision('hold'); }

    submitDecision(decision) {
        const chosen = this.selectedItems;
        if (!chosen.length || this.done) return;
        const n = chosen.length;
        const invoices = chosen.map((i) => this.labelFor(i, true)).join(', ');
        const totalAmount = compact(chosen.reduce((a, i) => a + num(i.amount), 0));
        const verb = decision === 'hold' ? 'Hold' : 'Approve';
        const message = decision === 'hold'
            ? `Hold ${n} invoice${n > 1 ? 's' : ''} for review: ${invoices}`
            : `Approve ${n} invoice${n > 1 ? 's' : ''}: ${invoices} — total ${totalAmount}`;

        // Primary (Agentforce surface): feed the user_input tool via valuechange.
        this.dispatchEvent(new CustomEvent('valuechange', {
            detail: { value: { decision, invoices, count: n, totalAmount } }
        }));
        // Fallback (ECv2 web-messaging surface): post as a chat message.
        this.sendMessage(message);

        this.done = true;
        this.doneText = decision === 'hold'
            ? `${n} invoice${n > 1 ? 's' : ''} placed on hold`
            : `${n} invoice${n > 1 ? 's' : ''} approved · ${totalAmount}`;
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('EcwApApprovals sent:', message))
                    .catch((err) => console.error('EcwApApprovals send error:', err));
            } else {
                console.log('EcwApApprovals: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('EcwApApprovals sendMessage error:', err);
        }
    }
}
