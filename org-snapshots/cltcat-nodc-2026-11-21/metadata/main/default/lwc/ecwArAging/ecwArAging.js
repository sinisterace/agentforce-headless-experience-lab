/**
 * @description Agentforce Coworker · Finance · AR aging renderer.
 * Accounts-receivable aging for the finance team: a hero total outstanding + DSO, a
 * stacked aging bar across buckets with a legend, and a selectable top-overdue list.
 * "Aging-bucket" archetype, interactive via multi-select + Send-payment-reminder.
 *
 * This component is dual-registered (ecwArAging.js-meta.xml):
 *  - lightning__AgentforceOutput (sourceType c__ecwArAging) — the read-only card.
 *  - lightning__AgentforceInput  (targetType  c__ecwArAgingInput) — the interactive
 *    editor. On Send payment reminder it dispatches the Agentforce `valuechange`
 *    CustomEvent with { accounts, count } (matching Apex c__EcwArAgingInput), which
 *    the agent's remindArAccounts user_input tool consumes. It also calls
 *    embeddedservice_configuration.util.sendTextMessage(...) as a fallback on the
 *    ECv2 web-messaging surface (where valuechange does not apply).
 *
 * Contract: field names below MUST match genAiFunctions/ecwArAging_Output_d3e5/input/schema.json.
 * Fields: totalOutstanding (number), dso?, buckets[]{ label, amount (number), state (good|info|warn|bad) },
 *   top[]{ account, amount (number), bucket, state (good|info|warn|bad) }.
 */
import { LightningElement, api, track } from 'lwc';

const COLOR = { good: '#15803d', info: '#0d6fd1', warn: '#b45309', bad: '#b91c1c' };

function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }
function compact(n) {
    const a = Math.abs(num(n)); const s = n < 0 ? '-' : '';
    if (a >= 1e6) return `${s}$${String(Number((a / 1e6).toFixed(2)))}M`;
    if (a >= 1e3) return `${s}$${Math.round(a / 1e3)}K`;
    return `${s}$${Math.round(a)}`;
}

// NEVER-BLANK GUARANTEE: curated amounts, real seed account names.
const TEST_DATA = {
    totalOutstanding: 1240000, dso: '42 days',
    buckets: [
        { label: 'Current', amount: 720000, state: 'good' },
        { label: '1–30', amount: 300000, state: 'info' },
        { label: '31–60', amount: 140000, state: 'warn' },
        { label: '60+', amount: 80000, state: 'bad' }
    ],
    top: [
        { account: 'Alta Canyon Clinics', amount: 48000, bucket: '60+', state: 'bad' },
        { account: 'Keystone Food Markets', amount: 42000, bucket: '31–60', state: 'warn' },
        { account: 'Union Gate Apartments', amount: 36000, bucket: '31–60', state: 'warn' },
        { account: 'Pacific Ridge Builders', amount: 29000, bucket: '1–30', state: 'info' }
    ]
};

export default class EcwArAging extends LightningElement {
    @api value;

    @track heroValue = '';
    @track dsoText = '';
    @track segments = [];
    @track legend = [];
    @track top = [];
    @track done = false;
    @track doneText = '';

    isTestMode = false;
    rawTop = [];
    selectedKeys = [];

    connectedCallback() { if (!this.tryLoadFromFlow()) this.initializeFromData({}); }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwArAgingJSON) {
                const data = JSON.parse(this.value.ecwArAgingJSON);
                if (data && typeof data === 'object' && Array.isArray(data.buckets)) { this.initializeFromData(data); return true; }
            }
        } catch (e) { console.error('EcwArAging parse error:', e.message); }
        return false;
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = Array.isArray(raw.buckets) && raw.buckets.length > 0;
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        const buckets = (Array.isArray(src.buckets) ? src.buckets : []).filter((b) => b && b.label);
        const total = num(src.totalOutstanding) || buckets.reduce((a, b) => a + num(b.amount), 0);
        const denom = total || 1;

        this.heroValue = compact(total);
        this.dsoText = src.dso ? `DSO ${String(src.dso).trim()}` : '';

        this.segments = buckets.filter((b) => num(b.amount) > 0).map((b, i) => ({
            key: `seg-${i}`,
            segStyle: `width:${Math.max(2, Math.round((num(b.amount) / denom) * 100))}%;background:${COLOR[b.state] || '#94a3b8'};`
        }));
        this.legend = buckets.map((b, i) => ({
            key: `leg-${i}`,
            label: String(b.label).trim(),
            amountText: compact(b.amount),
            pctText: `${Math.round((num(b.amount) / denom) * 100)}%`,
            dotStyle: `background:${COLOR[b.state] || '#94a3b8'};`
        }));
        this.rawTop = (Array.isArray(src.top) ? src.top : []).filter((t) => t && t.account).map((t, i) => ({
            key: `top-${i}`,
            index: i,
            account: String(t.account).trim(),
            amountText: compact(t.amount),
            bucket: t.bucket ? String(t.bucket).trim() : '',
            state: ['good', 'info', 'warn', 'bad'].includes(t.state) ? t.state : 'info'
        }));
        this.selectedKeys = [];
        this.recomputeTop();
    }

    recomputeTop() {
        const sel = new Set(this.selectedKeys);
        this.top = this.rawTop.map((t) => {
            const selected = sel.has(t.key);
            return {
                ...t,
                bucketClass: `ecw-ar-bchip is-${t.state}`,
                selected,
                rowClass: `ecw-ar-top-row selectable${selected ? ' selected' : ''}`,
                dotClass: selected ? 'ecw-ar-dot2 on' : 'ecw-ar-dot2'
            };
        });
    }

    handleSelect(event) {
        const key = event.currentTarget.dataset.key;
        if (!key) return;
        const set = new Set(this.selectedKeys);
        if (set.has(key)) set.delete(key); else set.add(key);
        this.selectedKeys = Array.from(set);
        this.recomputeTop();
    }

    handleRemind() {
        const sel = new Set(this.selectedKeys);
        const chosen = this.rawTop.filter((t) => sel.has(t.key));
        if (!chosen.length || this.done) return;
        const parts = chosen.map((t) => `${t.account} (${t.amountText}${t.bucket ? `, ${t.bucket}` : ''})`);
        const n = chosen.length;
        const accounts = parts.join(', ');

        // Primary (Agentforce surface): feed the user_input tool via valuechange.
        this.dispatchEvent(new CustomEvent('valuechange', {
            detail: { value: { accounts, count: n } }
        }));
        // Fallback (ECv2 web-messaging surface): post as a chat message.
        this.sendMessage(`Send payment reminder to ${n} account${n === 1 ? '' : 's'}: ${accounts}`);

        this.done = true;
        this.doneText = `Reminder queued · ${n} account${n === 1 ? '' : 's'}`;
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('EcwArAging sent:', message))
                    .catch((err) => console.error('EcwArAging send error:', err));
            } else {
                console.log('EcwArAging: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('EcwArAging sendMessage error:', err);
        }
    }

    get hasChart() { return this.segments.length > 0; }
    get hasTop() { return this.top.length > 0; }
    get showRemind() { return this.selectedKeys.length > 0 && !this.done; }
    get remindLabel() { return `Send payment reminder · ${this.selectedKeys.length}`; }
}