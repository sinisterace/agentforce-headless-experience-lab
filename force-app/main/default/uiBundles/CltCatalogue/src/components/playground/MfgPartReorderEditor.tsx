import { useEffect, useState } from 'react';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import type { MfgPartReorderPayload } from './payloads';
import { MFG_PART_IMG, initialsOf, mfgImage, money } from './mfgFormat';

/**
 * Live preview for the ASA Manufacturing · Part Reorder CLT (DTO field
 * mfgPartReorderJSON). Shows ONE part with a stock bar, lead time, unit price,
 * an interactive quantity stepper (respecting min + increment + stock), and a
 * live subtotal. No part name drops the preview into a test-mode fallback so it
 * renders with no payload — mirroring the LWC.
 */

const TEST: MfgPartReorderPayload = {
  title: 'Reorder part',
  part: { name: 'Industrial I/O Controller', sku: 'IOC-4820-DIN', category: 'controller', imageUrl: '/resource/asaMfgIoController', unitPrice: 486, currency: 'USD', leadTime: 'Ships in 3–5 business days', inStock: 142, minOrder: 1, incrementStep: 1 },
  quantity: 2,
  submitText: 'Reorder',
};

/** Faithful preview: mirrors the Part Reorder LWC, including test-mode fallback + stepper + subtotal. */
export function MfgPartReorderPreview({ value, accentColor }: { value: MfgPartReorderPayload; accentColor: string }) {
  const isTestMode = !(value.part && value.part.name);
  const src = isTestMode ? TEST : value;
  const part = src.part || { name: 'Part' };
  const currency = part.currency || 'USD';
  const img = mfgImage(part.imageUrl, MFG_PART_IMG);
  const minOrder = Math.max(1, Number(part.minOrder) || 1);
  const step = Math.max(1, Number(part.incrementStep) || 1);
  const inStock = Number.isFinite(part.inStock as number) ? (part.inStock as number) : null;
  const maxQty = inStock !== null && inStock > 0 ? inStock : null;
  const hasUnit = Number.isFinite(part.unitPrice as number);

  const clamp = (q: number) => {
    let v = Math.round(q);
    if (v < minOrder) v = minOrder;
    if (maxQty !== null && v > maxQty) v = maxQty;
    return v;
  };
  const [qty, setQty] = useState(clamp(Number(src.quantity) || minOrder));
  useEffect(() => { setQty(clamp(Number(src.quantity) || minOrder)); /* eslint-disable-next-line */ }, [isTestMode, part.minOrder, part.inStock, src.quantity]);

  const low = inStock !== null && inStock <= 10 && inStock > 0;
  const out = inStock !== null && inStock <= 0;
  const stockText = out ? 'Out of stock' : inStock !== null ? `${inStock} in stock` : '';
  const pct = out ? 0 : inStock !== null ? Math.max(6, Math.min(100, (inStock / 150) * 100)) : 0;
  const subtotal = hasUnit ? money((part.unitPrice as number) * qty, currency) : '';
  const units = qty === 1 ? 'unit' : 'units';
  const ctaLabel = hasUnit ? `${(src.submitText || 'Reorder')} · ${subtotal}` : `${src.submitText || 'Reorder'} ${qty} ${units}`;

  return (
    <div className="clt-live-preview part-reorder-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add a part to preview your content</p>}
      <div className="asa-pr-head"><h3 className="selector-title">{(src.title && src.title.trim()) || 'Reorder part'}</h3></div>

      <div className="asa-pr-part">
        <span className="asa-pr-thumb">
          {img ? <img src={img} alt={part.name} /> : <span className="asa-pr-thumb-fallback" aria-hidden="true">{initialsOf(part.name)}</span>}
        </span>
        <span className="asa-pr-part-text">
          <span className="asa-pr-name">{part.name}</span>
          {part.sku && <span className="asa-pr-sku">SKU {part.sku}</span>}
          {hasUnit && <span className="asa-pr-unit">{money(part.unitPrice as number, currency)} each</span>}
        </span>
      </div>

      {inStock !== null && (
        <div className={`asa-pr-stock${out ? ' is-out' : low ? ' is-low' : ''}`}>
          <div className="asa-pr-stock-row">
            <span className="asa-pr-stock-text">{stockText}</span>
            {part.leadTime && <span className="asa-pr-lead">{part.leadTime}</span>}
          </div>
          <div className="asa-pr-stock-track"><span className="asa-pr-stock-fill" style={{ width: `${pct}%` }} /></div>
        </div>
      )}

      <div className="asa-pr-qtyrow">
        <span className="asa-pr-qty-label">Quantity</span>
        <div className="asa-pr-stepper">
          <button type="button" className="asa-pr-step" onClick={() => setQty((q) => clamp(q - step))} disabled={qty <= minOrder} aria-label="Decrease quantity"><Minus aria-hidden="true" /></button>
          <span className="asa-pr-qty-value">{qty}</span>
          <button type="button" className="asa-pr-step" onClick={() => setQty((q) => clamp(q + step))} disabled={maxQty !== null && qty + step > maxQty} aria-label="Increase quantity"><Plus aria-hidden="true" /></button>
        </div>
      </div>

      <button type="button" className="asa-pr-cta"><ShoppingCart aria-hidden="true" /> {ctaLabel}</button>
    </div>
  );
}
