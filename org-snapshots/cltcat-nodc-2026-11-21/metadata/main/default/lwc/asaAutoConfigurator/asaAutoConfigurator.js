/**
 * @description ASA Automotive · Vehicle Configurator (build-and-price) renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a configurator: a model header, a paint-color swatch row
 * (single-select circular chips), one or more option groups (each a row of
 * single-select chips carrying a price delta), and a LIVE estimated price that
 * recomputes as the customer changes the color/options. The CTA sends the
 * configured selection + estimate back via
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaAutoConfigurator_Output_e1f2/input/schema.json.
 * Fields: title?, model?, currency?, basePrice?, colors[]{id, label, hex,
 * priceDelta?, selected?}, optionGroups[]{id, label, selectedId?,
 * options[]{id, label, priceDelta?, detail?}}, submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

function num(v) {
    const n = Number(v);
    return isFinite(n) ? n : null;
}

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const TEST_BUILD = {
    title: 'Build your electric SUV',
    model: 'Electric SUV',
    currency: 'USD',
    basePrice: 41990,
    colors: [
        { id: 'white', label: 'Glacier White', hex: '#f3f4f6', priceDelta: 0 },
        { id: 'black', label: 'Midnight Black', hex: '#111827' },
        { id: 'red', label: 'Radiant Red', hex: '#dc2626', priceDelta: 595, selected: true }
    ],
    optionGroups: [
        {
            id: 'trim', label: 'Trim', selectedId: 'rs',
            options: [
                { id: 'lt', label: 'LT', priceDelta: 0 },
                { id: 'rs', label: 'RS', priceDelta: 3200, detail: 'Sport-tuned' }
            ]
        },
        {
            id: 'drive', label: 'Drivetrain', selectedId: 'awd',
            options: [
                { id: 'fwd', label: 'FWD', priceDelta: 0 },
                { id: 'awd', label: 'AWD', priceDelta: 2500 }
            ]
        },
        {
            id: 'pkg', label: 'Packages', selectedId: 'tech',
            options: [
                { id: 'none', label: 'None', priceDelta: 0 },
                { id: 'tech', label: 'Technology Package', priceDelta: 1800, detail: 'Adaptive cruise, HUD' }
            ]
        }
    ],
    submitText: 'Reserve this build',
    submitValue: "I'd like to reserve this configuration"
};

export default class AsaAutoConfigurator extends LightningElement {
    @api value; // Receives the AsaAutoConfiguratorData object from the Lightning Type.

    @track title = 'Build your vehicle';
    @track hasModel = false;
    @track model = '';
    @track hasBase = false;
    @track baseText = '';

    @track hasColors = false;
    @track colorChips = [];
    @track colorNameText = '';

    @track groups = [];

    @track estimateText = '';
    @track estimateNote = '';

    @track submitText = 'Reserve this build';

    isTestMode = false;
    currency = 'USD';
    basePrice = 0;
    submitValue = '';
    // internal selection state: { [groupId]: optionId }
    selection = {};
    groupsRaw = [];
    colorsRaw = [];
    selectedColorId = '';

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.autoConfiguratorJSON) {
                const data = JSON.parse(this.value.autoConfiguratorJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaAutoConfigurator parse error:', e.message);
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
        const hasColors = Array.isArray(raw.colors) && raw.colors.filter((c) => c && c.id && c.label).length > 0;
        this.isTestMode = !hasGroups && !hasColors;
        const source = this.isTestMode ? TEST_BUILD : raw;
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
        this.title = (source.title && String(source.title).trim()) || 'Build your vehicle';
        this.model = source.model ? String(source.model).trim() : '';
        this.hasModel = !!this.model;
        this.currency = source.currency ? String(source.currency).trim() : 'USD';
        this.basePrice = num(source.basePrice) || 0;
        this.hasBase = this.basePrice > 0;
        this.baseText = this.hasBase ? `Base ${this.money(this.basePrice)}` : '';

        // Colors
        this.colorsRaw = (Array.isArray(source.colors) ? source.colors : [])
            .filter((c) => c && c.id && c.label)
            .map((c) => ({
                id: String(c.id),
                label: String(c.label).trim(),
                hex: c.hex ? String(c.hex).trim() : '#e2e8f0',
                priceDelta: num(c.priceDelta) || 0,
                selected: !!c.selected
            }));
        this.hasColors = this.colorsRaw.length > 0;
        if (this.hasColors) {
            const preselected = this.colorsRaw.find((c) => c.selected);
            this.selectedColorId = preselected ? preselected.id : this.colorsRaw[0].id;
        } else {
            this.selectedColorId = '';
        }

        // Option groups
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

        this.selection = {};
        this.groupsRaw.forEach((g) => {
            const valid = g.options.some((o) => o.id === g.selectedId);
            this.selection[g.id] = valid ? g.selectedId : g.options[0].id;
        });

        this.submitText = source.submitText ? String(source.submitText).trim() : 'Reserve this build';
        this.submitValue = source.submitValue ? String(source.submitValue).trim() : '';

        this.renderColors();
        this.renderGroups();
        this.refreshEstimate();
    }

    renderColors() {
        this.colorChips = this.colorsRaw.map((c) => {
            const selected = this.selectedColorId === c.id;
            return {
                key: `c-${c.id}`,
                colorId: c.id,
                label: c.label,
                swatchStyle: `background:${c.hex};`,
                chipClass: selected ? 'asa-cfg-swatch is-selected' : 'asa-cfg-swatch'
            };
        });
        const chosen = this.colorsRaw.find((c) => c.id === this.selectedColorId);
        this.colorNameText = chosen ? chosen.label : '';
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
                    chipClass: selected ? 'asa-cfg-chip is-selected' : 'asa-cfg-chip'
                };
            })
        }));
    }

    refreshEstimate() {
        let total = this.basePrice;
        const color = this.colorsRaw.find((c) => c.id === this.selectedColorId);
        if (color) total += color.priceDelta;
        this.groupsRaw.forEach((g) => {
            const opt = g.options.find((o) => o.id === this.selection[g.id]);
            if (opt) total += opt.priceDelta;
        });
        this.estimateText = this.money(total);
        this.estimateNote = 'Estimated · excludes tax, title & fees';
    }

    handleColor(event) {
        const { colorId } = event.currentTarget.dataset;
        if (!colorId) return;
        this.selectedColorId = colorId;
        this.renderColors();
        this.refreshEstimate();
    }

    handleSelect(event) {
        const { groupId, optionId } = event.currentTarget.dataset;
        if (!groupId || !optionId) return;
        this.selection = { ...this.selection, [groupId]: optionId };
        this.renderGroups();
        this.refreshEstimate();
    }

    handleSubmit() {
        const parts = [];
        const color = this.colorsRaw.find((c) => c.id === this.selectedColorId);
        if (color) parts.push(`Color: ${color.label}`);
        this.groupsRaw.forEach((g) => {
            const opt = g.options.find((o) => o.id === this.selection[g.id]);
            if (opt) parts.push(`${g.label}: ${opt.label}`);
        });
        const base = this.submitValue || `Reserve the configured ${this.model || 'vehicle'}`;
        const message = `${base} — ${parts.join(', ')}; estimated ${this.estimateText}`;
        this.sendMessage(message);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaAutoConfigurator sent:', message))
                    .catch((err) => console.error('AsaAutoConfigurator send error:', err));
            } else {
                console.log('AsaAutoConfigurator: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaAutoConfigurator sendMessage error:', err);
        }
    }
}