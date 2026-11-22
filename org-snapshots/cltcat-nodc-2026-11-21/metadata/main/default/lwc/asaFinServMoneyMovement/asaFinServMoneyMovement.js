/**
 * @description ASA Financial Services · Money Movement renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and lets the customer pick a recipient (saved payee / own account)
 * and then a preset amount (or an "Other amount" escape hatch). The choice is
 * sent back to the agent through
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaFinServMoneyMovement_Output_c3e7/input/schema.json.
 * Fields: title?, fromAccount{ label, mask? }, recipients[] of
 * { id, name, type?, mask?, detail? }, amountPresets[] of { id, label?, amount },
 * currency?, allowOther?, otherText?, submitText?.
 */
import { LightningElement, api, track } from 'lwc';

const OTHER_KEY = '__other__';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Renders
// when the Flow payload is missing/malformed. It is a plain object (no
// JSON.parse), so nothing here can fail.
const FALLBACK_DATA = {
    title: 'Send money',
    fromAccount: { label: 'Everyday Checking', mask: '1234' },
    recipients: [
        { id: 'rcp-1', name: 'Alex Rivera', type: 'person', mask: '4821', detail: 'Checking' },
        { id: 'rcp-2', name: 'Rewards Card', type: 'card', mask: '9012', detail: 'Credit Card' },
        { id: 'rcp-3', name: 'High-Yield Savings', type: 'account', mask: '5678', detail: 'Savings' }
    ],
    amountPresets: [
        { id: 'amt-1', label: '$50', amount: 50 },
        { id: 'amt-2', label: '$100', amount: 100 },
        { id: 'amt-3', label: '$250', amount: 250 },
        { id: 'amt-4', label: 'Minimum', amount: 35 }
    ],
    currency: 'USD',
    allowOther: true,
    otherText: 'Other amount',
    submitText: 'Continue'
};

export default class AsaFinServMoneyMovement extends LightningElement {
    @api value; // Receives the AsaFinServMoneyMovementData object from the Lightning Type.

    @track title = '';
    @track fromLabel = '';
    @track fromName = '';
    @track fromMask = '';
    @track submitText = 'Continue';
    @track otherText = 'Other amount';
    @track allowOther = false;
    @track recipients = []; // display-ready rows (computed)
    @track amounts = []; // display-ready chips (computed)
    @track errorMessage = '';

