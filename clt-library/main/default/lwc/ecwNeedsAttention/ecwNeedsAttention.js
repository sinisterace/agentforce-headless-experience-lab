/**
 * @description Agentforce Coworker · Sales · Needs attention renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a crafted list of open deals that need action: an
 * editorial "at risk" hero (total + count) and one hairline-separated row per
 * deal — name, account · stage, amount, and an urgency flag (overdue / closing
 * soon / stalled). The reference "list" archetype for employee ("ecw") CLTs.
 *
 * Contract: the field names read below MUST match the example JSON + rules in
 * genAiFunctions/ecwNeedsAttention_Output_b2c4/input/schema.json.
 * Fields: atRiskTotal? (number), count? (number),
 *   items[]{ name, account?, stage?, amount (number), flag, state (bad|warn) }.
 */
import { LightningElement, api, track } from 'lwc';

function num(v) {
    const n = Number(v);
    return isFinite(n) ? n : null;
}

// NEVER-BLANK GUARANTEE: mirrors the Apex feed (seed-stable names, no org Ids).
const TEST_DATA = {
    atRiskTotal: 1375000,
    count: 6,
    items: [
        { name: 'Entry System Upgrade - Juniper Hill Academy', stage: 'Negotiation/Review', amount: 250000, flag: 'Overdue 8d', state: 'bad' },
        { name: 'Warehouse Camera Expansion - Alta Canyon Clinics', stage: 'Proposal/Price Quote', amount: 250000, flag: 'Closes in 5d', state: 'warn' },
        { name: 'Warehouse Camera Expansion - Lakepoint Distribution', stage: 'Negotiation/Review', amount: 250000, flag: 'No activity 41d', state: 'warn' },
        { name: 'Visitor Kiosk Pilot - Iron Mesa Manufacturing', stage: 'Prospecting', amount: 250000, flag: 'No activity 36d', state: 'warn' },
        { name: 'Entry System Upgrade - Valencia Campus Services', stage: 'Value Proposition', amount: 250000, flag: 'No activity 33d', state: 'warn' },
        { name: 'Visitor Kiosk Pilot - Keystone Food Markets', stage: 'Proposal/Price Quote', amount: 125000, flag: 'Closes in 9d', state: 'warn' }
    ]
};

export default class EcwNeedsAttention extends LightningElement {
    @api value; // Receives the EcwNeedsAttentionData object from the Lightning Type.

    @track heroValue = '';
    @track hasHero = false;
    @track summaryText = '';
    @track items = [];

    isTestMode = false;
    currency = 'USD';

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwNeedsAttentionJSON) {
                const data = JSON.parse(this.value.ecwNeedsAttentionJSON);
                if (data && typeof data === 'object') {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('EcwNeedsAttention parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData({});
    }

    money(amount, maxFractionDigits) {
        const n = Number(amount);
        if (!isFinite(n)) return '';
        const frac = maxFractionDigits == null ? 0 : maxFractionDigits;
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: this.currency || 'USD', maximumFractionDigits: frac }).format(n);
        } catch (e) {
            return `${this.currency || 'USD'} ${n.toFixed(frac)}`;
        }
    }

    // 1_420_000 → "$1.42M", 320000 → "$320K". Non-USD falls back to full money().
    compactMoney(amount) {
        const n = Number(amount);
        if (!isFinite(n)) return '';
        if (this.currency && this.currency !== 'USD') return this.money(n, 0);
        const abs = Math.abs(n);
        const sign = n < 0 ? '-' : '';
        const strip = (v) => String(Number(v.toFixed(2)));
        if (abs >= 1e9) return `${sign}$${strip(abs / 1e9)}B`;
        if (abs >= 1e6) return `${sign}$${strip(abs / 1e6)}M`;
        if (abs >= 1e3) return `${sign}$${Math.round(abs / 1e3)}K`;
        return this.money(n, 0);
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = Array.isArray(raw.items) && raw.items.length > 0;
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.currency = src.currency ? String(src.currency).trim() : 'USD';

        const total = num(src.atRiskTotal);
        this.hasHero = total !== null;
        this.heroValue = this.hasHero ? this.compactMoney(total) : '';

        const list = Array.isArray(src.items) ? src.items.filter((i) => i && i.name) : [];
        const count = num(src.count) !== null ? num(src.count) : list.length;
        const plural = count === 1 ? 'deal needs' : 'deals need';
        this.summaryText = `${count} ${plural} attention`;

        this.items = list.map((i, idx) => {
            const state = (i.state === 'bad' || i.state === 'warn') ? i.state : 'warn';
            const amt = num(i.amount);
            const sub = [i.account, i.stage].filter((x) => x && String(x).trim()).join(' · ');
            return {
                key: `na-${idx}`,
                name: String(i.name).trim(),
                sub: sub,
                hasSub: !!sub,
                amountText: amt !== null ? this.compactMoney(amt) : '',
                flag: i.flag ? String(i.flag).trim() : '',
                flagClass: `ecw-na-flag is-${state}`
            };
        });
    }

    get hasItems() { return this.items.length > 0; }
}
