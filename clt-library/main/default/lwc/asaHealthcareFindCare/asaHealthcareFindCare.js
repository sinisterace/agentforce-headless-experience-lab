/**
 * @description ASA Healthcare · Find Care Near You renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a list of nearby care facilities. Each card is
 * wayfinding only (no patient health info): a color-coded type icon, an
 * open-now pill, distance/wait/hours, service chips, and two redirect links —
 * "Directions" (opens the maps URL) and "Call" (a tel: link).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaHealthcareFindCare_Output_f7c2/input/schema.json.
 * Fields: title, subtitle?, facilities[] of { id, name, type?, distance?,
 * openNow?, hours?, waitTime?, address?, phone?, services?[], mapsUrl? }.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Renders
// when the Flow payload is missing/malformed.
const FALLBACK_DATA = {
    title: 'Care near you',
    subtitle: 'Near Moscone Center · SoMa, San Francisco',
    facilities: [
        { id: 'f1', name: 'GoHealth Urgent Care – SoMa', type: 'urgent_care', distance: '0.3 mi', openNow: true, hours: 'Open until 8:00 PM', waitTime: '15 min wait', address: '876 Folsom St, San Francisco', phone: '+14155550142', services: ['X-ray', 'Labs', 'Stitches'], mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=876%20Folsom%20St%2C%20San%20Francisco%2C%20CA%2094107' },
        { id: 'f2', name: 'One Medical – Yerba Buena', type: 'primary_care', distance: '0.2 mi', openNow: true, hours: 'Open until 6:00 PM', address: '631 Mission St, San Francisco', phone: '+14155550111', services: ['Primary care', 'Vaccines', 'Labs'], mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=631%20Mission%20St%2C%20San%20Francisco%2C%20CA%2094105' },
        { id: 'f3', name: 'Saint Francis Memorial Hospital ER', type: 'er', distance: '1.5 mi', openNow: true, hours: 'Open 24 hours', address: '900 Hyde St, San Francisco', phone: '+14155550190', mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=900%20Hyde%20St%2C%20San%20Francisco%2C%20CA%2094109' },
        { id: 'f4', name: 'Walgreens Pharmacy – Powell St', type: 'pharmacy', distance: '0.6 mi', openNow: false, hours: 'Opens 8:00 AM Mon', address: '135 Powell St, San Francisco', phone: '+14155550170', services: ['Rx pickup', 'Vaccines'], mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=135%20Powell%20St%2C%20San%20Francisco%2C%20CA%2094102' }
    ]
};

const TYPE_BUCKETS = ['urgentcare', 'er', 'primarycare', 'pharmacy', 'clinic', 'hospital', 'lab', 'telehealth'];

export default class AsaHealthcareFindCare extends LightningElement {
    @api value; // Receives the AsaHealthcareFindCareData object from the Lightning Type.

    @track title = 'Care near you';
    @track subtitle = '';
    @track hasSubtitle = false;
    @track facilities = []; // display-ready cards (computed)

    isTestMode = false;

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.healthcareFindCareJSON) {
                const data = JSON.parse(this.value.healthcareFindCareJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaHealthcareFindCare parse error:', e.message);
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
        const list = Array.isArray(data.facilities) ? data.facilities.filter((f) => f && (f.name || f.id)) : [];
        this.isTestMode = list.length === 0;
        const source = this.isTestMode ? FALLBACK_DATA : { ...data, facilities: list };
        this.title = (source.title && String(source.title).trim()) || 'Care near you';
        this.subtitle = source.subtitle ? String(source.subtitle).trim() : '';
        this.hasSubtitle = !!this.subtitle;

        const facilities = Array.isArray(source.facilities) ? source.facilities : [];
        this.facilities = facilities.map((f, index) => this.toCard(f, index));
    }

    typeBucket(t) {
        const raw = String(t || '').toLowerCase().replace(/[^a-z]/g, '');
        if (raw === 'urgentcare' || raw === 'urgent') return 'urgentcare';
        if (raw === 'er' || raw === 'emergency' || raw === 'emergencyroom') return 'er';
        if (raw === 'primarycare' || raw === 'primary' || raw === 'doctor' || raw === 'gp') return 'primarycare';
        if (raw === 'pharmacy' || raw === 'drugstore' || raw === 'rx') return 'pharmacy';
        if (raw === 'hospital') return 'hospital';
        if (raw === 'lab' || raw === 'laboratory' || raw === 'labs') return 'lab';
        if (raw === 'telehealth' || raw === 'video' || raw === 'virtual') return 'telehealth';
        return 'clinic';
    }

    typeLabel(bucket) {
        switch (bucket) {
            case 'urgentcare': return 'Urgent care';
            case 'er': return 'Emergency room';
            case 'primarycare': return 'Primary care';
            case 'pharmacy': return 'Pharmacy';
            case 'hospital': return 'Hospital';
            case 'lab': return 'Lab';
            case 'telehealth': return 'Telehealth';
            default: return 'Clinic';
        }
    }

    telHref(phone) {
        const cleaned = String(phone || '').replace(/[^0-9+]/g, '');
        return cleaned ? 'tel:' + cleaned : '';
    }

    toCard(f, index) {
        const bucket = this.typeBucket(f.type);
        const flags = {};
        TYPE_BUCKETS.forEach((b) => {
            flags['is' + b.charAt(0).toUpperCase() + b.slice(1)] = bucket === b;
        });
        const services = Array.isArray(f.services)
            ? f.services.filter((s) => s != null && String(s).trim()).map((s, i) => ({ key: 'svc-' + index + '-' + i, label: String(s).trim() }))
            : [];
        const openNow = f.openNow === true;
        const isClosed = f.openNow === false;
        const mapsUrl = f.mapsUrl ? String(f.mapsUrl).trim() : '';
        const telHref = this.telHref(f.phone);
        return {
            key: f.id ? String(f.id) : 'fac-' + index,
            name: f.name ? String(f.name) : 'Care facility',
            typeLabel: this.typeLabel(bucket),
            distance: f.distance ? String(f.distance).trim() : '',
            hasDistance: !!(f.distance && String(f.distance).trim()),
            openNow,
            isClosed,
            showStatus: openNow || isClosed,
            statusText: openNow ? 'Open now' : 'Closed',
            statusClass: openNow ? 'asa-fnd-status is-open' : 'asa-fnd-status is-closed',
            hours: f.hours ? String(f.hours).trim() : '',
            hasHours: !!(f.hours && String(f.hours).trim()),
            waitTime: f.waitTime ? String(f.waitTime).trim() : '',
            hasWait: !!(f.waitTime && String(f.waitTime).trim()),
            address: f.address ? String(f.address).trim() : '',
            hasAddress: !!(f.address && String(f.address).trim()),
            services,
            hasServices: services.length > 0,
            mapsUrl,
            hasMaps: !!mapsUrl,
            telHref,
            hasPhone: !!telHref,
            iconClass: 'asa-fnd-ico is-' + bucket,
            ...flags
        };
    }

    get hasFacilities() {
        return this.facilities && this.facilities.length > 0;
    }
}
