import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import type { CarouselProduct, RetailProductCarouselPayload } from './payloads';
import { formatMoney, productCategory, productHue, productIcon, retailProductImage, stockBucket } from './retailFormat';

/**
 * Live preview for the ASA Retail · Product Carousel CLT
 * (DTO field retailProductCarouselJSON). LWC-true fields: title, subtitle?,
 * currency?, products (object[] of { id, name, sku?, price, currency?,
 * compareAtPrice?, rating?, reviewCount?, imageUrl?, category?, badge?,
 * availability?, addLabel? }). A horizontally scrollable rail of product cards;
 * Only one of up to three products is shown at a time. "Add to cart" hands the product id back to the agent. An empty product list
 * drops the preview into a test-mode fallback so it renders with no payload —
 * mirroring the LWC.
 */



const TEST_PRODUCTS: CarouselProduct[] = [
  { id: 'p2', name: 'Everyday Merino Crew', sku: 'EMC-NVY-M', category: 'apparel', price: 68, rating: 4.8, reviewCount: 512, badge: 'New', availability: 'in_stock' },
  { id: 'p1', name: 'Trailblazer Running Shoe', sku: 'VR3-BLK-10', category: 'shoes', price: 128, compareAtPrice: 160, rating: 4.7, reviewCount: 2140, badge: '-20%', availability: 'in_stock' },
];

/** Faithful preview: mirrors the Product Carousel LWC, including test-mode fallback. */
export function RetailProductCarouselPreview({
  value,
  accentColor,
}: {
  value: RetailProductCarouselPayload;
  accentColor: string;
}) {
  const payloadProducts = Array.isArray(value.products) ? value.products : [];
  const isTestMode = payloadProducts.length === 0;
  const title = (isTestMode ? 'Picked for you' : value.title) || 'Picked for you';
  const subtitle = isTestMode ? 'Based on your recent views' : value.subtitle;
  const products = (isTestMode ? TEST_PRODUCTS : payloadProducts).slice(0, 3);
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
