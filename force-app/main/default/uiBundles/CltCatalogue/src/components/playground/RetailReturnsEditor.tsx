import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from 'lucide-react';
import type { RetailReturnsPayload, ReturnItem, ReturnReason, ReturnResolution } from './payloads';
import { formatMoney, productCategory, productHue, productIcon, resolutionKind, retailProductImage } from './retailFormat';

/**
 * Build/Input editor + live preview for the ASA Retail · Returns & Exchange CLT
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

const CATEGORIES = ['apparel', 'shoes', 'electronics', 'beauty', 'home', 'grocery', 'accessories', 'outdoors', 'toys', 'general'];
const RESOLUTION_KINDS = ['refund', 'exchange', 'credit'];

export function RetailReturnsEditor({
  value,
  onChange,
}: {
  value: RetailReturnsPayload;
  onChange: (next: RetailReturnsPayload) => void;
}) {
  const items = value.items ?? [];
  const reasons = value.reasons ?? [];
  const resolutions = value.resolutions ?? [];

  const setItem = (index: number, patch: Partial<ReturnItem>) => {
    const next = items.slice();
    next[index] = { ...next[index], ...patch };
    onChange({ ...value, items: next });
  };
  const addItem = () =>
    onChange({ ...value, items: [...items, { id: `i-${items.length + 1}`, name: 'New item', category: 'general' }] });
  const removeItem = (index: number) => onChange({ ...value, items: items.filter((_, i) => i !== index) });
  const moveItem = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = items.slice();
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...value, items: next });
  };

  const setReason = (index: number, patch: Partial<ReturnReason>) => {
    const next = reasons.slice();
    next[index] = { ...next[index], ...patch };
    onChange({ ...value, reasons: next });
  };
  const addReason = () => onChange({ ...value, reasons: [...reasons, { id: `r-${reasons.length + 1}`, label: 'New reason' }] });
  const removeReason = (index: number) => onChange({ ...value, reasons: reasons.filter((_, i) => i !== index) });

  const setResolution = (index: number, patch: Partial<ReturnResolution>) => {
    const next = resolutions.slice();
    next[index] = { ...next[index], ...patch };
    onChange({ ...value, resolutions: next });
  };
  const addResolution = () => onChange({ ...value, resolutions: [...resolutions, { id: `x-${resolutions.length + 1}`, kind: 'refund', label: 'New resolution' }] });
  const removeResolution = (index: number) => onChange({ ...value, resolutions: resolutions.filter((_, i) => i !== index) });
  const num = (raw: string): number | undefined => (raw.trim() === '' ? undefined : Number(raw));

  return (
    <div className="playground-editor">
      <label className="playground-field">
        Title
        <input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="Start a return" />
      </label>
      <label className="playground-field">
        Subtitle <span className="optional-label">Optional</span>
        <input value={value.subtitle ?? ''} onChange={(e) => onChange({ ...value, subtitle: e.target.value })} placeholder="Choose what you'd like to send back" />
      </label>
      <label className="playground-field">
        Order label <span className="optional-label">Optional</span>
        <input value={value.orderLabel ?? ''} onChange={(e) => onChange({ ...value, orderLabel: e.target.value })} placeholder="Order #4821 · Mar 2" />
      </label>

      <div className="playground-list">
        <div className="playground-list-head">
          <span>Items</span>
          <button type="button" className="playground-add" onClick={addItem}><Plus aria-hidden="true" /> Add item</button>
        </div>
        {items.length === 0 && <p className="playground-empty">No items — the component shows sample test data until you add one.</p>}
        {items.map((it, index) => (
          <div className="playground-card" key={index}>
            <div className="playground-card-head">
              <strong>Item {index + 1}</strong>
              <span className="playground-card-actions">
                <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} aria-label="Move up"><ArrowUp aria-hidden="true" /></button>
                <button type="button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} aria-label="Move down"><ArrowDown aria-hidden="true" /></button>
                <button type="button" onClick={() => removeItem(index)} aria-label="Remove item"><Trash2 aria-hidden="true" /></button>
              </span>
            </div>
            <label className="playground-field">
              Name
              <input value={it.name} onChange={(e) => setItem(index, { name: e.target.value })} placeholder="Trailblazer Running Shoe" />
            </label>
            <label className="playground-field">
              Variant <span className="optional-label">Optional</span>
              <input value={it.variant ?? ''} onChange={(e) => setItem(index, { variant: e.target.value })} placeholder="Size 10 · Black" />
            </label>
            <label className="playground-field">
              SKU <span className="optional-label">Optional</span>
              <input value={it.sku ?? ''} onChange={(e) => setItem(index, { sku: e.target.value })} placeholder="TR3-BLK-10" />
            </label>
            <label className="playground-field">
              Price <span className="optional-label">Optional</span>
              <input type="number" value={it.price ?? ''} onChange={(e) => setItem(index, { price: num(e.target.value) })} placeholder="128.00" />
            </label>
            <div className="playground-field">
              <span>Category</span>
              <select value={productCategory(it.category)} onChange={(e) => setItem(index, { category: e.target.value })}>
                {CATEGORIES.map((c) => <option value={c} key={c}>{c}</option>)}
              </select>
            </div>
            <label className="playground-field">
              Image URL <span className="optional-label">blank → category tile</span>
              <input value={it.imageUrl ?? ''} onChange={(e) => setItem(index, { imageUrl: e.target.value })} placeholder="https://… or /resource/Name" />
            </label>
          </div>
        ))}
      </div>

      <div className="playground-list">
        <div className="playground-list-head">
          <span>Reasons</span>
          <button type="button" className="playground-add" onClick={addReason}><Plus aria-hidden="true" /> Add reason</button>
        </div>
        {reasons.map((r, index) => (
          <div className="playground-card" key={index}>
            <div className="playground-card-head">
              <strong>Reason {index + 1}</strong>
              <span className="playground-card-actions">
                <button type="button" onClick={() => removeReason(index)} aria-label="Remove reason"><Trash2 aria-hidden="true" /></button>
              </span>
            </div>
            <label className="playground-field">
              Label
              <input value={r.label} onChange={(e) => setReason(index, { label: e.target.value })} placeholder="Too small" />
            </label>
          </div>
        ))}
      </div>

      <div className="playground-list">
        <div className="playground-list-head">
          <span>Resolutions <span className="optional-label">blank → refund/exchange/credit</span></span>
          <button type="button" className="playground-add" onClick={addResolution}><Plus aria-hidden="true" /> Add resolution</button>
        </div>
        {resolutions.map((x, index) => (
          <div className="playground-card" key={index}>
            <div className="playground-card-head">
              <strong>Resolution {index + 1}</strong>
              <span className="playground-card-actions">
                <button type="button" onClick={() => removeResolution(index)} aria-label="Remove resolution"><Trash2 aria-hidden="true" /></button>
              </span>
            </div>
            <div className="playground-field">
              <span>Kind</span>
              <select value={resolutionKind(x.kind)} onChange={(e) => setResolution(index, { kind: e.target.value })}>
                {RESOLUTION_KINDS.map((k) => <option value={k} key={k}>{k}</option>)}
              </select>
            </div>
            <label className="playground-field">
              Label
              <input value={x.label} onChange={(e) => setResolution(index, { label: e.target.value })} placeholder="Refund" />
            </label>
            <label className="playground-field">
              Description <span className="optional-label">Optional</span>
              <input value={x.description ?? ''} onChange={(e) => setResolution(index, { description: e.target.value })} placeholder="Back to your original payment" />
            </label>
          </div>
        ))}
      </div>

      <label className="playground-field">
        Submit label <span className="optional-label">Optional</span>
        <input value={value.submitText ?? ''} onChange={(e) => onChange({ ...value, submitText: e.target.value })} placeholder="Continue return" />
      </label>
    </div>
  );
}

const TEST_ITEMS: ReturnItem[] = [
  { id: 'i1', name: 'Trailblazer Running Shoe', sku: 'TR3-BLK-10', variant: 'Size 10 · Black', price: 128, category: 'shoes' },
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