    rawRecipients = [];
    rawAmounts = [];
    currency = 'USD';
    selectedRecipientKey = '';
    selectedAmountKey = '';
    isTestMode = false;

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.finServMoneyMovementJSON) {
                const data = JSON.parse(this.value.finServMoneyMovementJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaFinServMoneyMovement parse error:', e.message);
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
        const list = Array.isArray(data.recipients) ? data.recipients : [];
        // No recipients → show generic sample so the card is never blank.
        this.isTestMode = list.length === 0;
        const source = this.isTestMode ? FALLBACK_DATA : data;
        this.rawRecipients = Array.isArray(source.recipients) ? source.recipients : [];
        this.rawAmounts = Array.isArray(source.amountPresets) ? source.amountPresets : [];
        this.title = source.title || '';
        this.fromLabel = this.buildFromLabel(source.fromAccount);
        const fromParts = this.buildFromParts(source.fromAccount);
        this.fromName = fromParts.name;
        this.fromMask = fromParts.mask;
        this.currency = source.currency || 'USD';
        this.allowOther = source.allowOther === true;
        this.otherText = (data.otherText && String(data.otherText).trim()) || 'Other amount';
        this.submitText = (data.submitText && String(data.submitText).trim()) || 'Continue';
        this.selectedRecipientKey = '';
        this.selectedAmountKey = '';
        this.recompute();
    }

    buildFromLabel(fromAccount) {
        if (!fromAccount) return '';
        if (typeof fromAccount === 'string') return fromAccount;
        const label = fromAccount.label || '';
        const mask = fromAccount.mask ? ' ••' + fromAccount.mask : '';
        return (label + mask).trim();
    }

    // Source-node display: account name + masked tail split apart so the "From"
    // tile can style the mask separately. Falls back to a bare label string.
    buildFromParts(fromAccount) {
        if (!fromAccount) return { name: '', mask: '' };
        if (typeof fromAccount === 'string') return { name: fromAccount, mask: '' };
        return {
            name: fromAccount.label || 'Your account',
            mask: fromAccount.mask ? '•• ' + fromAccount.mask : ''
        };
    }

    keyFor(prefix, item, index) {
        return item && item.id ? prefix + '-' + String(item.id) : prefix + '-idx-' + index;
    }

    formatMoney(amount, currency) {
        const cur = currency || this.currency || 'USD';
        const num = Number(amount);
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(isNaN(num) ? 0 : num);
        } catch (e) {
            return cur + ' ' + (isNaN(num) ? '0.00' : num.toFixed(2));
        }
    }

    typeOf(recipient) {
        return String((recipient && recipient.type) || 'person').toLowerCase();
    }

    recompute() {
        this.recipients = this.rawRecipients.map((rcp, index) => {
            const key = this.keyFor('rcp', rcp, index);
            const isSelected = key === this.selectedRecipientKey;
            const type = this.typeOf(rcp);
            const mask = rcp.mask ? '•• ' + rcp.mask : '';
            const detailParts = [rcp.detail, mask].filter((p) => p && String(p).trim());
            return {
                key,
                index,
                name: rcp.name || 'Recipient',
                detailLine: detailParts.join(' · '),
                hasDetail: detailParts.length > 0,
                selected: isSelected,
                rowClass: 'asa-mm-row' + (isSelected ? ' selected' : ''),
                checkClass: isSelected ? 'asa-mm-check on' : 'asa-mm-check',
                isPerson: type === 'person',
                isCard: type === 'card',
                isAccount: type === 'account',
                isBusiness: type === 'business',
                isExternal: type === 'external',
                isOtherType: !['person', 'card', 'account', 'business', 'external'].includes(type)
            };
        });

        const chips = this.rawAmounts.map((amt, index) => {
            const key = this.keyFor('amt', amt, index);
            const isSelected = key === this.selectedAmountKey;
            const label = (amt.label && String(amt.label).trim()) || this.formatMoney(amt.amount);
            return {
                key,
                index,
                label,
                selected: isSelected,
                chipClass: 'asa-mm-chip' + (isSelected ? ' selected' : '')
            };
        });
        if (this.allowOther) {
            const isSelected = this.selectedAmountKey === OTHER_KEY;
            chips.push({
                key: OTHER_KEY,
                index: -1,
                label: this.otherText,
                selected: isSelected,
                chipClass: 'asa-mm-chip is-other' + (isSelected ? ' selected' : '')
            });
        }
        this.amounts = chips;
    }

    get hasRecipients() {
        return this.recipients && this.recipients.length > 0;
    }

    get hasAmounts() {
        return this.amounts && this.amounts.length > 0;
    }

    // Submit only once a recipient AND an amount (preset or "Other") are chosen.
    get showSubmit() {
        return !!this.selectedRecipientKey && !!this.selectedAmountKey;
    }

    handleSelectRecipient(event) {
        const key = event.currentTarget.dataset.key;
        this.selectedRecipientKey = this.selectedRecipientKey === key ? '' : key;
        this.recompute();
    }

    handleSelectAmount(event) {
        const key = event.currentTarget.dataset.key;
        this.selectedAmountKey = this.selectedAmountKey === key ? '' : key;
        this.recompute();
    }

    handleSubmit() {
        const rcpIndex = this.rawRecipients.findIndex((r, i) => this.keyFor('rcp', r, i) === this.selectedRecipientKey);
        if (rcpIndex < 0) return;
        const rcp = this.rawRecipients[rcpIndex];
        const rcpName = rcp.name || 'recipient';
        const rcpMask = rcp.mask ? ' •• ' + rcp.mask : '';
        const fromPart = this.fromLabel ? ` from ${this.fromLabel}` : '';
        const rcpIdPart = rcp.id ? `recipient: ${rcp.id}` : '';

        if (this.selectedAmountKey === OTHER_KEY) {
            const ids = rcpIdPart ? ` (${rcpIdPart})` : '';
            this.sendMessage(`Send money to ${rcpName}${rcpMask}${fromPart} — I'd like to enter a different amount${ids}`);
            return;
        }

        const amtIndex = this.rawAmounts.findIndex((a, i) => this.keyFor('amt', a, i) === this.selectedAmountKey);
        if (amtIndex < 0) return;
        const amt = this.rawAmounts[amtIndex];
        const amountDisplay = this.formatMoney(amt.amount);
        const idParts = [rcpIdPart, amt.id ? `amount: ${amt.id}` : ''].filter(Boolean).join(', ');
        const ids = idParts ? ` (${idParts})` : '';
        this.sendMessage(`Send ${amountDisplay} to ${rcpName}${rcpMask}${fromPart}${ids}`);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaFinServMoneyMovement sent:', message))
                    .catch((err) => console.error('AsaFinServMoneyMovement send error:', err));
            } else {
                console.log('AsaFinServMoneyMovement: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaFinServMoneyMovement sendMessage error:', err);
        }
    }
}