/**
 * @description ASA Manufacturing · Quote Builder (Cart / Quote Review) renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a B2B quote review: a header card (cart id + status +
 * ship-to / bill-to), a line-items table (item #, description, UOM + unit price,
 * a quantity stepper and per-line total, plus an "Add item" affordance), and an
 * order-details block (PO number, subtotal, a "Calculate fees" shipping estimate,
 * an estimated total, and an acknowledgement checkbox that gates submit). The CTA
 * sends a quote-request summary back via
 * embeddedservice_configuration.util.sendTextMessage().
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaMfgQuoteBuilder_Output_d8e5/input/schema.json.
 * Fields: title?, cartId?, statusLabel?, shipTo?, shipToId?, billTo?, currency?,
 * lineItems[]{ id, itemNumber?, description, uom?, unitPrice?, quantity? },
 * poLabel?, poPlaceholder?, shippingText?, acknowledgeText?, submitText?,
 * submitValue?, secondaryText?.
 */
import { LightningElement, api, track } from 'lwc';

function num(v) {
    const n = Number(v);
    return isFinite(n) ? n : null;
}

const DEFAULT_ACK =
    'I acknowledge that pricing is an estimate pending a formal quote and confirm the configuration is correct.';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Mirrors
// the seed payload + the React preview's TEST cart exactly.
const TEST_QUOTE = {
    title: 'Quote',
    cartId: 'QT-00042',
    statusLabel: 'Draft quote',
    shipTo: 'Rivera Robotics · Plant 2',
    shipToId: '#PL-2-0192',
    billTo: 'Rivera Manufacturing, Inc.',
    currency: 'USD',
    lineItems: [
        { id: 'frame', itemNumber: 'TB-9000-FRM', description: 'Assembly cell frame, powder-coated steel', uom: 'EA', unitPrice: 4800, quantity: 2 },
        { id: 'plc', itemNumber: 'PLC-ADV-24', description: 'Advanced PLC + HMI control package', uom: 'EA', unitPrice: 5400, quantity: 1 },
        { id: 'conv', itemNumber: 'CONV-3M', description: 'Conveyor belt module, 3 m span', uom: 'EA', unitPrice: 1260, quantity: 3 },
        { id: 'safety', itemNumber: 'SAF-LC-KIT', description: 'Light-curtain safety kit', uom: 'KIT', unitPrice: 980, quantity: 1 }
    ],
    poLabel: 'Purchase Order #',
    poPlaceholder: 'Enter PO number…',
    acknowledgeText: DEFAULT_ACK,
    secondaryText: 'Save & close',
    submitText: 'Request quote',
    submitValue: 'Request a formal quote for this configured order'
};

export default class AsaMfgQuoteBuilder extends LightningElement {
    @api value; // Receives the AsaMfgQuoteBuilderData object from the Lightning Type.

    @track isTestMode = false;

    // Header
    @track headerLabel = 'Quote';
    @track statusLabel = '';
    @track hasStatus = false;
    @track shipTo = '';
    @track hasShipTo = false;
    @track shipToId = '';
    @track hasShipId = false;
    @track billTo = '';
    @track hasBillTo = false;
    @track hasShipMeta = false;

    // Line items (display projection of rawLines)
    @track lines = [];

    // Order details
    @track poLabel = 'Purchase Order #';
    @track poPlaceholder = 'Enter PO number…';
    @track po = '';
    @track subtotalText = '';
    @track shippingDash = '—';
    @track feesCalculated = false;
    @track feesText = '';
    @track totalText = '';

    @track acknowledgeText = '';
    @track hasAck = false;
    @track agree = false;

    @track submitText = 'Request quote';
    @track secondaryText = '';
    @track hasSecondary = false;
    @track submitDisabled = false;

