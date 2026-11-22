/**
 * @description ASA Insurance · Policy Selector renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a list of the customer's insurance policies. Sends the
 * user's choice back to the agent through
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaInsurancePolicySelector_Output_a1c7/input/schema.json.
 * Fields: title, mode ('single'|'multiple'), policies[] of
 * { id, name, type, policyNumber?, premium?, cadence?, currency?, renewalDate?,
 *   status, coverage?, badge? }, submitText?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Renders
// when the Flow payload is missing/malformed. It is a plain object (no
// JSON.parse), so nothing here can fail.
const FALLBACK_DATA = {
    title: 'Which policy can I help you with?',
    mode: 'single',
    policies: [
        { id: 'pol-8842', name: 'Auto — 2022 Tesla Model 3', type: 'Auto', policyNumber: '8842', premium: 142.5, cadence: 'monthly', currency: 'USD', renewalDate: '2026-11-01', status: 'Active', coverage: 'Collision + Comprehensive · $500 deductible', badge: 'Primary' },
        { id: 'pol-3391', name: 'Homeowners — 14 Elm St', type: 'Home', policyNumber: '3391', premium: 1820.0, cadence: 'annual', currency: 'USD', renewalDate: '2027-02-15', status: 'Active', coverage: 'Dwelling $420k · $1,000 deductible' },
        { id: 'pol-5567', name: 'Term Life — 20yr', type: 'Life', policyNumber: '5567', premium: 48.0, cadence: 'monthly', currency: 'USD', renewalDate: '2038-06-01', status: 'Active', coverage: '$500,000 benefit' }
    ]
};

export default class AsaInsurancePolicySelector extends LightningElement {
    @api value; // Receives the AsaInsurancePolicySelectorData object from the Lightning Type.

    @track title = '';
    @track mode = 'single';
    @track submitText = 'Continue';
    @track policies = []; // display-ready cards (computed)
    @track errorMessage = '';

    rawPolicies = [];
    selectedKeys = [];
    isTestMode = false;

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.insurancePolicySelectorJSON) {
                const data = JSON.parse(this.value.insurancePolicySelectorJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaInsurancePolicySelector parse error:', e.message);
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
        const list = Array.isArray(data.policies) ? data.policies : [];
        // Empty policies → show generic sample so the card is never blank.
        this.isTestMode = list.length === 0;
        const source = this.isTestMode ? FALLBACK_DATA : data;
        this.rawPolicies = Array.isArray(source.policies) ? source.policies : [];
        this.title = source.title || '';
        this.mode = source.mode === 'multiple' ? 'multiple' : 'single';
        this.submitText = (data.submitText && String(data.submitText).trim()) || 'Continue';
        this.selectedKeys = [];
        this.recompute();
    }

    keyFor(pol, index) {
        return pol && pol.id ? String(pol.id) : 'idx-' + index;
    }

    formatMoney(amount, currency) {
        const cur = currency || 'USD';
        const num = Number(amount);
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(isNaN(num) ? 0 : num);
        } catch (e) {
            return cur + ' ' + (isNaN(num) ? '0.00' : num.toFixed(2));
        }
    }

    // ISO yyyy-mm-dd → "Nov 1, 2026" (parsed as a local date to avoid a tz
    // day-shift). Any non-ISO string is shown as-is.
    formatDate(value) {
        if (!value) return '';
        const s = String(value);
        const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!m) return s;
        try {
            const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
            return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
        } catch (e) {
            return s;
        }
    }

    // Normalise a policy type to one of the icon buckets the template renders.
    typeOf(type) {
        const raw = String(type || '').toLowerCase().replace(/[^a-z]/g, '');
        if (raw === 'home' || raw === 'homeowners' || raw === 'property' || raw === 'dwelling') return 'home';
        if (raw === 'renters' || raw === 'rental' || raw === 'tenant') return 'renters';
        if (raw === 'life' || raw === 'termlife' || raw === 'wholelife') return 'life';
        if (raw === 'health' || raw === 'medical' || raw === 'dental' || raw === 'vision') return 'health';
        if (raw === 'umbrella' || raw === 'liability') return 'umbrella';
        if (raw === 'pet') return 'pet';
        if (raw === 'travel') return 'travel';
        return 'auto';
    }

    // Status → a pill modifier + display label. Unknown values read as neutral.
    statusOf(status) {
        const raw = String(status || '').toLowerCase().replace(/[^a-z]/g, '');
        if (raw === 'active' || raw === 'inforce' || raw === 'current') return 'active';
        if (raw === 'pending' || raw === 'inreview' || raw === 'processing') return 'pending';
        if (raw === 'lapsed' || raw === 'expired' || raw === 'pastdue') return 'lapsed';
        if (raw === 'cancelled' || raw === 'canceled' || raw === 'terminated') return 'cancelled';
        return 'neutral';
    }

    statusLabelOf(status, bucket) {
        const trimmed = String(status || '').trim();
        if (trimmed) return trimmed;
        if (bucket === 'active') return 'Active';
        if (bucket === 'pending') return 'Pending';
        if (bucket === 'lapsed') return 'Lapsed';
        if (bucket === 'cancelled') return 'Cancelled';
        return '';
    }

    recompute() {
        const selected = new Set(this.selectedKeys);
        this.policies = this.rawPolicies.map((pol, index) => {
            const key = this.keyFor(pol, index);
            const isSelected = selected.has(key);
            const type = this.typeOf(pol.type);
            const statusBucket = this.statusOf(pol.status);
            const statusLabel = this.statusLabelOf(pol.status, statusBucket);
            const hasPremium = typeof pol.premium === 'number' && !isNaN(pol.premium);
            const cadence = pol.cadence ? String(pol.cadence).trim() : '';
            const renewalDisplay = this.formatDate(pol.renewalDate);
            return {
                key,
                index,
                name: pol.name || 'Policy',
                badge: pol.badge || '',
                typeLabel: pol.type || 'Policy',
                mask: pol.policyNumber ? '•• ' + pol.policyNumber : '',
                coverage: pol.coverage || '',
                hasCoverage: !!(pol.coverage && String(pol.coverage).trim()),
                hasPremium,
                premiumDisplay: hasPremium ? this.formatMoney(pol.premium, pol.currency) : '',
                cadenceDisplay: cadence ? '/' + cadence : '',
                hasRenewal: !!renewalDisplay,
                renewalDisplay,
                statusLabel,
                hasStatus: !!statusLabel,
                selected: isSelected,
                isAuto: type === 'auto',
                isHome: type === 'home',
                isRenters: type === 'renters',
                isLife: type === 'life',
                isHealth: type === 'health',
                isUmbrella: type === 'umbrella',
                isPet: type === 'pet',
                isTravel: type === 'travel',
                cardClass: 'asa-ins-policy ' + ('is-' + type) + (isSelected ? ' is-selected' : ''),
                statusClass: 'asa-ins-status is-' + statusBucket,
                checkClass: isSelected ? 'asa-ins-check on' : 'asa-ins-check'
            };
        });
    }

    get showSubmit() {
        return this.mode === 'multiple' && this.selectedKeys.length > 0;
    }

    get hasPolicies() {
        return this.policies && this.policies.length > 0;
    }

    handleSelect(event) {
        const index = Number(event.currentTarget.dataset.index);
        const pol = this.rawPolicies[index];
        if (!pol) return;
        const key = this.keyFor(pol, index);

        if (this.mode === 'single') {
            this.selectedKeys = [key];
            this.recompute();
            this.submitSelection([pol]);
            return;
        }
        const set = new Set(this.selectedKeys);
        if (set.has(key)) {
            set.delete(key);
        } else {
            set.add(key);
        }
        this.selectedKeys = Array.from(set);
        this.recompute();
    }

    handleSubmit() {
        const chosen = this.rawPolicies.filter((pol, index) => this.selectedKeys.includes(this.keyFor(pol, index)));
        if (chosen.length) this.submitSelection(chosen);
    }

    submitSelection(policies) {
        const names = policies
            .map((p) => (p.policyNumber ? `${p.name} (policy •• ${p.policyNumber})` : p.name))
            .join(', ');
        const message = policies.length > 1 ? `Selected policies: ${names}` : `Selected policy: ${names}`;
        this.sendMessage(message);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaInsurancePolicySelector sent:', message))
                    .catch((err) => console.error('AsaInsurancePolicySelector send error:', err));
            } else {
                console.log('AsaInsurancePolicySelector: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaInsurancePolicySelector sendMessage error:', err);
        }
    }
}