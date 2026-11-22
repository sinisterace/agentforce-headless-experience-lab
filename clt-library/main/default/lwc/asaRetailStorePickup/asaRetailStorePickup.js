/**
 * @description ASA Retail · Store Pickup renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders a list of nearby stores — stock status, distance,
 * pickup ETA, hours, and Directions/Call links — with an optional product
 * context row above the list. The customer single-selects a store (radio;
 * out-of-stock stores render but are not selectable) and reserves it for
 * pickup; the choice is sent back to the agent through
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaRetailStorePickup_Output_d9e3/input/schema.json.
 * Fields: title, subtitle?, product?{ name, variant?, imageUrl?, category? },
 * stores[] of { id, name, distance?, address?, hours?, availability?,
 * pickupEta?, phone?, mapsUrl? }, submitText?.
 */
import { LightningElement, api, track } from 'lwc';
import TRAILBLAZER_SHOE from '@salesforce/resourceUrl/asaRetailTrailblazerShoe';
import EVERYDAY_MERINO from '@salesforce/resourceUrl/asaRetailEverydayMerinoCrew';

// Product payloads reference photos by an https URL or a stable '/resource/<name>'
// path. A raw '/resource/<name>' string does NOT reliably load inside Agentforce/ECv2
// (the card renders on a different base URL), so we swap the sentinel path for the
// versioned URL @salesforce/resourceUrl resolves. Full https URLs pass through; a
// missing image falls back to a branded category tile.
const STATIC_RESOURCE_URLS = {
    asaRetailTrailblazerShoe: TRAILBLAZER_SHOE,
    asaRetailEverydayMerinoCrew: EVERYDAY_MERINO
};
function resolveImageUrl(url, name) {
    const explicit = url ? String(url).trim() : '';
    if (explicit) {
        const m = /^\/resource\/([A-Za-z0-9_]+)/.exec(explicit);
        return (m && STATIC_RESOURCE_URLS[m[1]]) ? STATIC_RESOURCE_URLS[m[1]] : explicit;
    }
    const normalizedName = String(name || '').toLowerCase();
    if (normalizedName.includes('trailblazer') && (normalizedName.includes('shoe') || normalizedName.includes('runner'))) {
        return TRAILBLAZER_SHOE;
    }
    if (normalizedName.includes('merino') || normalizedName.includes('crew')) {
        return EVERYDAY_MERINO;
    }
    return '';
}

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Renders
// when the Flow payload is missing/malformed. Plain object (no JSON.parse), so
// nothing here can fail.
const FALLBACK_DATA = {
    title: 'Pick up in store',
    subtitle: 'Ready today at a store near you',
    product: { name: 'Trailblazer Running Shoe', variant: 'Size 10 · Black', category: 'shoes' },
    stores: [
        { id: 's1', name: 'Union Square', distance: '0.4 mi', availability: 'in_stock', pickupEta: 'Ready in 2 hours', address: '333 Post St, San Francisco', hours: 'Open until 9:00 PM', phone: '+14155550142', mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=333%20Post%20St%2C%20San%20Francisco%2C%20CA%2094108' },
        { id: 's2', name: 'Marina District', distance: '2.1 mi', availability: 'low', pickupEta: 'Ready tomorrow 10 AM', address: '2190 Chestnut St, San Francisco', hours: 'Open until 8:00 PM', phone: '+14155550171', mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=2190%20Chestnut%20St%2C%20San%20Francisco%2C%20CA%2094123' },
        { id: 's3', name: 'Stonestown Galleria', distance: '5.6 mi', availability: 'out', address: '3251 20th Ave, San Francisco', hours: 'Open until 9:00 PM' }
    ]
};

const CATEGORY_HUES = {
    apparel: '#6366f1',
    shoes: '#0ea5e9',
    electronics: '#475569',
    beauty: '#ec4899',
    home: '#f59e0b',
    grocery: '#22c55e',
    accessories: '#a855f7',
    outdoors: '#10b981',
    toys: '#ef4444',
    general: '#8b5cf6'
};

const CATEGORIES = ['apparel', 'shoes', 'electronics', 'beauty', 'home', 'grocery', 'accessories', 'outdoors', 'toys', 'general'];

export default class AsaRetailStorePickup extends LightningElement {
    @api value; // Receives the AsaRetailStorePickupData object from the Lightning Type.

    @track title = 'Pick up in store';
    @track subtitle = '';
    @track product = null; // display-ready product context row (computed)
    @track stores = []; // display-ready store rows (computed)
    @track mapPins = [];

    isTestMode = false;
    submitTextRaw = 'Reserve for pickup';
    selectedId = '';
    reserved = false;
    _storesData = []; // normalized store data, independent of selection state

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.retailStorePickupJSON) {
                const data = JSON.parse(this.value.retailStorePickupJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaRetailStorePickup parse error:', e.message);
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
        const list = Array.isArray(data.stores) ? data.stores.filter((s) => s && s.name) : [];
        this.isTestMode = list.length === 0;
        const source = this.isTestMode ? FALLBACK_DATA : { ...data, stores: list };
        this.title = (source.title && String(source.title).trim()) || 'Pick up in store';
        this.subtitle = source.subtitle ? String(source.subtitle).trim() : '';
        this.submitTextRaw = (source.submitText && String(source.submitText).trim()) || 'Reserve for pickup';
        this.selectedId = '';
        this.reserved = false;
        this.initializeProduct(source.product);
        this._storesData = this.normalizeStores(source.stores);
        this.recomputeStores();
    }

    initializeProduct(product) {
        if (!product || !product.name) {
            this.product = null;
            return;
        }
        const cat = this.category(product.category);
        const imageUrl = resolveImageUrl(product.imageUrl, product.name);
        this.product = {
            name: String(product.name),
            variant: product.variant ? String(product.variant) : '',
            hasVariant: !!product.variant,
            imageUrl,
            hasImage: !!imageUrl,
            mediaStyle: `--rt-hue: ${CATEGORY_HUES[cat] || CATEGORY_HUES.general}`,
            ...this.catFlags(cat)
        };
    }

    category(c) {
        const raw = String(c || '').toLowerCase().replace(/[^a-z]/g, '');
        if (raw === 'apparel' || raw === 'clothing' || raw === 'clothes' || raw === 'fashion') return 'apparel';
        if (raw === 'shoes' || raw === 'footwear' || raw === 'sneakers') return 'shoes';
        if (raw === 'electronics' || raw === 'tech' || raw === 'gadgets' || raw === 'phone') return 'electronics';
        if (raw === 'beauty' || raw === 'cosmetics' || raw === 'skincare') return 'beauty';
        if (raw === 'home' || raw === 'homegoods' || raw === 'furniture' || raw === 'kitchen') return 'home';
        if (raw === 'grocery' || raw === 'groceries' || raw === 'food') return 'grocery';
        if (raw === 'accessories' || raw === 'accessory' || raw === 'jewelry' || raw === 'watches') return 'accessories';
        if (raw === 'outdoors' || raw === 'outdoor' || raw === 'sports' || raw === 'fitness') return 'outdoors';
        if (raw === 'toys' || raw === 'toy' || raw === 'kids' || raw === 'games') return 'toys';
        return 'general';
    }

    stockBucket(a) {
        const raw = String(a || '').toLowerCase().replace(/[^a-z]/g, '');
        if (raw === 'out' || raw === 'outofstock' || raw === 'soldout' || raw === 'unavailable') return 'out';
        if (raw === 'low' || raw === 'limited' || raw === 'fewleft') return 'low';
        return 'in';
    }

    stockLabel(bucket) {
        if (bucket === 'out') return 'Out of stock';
        if (bucket === 'low') return 'Low stock';
        return 'In stock';
    }

    telHref(phone) {
        const cleaned = String(phone || '').replace(/[^0-9+]/g, '');
        return cleaned ? `tel:${cleaned}` : '';
    }

    catFlags(cat) {
        const flags = {};
        CATEGORIES.forEach((c) => {
            flags['is' + c.charAt(0).toUpperCase() + c.slice(1)] = cat === c;
        });
        return flags;
    }

    normalizeStores(stores) {
        const list = Array.isArray(stores) ? stores : [];
        return list.map((s, index) => {
            const id = s && s.id ? String(s.id) : `s-${index}`;
            const bucket = this.stockBucket(s.availability);
            return {
                id,
                name: s.name ? String(s.name) : 'Store',
                distance: s.distance ? String(s.distance) : '',
                hasDistance: !!s.distance,
                bucket,
                isOut: bucket === 'out',
                pickupEta: s.pickupEta ? String(s.pickupEta) : '',
                address: s.address ? String(s.address) : '',
                hasAddress: !!s.address,
                hours: s.hours ? String(s.hours) : '',
                hasHours: !!s.hours,
                mapsUrl: s.mapsUrl ? String(s.mapsUrl).trim() : '',
                tel: this.telHref(s.phone)
            };
        });
    }

    // Recomputes the display list from the normalized store data + current
    // selection/reserved state, so class bindings (is-selected, radio dot)
    // update reactively without re-parsing the payload.
    recomputeStores() {
        this.stores = this._storesData.map((s, index) => {
            const selected = this.selectedId === s.id;
            return {
                ...s,
                selected,
                rowClass: `asa-sp-store is-${s.bucket}${index === 0 && !s.isOut ? ' is-best' : ''}${selected ? ' is-selected' : ''}${s.isOut ? ' is-out' : ''}`,
                rankLabel: String(index + 1).padStart(2, '0'),
                availClass: `asa-sp-avail is-${s.bucket}`,
                availLabel: this.stockLabel(s.bucket),
                showEta: !s.isOut && !!s.pickupEta,
                hasLinks: !!(s.mapsUrl || s.tel),
                isBest: index === 0 && !s.isOut
            };
        });
        this.mapPins = this._storesData.slice(0, 3).map((s, index) => ({
            id: s.id,
            label: String(index + 1),
            pinClass: `asa-sp-map-pin p${index + 1}${s.isOut ? ' is-out' : ''}`,
            ariaLabel: `${index + 1}. ${s.name}`
        }));
    }

    get hasSubtitle() {
        return !!this.subtitle;
    }

    get hasProduct() {
        return !!this.product;
    }

    get storeCountLabel() {
        return String(this.stores.length);
    }

    get availableTodayLabel() {
        const count = this._storesData.filter((store) => !store.isOut).length;
        return `${count} available today`;
    }

    get submitText() {
        return this.submitTextRaw;
    }

    get isReserved() {
        return this.reserved;
    }

    get reserveDisabled() {
        return !this.selectedId || this.reserved;
    }

    handlePick(event) {
        const id = String(event.currentTarget.dataset.id || '');
        if (!id) return;
        const store = this._storesData.find((s) => s.id === id);
        if (!store || store.isOut) return;
        this.selectedId = id;
        this.recomputeStores();
    }

    handleReserve() {
        if (!this.selectedId || this.reserved) return;
        const store = this._storesData.find((s) => s.id === this.selectedId);
        if (!store) return;
        this.reserved = true;
        const productPart = this.product && this.product.name ? `${this.product.name} ` : '';
        this.sendMessage(`Reserve ${productPart}for pickup at ${store.name}`);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaRetailStorePickup sent:', message))
                    .catch((err) => console.error('AsaRetailStorePickup send error:', err));
            } else {
                console.log('AsaRetailStorePickup: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaRetailStorePickup sendMessage error:', err);
        }
    }
}
