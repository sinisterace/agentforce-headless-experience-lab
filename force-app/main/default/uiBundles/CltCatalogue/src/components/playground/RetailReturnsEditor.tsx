import { useState } from 'react';
import { Check } from 'lucide-react';
import type { RetailReturnsPayload, ReturnItem, ReturnReason } from './payloads';
import { formatMoney, productCategory, productHue, productIcon, retailProductImage } from './retailFormat';

/**
 * Live preview for the ASA Retail · Returns & Exchange CLT
 * (DTO field retailReturnsJSON). LWC-true fields: title, subtitle?, orderLabel?,
 * items (object[] of { id, name, sku?, variant?, price?, currency?, imageUrl?,
 * category? }), reasons (object[] of { id, label }), resolutions?
 * (object[] of { id, kind?, label, description? }), submitText?.
 *
 * The customer checks the items to return, picks one reason, and chooses a
 * resolution; the confirm button hands the whole selection back to the agent.
 * An empty item list drops the preview into a test-mode fallback so it renders
 * with no payload — mirroring the LWC.
 */


const TEST_ITEMS: ReturnItem[] = [
  { id: 'i1', name: 'Trailblazer Running Shoe', sku: 'VR3-BLK-10', variant: 'Size 10 · Black', price: 128, category: 'shoes' },
  { id: 'i2', name: 'Everyday Merino Crew', sku: 'EMC-NVY-M', variant: 'Medium · Navy', price: 68, category: 'apparel' },
];
const TEST_REASONS: ReturnReason[] = [
  { id: 'too_small', label: "Too small" },
  { id: 'too_large', label: 'Too large' },
  { id: 'changed_mind', label: 'Changed my mind' },
  { id: 'defective', label: 'Arrived damaged' },
  { id: 'wrong_item', label: 'Wrong item' },
];
/** Faithful preview: mirrors the Returns LWC, including test-mode fallback + interactivity. */
export function RetailReturnsPreview({
  value,
  accentColor,
}: {
  value: RetailReturnsPayload;
  accentColor: string;
}) {
  const isTestMode = !(value.items && value.items.length);
  const title = (isTestMode ? 'Start a return' : value.title) || 'Start a return';
  const subtitle = isTestMode ? "Choose what you'd like to send back" : value.subtitle;
  const orderLabel = isTestMode ? 'Order #4821 · Mar 2' : value.orderLabel;
  const items = isTestMode ? TEST_ITEMS : value.items;
  const reasons = isTestMode ? TEST_REASONS : value.reasons ?? [];
  const submitText = (value.submitText && value.submitText.trim()) || 'Continue return';

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [reasonId, setReasonId] = useState<string>('');
  const [done, setDone] = useState(false);

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const ready = selectedCount > 0 && !!reasonId;

  return (
    <div className="clt-live-preview returns-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {title && <h3 className="selector-title">{title}</h3>}
      {(subtitle || orderLabel) && (
        <p className="asa-card-sub">{[subtitle, orderLabel].filter(Boolean).join(' · ')}</p>
      )}

      <div className="asa-rt-guide" aria-label="Return progress">
        <span className={selectedCount > 0 ? 'is-done' : 'is-active'}><i>1</i><b>Items</b></span>
        <span className={reasonId ? 'is-done' : selectedCount > 0 ? 'is-active' : ''}><i>2</i><b>Reason</b></span>
        <span className={done ? 'is-done' : reasonId ? 'is-active' : ''}><i>3</i><b>Review</b></span>
      </div>

      <div className="asa-rt-items">
        {items.map((it, index) => {
          const cat = productCategory(it.category);
          const Icon = productIcon(cat);
          const id = it.id || `i-${index}`;
          const on = !!selected[id];
          const imageUrl = retailProductImage(it.imageUrl, it.name);
          return (
            <button
              type="button"
              className={on ? 'asa-rt-item is-selected' : 'asa-rt-item'}
              key={id}
              aria-pressed={on}
              onClick={() => setSelected((s) => ({ ...s, [id]: !s[id] }))}
            >
              <span className="asa-rt-thumb" style={{ '--rt-hue': productHue(cat) } as React.CSSProperties}>
                {imageUrl ? <img src={imageUrl} alt={it.name} /> : <span className="asa-rt-glyph" aria-hidden="true"><Icon /></span>}
              </span>
              <span className="asa-rt-item-text">
                <span className="asa-rt-item-name">{it.name || 'Item'}</span>
                {it.variant && <span className="asa-rt-item-variant">{it.variant}</span>}
                {it.sku && <span className="asa-rt-item-sku">SKU {it.sku}</span>}
              </span>
              {typeof it.price === 'number' && <span className="asa-rt-item-price">{formatMoney(it.price, it.currency || 'USD')}</span>}
              <span className={on ? 'asa-rt-check is-on' : 'asa-rt-check'} aria-hidden="true">{on && <Check />}</span>
            </button>
          );
        })}
      </div>

      {reasons.length > 0 && (
        <div className="asa-rt-block">
          <span className="asa-rt-legend">Reason for return</span>
          <div className="asa-rt-reasons">
            {reasons.map((r, index) => {
              const id = r.id || `r-${index}`;
              return (
                <button
                  type="button"
                  className={reasonId === id ? 'asa-rt-reason is-on' : 'asa-rt-reason'}
                  key={id}
                  aria-pressed={reasonId === id}
                  onClick={() => setReasonId(id)}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={`asa-rt-summary${ready ? ' is-ready' : ''}`} aria-live="polite">
        <span className="asa-rt-summary-count"><b>{String(selectedCount).padStart(2, '0')}</b><small>items selected</small></span>
        <span className="asa-rt-summary-state">{ready ? 'Return is ready to review' : selectedCount ? 'Choose a reason to continue' : 'Select items from this order'}</span>
      </div>

      <button
        type="button"
        className="asa-rt-submit"
        disabled={!ready || done}
        onClick={() => setDone(true)}
      >
        {done ? (
          <><Check aria-hidden="true" /> Return started</>
        ) : (
          selectedCount > 0 ? `${submitText} · ${selectedCount} item${selectedCount > 1 ? 's' : ''}` : submitText
        )}
      </button>
    </div>
  );
}
