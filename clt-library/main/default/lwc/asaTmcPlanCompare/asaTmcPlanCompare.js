/**
 * @description ASA Technology, Media & Comms · Plan Comparison renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a vertical stack of price-forward plan cards — each with
 * a monthly price, tagline, and a feature checklist. One plan can carry a
 * "recommended" highlight + badge; the customer's current plan is marked and is
 * not selectable. Tapping a selectable plan selects it; the CTA sends the choice
 * back to the agent via embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaTmcPlanCompare_Output_e1a4/input/schema.json.
 * Fields: title?, subtitle?, currency?, cadence?(mo|yr), currentPlanId?,
 * plans[]{id, name, price(number), tagline?, badge?, recommended?(bool),
 * features?[string]}, submitText?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Used
// when the Flow payload has no usable plans, mirroring the preview's test mode.
const TEST_PLANS = {
    title: 'Compare plans',
    subtitle: 'Pick the plan that fits how you use your phone',
    currency: 'USD',
    cadence: 'mo',
    currentPlanId: 'essential',
    plans: [
        {
            id: 'essential',
            name: 'Essential',
            price: 45,
            tagline: 'For light users',
            features: ['10 GB premium data', '5G nationwide', 'SD streaming']
        },
        {
            id: 'unlimited',
            name: 'Unlimited Plus',
            price: 70,
            tagline: 'Our most popular plan',
            badge: 'Most popular',
            recommended: true,
            features: ['Unlimited premium data', 'HD streaming', '50 GB hotspot', '5G Ultra Capacity']
        },
        {
            id: 'premium',
            name: 'Premium 5G',
            price: 90,
            tagline: 'Everything, maxed out',
            features: ['Unlimited premium data', '4K UHD streaming', '100 GB hotspot', 'Global roaming']
        }
    ],
    submitText: 'Switch plan'
};

function formatMoney(amount, currency) {
    const n = Number(amount);
    if (!isFinite(n)) return '';
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
            minimumFractionDigits: n % 1 === 0 ? 0 : 2,
            maximumFractionDigits: 2
        }).format(n);
    } catch (e) {
        return `${currency || 'USD'} ${n.toFixed(2)}`;
    }
}

export default class AsaTmcPlanCompare extends LightningElement {
    @api value; // Receives the AsaTmcPlanCompareData object from the Lightning Type.

    @track title = 'Compare plans';
    @track hasSubtitle = false;
    @track subtitle = '';
    @track plans = [];
    @track hasSubmit = false;
    @track submitText = 'Switch plan';

    isTestMode = false;
    selectedId = '';
    currency = 'USD';
    cadence = 'mo';
    currentPlanId = '';

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.tmcPlanCompareJSON) {
                const data = JSON.parse(this.value.tmcPlanCompareJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaTmcPlanCompare parse error:', e.message);
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
        const hasPlans = Array.isArray(raw.plans) && raw.plans.filter((p) => p && p.id && p.name).length > 0;
        this.isTestMode = !hasPlans;
        const source = this.isTestMode ? TEST_PLANS : raw;
        this.recompute(source);
    }

    cadenceSuffix(cadence) {
        const raw = String(cadence || 'mo').toLowerCase().replace(/[^a-z]/g, '');
        if (raw === 'yr' || raw === 'year' || raw === 'yearly' || raw === 'annual' || raw === 'annually') return '/yr';
        if (raw === 'wk' || raw === 'week' || raw === 'weekly') return '/wk';
        return '/mo';
    }

    recompute(source) {
        this.title = (source.title && String(source.title).trim()) || 'Compare plans';
        this.subtitle = source.subtitle ? String(source.subtitle).trim() : '';
        this.hasSubtitle = !!this.subtitle;
        this.currency = source.currency ? String(source.currency).trim() : 'USD';
        this.cadence = this.cadenceSuffix(source.cadence);
        this.currentPlanId = source.currentPlanId ? String(source.currentPlanId).trim() : '';

        const list = Array.isArray(source.plans) ? source.plans.filter((p) => p && p.id && p.name) : [];
        // Cap at four so the stack never overflows a narrow chat column.
        this.plans = list.slice(0, 4).map((p) => {
            const isCurrent = this.currentPlanId && String(p.id) === this.currentPlanId;
            const recommended = !!p.recommended && !isCurrent;
            const features = Array.isArray(p.features)
                ? p.features.filter((f) => f != null && String(f).trim()).map((f, i) => ({ key: `f-${i}`, text: String(f).trim() }))
                : [];
            const badge = isCurrent ? '' : p.badge ? String(p.badge).trim() : '';
            return {
                id: String(p.id),
                name: String(p.name).trim(),
                price: formatMoney(p.price, p.currency || this.currency),
                cadence: this.cadence,
                hasTagline: !!(p.tagline && String(p.tagline).trim()),
                tagline: p.tagline ? String(p.tagline).trim() : '',
                hasBadge: !!badge,
                badge,
                features,
                hasFeatures: features.length > 0,
                isCurrent,
                selectable: !isCurrent,
                recommended,
                selected: false,
                _class: '',
                _btnLabel: 'Select'
            };
        });
        this.applyStateClasses();

        this.submitText = source.submitText ? String(source.submitText).trim() : 'Switch plan';
    }

    applyStateClasses() {
        this.plans = this.plans.map((p) => {
            const selected = p.selectable && p.id === this.selectedId;
            let cls = 'asa-plc-card';
            if (p.isCurrent) cls += ' is-current';
            if (p.recommended) cls += ' is-recommended';
            if (selected) cls += ' is-selected';
            if (!p.selectable) cls += ' is-locked';
            return {
                ...p,
                selected,
                _class: cls,
                _btnLabel: p.isCurrent ? 'Current plan' : selected ? 'Selected' : 'Select'
            };
        });
        const chosen = this.plans.find((p) => p.selected);
        this.hasSubmit = !!chosen;
    }

    handleSelect(event) {
        const id = event.currentTarget.dataset.id;
        if (!id) return;
        const plan = this.plans.find((p) => p.id === id);
        if (!plan || !plan.selectable) return;
        this.selectedId = this.selectedId === id ? '' : id;
        this.applyStateClasses();
    }

    handleKey(event) {
        // The plan card is a role="button" div (it holds a feature <ul>, which a
        // real <button> may not), so wire up Enter/Space to activate it.
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
            event.preventDefault();
            this.handleSelect(event);
        }
    }

    handleSubmit() {
        const chosen = this.plans.find((p) => p.selected);
        if (!chosen) return;
        const price = chosen.price ? ` (${chosen.price}${chosen.cadence})` : '';
        this.sendMessage(`Switch my plan to ${chosen.name}${price} (plan: ${chosen.id})`);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaTmcPlanCompare sent:', message))
                    .catch((err) => console.error('AsaTmcPlanCompare send error:', err));
            } else {
                console.log('AsaTmcPlanCompare: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaTmcPlanCompare sendMessage error:', err);
        }
    }
}
