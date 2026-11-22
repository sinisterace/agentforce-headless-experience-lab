/**
 * @description ASA Manufacturing · Part Reorder renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a single spare part: photo, name/SKU, a stock bar, lead
 * time, unit price, an interactive quantity stepper (− / +) that respects the
 * min order + increment, and a live subtotal. The CTA sends the reorder (with
 * quantity + SKU) back via embeddedservice_configuration.util.sendTextMessage().
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaMfgPartReorder_Output_b6c3/input/schema.json.
 * Fields: title?, part{name, sku?, category?, imageUrl?, unitPrice?, currency?,
 * leadTime?, inStock?, minOrder?, incrementStep?}, quantity?, submitText?,
 * submitValue?.
 */
import { LightningElement, api, track } from 'lwc';
import IO_CONTROLLER from '@salesforce/resourceUrl/asaMfgIoController';

// Sample photography referenced by a stable '/resource/<name>' sentinel. A raw
// '/resource/<name>' path does NOT reliably load inside Agentforce/ECv2 (the card
// renders on a different base URL), so swap the sentinel for the versioned URL
// that @salesforce/resourceUrl resolves. Full https URLs pass through.
const STATIC_RESOURCE_URLS = {
    asaMfgIoController: IO_CONTROLLER
};
function resolveImageUrl(url) {
    const explicit = url ? String(url).trim() : '';
    if (!explicit) return '';
    const m = /^\/resource\/([A-Za-z0-9_]+)/.exec(explicit);
    return m && STATIC_RESOURCE_URLS[m[1]] ? STATIC_RESOURCE_URLS[m[1]] : explicit;
}

function num(v) {
    const n = Number(v);
    return isFinite(n) ? n : null;
}

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const TEST_PART = {
    title: 'Reorder part',
    part: {
        name: 'Industrial I/O Controller',
        sku: 'IOC-4820-DIN',
        category: 'controller',
        imageUrl: '/resource/asaMfgIoController',
        unitPrice: 486,
        currency: 'USD',
        leadTime: 'Ships in 3–5 business days',
        inStock: 142,
        minOrder: 1,
        incrementStep: 1
    },
    quantity: 2,
    submitText: 'Reorder'
};

export default class AsaMfgPartReorder extends LightningElement {
    @api value; // Receives the AsaMfgPartReorderData object from the Lightning Type.

    @track title = 'Reorder part';
    @track partName = '';
    @track hasSku = false;
    @track sku = '';
    @track hasImage = false;
    @track imageUrl = '';
    @track partInitials = '';

    @track hasStock = false;
    @track stockText = '';
    @track stockBarStyle = '';
    @track stockClass = 'asa-pr-stock';
    @track hasLeadTime = false;
    @track leadTime = '';

    @track hasUnitPrice = false;
    @track unitPriceText = '';
    @track quantity = 1;
    @track subtotalText = '';
    @track hasSubtotal = false;
    @track minusDisabled = false;
    @track plusDisabled = false;

    @track submitText = 'Reorder';
    @track ctaLabel = 'Reorder';

