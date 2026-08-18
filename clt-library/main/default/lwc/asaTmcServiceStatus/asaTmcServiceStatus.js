/**
 * @description ASA Technology, Media & Comms · Service Status renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a live service-health board: an overall status banner,
 * per-service rows (each with a status dot + detail + service glyph), the
 * affected area, an estimated restore time, and an optional "Notify me" action.
 * Tapping the CTA sends the choice back via
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaTmcServiceStatus_Output_a3c6/input/schema.json.
 * Fields: title?, overall?(operational|degraded|outage), headline?, area?,
 * etaText?, updatedText?, services[]{id, name, status(operational|degraded|
 * down|maintenance), detail?, icon?(internet|tv|mobile|voice|home)},
 * submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const TEST_STATUS = {
    title: 'Service status',
    overall: 'degraded',
    headline: "We're aware of an issue affecting your area",
    area: 'SoMa, San Francisco 94103',
    etaText: 'Est. restore by 4:30 PM',
    updatedText: 'Updated 2 min ago',
    services: [
        { id: 'internet', name: 'Internet', status: 'down', detail: 'Fiber node offline', icon: 'internet' },
        { id: 'tv', name: 'TV', status: 'degraded', detail: 'Some channels affected', icon: 'tv' },
        { id: 'mobile', name: 'Mobile', status: 'operational', icon: 'mobile' },
        { id: 'voice', name: 'Home phone', status: 'operational', icon: 'voice' }
    ],
    submitText: "Notify me when it's fixed",
    submitValue: 'Please text me when service is restored'
};

const STATUS_RANK = { operational: 0, maintenance: 1, degraded: 2, down: 3 };
const STATUS_LABEL = { operational: 'Operational', maintenance: 'Maintenance', degraded: 'Degraded', down: 'Down' };

function normStatus(s) {
    const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
    if (raw === 'down' || raw === 'outage' || raw === 'offline' || raw === 'unavailable' || raw === 'major') return 'down';
    if (raw === 'degraded' || raw === 'partial' || raw === 'slow' || raw === 'issues' || raw === 'minor' || raw === 'impaired') return 'degraded';
    if (raw === 'maintenance' || raw === 'scheduled' || raw === 'planned') return 'maintenance';
    return 'operational';
}

function normOverall(o) {
    const raw = String(o || '').toLowerCase().replace(/[^a-z]/g, '');
    if (raw === 'outage' || raw === 'down' || raw === 'major') return 'outage';
    if (raw === 'degraded' || raw === 'partial' || raw === 'minor' || raw === 'issues') return 'degraded';
    if (raw === 'maintenance' || raw === 'scheduled' || raw === 'planned') return 'maintenance';
    return 'operational';
}

function normIcon(i, name) {
    const raw = String(i || name || '').toLowerCase().replace(/[^a-z]/g, '');
    if (raw.includes('internet') || raw.includes('wifi') || raw.includes('broadband') || raw.includes('fiber') || raw.includes('data')) return 'internet';
    if (raw.includes('tv') || raw.includes('cable') || raw.includes('stream') || raw.includes('video')) return 'tv';
    if (raw.includes('mobile') || raw.includes('cell') || raw.includes('phone5g') || raw.includes('wireless')) return 'mobile';
    if (raw.includes('voice') || raw.includes('landline') || raw.includes('homephone') || raw.includes('call')) return 'voice';
    if (raw.includes('home') || raw.includes('smart') || raw.includes('security')) return 'home';
    return 'generic';
}

export default class AsaTmcServiceStatus extends LightningElement {
    @api value; // Receives the AsaTmcServiceStatusData object from the Lightning Type.

    @track title = 'Service status';
    @track overall = 'operational';
    @track bannerClass = 'asa-ss-banner is-operational';
    @track heroClass = 'asa-ss-hero is-operational';
    @track isOverallOk = true;
    @track isOverallDegraded = false;
    @track isOverallOutage = false;
    @track isOverallMaint = false;
    @track overallLabel = 'All systems operational';
    @track headline = '';
    @track hasHeadline = false;

    @track hasArea = false;
    @track area = '';
    @track hasEta = false;
    @track etaText = '';
    @track hasUpdated = false;
    @track updatedText = '';
    @track hasMeta = false;

    @track services = [];

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
            if (this.value && this.value.tmcServiceStatusJSON) {
                const data = JSON.parse(this.value.tmcServiceStatusJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaTmcServiceStatus parse error:', e.message);
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
        const hasServices = Array.isArray(raw.services) && raw.services.filter((s) => s && s.name).length > 0;
        this.isTestMode = !hasServices;
        const source = this.isTestMode ? TEST_STATUS : raw;
        this.recompute(source);
    }

    recompute(source) {
        this.title = (source.title && String(source.title).trim()) || 'Service status';

        const list = Array.isArray(source.services) ? source.services.filter((s) => s && s.name) : [];
        this.services = list.slice(0, 6).map((s, i) => {
            const status = normStatus(s.status);
            const icon = normIcon(s.icon, s.name);
            return {
                key: s.id ? `svc-${s.id}` : `svc-${i}`,
                name: String(s.name).trim(),
                detail: s.detail ? String(s.detail).trim() : STATUS_LABEL[status],
                statusLabel: STATUS_LABEL[status],
                rowClass: `asa-ss-row is-${status}`,
                isInternet: icon === 'internet',
                isTv: icon === 'tv',
                isMobile: icon === 'mobile',
                isVoice: icon === 'voice',
                isHome: icon === 'home',
                isGeneric: icon === 'generic'
            };
        });

        // Overall: use the payload's value, else derive from the worst service.
        let overall = source.overall ? normOverall(source.overall) : null;
        if (!overall) {
            const worst = this.services.reduce((acc, s) => {
                const st = s.rowClass.split('is-')[1];
                return Math.max(acc, STATUS_RANK[st] ?? 0);
            }, 0);
            overall = worst >= 3 ? 'outage' : worst === 2 ? 'degraded' : worst === 1 ? 'maintenance' : 'operational';
        }
        this.overall = overall;
        this.bannerClass = `asa-ss-banner is-${overall}`;
        this.heroClass = `asa-ss-hero is-${overall}`;
        this.isOverallOk = overall === 'operational';
        this.isOverallDegraded = overall === 'degraded';
        this.isOverallOutage = overall === 'outage';
        this.isOverallMaint = overall === 'maintenance';
        this.overallLabel = {
            operational: 'All systems operational',
            degraded: 'Some services degraded',
            outage: 'Service outage',
            maintenance: 'Scheduled maintenance'
        }[overall];

        this.headline = source.headline ? String(source.headline).trim() : '';
        this.hasHeadline = !!this.headline;
        this.area = source.area ? String(source.area).trim() : '';
        this.hasArea = !!this.area;
        this.etaText = source.etaText ? String(source.etaText).trim() : '';
        this.hasEta = !!this.etaText;
        this.updatedText = source.updatedText ? String(source.updatedText).trim() : '';
        this.hasUpdated = !!this.updatedText;
        this.hasMeta = this.hasArea || this.hasEta;

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
                    .then(() => console.log('AsaTmcServiceStatus sent:', message))
                    .catch((err) => console.error('AsaTmcServiceStatus send error:', err));
            } else {
                console.log('AsaTmcServiceStatus: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaTmcServiceStatus sendMessage error:', err);
        }
    }
}
