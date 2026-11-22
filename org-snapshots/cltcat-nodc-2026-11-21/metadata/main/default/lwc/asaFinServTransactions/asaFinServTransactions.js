/**
 * @description ASA Financial Services · Recent Transactions renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders the customer's recent transactions as a private-bank
 * statement: a monospace cash-flow readout (money out / money in), a
 * spend-by-category segmented meter + legend (computed from the debits), and a
 * typographic statement ledger. The customer selects a row and taps the dispute
 * button; the choice is sent back to the agent through
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
        { id: 'txn-3', merchant: 'Payroll Deposit', date: '2026-08-06', amount: 2450.0, currency: 'USD', category: 'Income', status: 'Posted', disputable: false },
        { id: 'txn-4', merchant: 'Corner Bistro', date: '2026-08-05', amount: -56.8, currency: 'USD', category: 'Dining', status: 'Pending' }
    ],
    disputeText: 'Dispute this charge'
};

// Category hues for the spend-breakdown meter/legend (debit categories).
const CATEGORY_COLORS = {
    groceries: '#15803d',
    dining: '#b45309',
    travel: '#1d4ed8',
    shopping: '#7c3aed',
    bills: '#0891b2',
    transfer: '#0d9488',
    entertainment: '#be185d',
    other: '#64748b'
};

export default class AsaFinServTransactions extends LightningElement {
    @api value; // Receives the AsaFinServTransactionsData object from the Lightning Type.

    @track title = '';
    @track accountLabel = '';
    @track disputeText = 'Dispute this charge';
    @track transactions = []; // display-ready rows (computed)
    @track breakdown = []; // spend-by-category segments (computed)
    @track moneyOutText = '';
    @track moneyInText = '';
    @track countText = '';
    @track errorMessage = '';

    rawTransactions = [];
    selectedKey = '';
    isTestMode = false;
    currency = 'USD';

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
        const withCur = this.rawTransactions.find((t) => t && t.currency);
        this.currency = (withCur && withCur.currency) || 'USD';
        this.selectedKey = '';
        this.recompute();
        this.computeSummary();
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
        return (num < 0 ? '−' : '+') + body;
    }

    // ISO yyyy-mm-dd → "Aug 9" (parsed as a local date to avoid a tz day-shift).
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

    titleCase(s) {
        const v = String(s || '');
        return v.charAt(0).toUpperCase() + v.slice(1);
    }

    recompute() {
        this.transactions = this.rawTransactions.map((txn, index) => {
            const key = this.keyFor(txn, index);
            const isSelected = key === this.selectedKey;
            const amount = Number(txn.amount);
            const isCredit = amount > 0;
            const selectable = txn.disputable !== false;
            const isPending = String(txn.status || '').toLowerCase() === 'pending';
            const cat = this.categoryOf(txn);
            const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.other;
            return {
                key,
                index,
                merchant: txn.merchant || 'Transaction',
                dateDisplay: this.formatDate(txn.date),
                amountDisplay: this.formatAmount(amount, txn.currency || this.currency),
                categoryLabel: txn.category || 'Other',
                tagStyle: `color:${color};background:color-mix(in srgb, ${color} 12%, transparent);`,
                isPending,
                selected: isSelected,
                selectable,
                disabled: !selectable,
                amountClass: isCredit ? 'asa-fs-amt is-credit' : 'asa-fs-amt',
                rowClass: 'asa-fs-row' + (isSelected ? ' selected' : '') + (selectable ? '' : ' is-disabled'),
                dotClass: isSelected ? 'asa-fs-dot on' : 'asa-fs-dot'
            };
        });
    }

    computeSummary() {
        let out = 0;
        let inc = 0;
        const byCat = {};
        this.rawTransactions.forEach((t) => {
            const amt = Number(t.amount) || 0;
            if (amt < 0) {
                out += Math.abs(amt);
                const cat = this.categoryOf(t);
                byCat[cat] = (byCat[cat] || 0) + Math.abs(amt);
            } else {
                inc += amt;
            }
        });
        this.moneyOutText = this.formatMoney(out, this.currency);
        this.moneyInText = inc > 0 ? '+' + this.formatMoney(inc, this.currency) : '';
        const total = out || 1;
        this.breakdown = Object.keys(byCat)
            .sort((a, b) => byCat[b] - byCat[a])
            .slice(0, 5)
            .map((cat, i) => {
                const amount = byCat[cat];
                const pct = Math.max(3, Math.round((amount / total) * 100));
                const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.other;
                return {
                    key: cat + '-' + i,
                    label: this.titleCase(cat),
                    amountText: this.formatMoney(amount, this.currency),
                    segStyle: `width:${pct}%;background:${color};`,
                    dotStyle: `background:${color};`
                };
            });
        const n = this.rawTransactions.length;
        this.countText = n + (n === 1 ? ' transaction' : ' transactions');
    }

    get hasTransactions() {
        return this.transactions && this.transactions.length > 0;
    }

    get hasBreakdown() {
        return this.breakdown && this.breakdown.length > 1;
    }

    get hasMoneyIn() {
        return !!this.moneyInText;
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
            this.formatAmount(Number(txn.amount), txn.currency || this.currency)
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