/**
 * @description ASA Energy & Utilities · Rebate Offers renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders the rebates the customer qualifies for as perforated
 * "voucher" tiles — a bold amber rebate-amount stub torn from a body with the
 * upgrade name + detail. The customer selects one, then the CTA applies. The
 * choice is sent back via embeddedservice_configuration.util.sendTextMessage().
 *
 * Contract: the field names read below MUST match the example JSON + rules in
 * genAiFunctions/asaEnergyRebateOffers_Output_d1e6/input/schema.json.
 * Fields: title?, subtitle?, currency?, offers[]{id, name, category?,
 * rebateAmount?, detail?, badge?}, submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

const CATEGORY_LABELS = {
    thermostat: 'Thermostat',
    hvac: 'HVAC',
    heat_pump: 'Heat pump',
    ev_charger: 'EV charger',
    solar: 'Solar',
    insulation: 'Insulation',
    water_heater: 'Water heater',
    appliance: 'Appliance',
};

function num(v) {
    const n = Number(v);
    return isFinite(n) ? n : null;
}

function titleCase(s) {
    return String(s || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const TEST_DATA = {
    title: 'Rebates you qualify for',
    subtitle: 'Save on energy-efficient upgrades',
    currency: 'USD',
    offers: [
        { id: 'thermostat', name: 'Smart thermostat', category: 'thermostat', rebateAmount: 75, detail: 'ENERGY STAR models', badge: 'Popular' },
        { id: 'heatpump', name: 'Heat pump HVAC', category: 'heat_pump', rebateAmount: 1200, detail: 'Whole-home system' },
        { id: 'evcharger', name: 'Level 2 EV charger', category: 'ev_charger', rebateAmount: 500, detail: 'Install included' },
        { id: 'insulation', name: 'Attic insulation', category: 'insulation', rebateAmount: 350, detail: 'Up to R-49' },
    ],
    submitText: 'Apply for rebate',
    submitValue: 'Apply for the rebate',
};

export default class AsaEnergyRebateOffers extends LightningElement {
    @api value; // Receives the AsaEnergyRebateOffersData object from the Lightning Type.

    @track title = 'Rebates you qualify for';
    @track subtitle = '';
    @track offers = [];
    @track submitText = 'Apply for rebate';
    @track selectedId = '';

    isTestMode = false;
    currency = 'USD';
    submitValue = '';
    rawOffers = [];

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.energyRebateOffersJSON) {
                const data = JSON.parse(this.value.energyRebateOffersJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaEnergyRebateOffers parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData({});
    }

    isUsable(data) {
        return data && typeof data === 'object';
    }

    money(amount) {
        const n = Number(amount);
        if (!isFinite(n)) return '';
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: this.currency || 'USD', maximumFractionDigits: 0 }).format(n);
        } catch (e) {
            return `${this.currency || 'USD'} ${n.toFixed(0)}`;
        }
    }

    initializeFromData(data) {
        const raw = data || {};
        this.isTestMode = !(Array.isArray(raw.offers) && raw.offers.filter((o) => o && o.name).length);
        const src = this.isTestMode ? TEST_DATA : raw;

        this.currency = src.currency ? String(src.currency).trim() : 'USD';
        this.title = (src.title && String(src.title).trim()) || 'Rebates you qualify for';
        this.subtitle = src.subtitle ? String(src.subtitle).trim() : '';
        this.submitText = src.submitText ? String(src.submitText).trim() : 'Apply for rebate';
        this.submitValue = src.submitValue ? String(src.submitValue).trim() : '';

        this.rawOffers = (Array.isArray(src.offers) ? src.offers : []).filter((o) => o && o.name);
        this.selectedId = '';
        this.rebuild();
    }

    rebuild() {
        this.offers = this.rawOffers.map((o, i) => {
            const id = o.id ? String(o.id) : `offer-${i}`;
            const cat = String(o.category || '').toLowerCase().replace(/[^a-z_]/g, '');
            const rebate = num(o.rebateAmount);
            const selected = id === this.selectedId;
            return {
                key: id,
                id,
                name: String(o.name).trim(),
                categoryLabel: cat ? (CATEGORY_LABELS[cat] || titleCase(cat)) : '',
                hasCategory: !!cat,
                rebateText: rebate !== null ? this.money(rebate) : '',
                hasRebate: rebate !== null,
                detail: o.detail ? String(o.detail).trim() : '',
                hasDetail: !!o.detail,
                badge: o.badge ? String(o.badge).trim() : '',
                hasBadge: !!o.badge,
                selected,
                tileClass: `asa-ro-voucher${selected ? ' is-selected' : ''}`,
            };
        });
    }

    get hasSubtitle() { return !!this.subtitle; }
    get hasOffers() { return this.offers.length > 0; }
    get ctaDisabled() { return !this.selectedId; }

    get selectedName() {
        const found = this.rawOffers.find((o, i) => (o.id ? String(o.id) : `offer-${i}`) === this.selectedId);
        return found ? String(found.name).trim() : '';
    }

    handleSelect(event) {
        const id = event.currentTarget.dataset.id;
        this.selectedId = this.selectedId === id ? '' : id;
        this.rebuild();
    }

    handleKey(event) {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
            event.preventDefault();
            this.handleSelect(event);
        }
    }

    handleSubmit() {
        if (!this.selectedId) return;
        const name = this.selectedName;
        const base = this.submitValue || 'Apply for the rebate';
        const message = `${base} — ${name} (id: ${this.selectedId})`;
        this.sendMessage(message);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaEnergyRebateOffers sent:', message))
                    .catch((err) => console.error('AsaEnergyRebateOffers send error:', err));
            } else {
                console.log('AsaEnergyRebateOffers: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaEnergyRebateOffers sendMessage error:', err);
        }
    }
}