/**
 * @description ASA Manufacturing · Equipment Monitor renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders an asset hero (machine photo + name/model + live status),
 * a grid of metric tiles (OEE, temp, throughput, uptime), a self-contained SVG
 * trend sparkline, and a create-work-order CTA. Tapping the CTA sends the choice
 * back via embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaMfgEquipmentMonitor_Output_a5f2/input/schema.json.
 * Fields: title?, asset{name, model?, assetId?, location?, imageUrl?},
 * status?(running|idle|fault|maintenance|offline), statusLabel?, updatedText?,
 * metrics[]{label, value, unit?, state?(good|warn|bad)}, trend?{label?, points[]},
 * submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

function resolveImageUrl(url) {
    return url ? String(url).trim() : '';
}

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const TEST_ASSET = {
    title: 'Machine health',
    asset: { name: 'Trailblazer Assembly Cell', model: 'TB-9000', assetId: 'LINE-3', location: 'Plant 2 · Bay 4', imageUrl: '/resource/asaMfgTrailblazerCell' },
    status: 'running',
    statusLabel: 'Running',
    updatedText: 'Live · updated 12s ago',
    metrics: [
        { label: 'OEE', value: '87', unit: '%', state: 'good' },
        { label: 'Spindle temp', value: '62', unit: '°C', state: 'warn' },
        { label: 'Throughput', value: '142', unit: '/hr', state: 'good' },
        { label: 'Uptime', value: '6d 4h', state: 'good' }
    ],
    trend: { label: 'OEE · last 12h', points: [72, 78, 74, 80, 83, 81, 85, 84, 86, 88, 87, 87] },
    submitText: 'Create work order',
    submitValue: 'Open a work order for the Trailblazer Assembly Cell (LINE-3)'
};

const STATUS_LABELS = {
    running: 'Running',
    idle: 'Idle',
    fault: 'Fault',
    maintenance: 'Maintenance',
    offline: 'Offline'
};

function normStatus(s) {
    const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
    if (raw === 'fault' || raw === 'error' || raw === 'alarm' || raw === 'down' || raw === 'stopped') return 'fault';
    if (raw === 'maintenance' || raw === 'service' || raw === 'servicing') return 'maintenance';
    if (raw === 'offline' || raw === 'disconnected') return 'offline';
    if (raw === 'idle' || raw === 'standby' || raw === 'paused') return 'idle';
    return 'running';
}

function normState(s) {
    const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
    if (raw === 'bad' || raw === 'critical' || raw === 'alarm' || raw === 'high') return 'bad';
    if (raw === 'warn' || raw === 'warning' || raw === 'caution') return 'warn';
    return 'good';
}

// Build an SVG polyline path + area from a numeric series, in a 100x32 viewBox.
function sparkline(points) {
    const nums = (Array.isArray(points) ? points : []).map((n) => Number(n)).filter((n) => isFinite(n));
    if (nums.length < 2) return null;
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const span = max - min || 1;
    const w = 100;
    const h = 32;
    const pad = 3;
    const step = (w - pad * 2) / (nums.length - 1);
    const pts = nums.map((n, i) => {
        const x = pad + i * step;
        const y = pad + (h - pad * 2) * (1 - (n - min) / span);
        return [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
    });
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
    const area = `${line} L${pts[pts.length - 1][0]},${h} L${pts[0][0]},${h} Z`;
    const last = pts[pts.length - 1];
    return { line, area, lastX: last[0], lastY: last[1] };
}

export default class AsaMfgEquipmentMonitor extends LightningElement {
    @api value; // Receives the AsaMfgEquipmentMonitorData object from the Lightning Type.

    @track title = 'Machine health';
    @track assetName = '';
    @track assetMeta = '';
    @track hasImage = false;
    @track imageUrl = '';
    @track assetInitials = '';

    @track statusLabel = 'Running';
    @track statusClass = 'asa-eq-status is-running';
    @track hasUpdated = false;
    @track updatedText = '';

    @track metrics = [];

    @track hasTrend = false;
    @track trendLabel = '';
    @track sparkLine = '';
    @track sparkArea = '';
    @track sparkDotX = 0;
    @track sparkDotY = 0;

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
            if (this.value && this.value.mfgEquipmentMonitorJSON) {
                const data = JSON.parse(this.value.mfgEquipmentMonitorJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaMfgEquipmentMonitor parse error:', e.message);
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
        const hasAsset = raw.asset && raw.asset.name;
        const hasMetrics = Array.isArray(raw.metrics) && raw.metrics.length;
        this.isTestMode = !hasAsset && !hasMetrics;
        const source = this.isTestMode ? TEST_ASSET : raw;
        this.recompute(source);
    }

    recompute(source) {
        this.title = (source.title && String(source.title).trim()) || 'Machine health';

        const asset = source.asset || {};
        this.assetName = asset.name ? String(asset.name).trim() : 'Asset';
        this.assetMeta = [asset.model, asset.assetId, asset.location].filter(Boolean).map((x) => String(x).trim()).join(' · ');
        this.imageUrl = resolveImageUrl(asset.imageUrl);
        this.hasImage = !!this.imageUrl;
        const parts = this.assetName.split(/\s+/).filter(Boolean);
        this.assetInitials = ((parts[0] ? parts[0][0] : '') + (parts[1] ? parts[1][0] : '')).toUpperCase();

        const status = normStatus(source.status);
        this.statusLabel = (source.statusLabel && String(source.statusLabel).trim()) || STATUS_LABELS[status];
        this.statusClass = `asa-eq-status is-${status}`;

        this.updatedText = source.updatedText ? String(source.updatedText).trim() : '';
        this.hasUpdated = !!this.updatedText;

        const rawMetrics = Array.isArray(source.metrics) ? source.metrics.filter((m) => m && m.label) : [];
        this.metrics = rawMetrics.slice(0, 4).map((m, i) => {
            const state = normState(m.state);
            return {
                key: `m-${i}`,
                label: String(m.label).trim(),
                value: m.value != null ? String(m.value).trim() : '—',
                unit: m.unit ? String(m.unit).trim() : '',
                hasUnit: !!m.unit,
                tileClass: `asa-eq-tile is-${state}`
            };
        });

        const trend = source.trend || {};
        const spark = sparkline(trend.points);
        if (spark) {
            this.hasTrend = true;
            this.trendLabel = trend.label ? String(trend.label).trim() : '';
            this.sparkLine = spark.line;
            this.sparkArea = spark.area;
            this.sparkDotX = spark.lastX;
            this.sparkDotY = spark.lastY;
        } else {
            this.hasTrend = false;
        }

        this.submitText = source.submitText ? String(source.submitText).trim() : '';
        this.hasSubmit = !!this.submitText;
        this.submitValue = source.submitValue ? String(source.submitValue).trim() : this.submitText;
    }

    handleImageError() {
        this.hasImage = false;
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
                    .then(() => console.log('AsaMfgEquipmentMonitor sent:', message))
                    .catch((err) => console.error('AsaMfgEquipmentMonitor send error:', err));
            } else {
                console.log('AsaMfgEquipmentMonitor: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaMfgEquipmentMonitor sendMessage error:', err);
        }
    }
}
