import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import type { CarouselProduct, RetailProductCarouselPayload } from './payloads';
import { formatMoney, productCategory, productHue, productIcon, retailProductImage, stockBucket } from './retailFormat';

/**
 * Build/Input editor + live preview for the ASA Retail · Product Carousel CLT
 * (DTO field retailProductCarouselJSON). LWC-true fields: title, subtitle?,
 * currency?, products (object[] of { id, name, sku?, price, currency?,
 * compareAtPrice?, rating?, reviewCount?, imageUrl?, category?, badge?,
 * availability?, addLabel? }). A horizontally scrollable rail of product cards;
 * Only one of up to three products is shown at a time. "Add to cart" hands the product id back to the agent. An empty product list
 * drops the preview into a test-mode fallback so it renders with no payload —
 * mirroring the LWC.
 */

const CATEGORIES = ['apparel', 'shoes', 'electronics', 'beauty', 'home', 'grocery', 'accessories', 'outdoors', 'toys', 'general'];
const STOCK_STATES = [
  { value: 'in_stock', label: 'In stock' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
];

export function RetailProductCarouselEditor({
  value,
  onChange,
}: {
  value: RetailProductCarouselPayload;
  onChange: (next: RetailProductCarouselPayload) => void;
}) {
  const setProduct = (index: number, patch: Partial<CarouselProduct>) => {
    const products = value.products.slice();
    products[index] = { ...products[index], ...patch };
    onChange({ ...value, products });
  };
  const addProduct = () => {
    if (value.products.length >= 3) return;
    onChange({
      ...value,
      products: [
        ...value.products,
        { id: `p-${value.products.length + 1}`, name: 'New product', category: 'general', price: 0, availability: 'in_stock' },
      ],
    });
  };
  const removeProduct = (index: number) => onChange({ ...value, products: value.products.filter((_, i) => i !== index) });
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.products.length) return;
    const products = value.products.slice();
    [products[index], products[target]] = [products[target], products[index]];
    onChange({ ...value, products });
  };
  const num = (raw: string): number | undefined => (raw.trim() === '' ? undefined : Number(raw));

  return (
    <div className="playground-editor">
      <label className="playground-field">
        Title
        <input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="Picked for you" />
      </label>
      <label className="playground-field">
        Subtitle <span className="optional-label">Optional</span>
        <input value={value.subtitle ?? ''} onChange={(e) => onChange({ ...value, subtitle: e.target.value })} placeholder="Based on your recent views" />
      </label>
      <label className="playground-field">
        Currency <span className="optional-label">ISO code</span>
        <input value={value.currency ?? ''} onChange={(e) => onChange({ ...value, currency: e.target.value || undefined })} placeholder="USD" />
      </label>

      <div className="playground-list">
        <div className="playground-list-head">
          <span>Products <span className="optional-label">Maximum 3</span></span>
          <button type="button" className="playground-add" onClick={addProduct} disabled={value.products.length >= 3}><Plus aria-hidden="true" /> Add product</button>
        </div>
        {value.products.length === 0 && <p className="playground-empty">No products — the component shows sample test data until you add one.</p>}
        {value.products.slice(0, 3).map((p, index) => (
          <div className="playground-card" key={index}>
            <div className="playground-card-head">
              <strong>Product {index + 1}</strong>
              <span className="playground-card-actions">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up"><ArrowUp aria-hidden="true" /></button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === value.products.length - 1} aria-label="Move down"><ArrowDown aria-hidden="true" /></button>
                <button type="button" onClick={() => removeProduct(index)} aria-label="Remove product"><Trash2 aria-hidden="true" /></button>
              </span>
            </div>
            <label className="playground-field">
              Name
              <input value={p.name} onChange={(e) => setProduct(index, { name: e.target.value })} placeholder="Trail Runner 3" />
            </label>
            <label className="playground-field">
              SKU <span className="optional-label">Optional</span>
              <input value={p.sku ?? ''} onChange={(e) => setProduct(index, { sku: e.target.value })} placeholder="TR3-BLK-10" />
            </label>
            <div className="playground-field">
              <span>Category</span>
              <select value={productCategory(p.category)} onChange={(e) => setProduct(index, { category: e.target.value })}>
                {CATEGORIES.map((c) => <option value={c} key={c}>{c}</option>)}
              </select>
            </div>
            <label className="playground-field">
              Price
              <input type="number" value={p.price ?? ''} onChange={(e) => setProduct(index, { price: Number(e.target.value) })} placeholder="129.00" />
            </label>
            <label className="playground-field">
              Compare-at price <span className="optional-label">was-price</span>
              <input type="number" value={p.compareAtPrice ?? ''} onChange={(e) => setProduct(index, { compareAtPrice: num(e.target.value) })} placeholder="159.00" />
            </label>
            <label className="playground-field">
              Rating <span className="optional-label">0–5</span>
              <input type="number" step="0.1" min="0" max="5" value={p.rating ?? ''} onChange={(e) => setProduct(index, { rating: num(e.target.value) })} placeholder="4.6" />
            </label>
            <label className="playground-field">
              Review count <span className="optional-label">Optional</span>
              <input type="number" value={p.reviewCount ?? ''} onChange={(e) => setProduct(index, { reviewCount: num(e.target.value) })} placeholder="248" />
            </label>
            <label className="playground-field">
              Image URL <span className="optional-label">blank → category tile</span>
              <input value={p.imageUrl ?? ''} onChange={(e) => setProduct(index, { imageUrl: e.target.value })} placeholder="https://… or /resource/Name" />
            </label>
            <label className="playground-field">
              Badge <span className="optional-label">corner tag</span>
              <input value={p.badge ?? ''} onChange={(e) => setProduct(index, { badge: e.target.value })} placeholder="Bestseller" />
            </label>
            <div className="playground-field">
              <span>Availability</span>
              <select value={stockToValue(p.availability)} onChange={(e) => setProduct(index, { availability: e.target.value })}>
                {STOCK_STATES.map((s) => <option value={s.value} key={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function stockToValue(a?: string): string {
  const bucket = stockBucket(a);
  return bucket === 'in' ? 'in_stock' : bucket;
}

const TEST_PRODUCTS: CarouselProduct[] = [
  { id: 'p1', name: 'Trailblazer Running Shoe', sku: 'TR3-BLK-10', category: 'shoes', price: 128, compareAtPrice: 160, rating: 4.7, reviewCount: 2140, badge: '-20%', availability: 'in_stock' },
  { id: 'p2', name: 'Everyday Merino Crew', sku: 'EMC-NVY-M', category: 'apparel', price: 68, rating: 4.8, reviewCount: 512, badge: 'New', availability: 'in_stock' },
];

/** Faithful preview: mirrors the Product Carousel LWC, including test-mode fallback. */
export function RetailProductCarouselPreview({
  value,
  accentColor,
}: {
  value: RetailProductCarouselPayload;
  accentColor: string;
}) {
  const isTestMode = value.products.length === 0;
  const title = (isTestMode ? 'Picked for you' : value.title) || 'Picked for you';
  const subtitle = isTestMode ? 'Based on your recent views' : value.subtitle;
  const products = (isTestMode ? TEST_PRODUCTS : value.products).slice(0, 3);
  const payloadCurrency = value.currency || 'USD';
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const currentIndex = Math.min(activeIndex, Math.max(0, products.length - 1));
  const product = products[currentIndex];

  if (!product) return null;

  const cat = productCategory(product.category);
  const Icon = productIcon(cat);
  const bucket = stockBucket(product.availability);
  const isOut = bucket === 'out';
  const currency = product.currency || payloadCurrency;
  const onSale = typeof product.compareAtPrice === 'number' && product.compareAtPrice > product.price;
  const id = product.id || `p-${currentIndex}`;
  const isAdded = !!added[id];
  const showNavigation = products.length > 1;
  const imageUrl = retailProductImage(product.imageUrl, product.name);

  return (
    <div className="clt-live-preview product-carousel-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      <div className="asa-pc-intro">
        <div>
          {title && <h3 className="selector-title">{title}</h3>}
          {subtitle && <p className="asa-card-sub">{subtitle}</p>}
        </div>
      </div>

      <div className="asa-pc-stage" aria-live="polite">
            <article className={`asa-pc-card${isOut ? ' is-out' : ''}`} aria-label={`${currentIndex + 1} of ${products.length}: ${product.name}`}>
              <div className="asa-pc-media" style={{ '--rt-hue': productHue(cat) } as React.CSSProperties}>
                {product.badge && <span className="asa-pc-badge">{product.badge}</span>}
                {imageUrl ? (
                  <img className="asa-pc-photo is-contain" src={imageUrl} alt={product.name} />
                ) : (
                  <span className="asa-pc-glyph" aria-hidden="true"><Icon /></span>
                )}
                {isOut && <span className="asa-pc-veil">Sold out</span>}
              </div>
              <div className="asa-pc-body">
                <span className="asa-pc-name" title={product.name}>{product.name || 'Product'}</span>
                <div className="asa-pc-pricerow">
                  <span className="asa-pc-price">{formatMoney(product.price ?? 0, currency)}</span>
                  {onSale && <span className="asa-pc-was">{formatMoney(product.compareAtPrice as number, currency)}</span>}
                </div>
                <button
                  type="button"
                  className={isAdded ? 'asa-pc-add is-added' : 'asa-pc-add'}
                  disabled={isOut}
                  onClick={() => setAdded((a) => ({ ...a, [id]: true }))}
                >
                  {isAdded ? <Check aria-hidden="true" /> : <ShoppingCart aria-hidden="true" />}
                  <span>{isOut ? 'Unavailable' : isAdded ? 'Added' : product.addLabel || 'Add to cart'}</span>
                </button>
              </div>
            </article>
      </div>
      {showNavigation && (
        <div className="asa-pc-nav" aria-label="Choose product">
          <button type="button" className="asa-pc-arrow" onClick={() => setActiveIndex((index) => Math.max(0, index - 1))} disabled={currentIndex === 0} aria-label="Previous product"><ChevronLeft aria-hidden="true" /></button>
          <div className="asa-pc-dots">
            {products.map((item, index) => <button type="button" className={index === currentIndex ? 'is-active' : ''} onClick={() => setActiveIndex(index)} aria-label={`Show ${item.name}`} aria-current={index === currentIndex ? 'true' : undefined} key={item.id || index} />)}
          </div>
          <button type="button" className="asa-pc-arrow" onClick={() => setActiveIndex((index) => Math.min(products.length - 1, index + 1))} disabled={currentIndex === products.length - 1} aria-label="Next product"><ChevronRight aria-hidden="true" /></button>
        </div>
      )}
    </div>
  );
}