    isTestMode = false;
    currency = 'USD';
    unitPrice = null;
    minOrder = 1;
    step = 1;
    maxQty = null;
    submitValue = '';

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.mfgPartReorderJSON) {
                const data = JSON.parse(this.value.mfgPartReorderJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaMfgPartReorder parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData({});
    }

    isUsable(data) {
        return data && typeof data === 'object';
    }

    initializeFromData(data) {
        const raw = data || {};
        this.isTestMode = !(raw.part && raw.part.name);
        const source = this.isTestMode ? TEST_PART : raw;
        this.recompute(source);
    }

    money(amount) {
        const n = Number(amount);
        if (!isFinite(n)) return '';
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: this.currency || 'USD' }).format(n);
        } catch (e) {
            return `${this.currency || 'USD'} ${n.toFixed(2)}`;
        }
    }

    recompute(source) {
        this.title = (source.title && String(source.title).trim()) || 'Reorder part';
        const part = source.part || {};
        this.partName = part.name ? String(part.name).trim() : 'Part';
        this.sku = part.sku ? String(part.sku).trim() : '';
        this.hasSku = !!this.sku;
        this.imageUrl = resolveImageUrl(part.imageUrl);
        this.hasImage = !!this.imageUrl;
        const parts = this.partName.split(/\s+/).filter(Boolean);
        this.partInitials = ((parts[0] ? parts[0][0] : '') + (parts[1] ? parts[1][0] : '')).toUpperCase();

        this.currency = part.currency ? String(part.currency).trim() : 'USD';
        this.unitPrice = num(part.unitPrice);
        this.hasUnitPrice = this.unitPrice !== null;
        this.unitPriceText = this.hasUnitPrice ? `${this.money(this.unitPrice)} each` : '';

        this.leadTime = part.leadTime ? String(part.leadTime).trim() : '';
        this.hasLeadTime = !!this.leadTime;

        // Stock bar: fill relative to a soft cap so "low" reads visually.
        const inStock = num(part.inStock);
        if (inStock !== null) {
            this.hasStock = true;
            const low = inStock <= 10;
            const out = inStock <= 0;
            this.stockText = out ? 'Out of stock' : `${inStock} in stock`;
            this.stockClass = `asa-pr-stock${out ? ' is-out' : low ? ' is-low' : ''}`;
            const pct = out ? 0 : Math.max(6, Math.min(100, (inStock / 150) * 100));
            this.stockBarStyle = `width:${pct.toFixed(0)}%;`;
        } else {
            this.hasStock = false;
        }

        this.minOrder = Math.max(1, num(part.minOrder) || 1);
        this.step = Math.max(1, num(part.incrementStep) || 1);
        this.maxQty = inStock !== null && inStock > 0 ? inStock : null;

        this.submitText = source.submitText ? String(source.submitText).trim() : 'Reorder';
        this.submitValue = source.submitValue ? String(source.submitValue).trim() : '';

        let qty = num(source.quantity);
        qty = qty !== null ? qty : this.minOrder;
        this.quantity = this.clampQty(qty);
        this.refreshQty();
    }

    clampQty(q) {
        let v = Math.round(Number(q) || this.minOrder);
        if (v < this.minOrder) v = this.minOrder;
        if (this.maxQty !== null && v > this.maxQty) v = this.maxQty;
        return v;
    }

    refreshQty() {
        this.minusDisabled = this.quantity <= this.minOrder;
        this.plusDisabled = this.maxQty !== null && this.quantity + this.step > this.maxQty;
        if (this.hasUnitPrice) {
            this.subtotalText = this.money(this.unitPrice * this.quantity);
            this.hasSubtotal = true;
        } else {
            this.hasSubtotal = false;
        }
        const units = this.quantity === 1 ? 'unit' : 'units';
        this.ctaLabel = this.hasSubtotal
            ? `${this.submitText} · ${this.subtotalText}`
            : `${this.submitText} ${this.quantity} ${units}`;
    }

    handleDecrement() {
        this.quantity = this.clampQty(this.quantity - this.step);
        this.refreshQty();
    }

    handleIncrement() {
        this.quantity = this.clampQty(this.quantity + this.step);
        this.refreshQty();
    }

    handleImageError() {
        this.hasImage = false;
    }

    handleSubmit() {
        const skuPart = this.hasSku ? ` (SKU ${this.sku})` : '';
        const message = this.submitValue
            ? `${this.submitValue} — quantity ${this.quantity}${skuPart}`
            : `Reorder ${this.quantity} × ${this.partName}${skuPart}`;
        this.sendMessage(message);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaMfgPartReorder sent:', message))
                    .catch((err) => console.error('AsaMfgPartReorder send error:', err));
            } else {
                console.log('AsaMfgPartReorder: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaMfgPartReorder sendMessage error:', err);
        }
    }
}
