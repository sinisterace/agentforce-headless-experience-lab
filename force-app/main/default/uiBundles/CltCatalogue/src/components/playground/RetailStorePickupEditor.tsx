import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Clock, MapPin, Navigation, Phone, Plus, Trash2 } from 'lucide-react';
import type { PickupStore, RetailStorePickupPayload } from './payloads';
import { productCategory, productHue, productIcon, retailProductImage, stockBucket, stockLabel, telHref } from './retailFormat';

/**
 * Build/Input editor + live preview for the ASA Retail · Store Pickup CLT
 * (DTO field retailStorePickupJSON). LWC-true fields: title, subtitle?,
 * product?{ name, variant?, imageUrl?, category? }, stores (object[] of
 * { id, name, distance?, address?, hours?, availability?, pickupEta?, phone?,
 * mapsUrl? }), submitText?.
 *
 * The customer picks a store (out-of-stock stores are shown but not selectable);
 * the confirm button reserves the item for pickup and hands the store id back to
 * the agent. An empty store list drops the preview into a test-mode fallback so
 * it renders with no payload — mirroring the LWC.
 */

const CATEGORIES = ['apparel', 'shoes', 'electronics', 'beauty', 'home', 'grocery', 'accessories', 'outdoors', 'toys', 'general'];
const STOCK_STATES = [
  { value: 'in_stock', label: 'In stock' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
];

export function RetailStorePickupEditor({
  value,
  onChange,
}: {
  value: RetailStorePickupPayload;
  onChange: (next: RetailStorePickupPayload) => void;
}) {
  const stores = value.stores ?? [];
  const setStore = (index: number, patch: Partial<PickupStore>) => {
    const next = stores.slice();
    next[index] = { ...next[index], ...patch };
    onChange({ ...value, stores: next });
  };
  const addStore = () =>
    onChange({ ...value, stores: [...stores, { id: `s-${stores.length + 1}`, name: 'New store', availability: 'in_stock' }] });
  const removeStore = (index: number) => onChange({ ...value, stores: stores.filter((_, i) => i !== index) });
  const moveStore = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= stores.length) return;
    const next = stores.slice();
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...value, stores: next });
  };
  const setProduct = (patch: Partial<NonNullable<RetailStorePickupPayload['product']>>) =>
    onChange({ ...value, product: { name: '', ...value.product, ...patch } });

  return (
    <div className="playground-editor">
      <label className="playground-field">
        Title
        <input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="Pick up in store" />
      </label>
      <label className="playground-field">
        Subtitle <span className="optional-label">Optional</span>
        <input value={value.subtitle ?? ''} onChange={(e) => onChange({ ...value, subtitle: e.target.value })} placeholder="Ready today at a store near you" />
      </label>

      <div className="playground-card">
        <div className="playground-card-head"><strong>Product <span className="optional-label">Optional context</span></strong></div>
        <label className="playground-field">
          Name
          <input value={value.product?.name ?? ''} onChange={(e) => setProduct({ name: e.target.value })} placeholder="Trailblazer Running Shoe" />
        </label>
        <label className="playground-field">
          Variant <span className="optional-label">Optional</span>
          <input value={value.product?.variant ?? ''} onChange={(e) => setProduct({ variant: e.target.value })} placeholder="Size 10 · Black" />
        </label>
        <div className="playground-field">
          <span>Category</span>
          <select value={productCategory(value.product?.category)} onChange={(e) => setProduct({ category: e.target.value })}>
            {CATEGORIES.map((c) => <option value={c} key={c}>{c}</option>)}
          </select>
        </div>
        <label className="playground-field">
          Image URL <span className="optional-label">blank → category tile</span>
          <input value={value.product?.imageUrl ?? ''} onChange={(e) => setProduct({ imageUrl: e.target.value })} placeholder="https://… or /resource/Name" />
        </label>
      </div>

      <div className="playground-list">
        <div className="playground-list-head">
          <span>Stores</span>
          <button type="button" className="playground-add" onClick={addStore}><Plus aria-hidden="true" /> Add store</button>
        </div>
        {stores.length === 0 && <p className="playground-empty">No stores — the component shows sample test data until you add one.</p>}
        {stores.map((st, index) => (
          <div className="playground-card" key={index}>
            <div className="playground-card-head">
              <strong>Store {index + 1}</strong>
              <span className="playground-card-actions">
                <button type="button" onClick={() => moveStore(index, -1)} disabled={index === 0} aria-label="Move up"><ArrowUp aria-hidden="true" /></button>
                <button type="button" onClick={() => moveStore(index, 1)} disabled={index === stores.length - 1} aria-label="Move down"><ArrowDown aria-hidden="true" /></button>
                <button type="button" onClick={() => removeStore(index)} aria-label="Remove store"><Trash2 aria-hidden="true" /></button>
              </span>
            </div>
            <label className="playground-field">
              Name
              <input value={st.name} onChange={(e) => setStore(index, { name: e.target.value })} placeholder="Union Square" />
            </label>
            <div className="playground-field">
              <span>Availability</span>
              <select value={stockToValue(st.availability)} onChange={(e) => setStore(index, { availability: e.target.value })}>
                {STOCK_STATES.map((s) => <option value={s.value} key={s.value}>{s.label}</option>)}
              </select>
            </div>
            <label className="playground-field">
              Distance <span className="optional-label">Optional</span>
              <input value={st.distance ?? ''} onChange={(e) => setStore(index, { distance: e.target.value })} placeholder="0.4 mi" />
            </label>
            <label className="playground-field">
              Pickup ETA <span className="optional-label">Optional</span>
              <input value={st.pickupEta ?? ''} onChange={(e) => setStore(index, { pickupEta: e.target.value })} placeholder="Ready in 2 hours" />
            </label>
            <label className="playground-field">
              Address <span className="optional-label">Optional</span>
              <input value={st.address ?? ''} onChange={(e) => setStore(index, { address: e.target.value })} placeholder="333 Post St, San Francisco" />
            </label>
            <label className="playground-field">
              Hours <span className="optional-label">Optional</span>
              <input value={st.hours ?? ''} onChange={(e) => setStore(index, { hours: e.target.value })} placeholder="Open until 9:00 PM" />
            </label>
            <label className="playground-field">
              Phone <span className="optional-label">Optional</span>
              <input value={st.phone ?? ''} onChange={(e) => setStore(index, { phone: e.target.value })} placeholder="+14155550142" />
            </label>
            <label className="playground-field">
              Maps URL <span className="optional-label">Directions link</span>
              <input value={st.mapsUrl ?? ''} onChange={(e) => setStore(index, { mapsUrl: e.target.value })} placeholder="https://www.google.com/maps/dir/?api=1&destination=..." />
            </label>
          </div>
        ))}
      </div>

      <label className="playground-field">
        Submit label <span className="optional-label">Optional</span>
        <input value={value.submitText ?? ''} onChange={(e) => onChange({ ...value, submitText: e.target.value })} placeholder="Reserve for pickup" />
      </label>
    </div>
  );
}