    // Internal (non-rendered) state
    currency = 'USD';
    submitValue = '';
    cartId = '';
    rawLines = [];
    fees = null;
    nextSeq = 0;

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.mfgQuoteBuilderJSON) {
                const data = JSON.parse(this.value.mfgQuoteBuilderJSON);
                if (data && typeof data === 'object') {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaMfgQuoteBuilder parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData({});
    }

    initializeFromData(data) {
        const raw = data || {};
        const usable = Array.isArray(raw.lineItems)
            ? raw.lineItems.filter((li) => li && li.description)
            : [];
        this.isTestMode = usable.length === 0;
        const source = this.isTestMode ? TEST_QUOTE : raw;
        const items = Array.isArray(source.lineItems)
            ? source.lineItems.filter((li) => li && li.description)
            : [];

        const title = (source.title && String(source.title).trim()) || 'Quote';
        this.cartId = source.cartId ? String(source.cartId).trim() : '';
        this.headerLabel = this.cartId || title;

        this.statusLabel = source.statusLabel ? String(source.statusLabel).trim() : '';
        this.hasStatus = !!this.statusLabel;
        this.shipTo = source.shipTo ? String(source.shipTo).trim() : '';
        this.hasShipTo = !!this.shipTo;
        this.shipToId = source.shipToId ? String(source.shipToId).trim() : '';
        this.hasShipId = !!this.shipToId;
        this.billTo = source.billTo ? String(source.billTo).trim() : '';
        this.hasBillTo = !!this.billTo;
        this.hasShipMeta = this.hasShipId || this.hasBillTo;

        this.currency = source.currency ? String(source.currency).trim() : 'USD';

        this.poLabel = (source.poLabel && String(source.poLabel).trim()) || 'Purchase Order #';
        this.poPlaceholder = (source.poPlaceholder && String(source.poPlaceholder).trim()) || 'Enter PO number…';
        this.po = '';
        this.shippingDash = (source.shippingText && String(source.shippingText).trim()) || '—';

        // acknowledgeText: an explicit empty string hides the checkbox; anything
        // else (incl. undefined) shows text — undefined falls back to DEFAULT_ACK.
        if (source.acknowledgeText === '') {
            this.acknowledgeText = '';
        } else {
            this.acknowledgeText = (source.acknowledgeText && String(source.acknowledgeText).trim()) || DEFAULT_ACK;
        }
        this.hasAck = !!this.acknowledgeText;
        this.agree = false;

        this.submitText = (source.submitText && String(source.submitText).trim()) || 'Request quote';
        this.submitValue = source.submitValue ? String(source.submitValue).trim() : '';
        this.secondaryText = source.secondaryText ? String(source.secondaryText).trim() : '';
        this.hasSecondary = !!this.secondaryText;

        this.rawLines = items.map((li, i) => ({
            id: li.id ? String(li.id) : `li-${i}`,
            itemNumber: li.itemNumber ? String(li.itemNumber).trim() : '',
            description: String(li.description).trim(),
            uom: li.uom ? String(li.uom).trim() : '',
            unitPrice: num(li.unitPrice) || 0,
            quantity: Math.max(1, Math.round(num(li.quantity) || 1))
        }));
        this.fees = null;
        this.recompute();
    }

    money(amount) {
        const n = Number(amount);
        if (!isFinite(n)) return '';
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: this.currency || 'USD',
                maximumFractionDigits: 2
            }).format(n);
        } catch (e) {
            return `${this.currency || 'USD'} ${n.toFixed(2)}`;
        }
    }

    get subtotal() {
        return this.rawLines.reduce(
            (sum, l) => sum + (Number(l.unitPrice) || 0) * (Number(l.quantity) || 0),
            0
        );
    }

    recompute() {
        this.lines = this.rawLines.map((l) => {
            const qty = Number(l.quantity) || 1;
            const unit = Number(l.unitPrice) || 0;
            const lineTotal = unit * qty;
            const hasUnit = unit > 0;
            return {
                id: l.id,
                itemNumber: l.itemNumber || '—',
                description: l.description,
                uom: l.uom,
                hasUom: !!l.uom,
                hasUnit,
                unitText: hasUnit ? `${this.money(unit)} ea` : '',
                quantity: qty,
                hasLineTotal: lineTotal > 0,
                lineTotalText: lineTotal > 0 ? this.money(lineTotal) : ''
            };
        });
        const subtotal = this.subtotal;
        this.subtotalText = this.money(subtotal);
        this.feesCalculated = this.fees != null;
        this.feesText = this.fees != null ? this.money(this.fees) : '';
        this.totalText = this.money(subtotal + (this.fees || 0));
        this.submitDisabled = this.hasAck && !this.agree;
    }

    lineById(id) {
        return this.rawLines.find((l) => l.id === id);
    }

    handleDecrement(event) {
        const id = event.currentTarget.dataset.id;
        const l = this.lineById(id);
        if (!l) return;
        if (l.quantity <= 1) {
            // Remove the line, but keep at least one so the card is never empty.
            if (this.rawLines.length > 1) {
                this.rawLines = this.rawLines.filter((x) => x.id !== id);
                this.fees = null;
            }
        } else {
            l.quantity -= 1;
            this.rawLines = [...this.rawLines];
        }
        this.recompute();
    }

    handleIncrement(event) {
        const id = event.currentTarget.dataset.id;
        const l = this.lineById(id);
        if (!l) return;
        l.quantity += 1;
        this.rawLines = [...this.rawLines];
        this.recompute();
    }

    handleAddItem() {
        const base = this.rawLines[this.rawLines.length - 1];
        const id = `li-new-${this.nextSeq++}`;
        const line = base
            ? { ...base, id, quantity: 1 }
            : { id, itemNumber: '', description: 'New line item', uom: 'EA', unitPrice: 0, quantity: 1 };
        this.rawLines = [...this.rawLines, line];
        this.fees = null; // adding an item invalidates the prior shipping estimate
        this.recompute();
    }

    handlePoInput(event) {
        this.po = event.target.value;
    }

    handleCalcFees() {
        this.fees = Math.max(150, Math.round(this.subtotal * 0.035));
        this.recompute();
    }

    handleAckChange(event) {
        this.agree = event.target.checked;
        this.recompute();
    }

    handleSubmit() {
        if (this.submitDisabled) return;
        const itemsSummary = this.rawLines
            .map((l) => `${l.quantity}× ${l.description}${l.itemNumber ? ` (${l.itemNumber})` : ''}`)
            .join('; ');
        const subtotal = this.subtotal;
        const total = subtotal + (this.fees || 0);
        const poPart = this.po ? ` · PO ${this.po}` : '';
        const cartPart = this.cartId ? `${this.cartId}: ` : '';
        const base = this.submitValue || 'Request a formal quote for this configured order';
        const message = `${base} — ${cartPart}${itemsSummary}${poPart} · Estimated total ${this.money(total)}`;
        this.sendMessage(message);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaMfgQuoteBuilder sent:', message))
                    .catch((err) => console.error('AsaMfgQuoteBuilder send error:', err));
            } else {
                console.log('AsaMfgQuoteBuilder: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaMfgQuoteBuilder sendMessage error:', err);
        }
    }
}
