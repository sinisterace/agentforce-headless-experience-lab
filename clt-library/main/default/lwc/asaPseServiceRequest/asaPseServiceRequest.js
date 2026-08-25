/**
 * @description ASA Public Sector & Education · Service Request renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a guided "report a problem" chooser: an optional
 * location banner plus a grid of request-type tiles. Selecting a tile (and
 * confirming) sends the choice back to the agent through
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaPseServiceRequest_Output_d7e4/input/schema.json.
 * Fields: title?, subtitle?, locationText?, requestTypes[] of
 * { id, label, description?, icon? }, submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Renders
// when the Flow payload is missing/malformed. Plain object (no JSON.parse), so
// nothing here can fail.
const FALLBACK_DATA = {
    title: 'Report a problem',
    subtitle: "Choose what you'd like to report",
    locationText: 'Near 123 Main St',
    requestTypes: [
        { id: 'pothole', label: 'Pothole / road', description: 'Damaged road or pavement', icon: 'road' },
        { id: 'streetlight', label: 'Streetlight out', description: 'Broken or flickering light', icon: 'light' },
        { id: 'graffiti', label: 'Graffiti', description: 'Vandalism or tagging', icon: 'graffiti' },
        { id: 'trash', label: 'Trash / dumping', description: 'Missed pickup or illegal dumping', icon: 'trash' },
        { id: 'water', label: 'Water / leak', description: 'Leak, flooding, or hydrant', icon: 'water' },
        { id: 'facility', label: 'Facilities', description: 'Building or campus maintenance', icon: 'building' }
    ]
};

const ICON_BUCKETS = ['road', 'light', 'graffiti', 'trash', 'water', 'building', 'tree', 'sidewalk', 'noise', 'other'];

export default class AsaPseServiceRequest extends LightningElement {
    @api value; // Receives the AsaPseServiceRequestData object from the Lightning Type.

    @track title = 'Report a problem';
    @track subtitle = '';
    @track hasSubtitle = false;
    @track locationText = '';
    @track hasLocation = false;
    @track submitText = 'Start report';
    @track requestTypes = []; // display-ready tiles (computed)

    rawRequests = [];
    selectedKey = '';
    submitValue = '';
    isTestMode = false;

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.pseServiceRequestJSON) {
                const data = JSON.parse(this.value.pseServiceRequestJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaPseServiceRequest parse error:', e.message);
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
        const list = Array.isArray(data.requestTypes) ? data.requestTypes : [];
        // No request types → show generic sample so it is never blank.
        this.isTestMode = list.length === 0;
        const source = this.isTestMode ? FALLBACK_DATA : data;
        this.rawRequests = Array.isArray(source.requestTypes) ? source.requestTypes : [];
        this.title = (source.title && String(source.title).trim()) || 'Report a problem';
        this.subtitle = source.subtitle ? String(source.subtitle).trim() : '';
        this.hasSubtitle = !!this.subtitle;
        this.locationText = source.locationText ? String(source.locationText).trim() : '';
        this.hasLocation = !!this.locationText;
        this.submitText = (data.submitText && String(data.submitText).trim()) || 'Start report';
        this.submitValue = source.submitValue ? String(source.submitValue).trim() : '';

        this.selectedKey = '';
        this.recompute();
    }

    keyFor(req, index) {
        return req && req.id ? String(req.id) : 'idx-' + index;
    }

    iconOf(icon) {
        const raw = String(icon || '').toLowerCase().replace(/[^a-z]/g, '');
        if (raw === 'road' || raw === 'pothole' || raw === 'pavement' || raw === 'street') return 'road';
        if (raw === 'light' || raw === 'streetlight' || raw === 'lamp' || raw === 'lighting') return 'light';
        if (raw === 'graffiti' || raw === 'vandalism' || raw === 'tagging') return 'graffiti';
        if (raw === 'trash' || raw === 'garbage' || raw === 'dumping' || raw === 'waste' || raw === 'litter') return 'trash';
        if (raw === 'water' || raw === 'leak' || raw === 'flood' || raw === 'hydrant' || raw === 'sewer') return 'water';
        if (raw === 'building' || raw === 'facility' || raw === 'facilities' || raw === 'maintenance') return 'building';
        if (raw === 'tree' || raw === 'park' || raw === 'landscaping' || raw === 'vegetation') return 'tree';
        if (raw === 'sidewalk' || raw === 'curb' || raw === 'walkway') return 'sidewalk';
        if (raw === 'noise' || raw === 'sound' || raw === 'nuisance') return 'noise';
        return 'other';
    }

    recompute() {
        const selected = this.selectedKey;
        this.requestTypes = this.rawRequests.map((req, index) => {
            const key = this.keyFor(req, index);
            const isSelected = key === selected;
            const icon = this.iconOf(req.icon);
            const flags = {};
            ICON_BUCKETS.forEach((b) => {
                flags['is' + b.charAt(0).toUpperCase() + b.slice(1)] = icon === b;
            });
            return {
                key,
                index,
                label: req.label || 'Request',
                description: req.description || '',
                hasDescription: !!(req.description && String(req.description).trim()),
                selected: isSelected,
                ...flags,
                tileClass: 'asa-sr-tile is-' + icon + (isSelected ? ' is-selected' : ''),
                checkClass: isSelected ? 'asa-sr-check on' : 'asa-sr-check'
            };
        });
    }

    get hasRequests() {
        return this.requestTypes && this.requestTypes.length > 0;
    }

    get showSubmit() {
        return !!this.selectedKey;
    }

    get submitLabel() {
        return this.submitText || 'Start report';
    }

    handleSelect(event) {
        const index = Number(event.currentTarget.dataset.index);
        const req = this.rawRequests[index];
        if (!req) return;
        this.selectedKey = this.keyFor(req, index);
        this.recompute();
    }

    handleSubmit() {
        const req = this.rawRequests.find((r, index) => this.keyFor(r, index) === this.selectedKey);
        if (!req) return;
        const label = req.label || 'an issue';
        const base = this.submitValue || "I'd like to report a";
        // Append the chosen label so the agent knows what is being reported.
        this.sendMessage(`${base} ${label} (id: ${this.keyFor(req, this.rawRequests.indexOf(req))})`);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaPseServiceRequest sent:', message))
                    .catch((err) => console.error('AsaPseServiceRequest send error:', err));
            } else {
                console.log('AsaPseServiceRequest: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaPseServiceRequest sendMessage error:', err);
        }
    }
}
