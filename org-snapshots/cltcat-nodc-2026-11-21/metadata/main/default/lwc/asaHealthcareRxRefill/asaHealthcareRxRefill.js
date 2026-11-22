/**
 * @description ASA Healthcare · Prescription Refill renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders each medication as a pharmacy prescription LABEL — an ℞
 * mark, name + strength, a monospace label data block (Sig / Supply / Refills)
 * and a squared select box — plus a tear-off pickup-pharmacy ticket. Out-of-
 * refills meds get a "NO REFILLS" stamp and aren't selectable. Confirming sends
 * the request back to the agent through
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaHealthcareRxRefill_Output_c4e6/input/schema.json.
 * Fields: title, subtitle?, medications[] of { id, name, dosage?, supplyText?,
 * status?, refillsLeft? }, pharmacy?{ name, address?, hours? }, submitText?.
 */
import { LightningElement, api, track } from 'lwc';
import RX_ATORVASTATIN from '@salesforce/resourceUrl/asaRxAtorvastatin';
import RX_LISINOPRIL from '@salesforce/resourceUrl/asaRxLisinopril';
import RX_METFORMIN from '@salesforce/resourceUrl/asaRxMetformin';

// Pill photography keyed by the generic medication name (matched on any leading
// word, so "Atorvastatin 20 mg" still resolves). Referenced via
// @salesforce/resourceUrl so the versioned URL loads inside Agentforce/ECv2.
const MED_IMAGES = {
    atorvastatin: RX_ATORVASTATIN,
    lisinopril: RX_LISINOPRIL,
    metformin: RX_METFORMIN
};
function resolveMedImage(name) {
    const n = String(name || '').toLowerCase();
    const key = Object.keys(MED_IMAGES).find((k) => n.includes(k));
    return key ? MED_IMAGES[key] : '';
}

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const FALLBACK_DATA = {
    title: 'Refill prescriptions',
    subtitle: 'Select the medications to refill',
    medications: [
        { id: 'm1', name: 'Atorvastatin', dosage: '20 mg tablet', supplyText: '3 days left', status: 'low', refillsLeft: 2 },
        { id: 'm2', name: 'Lisinopril', dosage: '10 mg tablet', supplyText: 'In stock', status: 'ok', refillsLeft: 5 },
        { id: 'm3', name: 'Metformin', dosage: '500 mg tablet', supplyText: 'No refills left', status: 'out', refillsLeft: 0 }
    ],
    pharmacy: { name: 'Walgreens · Market St', address: '700 Market St', hours: 'Open until 10 PM' }
};

export default class AsaHealthcareRxRefill extends LightningElement {
    @api value; // Receives the AsaHealthcareRxRefillData object from the Lightning Type.

    @track title = 'Refill prescriptions';
    @track subtitle = '';
    @track hasSubtitle = false;
    @track submitText = 'Request refill';
    @track medications = []; // display-ready rows (computed)
    @track pharmacyName = '';
    @track pharmacyAddress = '';
    @track pharmacyHours = '';
    @track hasPharmacy = false;

