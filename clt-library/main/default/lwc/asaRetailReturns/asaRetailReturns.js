/**
 * @description ASA Retail · Returns & Exchange renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders the order's items to select plus a reason picker. Confirming the return
 * sends the selection back to the agent through
 * embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in
 * genAiFunctions/asaRetailReturns_Output_c4d8/input/schema.json.
 * Fields: title?, subtitle?, orderLabel?, items[] of { id, name, sku?,
 * variant?, price?, currency?, imageUrl?, category? }, reasons[] of { id,
 * label }, resolutions?[] of { id?, kind?, label, description? }, submitText?.
 */
import { LightningElement, api, track } from 'lwc';

// Return item payloads reference photos by an https URL or a stable
// '/resource/<name>' path. No retail images are bundled today, so URLs pass
// through unchanged and items fall back to a branded category tile when absent.
function resolveImageUrl(url, name) {
    const explicit = url ? String(url).trim() : '';
    if (explicit) return explicit;
    const normalizedName = String(name || '').toLowerCase();
    if (normalizedName.includes('trailblazer') && (normalizedName.includes('shoe') || normalizedName.includes('runner'))) {
        return '/resource/asaRetailTrailblazerShoe';
    }
    if (normalizedName.includes('merino') || normalizedName.includes('crew')) {
        return '/resource/asaRetailEverydayMerinoCrew';
    }
    return '';
}

const TEST_ITEMS = [
    { id: 'i1', name: 'Trailblazer Running Shoe', sku: 'TR3-BLK-10', variant: 'Size 10 · Black', price: 128, category: 'shoes' },
    { id: 'i2', name: 'Everyday Merino Crew', sku: 'EMC-NVY-M', variant: 'Medium · Navy', price: 68, category: 'apparel' }
];

const TEST_REASONS = [
    { id: 'too_small', label: 'Too small' },
    { id: 'too_large', label: 'Too large' },
    { id: 'changed_mind', label: 'Changed my mind' },
    { id: 'defective', label: 'Arrived damaged' },
    { id: 'wrong_item', label: 'Wrong item' }
];

const DEFAULT_RESOLUTIONS = [
    { id: 'refund', kind: 'refund', label: 'Refund', description: 'Back to original payment' },
    { id: 'exchange', kind: 'exchange', label: 'Exchange', description: 'Swap for another size' },
    { id: 'credit', kind: 'credit', label: 'Store credit', description: 'Instant, +5% bonus' }
];

