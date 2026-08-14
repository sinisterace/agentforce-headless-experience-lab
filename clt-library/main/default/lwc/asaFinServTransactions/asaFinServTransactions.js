/**
 * @description ASA Financial Services · Recent Transactions renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders the customer's recent transactions. The customer selects
 * one and taps the dispute button; the choice is sent back to the agent through
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaFinServTransactions_Output_d15b/input/schema.json.
 * Fields: title, accountLabel?, transactions[] of
 * { id, merchant, date, amount, currency?, category?, status?, disputable? },
 * disputeText?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Renders
// when the Flow payload is missing/malformed. It is a plain object (no
// JSON.parse), so nothing here can fail.
const FALLBACK_DATA = {
    title: 'Your recent transactions',
    accountLabel: 'Everyday Checking ••1234',
    transactions: [
        { id: 'txn-1', merchant: 'Whole Foods Market', date: '2026-08-09', amount: -84.23, currency: 'USD', category: 'Groceries', status: 'Posted' },
        { id: 'txn-2', merchant: 'Delta Air Lines', date: '2026-08-07', amount: -412.6, currency: 'USD', category: 'Travel', status: 'Posted' },
        { id: 'txn-3', merchant: 'Payroll Deposit', date: '2026-08-06', amount: 2450.0, currency: 'USD', category: 'Income', status: 'Posted' },
        { id: 'txn-4', merchant: 'Corner Bistro', date: '2026-08-05', amount: -56.8, currency: 'USD', category: 'Dining', status: 'Pending' }
    ],
    disputeText: 'Dispute this charge'
};

export default class AsaFinServTransactions extends LightningElement {
    @api value; // Receives the AsaFinServTransactionsData object from the Lightning Type.

    @track title = '';
    @track accountLabel = '';
    @track disputeText = 'Dispute this charge';
    @track transactions = []; // display-ready rows (computed)
    @track errorMessage = '';

    rawTransactions = [];
    selectedKey = '';
    isTestMode = false;

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.finServTransactionsJSON) {
                const data = JSON.parse(this.value.finServTransactionsJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaFinServTransactions parse error:', e.message);
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
        const list = Array.isArray(data.transactions) ? data.transactions : [];
        // Empty transactions → show generic sample so the card is never blank.
        this.isTestMode = list.length === 0;
        const source = this.isTestMode ? FALLBACK_DATA : data;
        this.rawTransactions = Array.isArray(source.transactions) ? source.transactions : [];
        this.title = source.title || '';
        this.accountLabel = source.accountLabel || '';
        this.disputeText = (data.disputeText && String(data.disputeText).trim()) || 'Dispute this charge';
        this.selectedKey = '';
        this.recompute();
    }

    keyFor(txn, index) {
        return txn && txn.id ? String(txn.id) : 'idx-' + index;
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

    // Signed amount: debits show "-$84.23", credits "+$2,450.00".
    formatAmount(amount, currency) {
        const num = Number(amount);
        const body = this.formatMoney(Math.abs(isNaN(num) ? 0 : num), currency);
        return (num < 0 ? '-' : '+') + body;
    }

    // ISO yyyy-mm-dd → "Aug 9" (parsed as a local date to avoid a tz day-shift).
    // Any non-ISO string is shown as-is.
    formatDate(value) {
        if (!value) return '';
        const s = String(value);
        const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!m) return s;
        try {
            const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
            return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
        } catch (e) {
            return s;
        }
    }

    categoryOf(txn) {
        return String(txn.category || 'Other').toLowerCase();
    }

    recompute() {
        this.transactions = this.rawTransactions.map((txn, index) => {
            const key = this.keyFor(txn, index);
            const isSelected = key === this.selectedKey;
            const amount = Number(txn.amount);
            const isCredit = amount > 0;
            const cat = this.categoryOf(txn);
            const selectable = txn.disputable !== false;
            const isPending = String(txn.status || '').toLowerCase() === 'pending';
            return {
                key,
                index,
                merchant: txn.merchant || 'Transaction',
                dateDisplay: this.formatDate(txn.date),
                amountDisplay: this.formatAmount(amount, txn.currency),
                categoryLabel: txn.category || 'Other',
                isPending,
                selected: isSelected,
                selectable,
                disabled: !selectable,
                amountClass: isCredit ? 'asa-stmt-amount is-credit' : 'asa-stmt-amount',
                rowClass:
                    'asa-stmt-row' + (isSelected ? ' selected' : '') + (selectable ? '' : ' is-disabled'),
                checkClass: isSelected ? 'asa-stmt-check on' : 'asa-stmt-check',
                isGroceries: cat === 'groceries',
                isDining: cat === 'dining',
                isTravel: cat === 'travel',
                isShopping: cat === 'shopping',
                isBills: cat === 'bills',
                isTransfer: cat === 'transfer',
                isIncome: cat === 'income',
                isOther: !['groceries', 'dining', 'travel', 'shopping', 'bills', 'transfer', 'income'].includes(cat)
            };
        });
    }

    get hasTransactions() {
        return this.transactions && this.transactions.length > 0;
    }

    get showSubmit() {
        return !!this.selectedKey;
    }

    handleSelect(event) {
        const index = Number(event.currentTarget.dataset.index);
        const txn = this.rawTransactions[index];
        if (!txn || txn.disputable === false) return;
        const key = this.keyFor(txn, index);
        // Toggle off if the same row is tapped again.
        this.selectedKey = this.selectedKey === key ? '' : key;
        this.recompute();
    }

    handleSubmit() {
        const index = this.rawTransactions.findIndex((txn, i) => this.keyFor(txn, i) === this.selectedKey);
        if (index < 0) return;
        const txn = this.rawTransactions[index];
        const parts = [
            txn.merchant || 'Transaction',
            this.formatAmount(Number(txn.amount), txn.currency)
        ];
        const dateDisplay = this.formatDate(txn.date);
        if (dateDisplay) parts.push('on ' + dateDisplay);
        const idPart = txn.id ? ` (id: ${txn.id})` : '';
        this.sendMessage(`Dispute requested: ${parts.join(', ')}${idPart}`);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaFinServTransactions sent:', message))
                    .catch((err) => console.error('AsaFinServTransactions send error:', err));
            } else {
                console.log('AsaFinServTransactions: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaFinServTransactions sendMessage error:', err);
        }
    }
}
