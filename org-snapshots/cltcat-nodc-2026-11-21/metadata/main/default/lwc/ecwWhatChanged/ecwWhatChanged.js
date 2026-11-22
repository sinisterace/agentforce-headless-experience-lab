/**
 * @description Agentforce Coworker · Sales · What changed renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a recent deal-motion feed: an editorial net-change hero
 * and one hairline-separated event per row (won / advanced / new / slipped /
 * lost) with a colored status rail, a type label, the deal, a detail line, a
 * relative time, and the amount. The reference "changelog" archetype.
 *
 * Contract: field names below MUST match genAiFunctions/ecwWhatChanged_Output_d4e6/input/schema.json.
 * Fields: netText?, summaryText?, items[]{ label, deal, detail?, amount (number), when?, state (good|info|warn|bad) }.
 */
import { LightningElement, api, track } from 'lwc';

function num(v) {
    const n = Number(v);
    return isFinite(n) ? n : null;
}

// NEVER-BLANK GUARANTEE: mirrors the Apex feed (no org-specific content).
const TEST_DATA = {
    netText: '+$510K',
    summaryText: '5 updates this week',
    items: [
        { label: 'Won', deal: 'Entry System Upgrade - Juniper Mesa Schools', detail: 'Closed Won', amount: 250000, when: '2d ago', state: 'good' },
        { label: 'Advanced', deal: 'Warehouse Camera Expansion - Amber Valley Resorts', detail: 'Prospecting → Proposal', amount: 250000, when: '3d ago', state: 'info' },
        { label: 'New', deal: 'Visitor Kiosk Pilot - Ravenwood Storage', detail: 'Added to pipeline', amount: 125000, when: '4d ago', state: 'info' },
        { label: 'Slipped', deal: 'Entry System Upgrade - Yucca Trail Schools', detail: 'Close date moved out 3 weeks', amount: 250000, when: '5d ago', state: 'warn' },
        { label: 'Lost', deal: 'Warehouse Camera Expansion - Teal Ridge Schools', detail: 'Closed Lost — went with incumbent', amount: 125000, when: '6d ago', state: 'bad' }
    ]
};

export default class EcwWhatChanged extends LightningElement {
    @api value; // Receives the EcwWhatChangedData object from the Lightning Type.

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
            if (this.value && this.value.ecwWhatChangedJSON) {
                const data = JSON.parse(this.value.ecwWhatChangedJSON);
                if (data && typeof data === 'object') {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('EcwWhatChanged parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData({});
    }

    money(amount) {
        const n = Number(amount);
        if (!isFinite(n)) return '';
        const abs = Math.abs(n);
        const sign = n < 0 ? '-' : '';
        const strip = (v) => String(Number(v.toFixed(2)));
        if (abs >= 1e6) return `${sign}$${strip(abs / 1e6)}M`;
        if (abs >= 1e3) return `${sign}$${Math.round(abs / 1e3)}K`;
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: this.currency || 'USD', maximumFractionDigits: 0 }).format(n);
        } catch (e) {
            return `$${n}`;
        }
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = Array.isArray(raw.items) && raw.items.length > 0;
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.heroValue = src.netText ? String(src.netText).trim() : '';
        this.hasHero = !!this.heroValue;
        this.summaryText = src.summaryText ? String(src.summaryText).trim() : '';

        const list = Array.isArray(src.items) ? src.items.filter((i) => i && i.deal) : [];
        this.items = list.map((i, idx) => {
            const state = ['good', 'info', 'warn', 'bad'].includes(i.state) ? i.state : 'info';
            const amt = num(i.amount);
            const meta = [i.label, i.detail, i.when].filter((x) => x && String(x).trim()).join(' · ');
            return {
                key: `wc-${idx}`,
                deal: String(i.deal).trim(),
                meta: meta,
                amountText: amt !== null ? this.money(amt) : '',
                railClass: `ecw-wc-rail is-${state}`
            };
        });
    }

    get hasItems() { return this.items.length > 0; }
}