function stockToValue(a?: string): string {
  const bucket = stockBucket(a);
  return bucket === 'in' ? 'in_stock' : bucket;
}

const TEST_STORES: PickupStore[] = [
  { id: 's1', name: 'Union Square', distance: '0.4 mi', availability: 'in_stock', pickupEta: 'Ready in 2 hours', address: '333 Post St, San Francisco', hours: 'Open until 9:00 PM', phone: '+14155550142', mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=333%20Post%20St%2C%20San%20Francisco%2C%20CA%2094108' },
  { id: 's2', name: 'Marina District', distance: '2.1 mi', availability: 'low', pickupEta: 'Ready tomorrow 10 AM', address: '2190 Chestnut St, San Francisco', hours: 'Open until 8:00 PM', phone: '+14155550171', mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=2190%20Chestnut%20St%2C%20San%20Francisco%2C%20CA%2094123' },
  { id: 's3', name: 'Stonestown Galleria', distance: '5.6 mi', availability: 'out', address: '3251 20th Ave, San Francisco', hours: 'Open until 9:00 PM' },
];

/** Faithful preview: mirrors the Store Pickup LWC, including test-mode fallback + interactivity. */
export function RetailStorePickupPreview({
  value,
  accentColor,
}: {
  value: RetailStorePickupPayload;
  accentColor: string;
}) {
  const isTestMode = !(value.stores && value.stores.length);
  const title = (isTestMode ? 'Pick up in store' : value.title) || 'Pick up in store';
  const subtitle = isTestMode ? 'Ready today at a store near you' : value.subtitle;
  const product = isTestMode
    ? { name: 'Trailblazer Running Shoe', variant: 'Size 10 · Black', category: 'shoes' }
    : value.product;
  const stores = isTestMode ? TEST_STORES : value.stores;
  const submitText = (value.submitText && value.submitText.trim()) || 'Reserve for pickup';

  const [selectedId, setSelectedId] = useState<string>('');
  const [reserved, setReserved] = useState(false);
  const cat = productCategory(product?.category);
  const ProdIcon = productIcon(cat);
  const productImageUrl = retailProductImage(product?.imageUrl, product?.name);

  return (
    <div className="clt-live-preview store-pickup-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      <div className="asa-sp-intro">
        <div>
          {title && <h3 className="selector-title">{title}</h3>}
          {subtitle && <p className="asa-card-sub">{subtitle}</p>}
        </div>
      </div>

      <div className="asa-sp-map" aria-label={`${stores.length} nearby stores`}>
        <svg className="asa-sp-map-canvas" viewBox="0 0 440 168" aria-hidden="true">
          <rect width="440" height="168" fill="#edf1e9" />
          <path className="asa-sp-park" d="M0 0h132l-19 58-72 17L0 56z" />
          <g className="asa-sp-blocks">
            <path d="M151 0h91l-8 38-96 23z" /><path d="M263 0h91l-9 26-91 11z" /><path d="M374 0h66v39l-78-13z" />
            <path d="M50 88l74-18 32 40-91 24z" /><path d="M145 65l93-22 14 49-82 20z" /><path d="M270 42l72-10 23 54-96 8z" />
            <path d="M373 37l67 12v49l-60-10z" /><path d="M0 111l44-17 15 44-59 17z" /><path d="M73 140l87-23 31 51H65z" />
            <path d="M178 117l78-19 18 70h-77z" /><path d="M282 101l86-9 19 76H280z" /><path d="M385 96l55 10v62h-47z" />
          </g>
          <g className="asa-sp-streets">
            <path d="M-18 93L456 -18" /><path d="M-8 151L454 42" /><path d="M126 -22L211 190" /><path d="M244 -22L300 190" /><path d="M351 -22L397 190" />
          </g>
          <g className="asa-sp-street-centers">
            <path d="M-18 93L456 -18" /><path d="M-8 151L454 42" /><path d="M126 -22L211 190" /><path d="M244 -22L300 190" /><path d="M351 -22L397 190" />
          </g>
          <g className="asa-sp-map-labels">
            <text x="18" y="24">Union Square</text><text x="185" y="67" transform="rotate(-13 185 67)">Post St</text>
            <text x="294" y="130" transform="rotate(-13 294 130)">Geary St</text><text x="224" y="27" transform="rotate(75 224 27)">Powell St</text>
            <text x="362" y="55" transform="rotate(77 362 55)">Stockton St</text>
          </g>
        </svg>
        {stores.slice(0, 3).map((st, index) => (
          <span className={`asa-sp-map-pin p${index + 1}${stockBucket(st.availability) === 'out' ? ' is-out' : ''}`} key={st.id || index} aria-label={`${index + 1}. ${st.name}`}>
            {index + 1}
          </span>
        ))}
        <span className="asa-sp-map-caption"><b>{stores.filter((st) => stockBucket(st.availability) !== 'out').length} stores nearby</b><small>Union Square · San Francisco</small></span>
      </div>

      {product && product.name && (
        <div className="asa-sp-product">
          <span className="asa-sp-prod-thumb" style={{ '--rt-hue': productHue(cat) } as React.CSSProperties}>
            {productImageUrl ? <img src={productImageUrl} alt={product.name} /> : <span className="asa-sp-prod-glyph" aria-hidden="true"><ProdIcon /></span>}
          </span>
          <span className="asa-sp-prod-text">
            <span className="asa-sp-prod-name">{product.name}</span>
            {product.variant && <span className="asa-sp-prod-variant">{product.variant}</span>}
          </span>
        </div>
      )}

      <div className="asa-sp-list">
        {stores.map((st, index) => {
          const bucket = stockBucket(st.availability);
          const isOut = bucket === 'out';
          const id = st.id || `s-${index}`;
          const on = selectedId === id;
          const tel = telHref(st.phone);
          const mapsUrl = st.mapsUrl ? String(st.mapsUrl).trim() : '';
          return (
            <div className={`asa-sp-store is-${bucket}${index === 0 && !isOut ? ' is-best' : ''}${on ? ' is-selected' : ''}${isOut ? ' is-out' : ''}`} key={id}>
              <button
                type="button"
                className="asa-sp-pick"
                disabled={isOut}
                aria-pressed={on}
                onClick={() => setSelectedId(id)}
              >
                <span className="asa-sp-rank">{String(index + 1).padStart(2, '0')}</span>
                <span className="asa-sp-radio" aria-hidden="true">{on && <span className="asa-sp-radio-dot" />}</span>
                <span className="asa-sp-store-main">
                  <span className="asa-sp-store-head">
                    <span className="asa-sp-store-name">{st.name || 'Store'}</span>
                    <span className="asa-sp-store-aside">
                      {index === 0 && !isOut && <span className="asa-sp-best">Best match</span>}
                      {st.distance && <span className="asa-sp-dist">{st.distance}</span>}
                    </span>
                  </span>
                  <span className="asa-sp-meta">
                    <span className={`asa-sp-avail is-${bucket}`}><span className="asa-sp-avail-dot" aria-hidden="true" />{stockLabel(bucket)}</span>
                    {!isOut && st.pickupEta && <span className="asa-sp-eta"><Clock aria-hidden="true" />{st.pickupEta}</span>}
                  </span>
                  {st.address && <span className="asa-sp-line"><MapPin aria-hidden="true" />{st.address}</span>}
                  {st.hours && <span className="asa-sp-hours">{st.hours}</span>}
                </span>
              </button>
              {(mapsUrl || tel) && (
                <div className="asa-sp-links">
                  {mapsUrl && <a className="asa-sp-link" href={mapsUrl} target="_blank" rel="noopener noreferrer"><Navigation aria-hidden="true" />Directions</a>}
                  {tel && <a className="asa-sp-link" href={tel}><Phone aria-hidden="true" />Call</a>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="asa-sp-submit"
        disabled={!selectedId || reserved}
        onClick={() => setReserved(true)}
      >
        {reserved ? <><Check aria-hidden="true" /> Reserved for pickup</> : submitText}
      </button>
    </div>
  );
}
