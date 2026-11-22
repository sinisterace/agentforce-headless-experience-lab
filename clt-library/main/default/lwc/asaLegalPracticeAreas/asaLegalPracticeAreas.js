/**
 * @description ASA Legal · Practice-Area Selector renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders an expandable "How can we help?" practice-area guide:
 * each area is a tappable row that expands to reveal a description, a trust
 * stat, common matter types (chips), a display-only "Learn more" affordance,
 * and a Get-help CTA. Tapping the CTA sends a message back to the agent through
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaLegalPracticeAreas_Output_7a1c/input/schema.json.
 * Fields: title?, subtitle?, areas[]{ id, name, blurb?, icon?, description?,
 * services?[], stat?, href? }, linkText?, submitText?, submitValue?.
 */
import { LightningElement, api, track } from 'lwc';

// Icon keys the card knows how to render (inline SVGs). Anything else → 'other'.
const KNOWN_ICONS = [
    'injury',
    'family',
    'estate',
    'business',
    'immigration',
    'criminal',
    'employment',
    'realestate'
];

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Renders
// when the Flow payload is missing/malformed. Plain object (no JSON.parse).
const FALLBACK_DATA = {
    title: 'How can we help?',
    subtitle: 'Tap an area to see how we can help — then start your conversation',
    areas: [
        {
            id: 'injury',
            name: 'Personal Injury',
            blurb: 'Accidents, negligence & claims',
            icon: 'injury',
            description:
                'We pursue full compensation for accident and negligence victims — medical bills, lost wages, and pain and suffering. No fee unless we win.',
            services: ['Car & truck accidents', 'Slip & fall', 'Medical malpractice', 'Wrongful death'],
            stat: '$50M+ recovered',
            href: '/practice-areas/personal-injury'
        },
        {
            id: 'family',
            name: 'Family Law',
            blurb: 'Divorce, custody & support',
            icon: 'family',
            description:
                'Compassionate guidance through divorce, custody, and support — protecting your family and your future at every step.',
            services: ['Divorce', 'Child custody', 'Child & spousal support', 'Prenuptial agreements'],
            stat: '1,200+ families helped',
            href: '/practice-areas/family-law'
        },
        {
            id: 'estate',
            name: 'Estate Planning',
            blurb: 'Wills, trusts & probate',
            icon: 'estate',
            description:
                'Plan ahead with wills, trusts, and powers of attorney so your wishes are honored and your loved ones are protected.',
            services: ['Wills', 'Living trusts', 'Probate', 'Power of attorney'],
            stat: 'Flat-fee packages',
            href: '/practice-areas/estate-planning'
        },
        {
            id: 'business',
            name: 'Business & Corporate',
            blurb: 'Formation, contracts & disputes',
            icon: 'business',
            description:
                'From formation to contracts to disputes, we help businesses operate and grow with confidence.',
            services: ['Entity formation', 'Contracts', 'Partnership disputes', 'M&A'],
            stat: '500+ businesses advised',
            href: '/practice-areas/business-law'
        },
        {
            id: 'immigration',
            name: 'Immigration',
            blurb: 'Visas, green cards & citizenship',
            icon: 'immigration',
            description:
                'Guiding individuals, families, and employers through visas, green cards, and citizenship.',
            services: ['Family visas', 'Work visas', 'Green cards', 'Naturalization'],
            stat: '98% approval rate',
            href: '/practice-areas/immigration'
        },
        {
            id: 'criminal',
            name: 'Criminal Defense',
            blurb: 'Charges, DUI & expungement',
            icon: 'criminal',
            description:
                'Aggressive, confidential defense against charges — protecting your rights, your record, and your freedom.',
            services: ['DUI / DWI', 'Drug charges', 'Assault', 'Expungement'],
            stat: 'Available 24/7',
            href: '/practice-areas/criminal-defense'
        },
        {
            id: 'employment',
            name: 'Employment',
            blurb: 'Disputes, contracts & rights',
            icon: 'employment',
            description:
                'Standing up for employees and advising employers on workplace rights and compliance.',
            services: ['Wrongful termination', 'Discrimination', 'Wage & hour', 'Severance review'],
            stat: 'Free consultation',
            href: '/practice-areas/employment-law'
        },
        {
            id: 'realestate',
            name: 'Real Estate',
            blurb: 'Purchases, leases & closings',
            icon: 'realestate',
            description:
                'Smooth closings and sound advice for buyers, sellers, landlords, and investors.',
            services: ['Purchases & sales', 'Leases', 'Title review', 'Zoning & disputes'],
            stat: '2,000+ closings',
            href: '/practice-areas/real-estate'
        }
    ],
    linkText: 'Learn more',
    submitText: 'Get help with {name}',
    submitValue: 'I need help with'
};

