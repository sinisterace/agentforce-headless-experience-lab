/**
 * @description ASA Public Sector & Education · Documents Checklist renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a multi-select checklist of the documents needed for an
 * application or enrollment, each with a status pill (green received / navy
 * required / muted optional). Documents already received are shown checked and
 * are not selectable. Confirming sends the request back to the agent through
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaPseDocsChecklist_Output_a9f6/input/schema.json.
 * Fields: title, subtitle?, documents[] of { id, name, detail?, status? },
 * submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const FALLBACK_DATA = {
    title: "Required documents",
    subtitle: 'For your building permit application',
    documents: [
        { id: 'id', name: 'Government-issued ID', detail: "Driver's license or passport", status: 'received' },
        { id: 'proof', name: 'Proof of residency', detail: 'Utility bill within 60 days', status: 'required' },
        { id: 'site', name: 'Site plan', detail: 'PDF, drawn to scale', status: 'required' },
        { id: 'insurance', name: 'Contractor insurance', detail: 'Only if using a contractor', status: 'optional' }
    ],
    submitText: 'Upload selected',
    submitValue: 'I\'d like to upload the selected documents'
};

export default class AsaPseDocsChecklist extends LightningElement {
    @api value; // Receives the AsaPseDocsChecklistData object from the Lightning Type.

    @track title = "Required documents";
    @track subtitle = '';
    @track hasSubtitle = false;
    @track submitText = 'Upload selected';
    @track documents = []; // display-ready rows (computed)

    rawDocs = [];
    submitValue = '';
    selectedIds = new Set();
    isTestMode = false;

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.pseDocsChecklistJSON) {
                const data = JSON.parse(this.value.pseDocsChecklistJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaPseDocsChecklist parse error:', e.message);
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
        const list = Array.isArray(data.documents) ? data.documents.filter((d) => d && (d.name || d.id)) : [];
        this.isTestMode = list.length === 0;
        const source = this.isTestMode ? FALLBACK_DATA : { ...data, documents: list };
        this.rawDocs = Array.isArray(source.documents) ? source.documents : [];
        this.title = (source.title && String(source.title).trim()) || "Required documents";
        this.subtitle = source.subtitle ? String(source.subtitle).trim() : '';
        this.hasSubtitle = !!this.subtitle;
        this.submitText = (data.submitText && String(data.submitText).trim()) || 'Upload selected';
        this.submitValue = source.submitValue ? String(source.submitValue).trim() : '';

        this.selectedIds = new Set();
        this.recompute();
    }

    statusBucket(s) {
        const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
        if (raw === 'received' || raw === 'have' || raw === 'provided' || raw === 'done' || raw === 'complete' || raw === 'uploaded') return 'received';
        if (raw === 'optional' || raw === 'ifapplicable' || raw === 'ifneeded') return 'optional';
        return 'required';
    }

    statusText(bucket) {
        if (bucket === 'received') return 'Received';
        if (bucket === 'optional') return 'Optional';
        return 'Required';
    }

    keyFor(doc, index) {
        return doc && doc.id ? String(doc.id) : 'doc-' + index;
    }

    recompute() {
        this.documents = this.rawDocs.map((doc, index) => {
            const key = this.keyFor(doc, index);
            const bucket = this.statusBucket(doc.status);
            const selectable = bucket !== 'received';
            const isSelected = selectable && this.selectedIds.has(key);
            const checkOn = isSelected || bucket === 'received';
            return {
                key,
                index,
                name: doc.name ? String(doc.name) : 'Document',
                detail: doc.detail ? String(doc.detail).trim() : '',
                hasDetail: !!(doc.detail && String(doc.detail).trim()),
                stampLabel: this.statusText(bucket),
                stampClass: 'asa-dc-stamp is-' + bucket,
                selectable,
                disabled: !selectable,
                selected: isSelected,
                rowClass: 'asa-dc-doc is-' + bucket + (isSelected ? ' is-selected' : '') + (selectable ? '' : ' is-disabled'),
                boxClass: checkOn ? 'asa-dc-box on' : 'asa-dc-box'
            };
        });
    }

    get hasDocs() {
        return this.documents && this.documents.length > 0;
    }

    // --- Manifest progress ("X OF Y PROVIDED") ---
    get totalCount() {
        return this.rawDocs.length;
    }

    get providedCount() {
        let received = 0;
        this.rawDocs.forEach((d) => {
            if (this.statusBucket(d.status) === 'received') received += 1;
        });
        return received + this.selectedIds.size;
    }

    get progressLabel() {
        return `${this.providedCount} OF ${this.totalCount} PROVIDED`;
    }

    get progressStyle() {
        const pct = this.totalCount ? Math.round((this.providedCount / this.totalCount) * 100) : 0;
        return `width:${pct}%;`;
    }

    get showSubmit() {
        return this.selectedIds.size > 0;
    }

    get submitLabel() {
        const n = this.selectedIds.size;
        const base = this.submitText || 'Upload selected';
        return n > 0 ? `${base} (${n})` : base;
    }

    handleToggle(event) {
        const key = String(event.currentTarget.dataset.key || '');
        const index = Number(event.currentTarget.dataset.index);
        const doc = this.rawDocs[index];
        if (!key || !doc) return;
        if (this.statusBucket(doc.status) === 'received') return; // already provided
        if (this.selectedIds.has(key)) {
            this.selectedIds.delete(key);
        } else {
            this.selectedIds.add(key);
        }
        this.selectedIds = new Set(this.selectedIds);
        this.recompute();
    }

    handleSubmit() {
        const names = this.rawDocs
            .filter((d, i) => this.selectedIds.has(this.keyFor(d, i)))
            .map((d) => (d.name ? String(d.name) : 'document'));
        if (!names.length) return;
        const base = this.submitValue || 'Upload the selected documents';
        this.sendMessage(`${base}: ${names.join(', ')}`);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaPseDocsChecklist sent:', message))
                    .catch((err) => console.error('AsaPseDocsChecklist send error:', err));
            } else {
                console.log('AsaPseDocsChecklist: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaPseDocsChecklist sendMessage error:', err);
        }
    }
}