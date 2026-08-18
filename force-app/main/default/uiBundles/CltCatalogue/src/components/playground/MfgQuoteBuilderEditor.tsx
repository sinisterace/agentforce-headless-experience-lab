import { useEffect, useState } from 'react';
import { FileText, Minus, Plus } from 'lucide-react';
import type { MfgQuoteBuilderPayload } from './payloads';
import { money } from './mfgFormat';

/**
 * Live preview for the ASA Manufacturing · Quote Builder CLT (DTO field
 * mfgQuoteBuilderJSON). Configure-to-order: single-select option chips per group
 * (each carrying a price delta), a quantity stepper, and a live estimated total.
 * An empty option-group list drops the preview into a test-mode fallback —
 * mirroring the LWC.
 */

const TEST: MfgQuoteBuilderPayload = {
  title: 'Configure your quote',
  product: 'TB-9000 Assembly Cell',
  currency: 'USD',
  basePrice: 48000,
  optionGroups: [
    { id: 'material', label: 'Frame material', selectedId: 'steel', options: [{ id: 'steel', label: 'Powder-coated steel', priceDelta: 0 }, { id: 'stainless', label: 'Stainless 304', priceDelta: 3200, detail: 'Washdown-rated' }] },
    { id: 'controls', label: 'Control package', options: [{ id: 'standard', label: 'Standard PLC', priceDelta: 0 }, { id: 'advanced', label: 'Advanced PLC + HMI', priceDelta: 5400 }] },
    { id: 'warranty', label: 'Warranty', options: [{ id: '1yr', label: '1 year', priceDelta: 0 }, { id: '3yr', label: '3 years', priceDelta: 2600 }, { id: '5yr', label: '5 years', priceDelta: 4200 }] },
  ],
  quantity: 1,
  submitText: 'Request quote',
};

/** Faithful preview: mirrors the Quote Builder LWC, including test-mode fallback + live estimate. */
export function MfgQuoteBuilderPreview({ value, accentColor }: { value: MfgQuoteBuilderPayload; accentColor: string }) {
  const validGroups = (value.optionGroups ?? []).filter((g) => g && g.label && Array.isArray(g.options) && g.options.length > 0);
  const isTestMode = validGroups.length === 0;
  const src = isTestMode ? TEST : value;
  const currency = src.currency || 'USD';
  const basePrice = Number(src.basePrice) || 0;
  const groups = (src.optionGroups ?? []).filter((g) => g && g.label && Array.isArray(g.options) && g.options.length > 0);
  const minQuantity = Math.max(1, Number(src.minQuantity) || 1);

  const seedSelection = () => {
    const sel: Record<string, string> = {};
    groups.forEach((g) => {
      const valid = g.options.some((o) => o.id === g.selectedId);
      sel[g.id] = valid ? (g.selectedId as string) : g.options[0].id;
    });
    return sel;
  };
  const [selection, setSelection] = useState<Record<string, string>>(seedSelection);
  const [qty, setQty] = useState(Math.max(minQuantity, Number(src.quantity) || minQuantity));
  // Re-seed when the payload identity changes (widget switch / reset).
  const seedKey = JSON.stringify(groups.map((g) => [g.id, g.options.map((o) => o.id)])) + `|${src.quantity}`;
  useEffect(() => { setSelection(seedSelection()); setQty(Math.max(minQuantity, Number(src.quantity) || minQuantity)); /* eslint-disable-next-line */ }, [seedKey, isTestMode]);

  const deltaText = (d?: number) => (d && d > 0 ? `+${money(d, currency, 0)}` : d && d < 0 ? `−${money(Math.abs(d), currency, 0)}` : 'Included');
  let unit = basePrice;
  groups.forEach((g) => {
    const opt = g.options.find((o) => o.id === selection[g.id]);
    if (opt) unit += Number(opt.priceDelta) || 0;
  });
  const total = unit * qty;
  const estimateNote = qty > 1 ? `${money(unit, currency, 0)} each · qty ${qty}` : 'Estimated · excludes tax & freight';

  return (
    <div className="clt-live-preview quote-builder-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add option groups to preview your content</p>}
      <div className="asa-qb-head">
        <h3 className="selector-title">{(src.title && src.title.trim()) || 'Configure your quote'}</h3>
        {src.product && <p className="asa-qb-product">{src.product}{basePrice > 0 && <> · <span className="asa-qb-base">Base {money(basePrice, currency, 0)}</span></>}</p>}
      </div>

      <div className="asa-qb-groups">
        {groups.map((g) => (
          <div key={g.id} className="asa-qb-group">
            <span className="asa-qb-group-label">{g.label}</span>
            <div className="asa-qb-chips">
              {g.options.map((o) => {
                const selected = selection[g.id] === o.id;
                return (
                  <button key={o.id} type="button" className={selected ? 'asa-qb-chip is-selected' : 'asa-qb-chip'} onClick={() => setSelection((s) => ({ ...s, [g.id]: o.id }))}>
                    <span className="asa-qb-chip-main">
                      <span className="asa-qb-chip-label">{o.label}</span>
                      {o.detail && <span className="asa-qb-chip-detail">{o.detail}</span>}
                    </span>
                    <span className="asa-qb-chip-delta">{deltaText(o.priceDelta)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="asa-qb-qtyrow">
        <span className="asa-qb-qty-label">Quantity</span>
        <div className="asa-qb-stepper">
          <button type="button" className="asa-qb-step" onClick={() => setQty((q) => Math.max(minQuantity, q - 1))} disabled={qty <= minQuantity} aria-label="Decrease quantity"><Minus aria-hidden="true" /></button>
          <span className="asa-qb-qty-value">{qty}</span>
          <button type="button" className="asa-qb-step" onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity"><Plus aria-hidden="true" /></button>
        </div>
      </div>

      <div className="asa-qb-estimate">
        <span className="asa-qb-est-label">Estimated total</span>
        <span className="asa-qb-est-value">{money(total, currency, 0)}</span>
        <span className="asa-qb-est-note">{estimateNote}</span>
      </div>

      <button type="button" className="asa-qb-cta"><FileText aria-hidden="true" /> {(src.submitText && src.submitText.trim()) || 'Request quote'}</button>
    </div>
  );
}
