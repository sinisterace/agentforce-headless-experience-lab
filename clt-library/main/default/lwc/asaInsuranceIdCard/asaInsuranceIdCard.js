/**
 * @description ASA Insurance · Digital ID Card renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a wallet-style proof-of-insurance card: carrier + status,
 * a detail grid (policyholder, policy #, vehicle, plate, dates), coverage chips,
 * and primary/secondary actions. Tapping an action sends a message back to the
 * agent through embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaInsuranceIdCard_Output_e5f7/input/schema.json.
 * Fields: title?, carrier?, policyType?, policyholder?, policyNumber?, vehicle?,
 * plate?, effectiveDate?, expirationDate?, status?, coverages[]{label, detail?},
 * submitText?, submitValue?, secondaryText?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Renders
// when the Flow payload is missing/malformed. Plain object (no JSON.parse).
const FALLBACK_DATA = {
    title: 'Proof of insurance',
    carrier: 'Meridian Mutual',
    policyType: 'Auto',
    policyholder: 'Jordan Rivera',
    policyNumber: 'AUTO-8842-XY',
    vehicle: '2022 Tesla Model 3',
    plate: '8ABC123',
    effectiveDate: 'Jan 1, 2026',
    expirationDate: 'Jul 1, 2028',
    status: 'Active',
    coverages: [
        { label: 'Liability' },
        { label: 'Collision', detail: '$500 ded.' },
        { label: 'Comprehensive', detail: '$500 ded.' },
        { label: 'Uninsured motorist' }
    ],
    submitText: 'Email me a copy',
    submitValue: 'Email me a copy of my insurance ID card',
    secondaryText: 'Add to wallet'
};

export default class AsaInsuranceIdCard extends LightningElement {
    @api value; // Receives the AsaInsuranceIdCardData object from the Lightning Type.

    @track title = 'Proof of insurance';
    @track carrier = '';
    @track status = '';
    @track kindLabel = '';
    @track fields = [];
    @track coverages = [];
    @track submitText = 'Email me a copy';
    @track secondaryText = '';

    isTestMode = false;
    submitValue = '';

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.insuranceIdCardJSON) {
                const data = JSON.parse(this.value.insuranceIdCardJSON);
                if (data && typeof data === 'object') {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaInsuranceIdCard parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData(FALLBACK_DATA);
    }

    initializeFromData(data) {
        const covRaw = Array.isArray(data.coverages) ? data.coverages.filter((c) => c && c.label) : [];
        // Test mode when the payload carries no identifying content — never blank.
        this.isTestMode = !(data.policyNumber || data.carrier || covRaw.length > 0);
        const src = this.isTestMode ? FALLBACK_DATA : data;
        const srcCov = Array.isArray(src.coverages) ? src.coverages.filter((c) => c && c.label) : [];

        this.title = (src.title && String(src.title).trim()) || 'Proof of insurance';
        this.carrier = (src.carrier && String(src.carrier).trim()) || 'Your insurer';
        this.status = (src.status && String(src.status).trim()) || '';
        this.kindLabel = src.policyType ? String(src.policyType).trim() + ' · ID Card' : '';
        this.submitText = (src.submitText && String(src.submitText).trim()) || 'Email me a copy';
        this.submitValue = (src.submitValue && String(src.submitValue).trim())
            || 'Email me a copy of my insurance ID card';
        this.secondaryText = (src.secondaryText && String(src.secondaryText).trim()) || '';

        const raw = [
            ['Policyholder', src.policyholder, false],
            ['Policy #', src.policyNumber, true],
            ['Vehicle', src.vehicle, false],
            ['Plate', src.plate, true],
            ['Effective', src.effectiveDate, false],
            ['Expires', src.expirationDate, false]
        ];
        this.fields = raw
            .filter((f) => f[1] != null && String(f[1]).trim())
            .map((f) => ({
                label: f[0],
                value: String(f[1]),
                valClass: f[2] ? 'asa-iid-fval is-mono' : 'asa-iid-fval'
            }));

        this.coverages = srcCov.map((c, i) => ({
            key: (c.label || 'cov') + '-' + i,
            label: c.label,
            detail: c.detail ? String(c.detail) : '',
            hasDetail: !!(c.detail && String(c.detail).trim())
        }));
    }

    get hasStatus() {
        return !!this.status;
    }
    get hasKind() {
        return !!this.kindLabel;
    }
    get hasCoverages() {
        return this.coverages && this.coverages.length > 0;
    }
    get hasSecondary() {
        return !!this.secondaryText;
    }

    handleSubmit() {
        this.sendMessage(this.submitValue || 'Email me a copy of my insurance ID card');
    }

    handleSecondary() {
        this.sendMessage('Add my insurance ID card to my wallet');
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaInsuranceIdCard sent:', message))
                    .catch((err) => console.error('AsaInsuranceIdCard send error:', err));
            } else {
                console.log('AsaInsuranceIdCard: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaInsuranceIdCard sendMessage error:', err);
        }
    }
}