export default class AsaLegalPracticeAreas extends LightningElement {
    @api value; // Receives the AsaLegalPracticeAreasData object from the Lightning Type.

    @track title = 'How can we help?';
    @track subtitle = '';
    @track linkText = 'Learn more';

    isTestMode = false;
    openId = '';
    baseAreas = [];

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.legalPracticeAreasJSON) {
                const data = JSON.parse(this.value.legalPracticeAreasJSON);
                if (data && typeof data === 'object') {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaLegalPracticeAreas parse error:', e.message);
        }
        return false;
    }

    loadFallback() {
        this.initializeFromData(FALLBACK_DATA);
    }

    initializeFromData(data) {
        // Test mode when there are no areas — never blank.
        this.isTestMode = !Array.isArray(data.areas) || data.areas.length === 0;
        const src = this.isTestMode ? FALLBACK_DATA : data;

        this.title = this.isTestMode
            ? 'How can we help?'
            : (src.title && String(src.title).trim()) || 'How can we help?';
        this.subtitle = this.isTestMode
            ? 'Tap an area to see how we can help — then start your conversation'
            : (src.subtitle && String(src.subtitle).trim()) || '';
        this.linkText = (src.linkText && String(src.linkText).trim()) || 'Learn more';

        const submitText = (src.submitText && String(src.submitText).trim()) || 'Get help with {name}';
        const submitValue = src.submitValue != null ? String(src.submitValue).trim() : '';

        const rawAreas = Array.isArray(src.areas) ? src.areas.filter((a) => a && (a.name || a.id)) : [];

        this.baseAreas = rawAreas.map((a, index) => {
            const id = (a.id && String(a.id)) || (a.name && String(a.name)) || 'area-' + index;
            const name = (a.name && String(a.name).trim()) || 'Practice area';
            const iconKey = String(a.icon || 'other').toLowerCase();
            const icon = KNOWN_ICONS.indexOf(iconKey) >= 0 ? iconKey : 'other';

            const services = (Array.isArray(a.services) ? a.services : [])
                .filter((s) => s != null && String(s).trim())
                .map((s, si) => ({ key: id + '-svc-' + si, label: String(s).trim() }));

            const description = a.description ? String(a.description).trim() : '';
            const stat = a.stat ? String(a.stat).trim() : '';
            const href = a.href ? String(a.href).trim() : '';
            const blurb = a.blurb ? String(a.blurb).trim() : '';
            const hasBody = !!(description || services.length || href || stat);

            const submitLabel = this.interpolate(submitText, name);
            let submitMessage;
            if (submitValue) {
                submitMessage = submitValue.indexOf('{name}') >= 0
                    ? this.interpolate(submitValue, name)
                    : submitValue + ' ' + name;
            } else {
                submitMessage = submitLabel;
            }

            return {
                id,
                name,
                blurb,
                hasBlurb: !!blurb,
                description,
                hasDesc: !!description,
                stat,
                hasStat: !!stat,
                services,
                hasServices: services.length > 0,
                href,
                hasLink: !!href,
                hasBody,
                submitLabel,
                submitMessage,
                iconInjury: icon === 'injury',
                iconFamily: icon === 'family',
                iconEstate: icon === 'estate',
                iconBusiness: icon === 'business',
                iconImmigration: icon === 'immigration',
                iconCriminal: icon === 'criminal',
                iconEmployment: icon === 'employment',
                iconRealestate: icon === 'realestate',
                iconOther: icon === 'other'
            };
        });

        // Open the first area by default so the card is informative on first render.
        this.openId = this.baseAreas.length ? this.baseAreas[0].id : '';
    }

    interpolate(template, name) {
        return template.indexOf('{name}') >= 0 ? template.replace('{name}', name) : template;
    }

    get areas() {
        return this.baseAreas.map((a) => {
            const isOpen = this.openId === a.id;
            return {
                ...a,
                isOpen,
                showBody: isOpen && a.hasBody,
                itemClass: isOpen ? 'asa-lpa-item is-open' : 'asa-lpa-item'
            };
        });
    }

    get hasSubtitle() {
        return !!this.subtitle;
    }

    handleToggle(event) {
        const id = event.currentTarget.dataset.id;
        this.openId = this.openId === id ? '' : id;
    }

    handleSelect(event) {
        const id = event.currentTarget.dataset.id;
        const area = this.baseAreas.find((a) => a.id === id);
        const message = (area && area.submitMessage) || 'I need help with a legal matter';
        this.sendMessage(message);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaLegalPracticeAreas sent:', message))
                    .catch((err) => console.error('AsaLegalPracticeAreas send error:', err));
            } else {
                console.log('AsaLegalPracticeAreas: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaLegalPracticeAreas sendMessage error:', err);
        }
    }
}
