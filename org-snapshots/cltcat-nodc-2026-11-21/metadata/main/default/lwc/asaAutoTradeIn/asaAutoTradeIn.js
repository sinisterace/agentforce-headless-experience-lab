/**
 * @description ASA Automotive · Trade-In Estimator renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a vehicle trade-in valuation: an identity row, a big
 * estimated value, a low–high value-range bar with an estimate marker, an
 * optional instant-offer note, the factors driving the estimate, and primary +
 * secondary actions. Tapping an action sends the choice back to the agent via
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaAutoTradeIn_Output_e9f0/input/schema.json.
 * Fields: title?, vehicle{name, detail?, imageUrl?, initials?}, currency?,
 * estimate(number), low?, high?, offerText?, factors[]{label, detail?,
 * impact?(positive|neutral|negative)}, submitText?, submitValue?,
 * secondaryText?, secondaryValue?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const TEST_DATA = {
    title: 'Your trade-in estimate',
    vehicle: { name: '2021 Midsize SUV', detail: '42,300 mi · Good condition', initials: 'SV' },
    currency: 'USD',
    estimate: 18400,
    low: 16900,
    high: 19800,
    offerText: 'Instant offer good for 7 days',
    factors: [
        { label: 'Mileage', detail: '42,300 mi — below average', impact: 'positive' },
        { label: 'Condition', detail: 'Good', impact: 'neutral' },
        { label: 'Market demand', detail: 'High for this trim', impact: 'positive' }
    ],
    submitText: 'Apply to a purchase',
    submitValue: "I'd like to apply my trade-in toward a purchase",
    secondaryText: 'Book an appraisal',
    secondaryValue: "I'd like to book an in-person appraisal"
};

function num(v) {
    const n = Number(v);
    return isFinite(n) ? n : null;
}

function normImpact(s) {
    const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
    if (raw === 'positive' || raw === 'up' || raw === 'good') return 'positive';
    if (raw === 'negative' || raw === 'down' || raw === 'bad') return 'negative';
    return 'neutral';
}

function formatMoney(amount, currency) {
    const n = Number(amount);
    if (!isFinite(n)) return '';
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(n);
    } catch (e) {
        return `${currency || 'USD'} ${Math.round(n)}`;
    }
}

export default class AsaAutoTradeIn extends LightningElement {
    @api value; // Receives the AsaAutoTradeInData object from the Lightning Type.

    @track title = 'Your trade-in estimate';
    @track vehicleName = '';
    @track vehicleDetail = '';
    @track hasVehicleDetail = false;
    @track hasImage = false;
    @track imageUrl = '';
    @track initials = '';

    @track estimateLabel = '';
    @track lowLabel = '';
    @track highLabel = '';
    @track markerStyle = 'left:50%;';

    @track hasOffer = false;
    @track offerText = '';

    @track factors = [];

    @track hasPrimary = false;
    @track submitText = '';
    @track hasSecondary = false;
    @track secondaryText = '';

    isTestMode = false;
    submitValue = '';
    secondaryValue = '';

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.autoTradeInJSON) {
                const data = JSON.parse(this.value.autoTradeInJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaAutoTradeIn parse error:', e.message);
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
        this.isTestMode = num(raw.estimate) === null;
        const src = this.isTestMode ? TEST_DATA : raw;
        this.recompute(src);
    }

    recompute(src) {
        this.title = (src.title && String(src.title).trim()) || 'Your trade-in estimate';

        const v = src.vehicle || {};
        this.vehicleName = v.name ? String(v.name).trim() : 'Your vehicle';
        this.vehicleDetail = v.detail ? String(v.detail).trim() : '';
        this.hasVehicleDetail = !!this.vehicleDetail;
        this.imageUrl = v.imageUrl ? String(v.imageUrl).trim() : '';
        this.hasImage = !!this.imageUrl;
        const parts = this.vehicleName.split(/\s+/).filter(Boolean);
        this.initials = (v.initials && String(v.initials).trim().slice(0, 2).toUpperCase())
            || ((parts[0] ? parts[0][0] : '') + (parts[1] ? parts[1][0] : '')).toUpperCase()
            || 'CAR';

        const currency = src.currency ? String(src.currency).trim() : 'USD';
        const estimate = Math.max(0, num(src.estimate) || 0);
        let low = num(src.low);
        let high = num(src.high);
        if (low === null) low = Math.round(estimate * 0.9);
        if (high === null) high = Math.round(estimate * 1.1);
        // Keep the range sane so the marker always lands inside the track.
        low = Math.min(low, estimate);
        high = Math.max(high, estimate);
        this.estimateLabel = formatMoney(estimate, currency);
        this.lowLabel = formatMoney(low, currency);
        this.highLabel = formatMoney(high, currency);
        const span = high - low || 1;
        const frac = Math.max(0, Math.min(1, (estimate - low) / span));
        this.markerStyle = `left:${(frac * 100).toFixed(2)}%;`;

        this.offerText = src.offerText ? String(src.offerText).trim() : '';
        this.hasOffer = !!this.offerText;

        const rawFactors = Array.isArray(src.factors) ? src.factors.filter((f) => f && f.label) : [];
        this.factors = rawFactors.map((f, i) => {
            const impact = normImpact(f.impact);
            return {
                key: `f-${i}`,
                label: String(f.label).trim(),
                detail: f.detail ? String(f.detail).trim() : '',
                hasDetail: !!f.detail,
                rowClass: `asa-ti-factor is-${impact}`,
                isPositive: impact === 'positive',
                isNegative: impact === 'negative'
            };
        });

        this.submitText = src.submitText ? String(src.submitText).trim() : '';
        this.hasPrimary = !!this.submitText;
        this.submitValue = src.submitValue ? String(src.submitValue).trim() : this.submitText;

        this.secondaryText = src.secondaryText ? String(src.secondaryText).trim() : '';
        this.hasSecondary = !!this.secondaryText;
        this.secondaryValue = src.secondaryValue ? String(src.secondaryValue).trim() : this.secondaryText;
    }

    handleImageError() {
        this.hasImage = false;
    }

    handlePrimary() {
        if (!this.hasPrimary) return;
        this.sendMessage(this.submitValue || this.submitText);
    }

    handleSecondary() {
        if (!this.hasSecondary) return;
        this.sendMessage(this.secondaryValue || this.secondaryText);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaAutoTradeIn sent:', message))
                    .catch((err) => console.error('AsaAutoTradeIn send error:', err));
            } else {
                console.log('AsaAutoTradeIn: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaAutoTradeIn sendMessage error:', err);
        }
    }
}