// NEVER-BLANK GUARANTEE: generic sample data (no org-specific content). Renders
// when the Flow payload is missing/malformed or has no items. Plain object (no
// JSON.parse), so nothing here can fail.
const FALLBACK_DATA = {
    title: 'Start a return',
    subtitle: "Choose what you'd like to send back",
    orderLabel: 'Order #4821 · Mar 2',
    items: TEST_ITEMS,
    reasons: TEST_REASONS,
    resolutions: DEFAULT_RESOLUTIONS
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

export default class AsaRetailReturns extends LightningElement {
    @api value; // Receives the AsaRetailReturnsData object from the Lightning Type.

    @track title = 'Start a return';
    @track subtitle = '';
    @track orderLabel = '';
    @track items = []; // display-ready return items (computed)
    @track reasons = []; // display-ready reasons (computed)
    @track resolutions = []; // display-ready resolutions (computed)
    @track submitText = 'Continue return';

    isTestMode = false;
    selectedItems = {}; // id -> bool
    reasonId = '';
    resolutionId = '';
    done = false;

    rawItems = [];
    rawReasons = [];
    rawResolutions = [];

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.retailReturnsJSON) {
                const data = JSON.parse(this.value.retailReturnsJSON);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('AsaRetailReturns parse error:', e.message);
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
        const itemList = Array.isArray(data.items) ? data.items.filter((it) => it && it.name) : [];
        this.isTestMode = itemList.length === 0;
        const source = this.isTestMode ? FALLBACK_DATA : data;
        this.title = (source.title && String(source.title).trim()) || 'Start a return';
        this.subtitle = source.subtitle ? String(source.subtitle).trim() : '';
        this.orderLabel = source.orderLabel ? String(source.orderLabel).trim() : '';
        this.submitText = (source.submitText && String(source.submitText).trim()) || 'Continue return';

        this.rawItems = this.isTestMode ? TEST_ITEMS : itemList;
        const reasonList = Array.isArray(source.reasons) ? source.reasons.filter((r) => r && r.label) : [];
        this.rawReasons = this.isTestMode ? TEST_REASONS : reasonList;
        this.rawResolutions = Array.isArray(source.resolutions) && source.resolutions.length
            ? source.resolutions.filter((r) => r && r.label)
            : DEFAULT_RESOLUTIONS;

        this.selectedItems = {};
        this.reasonId = '';
        this.resolutionId = this.rawResolutions[0] ? String(this.rawResolutions[0].id || '') : '';
        this.done = false;

        this.recomputeItems();
        this.recomputeReasons();
        this.recomputeResolutions();
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

    resolutionKind(k) {
        const raw = String(k || '').toLowerCase().replace(/[^a-z]/g, '');
        if (raw === 'exchange' || raw === 'swap' || raw === 'replace') return 'exchange';
        if (raw === 'credit' || raw === 'storecredit' || raw === 'giftcard') return 'credit';
        return 'refund';
    }

    formatMoney(amount, currency) {
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(Number(amount) || 0);
        } catch (e) {
            return `${currency || 'USD'} ${(Number(amount) || 0).toFixed(2)}`;
        }
    }

    catFlags(cat) {
        const flags = {};
        CATEGORIES.forEach((c) => {
            flags['is' + c.charAt(0).toUpperCase() + c.slice(1)] = cat === c;
        });
        return flags;
    }

    recomputeItems() {
        this.items = this.rawItems.map((it, index) => {
            const id = it && it.id ? String(it.id) : `i-${index}`;
            const cat = this.category(it.category);
            const imageUrl = resolveImageUrl(it.imageUrl, it.name);
            const isSelected = !!this.selectedItems[id];
            const hasPrice = typeof it.price === 'number';
            return {
                id,
                name: it.name ? String(it.name) : 'Item',
                variant: it.variant ? String(it.variant) : '',
                hasVariant: !!it.variant,
                sku: it.sku ? String(it.sku) : '',
                hasSku: !!it.sku,
                hasPrice,
                priceText: hasPrice ? this.formatMoney(it.price, it.currency) : '',
                lineLabel: String(index + 1).padStart(2, '0'),
                imageUrl,
                hasImage: !!imageUrl,
                mediaStyle: `--rt-hue: ${CATEGORY_HUES[cat] || CATEGORY_HUES.general}`,
                isSelected,
                itemClass: isSelected ? 'asa-rt-item is-selected' : 'asa-rt-item',
                checkClass: isSelected ? 'asa-rt-check is-on' : 'asa-rt-check',
                ...this.catFlags(cat)
            };
        });
    }

    recomputeReasons() {
        this.reasons = this.rawReasons.map((r, index) => {
            const id = r && r.id ? String(r.id) : `r-${index}`;
            const isOn = this.reasonId === id;
            return {
                id,
                label: r.label ? String(r.label) : 'Reason',
                isOn,
                reasonClass: isOn ? 'asa-rt-reason is-on' : 'asa-rt-reason'
            };
        });
    }

    recomputeResolutions() {
        this.resolutions = this.rawResolutions.map((x, index) => {
            const id = x && x.id ? String(x.id) : `x-${index}`;
            const kind = this.resolutionKind(x.kind);
            const isOn = this.resolutionId === id;
            return {
                id,
                kind,
                label: x.label ? String(x.label) : 'Resolution',
                description: x.description ? String(x.description) : '',
                hasDescription: !!x.description,
                isOn,
                resolutionClass: `asa-rt-resolution is-${kind}${isOn ? ' is-on' : ''}`,
                isRefund: kind === 'refund',
                isExchange: kind === 'exchange',
                isCredit: kind === 'credit'
            };
        });
    }

    get hasSubLine() {
        return !!(this.subtitle || this.orderLabel);
    }

    get subLine() {
        return [this.subtitle, this.orderLabel].filter(Boolean).join(' · ');
    }

    get hasReasons() {
        return this.reasons.length > 0;
    }

    get selectedCount() {
        return Object.values(this.selectedItems).filter(Boolean).length;
    }

    get ready() {
        return this.selectedCount > 0 && !!this.reasonId;
    }

    get submitDisabled() {
        return !this.ready || this.done;
    }

    get submitLabel() {
        if (this.done) return 'Return started';
        const count = this.selectedCount;
        return count > 0 ? `${this.submitText} · ${count} item${count > 1 ? 's' : ''}` : this.submitText;
    }

    get selectedCountLabel() {
        return String(this.selectedCount).padStart(2, '0');
    }

    get summaryClass() {
        return this.ready ? 'asa-rt-summary is-ready' : 'asa-rt-summary';
    }

    get summaryState() {
        if (this.ready) return 'Return is ready to review';
        if (this.selectedCount > 0) return 'Choose a reason to continue';
        return 'Select items from this order';
    }

    get itemsGuideClass() {
        return this.selectedCount > 0 ? 'is-done' : 'is-active';
    }

    get reasonGuideClass() {
        if (this.reasonId) return 'is-done';
        return this.selectedCount > 0 ? 'is-active' : '';
    }

    get methodGuideClass() {
        if (this.done) return 'is-done';
        return this.reasonId ? 'is-active' : '';
    }

    handleToggleItem(event) {
        const id = String(event.currentTarget.dataset.id || '');
        if (!id) return;
        this.selectedItems = { ...this.selectedItems, [id]: !this.selectedItems[id] };
        this.recomputeItems();
    }

    handleSelectReason(event) {
        const id = String(event.currentTarget.dataset.id || '');
        if (!id) return;
        this.reasonId = id;
        this.recomputeReasons();
    }

    handleSelectResolution(event) {
        const id = String(event.currentTarget.dataset.id || '');
        if (!id) return;
        this.resolutionId = id;
        this.recomputeResolutions();
    }

    handleSubmit() {
        if (!this.ready || this.done) return;
        this.done = true;
        const selected = this.items.filter((it) => it.isSelected);
        const names = selected.map((it) => it.name).join(', ');
        const reason = this.reasons.find((r) => r.id === this.reasonId);
        const reasonLabel = reason ? reason.label : '';
        const count = selected.length;
        this.sendMessage(`Start a return for ${count} item${count > 1 ? 's' : ''}: ${names} — reason: ${reasonLabel}`);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('AsaRetailReturns sent:', message))
                    .catch((err) => console.error('AsaRetailReturns send error:', err));
            } else {
                console.log('AsaRetailReturns: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('AsaRetailReturns sendMessage error:', err);
        }
    }
}
