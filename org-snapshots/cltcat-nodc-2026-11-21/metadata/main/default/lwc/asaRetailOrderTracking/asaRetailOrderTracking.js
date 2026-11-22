/**
 * @description ASA Retail · Order Tracking renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a self-contained SVG delivery map (courier marker
 * positioned by status, destination pin, covered vs. remaining route), an
 * ETA block, a courier row, and a status timeline. Tapping the optional CTA
 * sends the choice back to the agent through
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaRetailOrderTracking_Output_b7c2/input/schema.json.
 * Fields: title, live?(bool), status?(submitted|packed|out_for_delivery|delivered),
 * etaText?, courier?{name, vehicle?(bike|van|car|foot), initials?, photoUrl?,
 * rating?}, destination?{label?, address?}, steps?[]{label, state(done|current|todo),
 * time?}, submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

// Courier photos are referenced by an https URL or a stable '/resource/<name>'
// path. No retail images are bundled today, so URLs pass through unchanged
// and the avatar falls back to initials when absent.
function resolveImageUrl(url) {
    return url ? String(url).trim() : '';
}

// Route polyline in the 320x176 map viewBox — store (bottom-left) -> home (top-right).
const ROUTE = [
    [40, 150],
    [40, 106],
    [150, 106],
    [150, 60],
    [268, 60]
];

function pointAlong(progress) {
    const segs = ROUTE.slice(1).map((b, i) => {
        const a = ROUTE[i];
        return { a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1]) };
    });
    const total = segs.reduce((sum, s) => sum + s.len, 0);
    const target = Math.max(0, Math.min(1, progress)) * total;
    let acc = 0;
    const covered = [ROUTE[0]];
    for (let i = 0; i < segs.length; i++) {
        const seg = segs[i];
        if (target <= acc + seg.len || i === segs.length - 1) {
            const f = seg.len === 0 ? 0 : Math.max(0, Math.min(1, (target - acc) / seg.len));
            const x = seg.a[0] + (seg.b[0] - seg.a[0]) * f;
            const y = seg.a[1] + (seg.b[1] - seg.a[1]) * f;
            covered.push([x, y]);
            return { x, y, covered };
        }
        covered.push(seg.b);
        acc += seg.len;
    }
    const last = ROUTE[ROUTE.length - 1];
    return { x: last[0], y: last[1], covered };
}

function toPath(pts) {
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
}

function initialsFrom(name, initials) {
    if (initials) return String(initials).trim().slice(0, 2).toUpperCase();
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '';
    return ((parts[0][0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Used
// when the Flow payload has no status/steps/etaText/courier, mirroring the
// preview's test-mode fallback.
const TEST_TRACKING = {
    title: 'Track order #4821',
    live: true,
    status: 'out_for_delivery',
    etaText: 'Arriving 2:15–2:30 PM',
    courier: { name: 'Alex Rivera', vehicle: 'bike', initials: 'AR', rating: '4.9 ★' },
    destination: { label: 'Home', address: '150 4th St, San Francisco' },
    submitText: 'Message courier'
};

// Canonical order statuses, in order, and the default timeline they seed.
const TRACK_FLOW = ['submitted', 'packed', 'out_for_delivery', 'delivered'];

export default class AsaRetailOrderTracking extends LightningElement {
    @api value; // Receives the AsaRetailOrderTrackingData object from the Lightning Type.

    @track title = 'Track your order';
    @track live = false;
    @track statusLabel = 'Order placed';
    @track statusStep = 'Step 1 of 4';

    @track fullPath = '';
    @track coveredPath = '';
    @track courierTransform = '';
    @track destTransform = '';
    @track showPulse = false;

    @track hasEta = false;
    @track etaText = '';
    @track hasDest = false;
    @track destText = '';

    @track hasCourier = false;
    @track courierName = '';
    @track hasPhoto = false;
    @track photoUrl = '';
    @track courierInitials = '';
    @track hasRating = false;
    @track courierRating = '';
    @track isBike = false;
    @track isVan = false;
    @track isCar = false;
    @track isFoot = false;

    @track steps = [];

    @track hasSubmit = false;
    @track submitText = '';

    isTestMode = false;
    submitValue = '';

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.retailOrderTrackingJSON) {
                const data = JSON.parse(this.value.retailOrderTrackingJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaRetailOrderTracking parse error:', e.message);
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
        this.isTestMode = !raw.status && !(Array.isArray(raw.steps) && raw.steps.length) && !raw.etaText && !raw.courier;
        const source = this.isTestMode ? TEST_TRACKING : raw;
        this.recompute(source);
    }

    trackStatus(s) {
        const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
        if (raw === 'delivered' || raw === 'complete' || raw === 'completed') return 'delivered';
        if (raw === 'outfordelivery' || raw === 'ontheway' || raw === 'shipping' || raw === 'intransit') return 'out_for_delivery';
        if (raw === 'packed' || raw === 'ready' || raw === 'preparing' || raw === 'processing') return 'packed';
        return 'submitted';
    }

    trackVehicle(v) {
        const raw = String(v || '').toLowerCase().replace(/[^a-z]/g, '');
        if (raw === 'van' || raw === 'truck' || raw === 'delivery') return 'van';
        if (raw === 'car' || raw === 'auto') return 'car';
        if (raw === 'foot' || raw === 'walk' || raw === 'walking' || raw === 'courier') return 'foot';
        return 'bike';
    }

    routeProgress(status) {
        switch (status) {
            case 'submitted':
                return 0.08;
            case 'packed':
                return 0.28;
            case 'out_for_delivery':
                return 0.62;
            default:
                return 1;
        }
    }

    stepsForStatus(status) {
        const labels = [
            { key: 'submitted', label: 'Order placed' },
            { key: 'packed', label: 'Packed & ready' },
            { key: 'out_for_delivery', label: 'Out for delivery' },
            { key: 'delivered', label: 'Delivered' }
        ];
        const activeIdx = TRACK_FLOW.indexOf(status);
        return labels.map((l, i) => ({
            label: l.label,
            state: i < activeIdx ? 'done' : i === activeIdx ? 'current' : 'todo'
        }));
    }

    recompute(source) {
        this.title = (source.title && String(source.title).trim()) || 'Track your order';
        this.live = !!source.live;

        const status = this.trackStatus(source.status);
        const statusIndex = Math.max(0, TRACK_FLOW.indexOf(status));
        this.statusLabel = ['Order placed', 'Packed & ready', 'Out for delivery', 'Delivered'][statusIndex];
        this.statusStep = `Step ${statusIndex + 1} of 4`;
        const { x, y, covered } = pointAlong(this.routeProgress(status));
        const dest = ROUTE[ROUTE.length - 1];
        this.fullPath = toPath(ROUTE);
        this.coveredPath = toPath(covered);
        this.courierTransform = `translate(${x}, ${y})`;
        this.destTransform = `translate(${dest[0]}, ${dest[1]})`;
        this.showPulse = this.live && status !== 'delivered';

        this.etaText = source.etaText ? String(source.etaText).trim() : '';
        this.hasEta = !!this.etaText;

        const dst = source.destination || {};
        this.destText = [dst.label, dst.address].filter(Boolean).join(' · ');
        this.hasDest = !!this.destText;

        const courier = source.courier;
        this.hasCourier = !!(courier && courier.name);
        if (this.hasCourier) {
            this.courierName = String(courier.name).trim();
            this.photoUrl = resolveImageUrl(courier.photoUrl);
            this.hasPhoto = !!this.photoUrl;
            this.courierInitials = initialsFrom(courier.name, courier.initials);
            this.courierRating = courier.rating ? String(courier.rating).trim() : '';
            this.hasRating = !!this.courierRating;
            const vehicle = this.trackVehicle(courier.vehicle);
            this.isBike = vehicle === 'bike';
            this.isVan = vehicle === 'van';
            this.isCar = vehicle === 'car';
            this.isFoot = vehicle === 'foot';
        } else {
            this.courierName = '';
            this.photoUrl = '';
            this.hasPhoto = false;
            this.courierInitials = '';
            this.courierRating = '';
            this.hasRating = false;
            this.isBike = false;
            this.isVan = false;
            this.isCar = false;
            this.isFoot = false;
        }

        const rawSteps = Array.isArray(source.steps) ? source.steps.filter((s) => s && s.label) : [];
        const list = rawSteps.length ? rawSteps : this.stepsForStatus(status);
        this.steps = list.map((s, index) => {
            const state = ['done', 'current', 'todo'].includes(s.state) ? s.state : 'todo';
            return {
                key: `${s.label}-${index}`,
                orderLabel: String(index + 1).padStart(2, '0'),
                label: String(s.label),
                time: s.time ? String(s.time) : '',
                hasTime: !!s.time,
                stepClass: `asa-ot-step is-${state}`
            };
        });

        this.submitText = source.submitText ? String(source.submitText).trim() : '';
        this.hasSubmit = !!this.submitText;
        this.submitValue = source.submitValue ? String(source.submitValue).trim() : this.submitText;
    }

    handleSubmit() {
        if (!this.hasSubmit) return;
        this.sendMessage(this.submitValue || this.submitText);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaRetailOrderTracking sent:', message))
                    .catch((err) => console.error('AsaRetailOrderTracking send error:', err));
            } else {
                console.log('AsaRetailOrderTracking: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaRetailOrderTracking sendMessage error:', err);
        }
    }
}