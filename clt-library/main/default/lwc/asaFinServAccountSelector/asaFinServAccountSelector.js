/**
 * @description ASA Financial Services · Account Selector renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a list of the customer's financial accounts. Sends the
 * user's choice back to the agent through
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaFinServAccountSelector_Output_acc7/input/schema.json.
 * Fields: title, mode ('single'|'multiple'), accounts[] of
 * { id, name, type, mask, balance, currency?, available?, badge? }, submitText?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Renders
// when the Flow payload is missing/malformed. It is a plain object (no
// JSON.parse), so nothing here can fail.
const FALLBACK_DATA = {
    title: 'Which account can I help you with?',
    mode: 'single',
    accounts: [
        { id: 'chk-1234', name: 'Everyday Checking', type: 'Checking', mask: '1234', balance: 4820.55, currency: 'USD', badge: 'Primary' },
        { id: 'sav-5678', name: 'High-Yield Savings', type: 'Savings', mask: '5678', balance: 15230.0, currency: 'USD' },
        { id: 'crd-9012', name: 'Rewards Card', type: 'Credit Card', mask: '9012', balance: -742.18, currency: 'USD', available: 9257.82 }
    ]
};

export default class AsaFinServAccountSelector extends LightningElement {
    @api value; // Receives the AsaFinServAccountSelectorData object from the Lightning Type.

    @track title = '';
    @track mode = 'single';
    @track submitText = 'Continue';
    @track accounts = []; // display-ready rows (computed)
    @track errorMessage = '';

    rawAccounts = [];
    selectedKeys = [];
    isTestMode = false;

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.finServAccountSelectorJSON) {
                const data = JSON.parse(this.value.finServAccountSelectorJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaFinServAccountSelector parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData(FALLBACK_DATA);
    }

    isUsable(data) {
        return data && typeof data === 'object';
    }

    initializeFromData(data) {
        this.errorMessage = '';
        const list = Array.isArray(data.accounts) ? data.accounts : [];
        // Empty accounts → show generic sample so the card is never blank.
        this.isTestMode = list.length === 0;
        const source = this.isTestMode ? FALLBACK_DATA : data;
        this.rawAccounts = Array.isArray(source.accounts) ? source.accounts : [];
        this.title = source.title || '';
        this.mode = source.mode === 'multiple' ? 'multiple' : 'single';
        this.submitText = (data.submitText && String(data.submitText).trim()) || 'Continue';
        this.selectedKeys = [];
        this.recompute();
    }

    keyFor(acct, index) {
        return acct && acct.id ? String(acct.id) : 'idx-' + index;
    }

    formatMoney(amount, currency) {
        const cur = currency || 'USD';
        const num = Number(amount);
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(num);
        } catch (e) {
            return cur + ' ' + (isNaN(num) ? '0.00' : num.toFixed(2));
        }
    }

    // Maps an account type to a card-hue modifier class so each tile in the
    // wallet reads as its own payment card (checking follows the themeable
    // --asa-accent; the rest get fixed, pleasant hues for variety).
    typeModifier(type) {
        switch ((type || '').toLowerCase()) {
            case 'savings': return 'is-savings';
            case 'credit card':
            case 'credit': return 'is-credit';
            case 'loan': return 'is-loan';
            case 'investment': return 'is-investment';
            default: return 'is-checking';
        }
    }

    recompute() {
        const selected = new Set(this.selectedKeys);
        this.accounts = this.rawAccounts.map((acct, index) => {
            const key = this.keyFor(acct, index);
            const isSelected = selected.has(key);
            const type = acct.type || 'Checking';
            const balance = Number(acct.balance);
            const hasAvailable = typeof acct.available === 'number' && !isNaN(acct.available);
            const negative = balance < 0;
            const typeMod = this.typeModifier(type);
            return {
                key,
                index,
                name: acct.name || 'Account',
                badge: acct.badge || '',
                typeLabel: type,
                mask: acct.mask || '',
                balanceDisplay: this.formatMoney(balance, acct.currency),
                hasAvailable,
                availableDisplay: hasAvailable ? this.formatMoney(acct.available, acct.currency) : '',
                selected: isSelected,
                balanceClass: negative ? 'asa-wcard-bal is-negative' : 'asa-wcard-bal',
                cardClass: 'asa-wcard ' + typeMod + (isSelected ? ' is-selected' : ''),
                checkClass: isSelected ? 'asa-wcard-check on' : 'asa-wcard-check'
            };
        });
    }

    get showSubmit() {
        return this.mode === 'multiple' && this.selectedKeys.length > 0;
    }

    get hasAccounts() {
        return this.accounts && this.accounts.length > 0;
    }

    handleSelect(event) {
        const index = Number(event.currentTarget.dataset.index);
        const acct = this.rawAccounts[index];
        if (!acct) return;
        const key = this.keyFor(acct, index);

        if (this.mode === 'single') {
            this.selectedKeys = [key];
            this.recompute();
            this.submitSelection([acct]);
            return;
        }
        const set = new Set(this.selectedKeys);
        if (set.has(key)) {
            set.delete(key);
        } else {
            set.add(key);
        }
        this.selectedKeys = Array.from(set);
        this.recompute();
    }

    handleSubmit() {
        const chosen = this.rawAccounts.filter((acct, index) => this.selectedKeys.includes(this.keyFor(acct, index)));
        if (chosen.length) this.submitSelection(chosen);
    }

    submitSelection(accts) {
        const names = accts
            .map((a) => (a.mask ? `${a.name} ••${a.mask}` : a.name))
            .join(', ');
        const message = accts.length > 1 ? `Selected accounts: ${names}` : `Selected account: ${names}`;
        this.sendMessage(message);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaFinServAccountSelector sent:', message))
                    .catch((err) => console.error('AsaFinServAccountSelector send error:', err));
            } else {
                console.log('AsaFinServAccountSelector: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaFinServAccountSelector sendMessage error:', err);
        }
    }
}
