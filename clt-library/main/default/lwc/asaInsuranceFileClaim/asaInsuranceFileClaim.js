/**
 * @description ASA Insurance · File a Claim renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a guided "what happened?" form: an optional policy
 * banner plus a grid of incident-type tiles. Selecting a tile (and confirming)
 * sends the choice back to the agent through
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaInsuranceFileClaim_Output_b2d4/input/schema.json.
 * Fields: title, policy?{ label, policyNumber?, imageUrl? },
 * incidentTypes[] of { id, label, description?, icon? }, submitText?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Renders
// when the Flow payload is missing/malformed. Plain object (no JSON.parse), so
// nothing here can fail.
const FALLBACK_DATA = {
    title: 'What happened?',
    policy: { label: 'Auto — 2022 Tesla Model 3', policyNumber: '8842', imageUrl: '/resource/asaInsuranceTeslaModel3' },
    incidentTypes: [
        { id: 'collision', label: 'Collision', description: 'Accident with another vehicle or object', icon: 'collision' },
        { id: 'theft', label: 'Theft or break-in', description: 'Vehicle or contents stolen', icon: 'theft' },
        { id: 'weather', label: 'Weather or storm', description: 'Hail, wind, flood, or fallen tree', icon: 'weather' },
        { id: 'glass', label: 'Glass or windshield', description: 'Cracked or shattered glass', icon: 'glass' }
    ]
};

const ICON_BUCKETS = ['collision', 'theft', 'weather', 'water', 'fire', 'glass', 'liability', 'medical', 'other'];

export default class AsaInsuranceFileClaim extends LightningElement {
    @api value; // Receives the AsaInsuranceFileClaimData object from the Lightning Type.

    @track title = 'What happened?';
    @track submitText = 'Start claim';
    @track incidentTypes = []; // display-ready tiles (computed)
    @track policyLabel = '';
    @track policyMask = '';
    @track hasPolicy = false;
    @track policyImageUrl = '';
    @track hasImage = false;

    rawIncidents = [];
    selectedKey = '';
    isTestMode = false;

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.insuranceFileClaimJSON) {
                const data = JSON.parse(this.value.insuranceFileClaimJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaInsuranceFileClaim parse error:', e.message);
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
        const list = Array.isArray(data.incidentTypes) ? data.incidentTypes : [];
        // Fewer than one incident type → show generic sample so it is never blank.
        this.isTestMode = list.length === 0;
        const source = this.isTestMode ? FALLBACK_DATA : data;
        this.rawIncidents = Array.isArray(source.incidentTypes) ? source.incidentTypes : [];
        this.title = (source.title && String(source.title).trim()) || 'What happened?';
        this.submitText = (data.submitText && String(data.submitText).trim()) || 'Start claim';

        const policy = source.policy && typeof source.policy === 'object' ? source.policy : null;
        this.policyLabel = policy && policy.label ? String(policy.label) : '';
        this.policyMask = policy && policy.policyNumber ? '•• ' + policy.policyNumber : '';
        this.hasPolicy = !!this.policyLabel;
        this.policyImageUrl = policy && policy.imageUrl ? String(policy.imageUrl).trim() : '';
        this.hasImage = !!this.policyImageUrl;

        this.selectedKey = '';
        this.recompute();
    }

    keyFor(inc, index) {
        return inc && inc.id ? String(inc.id) : 'idx-' + index;
    }

    iconOf(icon) {
        const raw = String(icon || '').toLowerCase().replace(/[^a-z]/g, '');
        if (raw === 'collision' || raw === 'crash' || raw === 'accident') return 'collision';
        if (raw === 'theft' || raw === 'stolen' || raw === 'burglary' || raw === 'breakin') return 'theft';
        if (raw === 'weather' || raw === 'storm' || raw === 'hail' || raw === 'wind') return 'weather';
        if (raw === 'water' || raw === 'flood' || raw === 'leak') return 'water';
        if (raw === 'fire' || raw === 'smoke') return 'fire';
        if (raw === 'glass' || raw === 'windshield' || raw === 'window') return 'glass';
        if (raw === 'liability' || raw === 'injury' || raw === 'thirdparty') return 'liability';
        if (raw === 'medical' || raw === 'health' || raw === 'illness') return 'medical';
        return 'other';
    }

    recompute() {
        const selected = this.selectedKey;
        this.incidentTypes = this.rawIncidents.map((inc, index) => {
            const key = this.keyFor(inc, index);
            const isSelected = key === selected;
            const icon = this.iconOf(inc.icon);
            const flags = {};
            ICON_BUCKETS.forEach((b) => {
                flags['is' + b.charAt(0).toUpperCase() + b.slice(1)] = icon === b;
            });
            return {
                key,
                index,
                label: inc.label || 'Incident',
                description: inc.description || '',
                hasDescription: !!(inc.description && String(inc.description).trim()),
                selected: isSelected,
                ...flags,
                tileClass: 'asa-fc-tile is-' + icon + (isSelected ? ' is-selected' : ''),
                checkClass: isSelected ? 'asa-fc-check on' : 'asa-fc-check'
            };
        });
    }

    get hasIncidents() {
        return this.incidentTypes && this.incidentTypes.length > 0;
    }

    get showSubmit() {
        return !!this.selectedKey;
    }

    get selectedLabel() {
        const inc = this.rawIncidents.find((i, index) => this.keyFor(i, index) === this.selectedKey);
        return inc ? inc.label || 'this incident' : '';
    }

    get submitLabel() {
        return this.submitText || 'Start claim';
    }

    // If the asset URL 404s (missing static resource, cross-origin block, etc.)
    // drop the hero image so the card falls back to the plain policy banner.
    handleImageError() {
        this.hasImage = false;
        this.policyImageUrl = '';
    }

    handleSelect(event) {
        const index = Number(event.currentTarget.dataset.index);
        const inc = this.rawIncidents[index];
        if (!inc) return;
        this.selectedKey = this.keyFor(inc, index);
        this.recompute();
    }

    handleSubmit() {
        const inc = this.rawIncidents.find((i, index) => this.keyFor(i, index) === this.selectedKey);
        if (!inc) return;
        const type = inc.label || 'a claim';
        const onPolicy = this.policyLabel ? ` on ${this.policyLabel}${this.policyMask ? ' (policy ' + this.policyMask + ')' : ''}` : '';
        this.sendMessage(`Start a ${type} claim${onPolicy}`);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaInsuranceFileClaim sent:', message))
                    .catch((err) => console.error('AsaInsuranceFileClaim send error:', err));
            } else {
                console.log('AsaInsuranceFileClaim: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaInsuranceFileClaim sendMessage error:', err);
        }
    }
}
