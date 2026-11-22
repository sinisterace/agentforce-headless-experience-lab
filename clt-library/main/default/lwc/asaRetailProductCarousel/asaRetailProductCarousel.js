/**
 * @description ASA Retail · Product Carousel renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders one focused product card at a time, with a maximum of
 * three products and simple previous/next navigation. Adding a
 * product sends the choice back to the agent through
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaRetailProductCarousel_Output_a3f1/input/schema.json.
 * Fields: title, subtitle?, currency?, products[] of { id, name, sku?, price,
 * currency?, compareAtPrice?, rating?, reviewCount?, imageUrl?, category?,
 * badge?, availability?, addLabel? }.
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
    title: 'Picked for you',
    subtitle: 'Based on your recent views',
    currency: 'USD',
    products: [
        { id: 'p2', name: 'Everyday Merino Crew', sku: 'EMC-NVY-M', category: 'apparel', price: 68, rating: 4.8, reviewCount: 512, badge: 'New', availability: 'in_stock' },
        { id: 'p1', name: 'Trailblazer Running Shoe', sku: 'TR3-BLK-10', category: 'shoes', price: 128, compareAtPrice: 160, rating: 4.7, reviewCount: 2140, badge: '-20%', availability: 'in_stock' }
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

export default class AsaRetailProductCarousel extends LightningElement {
    @api value; // Receives the AsaRetailProductCarouselData object from the Lightning Type.

    @track title = 'Picked for you';
    @track subtitle = '';
    @track products = []; // display-ready product cards (computed)
    @track currentIndex = 0;

    isTestMode = false;
    addedIds = {};

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.retailProductCarouselJSON) {
                const data = JSON.parse(this.value.retailProductCarouselJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaRetailProductCarousel parse error:', e.message);
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
        const list = Array.isArray(data.products) ? data.products.filter((p) => p && p.name) : [];
        this.isTestMode = list.length === 0;
        const source = this.isTestMode ? FALLBACK_DATA : { ...data, products: list };
        this.title = (source.title && String(source.title).trim()) || 'Picked for you';
        this.subtitle = source.subtitle ? String(source.subtitle).trim() : '';
        const payloadCurrency = source.currency ? String(source.currency).trim() : 'USD';
        this.recompute(source.products, payloadCurrency);
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
        if (bucket === 'low') return 'Almost gone';
        return 'Ready to ship';
    }

    formatMoney(amount, currency) {
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(Number(amount) || 0);
        } catch (e) {
            return `${currency || 'USD'} ${(Number(amount) || 0).toFixed(2)}`;
        }
    }

    starParts(rating) {
        const r = Math.max(0, Math.min(5, Number(rating) || 0));
        const full = Math.floor(r);
        const half = r - full >= 0.25 && r - full < 0.75;
        const rounded = r - full >= 0.75 ? full + 1 : full;
        const filled = half ? full : rounded;
        return { full: filled, half, empty: 5 - filled - (half ? 1 : 0) };
    }

    catFlags(cat) {
        const flags = {};
        CATEGORIES.forEach((c) => {
            flags['is' + c.charAt(0).toUpperCase() + c.slice(1)] = cat === c;
        });
        return flags;
    }

    recompute(products, payloadCurrency) {
        const list = Array.isArray(products) ? products.slice(0, 3) : [];
        this.products = list.map((p, index) => {
            const id = p && p.id ? String(p.id) : `p-${index}`;
            const cat = this.category(p.category);
            const bucket = this.stockBucket(p.availability);
            const isOut = bucket === 'out';
            const currency = p.currency ? String(p.currency).trim() : payloadCurrency;
            const ratingNum = Number(p.rating);
            const hasRating = !Number.isNaN(ratingNum) && ratingNum > 0;
            const stars = this.starParts(ratingNum);
            const onSale = typeof p.compareAtPrice === 'number' && p.compareAtPrice > (p.price || 0);
            const imageUrl = resolveImageUrl(p.imageUrl, p.name);
            const isAdded = !!this.addedIds[id];
            return {
                id,
                name: p.name ? String(p.name) : 'Product',
                sku: p.sku ? String(p.sku) : '',
                hasSku: !!p.sku,
                badge: p.badge ? String(p.badge) : '',
                hasBadge: !!p.badge,
                imageUrl,
                hasImage: !!imageUrl,
                photoClass: 'asa-pc-photo is-contain',
                priceText: this.formatMoney(p.price, currency),
                wasText: onSale ? this.formatMoney(p.compareAtPrice, currency) : '',
                onSale,
                savingText: onSale ? `You save ${this.formatMoney(p.compareAtPrice - (p.price || 0), currency)}` : '',
                hasRating,
                ratingText: hasRating ? ratingNum.toFixed(1) : '',
                hasReviews: typeof p.reviewCount === 'number',
                reviewText: typeof p.reviewCount === 'number' ? `(${p.reviewCount.toLocaleString('en-US')})` : '',
                fullStars: Array.from({ length: stars.full }, (_, i) => ({ key: `f${i}` })),
                showHalf: stars.half,
                emptyStars: Array.from({ length: stars.empty }, (_, i) => ({ key: `e${i}` })),
                isOut,
                mediaStyle: `--rt-hue: ${CATEGORY_HUES[cat] || CATEGORY_HUES.general}`,
                cardClass: `asa-pc-card${index === 0 ? ' is-featured' : ''}${isOut ? ' is-out' : ''}`,
                positionLabel: String(index + 1).padStart(2, '0'),
                stockClass: `asa-pc-stock is-${bucket}`,
                stockLabel: this.stockLabel(bucket),
                addClass: isAdded ? 'asa-pc-add is-added' : 'asa-pc-add',
                addLabel: isOut ? 'Unavailable' : isAdded ? 'Added' : (p.addLabel ? String(p.addLabel) : 'Add to cart'),
                isAdded,
                addDisabled: isOut || isAdded,
                addLabelRaw: p.addLabel ? String(p.addLabel) : 'Add to cart',
                ...this.catFlags(cat)
            };
        });
        this.currentIndex = Math.min(this.currentIndex, Math.max(0, this.products.length - 1));
    }

    get hasSubtitle() {
        return !!this.subtitle;
    }

    get productCountLabel() {
        return `${this.products.length} picks`;
    }

    get visibleProducts() {
        const current = this.products[this.currentIndex];
        return current ? [current] : [];
    }

    get hasMultipleProducts() {
        return this.products.length > 1;
    }

    get previousDisabled() {
        return this.currentIndex === 0;
    }

    get nextDisabled() {
        return this.currentIndex >= this.products.length - 1;
    }

    get navDots() {
        return this.products.map((product, index) => ({
            id: product.id,
            index,
            label: `Show ${product.name}`,
            dotClass: index === this.currentIndex ? 'asa-pc-dot is-active' : 'asa-pc-dot',
            ariaCurrent: index === this.currentIndex ? 'true' : 'false'
        }));
    }

    handlePrevious() {
        this.currentIndex = Math.max(0, this.currentIndex - 1);
    }

    handleNext() {
        this.currentIndex = Math.min(this.products.length - 1, this.currentIndex + 1);
    }

    handleDot(event) {
        const index = Number(event.currentTarget.dataset.index);
        if (Number.isInteger(index) && index >= 0 && index < this.products.length) {
            this.currentIndex = index;
        }
    }

    handleAdd(event) {
        const id = String(event.currentTarget.dataset.id || '');
        if (!id) return;
        const product = this.products.find((p) => p.id === id);
        if (!product || product.isOut || product.isAdded) return;
        this.addedIds = { ...this.addedIds, [id]: true };
        // Recompute just the added flags for immediate visual feedback.
        this.products = this.products.map((p) =>
            p.id === id
                ? { ...p, isAdded: true, addDisabled: true, addClass: 'asa-pc-add is-added', addLabel: 'Added' }
                : p
        );
        const skuPart = product.hasSku ? ` (SKU ${product.sku})` : '';
        this.sendMessage(`Add ${product.name}${skuPart} to my cart`);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaRetailProductCarousel sent:', message))
                    .catch((err) => console.error('AsaRetailProductCarousel send error:', err));
            } else {
                console.log('AsaRetailProductCarousel: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaRetailProductCarousel sendMessage error:', err);
        }
    }
}