    rawMeds = [];
    selectedIds = new Set();
    isTestMode = false;

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.healthcareRxRefillJSON) {
                const data = JSON.parse(this.value.healthcareRxRefillJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaHealthcareRxRefill parse error:', e.message);
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
        const list = Array.isArray(data.medications) ? data.medications.filter((m) => m && (m.name || m.id)) : [];
        this.isTestMode = list.length === 0;
        const source = this.isTestMode ? FALLBACK_DATA : { ...data, medications: list };
        this.rawMeds = Array.isArray(source.medications) ? source.medications : [];
        this.title = (source.title && String(source.title).trim()) || 'Refill prescriptions';
        this.subtitle = source.subtitle ? String(source.subtitle).trim() : '';
        this.hasSubtitle = !!this.subtitle;
        this.submitText = (data.submitText && String(data.submitText).trim()) || 'Request refill';

        const ph = source.pharmacy && typeof source.pharmacy === 'object' ? source.pharmacy : null;
        this.pharmacyName = ph && ph.name ? String(ph.name) : '';
        this.pharmacyAddress = ph && ph.address ? String(ph.address).trim() : '';
        this.pharmacyHours = ph && ph.hours ? String(ph.hours).trim() : '';
        this.hasPharmacy = !!this.pharmacyName;

        this.selectedIds = new Set();
        this.recompute();
    }

    statusBucket(s) {
        const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
        if (raw === 'low' || raw === 'runninglow' || raw === 'warn') return 'low';
        if (raw === 'out' || raw === 'norefills' || raw === 'none' || raw === 'empty') return 'out';
        return 'ok';
    }

    statusText(bucket) {
        if (bucket === 'low') return 'Running low';
        if (bucket === 'out') return 'No refills';
        return 'In stock';
    }

    keyFor(med, index) {
        return med && med.id ? String(med.id) : 'med-' + index;
    }

    recompute() {
        this.medications = this.rawMeds.map((med, index) => {
            const key = this.keyFor(med, index);
            const bucket = this.statusBucket(med.status);
            const selectable = bucket !== 'out';
            const isSelected = selectable && this.selectedIds.has(key);
            const supply = med.supplyText ? String(med.supplyText).trim() : this.statusText(bucket);
            let refillsNote = '';
            if (med.refillsLeft != null && !Number.isNaN(Number(med.refillsLeft))) {
                const n = Number(med.refillsLeft);
                refillsNote = n === 1 ? '1 remaining' : `${n} remaining`;
            }
            const dosage = med.dosage ? String(med.dosage).trim() : '';
            const imageUrl = resolveMedImage(med.name);
            return {
                key,
                index,
                name: med.name ? String(med.name) : 'Medication',
                imageUrl,
                hasImage: !!imageUrl,
                dosage,
                hasDosage: !!dosage,
                supply,
                tagClass: 'asa-rx-tag is-' + bucket,
                refillsNote,
                hasRefillsNote: !!refillsNote,
                isOut: bucket === 'out',
                selectable,
                disabled: !selectable,
                selected: isSelected,
                rowClass: 'asa-rx-med is-' + bucket + (isSelected ? ' is-selected' : '') + (selectable ? '' : ' is-disabled'),
                checkClass: isSelected ? 'asa-rx-check on' : 'asa-rx-check'
            };
        });
    }

    get hasMeds() {
        return this.medications && this.medications.length > 0;
    }

    get selectedCount() {
        return this.selectedIds.size;
    }

    get showSubmit() {
        return this.selectedIds.size > 0;
    }

    get submitLabel() {
        const n = this.selectedIds.size;
        const base = this.submitText || 'Request refill';
        return n > 0 ? `${base} (${n})` : base;
    }

    handleToggle(event) {
        const key = String(event.currentTarget.dataset.key || '');
        const index = Number(event.currentTarget.dataset.index);
        const med = this.rawMeds[index];
        if (!key || !med) return;
        if (this.statusBucket(med.status) === 'out') return; // not refillable here
        if (this.selectedIds.has(key)) {
            this.selectedIds.delete(key);
        } else {
            this.selectedIds.add(key);
        }
        this.selectedIds = new Set(this.selectedIds);
        this.recompute();
    }

    handleSubmit() {
        const names = this.rawMeds
            .filter((m, i) => this.selectedIds.has(this.keyFor(m, i)))
            .map((m) => (m.name ? String(m.name) : 'medication'));
        if (!names.length) return;
        const pickup = this.pharmacyName ? ` for pickup at ${this.pharmacyName}` : '';
        this.sendMessage(`Request a refill for ${names.join(', ')}${pickup}`);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaHealthcareRxRefill sent:', message))
                    .catch((err) => console.error('AsaHealthcareRxRefill send error:', err));
            } else {
                console.log('AsaHealthcareRxRefill: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaHealthcareRxRefill sendMessage error:', err);
        }
    }
}