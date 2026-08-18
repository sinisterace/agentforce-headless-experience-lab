/**
 * @description ASA Manufacturing · Quote Builder (Configure-to-Order) renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a configurator: a product header, one or more option
 * groups (each a row of single-select chips carrying a price delta), a quantity
 * stepper, and a LIVE estimated price that recomputes as the customer changes
 * options/quantity. The CTA sends the configured selection + estimate back via
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaMfgQuoteBuilder_Output_d8e5/input/schema.json.
 * Fields: title?, product?, currency?, basePrice?, optionGroups[]{id, label,
 * selectedId?, options[]{id, label, priceDelta?, detail?}}, quantity?,
 * minQuantity?, submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

function num(v) {
    const n = Number(v);
    return isFinite(n) ? n : null;
}

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const TEST_QUOTE = {
    title: 'Configure your quote',
    product: 'TB-9000 Assembly Cell',
    currency: 'USD',
    basePrice: 48000,
    optionGroups: [
        {
            id: 'material', label: 'Frame material', selectedId: 'steel',
            options: [
                { id: 'steel', label: 'Powder-coated steel', priceDelta: 0 },
                { id: 'stainless', label: 'Stainless 304', priceDelta: 3200, detail: 'Washdown-rated' }
            ]
        },
        {
            id: 'controls', label: 'Control package',
            options: [
                { id: 'standard', label: 'Standard PLC', priceDelta: 0 },
                { id: 'advanced', label: 'Advanced PLC + HMI', priceDelta: 5400 }
            ]
        },
        {
            id: 'warranty', label: 'Warranty',
            options: [
                { id: '1yr', label: '1 year', priceDelta: 0 },
                { id: '3yr', label: '3 years', priceDelta: 2600 },
                { id: '5yr', label: '5 years', priceDelta: 4200 }
            ]
        }
    ],
    quantity: 1,
    submitText: 'Request quote',
    submitValue: 'Request a formal quote for the configured TB-9000 Assembly Cell'
};

export default class AsaMfgQuoteBuilder extends LightningElement {
    @api value; // Receives the AsaMfgQuoteBuilderData object from the Lightning Type.

    @track title = 'Configure your quote';
    @track hasProduct = false;
    @track product = '';
    @track hasBase = false;
    @track baseText = '';

    @track groups = [];

    @track quantity = 1;
    @track minusDisabled = true;
    @track estimateText = '';
    @track estimateNote = '';

    @track submitText = 'Request quote';

    isTestMode = false;
    currency = 'USD';
    basePrice = 0;
    minQuantity = 1;
    submitValue = '';
    // internal selection state: { [groupId]: optionId }
    selection = {};
    groupsRaw = [];

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.mfgQuoteBuilderJSON) {
                const data = JSON.parse(this.value.mfgQuoteBuilderJSON);
                if (this.isUsable(data)) {
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

    isUsable(data) {
        return data && typeof data === 'object';
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasGroups = Array.isArray(raw.optionGroups) && raw.optionGroups.filter((g) => g && g.label && Array.isArray(g.options) && g.options.length).length > 0;
        this.isTestMode = !hasGroups;
        const source = this.isTestMode ? TEST_QUOTE : raw;
        this.recompute(source);
    }

    money(amount) {
        const n = Number(amount);
        if (!isFinite(n)) return '';
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: this.currency || 'USD', maximumFractionDigits: 0 }).format(n);
        } catch (e) {
            return `${this.currency || 'USD'} ${Math.round(n)}`;
        }
    }

    recompute(source) {
        this.title = (source.title && String(source.title).trim()) || 'Configure your quote';
        this.product = source.product ? String(source.product).trim() : '';
        this.hasProduct = !!this.product;
        this.currency = source.currency ? String(source.currency).trim() : 'USD';
        this.basePrice = num(source.basePrice) || 0;
        this.hasBase = this.basePrice > 0;
        this.baseText = this.hasBase ? `Base ${this.money(this.basePrice)}` : '';

        this.groupsRaw = (Array.isArray(source.optionGroups) ? source.optionGroups : [])
            .filter((g) => g && g.label && Array.isArray(g.options) && g.options.length)
            .map((g, gi) => ({
                id: g.id ? String(g.id) : `g${gi}`,
                label: String(g.label).trim(),
                options: g.options.filter((o) => o && o.id && o.label).map((o) => ({
                    id: String(o.id),
                    label: String(o.label).trim(),
                    priceDelta: num(o.priceDelta) || 0,
                    detail: o.detail ? String(o.detail).trim() : ''
                })),
                selectedId: g.selectedId ? String(g.selectedId) : null
            }))
            .filter((g) => g.options.length);

        // Seed selection: provided selectedId, else first option.
        this.selection = {};
        this.groupsRaw.forEach((g) => {
            const valid = g.options.some((o) => o.id === g.selectedId);
            this.selection[g.id] = valid ? g.selectedId : g.options[0].id;
        });

        this.minQuantity = Math.max(1, num(source.minQuantity) || 1);
        this.quantity = Math.max(this.minQuantity, num(source.quantity) || this.minQuantity);

        this.submitText = source.submitText ? String(source.submitText).trim() : 'Request quote';
        this.submitValue = source.submitValue ? String(source.submitValue).trim() : '';

        this.renderGroups();
        this.refreshEstimate();
    }

    renderGroups() {
        this.groups = this.groupsRaw.map((g) => ({
            id: g.id,
            label: g.label,
            options: g.options.map((o) => {
                const selected = this.selection[g.id] === o.id;
                const deltaText = o.priceDelta > 0 ? `+${this.money(o.priceDelta)}` : o.priceDelta < 0 ? `−${this.money(Math.abs(o.priceDelta))}` : 'Included';
                return {
                    key: `${g.id}-${o.id}`,
                    groupId: g.id,
                    optionId: o.id,
                    label: o.label,
                    hasDetail: !!o.detail,
                    detail: o.detail,
                    deltaText,
                    chipClass: selected ? 'asa-qb-chip is-selected' : 'asa-qb-chip'
                };
            })
        }));
    }

    refreshEstimate() {
        let unit = this.basePrice;
        this.groupsRaw.forEach((g) => {
            const opt = g.options.find((o) => o.id === this.selection[g.id]);
            if (opt) unit += opt.priceDelta;
        });
        const total = unit * this.quantity;
        this.estimateText = this.money(total);
        this.estimateNote = this.quantity > 1 ? `${this.money(unit)} each · qty ${this.quantity}` : 'Estimated · excludes tax & freight';
        this.minusDisabled = this.quantity <= this.minQuantity;
    }

    handleSelect(event) {
        const { groupId, optionId } = event.currentTarget.dataset;
        if (!groupId || !optionId) return;
        this.selection = { ...this.selection, [groupId]: optionId };
        this.renderGroups();
        this.refreshEstimate();
    }

    handleDecrement() {
        if (this.quantity <= this.minQuantity) return;
        this.quantity -= 1;
        this.refreshEstimate();
    }

    handleIncrement() {
        this.quantity += 1;
        this.refreshEstimate();
    }

    handleSubmit() {
        const chosen = this.groupsRaw.map((g) => {
            const opt = g.options.find((o) => o.id === this.selection[g.id]);
            return opt ? `${g.label}: ${opt.label}` : null;
        }).filter(Boolean).join(', ');
        const base = this.submitValue || `Request a quote for ${this.product || 'the configured product'}`;
        const message = `${base} — ${chosen}; quantity ${this.quantity}; estimated ${this.estimateText}`;
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
