/**
 * @description ASA Healthcare · Care Options renderer — a bespoke "Care
 * Navigator": each care channel is an elevated card with a channel medallion,
 * label, an optional Recommended ribbon + accent ring, a typed meta chip
 * (wait-time / cost / info), and a full-width channel-colored action. Each row
 * carries its own action: 'call' and 'link' render as redirect anchors
 * (tel: / https), while 'book' hands the conversation back to the agent via
 * embeddedservice_configuration.util.sendTextMessage(...). No symptoms are
 * collected — this is a routing card only.
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaHealthcareCareOptions_Output_a9d3/input/schema.json.
 * Fields: title, subtitle?, options[] of { id, channel?, label, description?,
 * meta?, recommended?, actionType, actionValue? }, disclaimer?, submitText?.
 */
import { LightningElement, api, track } from 'lwc';

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content).
const FALLBACK_DATA = {
    title: 'How would you like to get care?',
    subtitle: 'Choose the option that fits your needs',
    options: [
        { id: 'o1', channel: 'nurse_line', label: '24/7 Nurse Advice Line', description: 'Talk to a registered nurse now', meta: 'Avg wait 3 min', actionType: 'call', actionValue: '+18005551234' },
        { id: 'o2', channel: 'video', label: 'Video visit', description: 'See a provider by video in about 15 minutes', meta: '$0 with your plan', actionType: 'link', actionValue: 'https://example.com/video-visit', recommended: true },
        { id: 'o3', channel: 'in_person', label: 'Schedule an in-person visit', description: 'Book a time at a clinic near you', actionType: 'book', actionValue: 'Schedule an in-person visit' },
        { id: 'o4', channel: 'er', label: 'Emergency care', description: 'For severe or life-threatening symptoms', actionType: 'call', actionValue: '911' }
    ],
    disclaimer: 'If this is a medical emergency, call 911. This tool does not provide medical advice.'
};

const CHANNEL_BUCKETS = ['nurseline', 'video', 'inperson', 'urgent', 'er', 'pharmacy', 'message'];

export default class AsaHealthcareCareOptions extends LightningElement {
    @api value; // Receives the AsaHealthcareCareOptionsData object from the Lightning Type.

    @track title = 'How would you like to get care?';
    @track subtitle = '';
    @track hasSubtitle = false;
    @track disclaimer = '';
    @track hasDisclaimer = false;
    @track options = []; // display-ready cards (computed)

    isTestMode = false;

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.healthcareCareOptionsJSON) {
                const data = JSON.parse(this.value.healthcareCareOptionsJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaHealthcareCareOptions parse error:', e.message);
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
        const list = Array.isArray(data.options) ? data.options.filter((o) => o && o.label) : [];
        this.isTestMode = list.length === 0;
        const source = this.isTestMode ? FALLBACK_DATA : { ...data, options: list };
        this.title = (source.title && String(source.title).trim()) || 'How would you like to get care?';
        this.subtitle = source.subtitle ? String(source.subtitle).trim() : '';
        this.hasSubtitle = !!this.subtitle;
        this.disclaimer = source.disclaimer ? String(source.disclaimer).trim() : '';
        this.hasDisclaimer = !!this.disclaimer;

        const options = Array.isArray(source.options) ? source.options : [];
        this.options = options.map((o, index) => this.toRow(o, index));
    }

    channelBucket(c) {
        const raw = String(c || '').toLowerCase().replace(/[^a-z]/g, '');
        if (raw === 'nurseline' || raw === 'nurse' || raw === 'advice') return 'nurseline';
        if (raw === 'video' || raw === 'telehealth' || raw === 'virtual') return 'video';
        if (raw === 'inperson' || raw === 'clinic' || raw === 'office') return 'inperson';
        if (raw === 'urgent' || raw === 'urgentcare') return 'urgent';
        if (raw === 'er' || raw === 'emergency' || raw === 'ers') return 'er';
        if (raw === 'pharmacy' || raw === 'rx') return 'pharmacy';
        return 'message';
    }

    actionKind(a) {
        const raw = String(a || '').toLowerCase().replace(/[^a-z]/g, '');
        if (raw === 'call' || raw === 'phone') return 'call';
        if (raw === 'link' || raw === 'url' || raw === 'web') return 'link';
        return 'book';
    }

    // Classify the free-text meta so it renders as a typed chip (clock / cost / info).
    metaKind(meta) {
        const m = String(meta || '').toLowerCase();
        if (/\$|free|per\s|plan|copay|co-pay|cost|covered|deductible/.test(m)) return 'cost';
        if (/min|hour|\bhr|wait|now|24\s*\/?\s*7|open|today|same[-\s]?day|next/.test(m)) return 'time';
        return 'info';
    }

    telHref(value) {
        const cleaned = String(value || '').replace(/[^0-9+]/g, '');
        return cleaned ? 'tel:' + cleaned : '';
    }

    actionLabel(kind) {
        if (kind === 'call') return 'Call';
        if (kind === 'link') return 'Open';
        return 'Choose';
    }

    toRow(o, index) {
        const bucket = this.channelBucket(o.channel);
        const kind = this.actionKind(o.actionType);
        const value = o.actionValue != null ? String(o.actionValue).trim() : '';
        const flags = {};
        CHANNEL_BUCKETS.forEach((b) => {
            flags['is' + b.charAt(0).toUpperCase() + b.slice(1)] = bucket === b;
        });
        const recommended = o.recommended === true;
        let href = '';
        if (kind === 'call') href = this.telHref(value);
        else if (kind === 'link') href = /^https?:\/\//i.test(value) ? value : '';
        const isAnchor = (kind === 'call' || kind === 'link') && !!href;
        // A call/link with no usable target falls back to a book-style handoff.
        const effectiveKind = isAnchor ? kind : 'book';
        const metaText = o.meta ? String(o.meta).trim() : '';
        const metaKind = this.metaKind(metaText);
        return {
            key: o.id ? String(o.id) : 'opt-' + index,
            index,
            label: o.label ? String(o.label) : 'Care option',
            description: o.description ? String(o.description).trim() : '',
            hasDescription: !!(o.description && String(o.description).trim()),
            meta: metaText,
            hasMeta: !!metaText,
            metaIsCost: metaKind === 'cost',
            metaIsTime: metaKind === 'time',
            metaIsInfo: metaKind === 'info',
            recommended,
            href,
            isAnchor,
            isBook: !isAnchor,
            isCall: isAnchor && effectiveKind === 'call',
            isExternal: effectiveKind === 'link',
            ctaTarget: effectiveKind === 'link' ? '_blank' : null,
            bookValue: value || (o.label ? String(o.label) : ''),
            actionLabel: this.actionLabel(effectiveKind),
            ...flags,
            cardClass: 'asa-co-card is-' + bucket + (recommended ? ' is-recommended' : '')
        };
    }

    get hasOptions() {
        return this.options && this.options.length > 0;
    }

    handleBook(event) {
        const value = String(event.currentTarget.dataset.value || '');
        if (!value) return;
        this.sendMessage(value);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaHealthcareCareOptions sent:', message))
                    .catch((err) => console.error('AsaHealthcareCareOptions send error:', err));
            } else {
                console.log('AsaHealthcareCareOptions: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaHealthcareCareOptions sendMessage error:', err);
        }
    }
}
