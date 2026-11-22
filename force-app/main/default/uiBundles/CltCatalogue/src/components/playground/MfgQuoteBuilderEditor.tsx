import { useEffect, useRef, useState } from 'react';
import { Minus, Package, Plus } from 'lucide-react';
import type { MfgQuoteBuilderPayload, QuoteLineItem } from './payloads';
import { money } from './mfgFormat';

/**
 * Live preview for the ASA Manufacturing · Quote Builder CLT (DTO field
 * mfgQuoteBuilderJSON). A cart-style quote: a header with the ship-to / bill-to
 * accounts, a line-item table where each row carries a live quantity stepper
 * (add / remove qty) plus an "Add item" action, and an order-details block with
 * a PO field, subtotal, an on-demand shipping estimate, an acknowledgement, and
 * the request-quote action. An empty line-item list drops the preview into a
 * test-mode fallback — mirroring the LWC.
 */

const TEST: MfgQuoteBuilderPayload = {
  title: 'Quote',
  cartId: 'QT-00042',
  statusLabel: 'Draft quote',
  shipTo: 'Rivera Robotics · Plant 2',
  shipToId: '#PL-2-0192',
  billTo: 'Rivera Manufacturing, Inc.',
  currency: 'USD',
  lineItems: [
    { id: 'frame', itemNumber: 'TB-9000-FRM', description: 'Assembly cell frame, powder-coated steel', uom: 'EA', unitPrice: 4800, quantity: 2 },
    { id: 'plc', itemNumber: 'PLC-ADV-24', description: 'Advanced PLC + HMI control package', uom: 'EA', unitPrice: 5400, quantity: 1 },
    { id: 'conv', itemNumber: 'CONV-3M', description: 'Conveyor belt module, 3 m span', uom: 'EA', unitPrice: 1260, quantity: 3 },
    { id: 'safety', itemNumber: 'SAF-LC-KIT', description: 'Light-curtain safety kit', uom: 'KIT', unitPrice: 980, quantity: 1 },
  ],
  poLabel: 'Purchase Order #',
  poPlaceholder: 'Enter PO number…',
  acknowledgeText: 'I acknowledge that pricing is an estimate pending a formal quote and confirm the configuration is correct.',
  submitText: 'Request quote',
  secondaryText: 'Save & close',
};

const DEFAULT_ACK = 'I acknowledge that pricing is an estimate pending a formal quote and confirm the configuration is correct.';

/** Faithful preview: mirrors the Quote Builder LWC, including test-mode fallback + dynamic quantities. */
export function MfgQuoteBuilderPreview({ value, accentColor }: { value: MfgQuoteBuilderPayload; accentColor: string }) {
  const valid = (value.lineItems ?? []).filter((li) => li && li.description);
  const isTestMode = valid.length === 0;
  const src = isTestMode ? TEST : value;
  const currency = src.currency || 'USD';
  const seed = (isTestMode ? TEST.lineItems : valid).map((li, i) => ({
    ...li,
    id: li.id || `li-${i}`,
    quantity: Math.max(1, Number(li.quantity) || 1),
  }));

  const [lines, setLines] = useState<QuoteLineItem[]>(seed);
  const [po, setPo] = useState('');
  const [fees, setFees] = useState<number | null>(null);
  const [agree, setAgree] = useState(false);
  const nextId = useRef(seed.length);

  // Re-seed when the payload identity changes (widget switch / reset).
  const seedKey = JSON.stringify(seed.map((l) => [l.id, l.unitPrice, l.quantity]));
  useEffect(() => {
    setLines(seed);
    setPo('');
    setFees(null);
    setAgree(false);
    nextId.current = seed.length;
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [seedKey, isTestMode]);

  const setQty = (id: string, delta: number) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, quantity: Math.max(1, (Number(l.quantity) || 1) + delta) } : l)));
  const removeLine = (id: string) => setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.id !== id) : ls));
  const addItem = () => {
    const base = lines[lines.length - 1];
    const id = `li-new-${nextId.current++}`;
    setLines((ls) => [...ls, base ? { ...base, id, quantity: 1 } : { id, description: 'New line item', uom: 'EA', unitPrice: 0, quantity: 1 }]);
    setFees(null);
  };

  const subtotal = lines.reduce((sum, l) => sum + (Number(l.unitPrice) || 0) * (Number(l.quantity) || 0), 0);
  const calcFees = () => setFees(Math.max(150, Math.round(subtotal * 0.035)));
  const total = subtotal + (fees || 0);

  const title = (src.title && src.title.trim()) || 'Quote';
  const cartId = (src.cartId || '').trim();
  const poLabel = (src.poLabel || 'Purchase Order #').trim();
  const acknowledgeText = src.acknowledgeText === '' ? '' : (src.acknowledgeText || DEFAULT_ACK).trim();
  const submitText = (src.submitText && src.submitText.trim()) || 'Request quote';
  const secondaryText = (src.secondaryText || '').trim();

  return (
    <div className="clt-live-preview quote-builder-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>

      {/* Header card — cart id + ship-to / bill-to */}
      <div className="asa-qb-cart">
        <span className="asa-qb-cart-ico" aria-hidden="true"><Package /></span>
        <div className="asa-qb-cart-body">
          <div className="asa-qb-cart-top">
            <h3 className="selector-title">{cartId || title}</h3>
            {src.statusLabel && <span className="asa-qb-cart-pill">{src.statusLabel}</span>}
          </div>
          {src.shipTo && (
            <p className="asa-qb-cart-line">
              <span className="asa-qb-cart-key">Ship-To:</span> <span className="asa-qb-cart-val">{src.shipTo}</span>
            </p>
          )}
          {(src.shipToId || src.billTo) && (
            <p className="asa-qb-cart-line asa-qb-cart-sub">
              {src.shipToId && <span className="asa-qb-cart-id">{src.shipToId}</span>}
              {src.shipToId && src.billTo && <span className="asa-qb-cart-dot"> · </span>}
              {src.billTo && (<><span className="asa-qb-cart-key">Bill-To:</span> <span className="asa-qb-cart-val">{src.billTo}</span></>)}
            </p>
          )}
        </div>
      </div>

      {/* Line items card */}
      <div className="asa-qb-lines">
        <div className="asa-qb-lines-head">
          <span className="asa-qb-section-title">Line items</span>
          <button type="button" className="asa-qb-additem" onClick={addItem}><Plus aria-hidden="true" /> Add item</button>
        </div>
        <div className="asa-qb-table">
          <div className="asa-qb-thead" aria-hidden="true">
            <span>Item #</span>
            <span>Description</span>
            <span className="asa-qb-t-right">Qty</span>
          </div>
          {lines.map((l) => {
            const qty = Number(l.quantity) || 1;
            const lineTotal = (Number(l.unitPrice) || 0) * qty;
            return (
              <div className="asa-qb-trow" key={l.id}>
                <span className="asa-qb-tnum">{l.itemNumber || '—'}</span>
                <span className="asa-qb-tdesc">
                  <span className="asa-qb-tdesc-name">{l.description}</span>
                  <span className="asa-qb-tmeta">
                    {l.uom && <span className="asa-qb-tuom">{l.uom}</span>}
                    {(Number(l.unitPrice) || 0) > 0 && <span className="asa-qb-tunit">{money(Number(l.unitPrice), currency, 2)} ea</span>}
                  </span>
                </span>
                <span className="asa-qb-tqty">
                  <span className="asa-qb-stepper">
                    <button type="button" className="asa-qb-step" onClick={() => (qty <= 1 ? removeLine(l.id) : setQty(l.id, -1))} aria-label="Decrease quantity"><Minus aria-hidden="true" /></button>
                    <span className="asa-qb-qty-value">{qty}</span>
                    <button type="button" className="asa-qb-step" onClick={() => setQty(l.id, 1)} aria-label="Increase quantity"><Plus aria-hidden="true" /></button>
                  </span>
                  {lineTotal > 0 && <span className="asa-qb-tline">{money(lineTotal, currency, 2)}</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order details card */}
      <div className="asa-qb-details">
        <span className="asa-qb-section-title">Order details</span>
        <label className="asa-qb-po">
          <span className="asa-qb-po-label">{poLabel}</span>
          <input className="asa-qb-po-input" type="text" placeholder={src.poPlaceholder || 'Enter PO number…'} value={po} onChange={(e) => setPo(e.target.value)} />
        </label>

        <div className="asa-qb-sum">
          <div className="asa-qb-sum-row">
            <span className="asa-qb-sum-key">Subtotal</span>
            <span className="asa-qb-sum-val">{money(subtotal, currency, 2)}</span>
          </div>
          <div className="asa-qb-sum-row">
            <span className="asa-qb-sum-key">Shipping &amp; Handling</span>
            {fees == null ? (
              <span className="asa-qb-sum-fees">
                <span className="asa-qb-sum-dash">{src.shippingText || '—'}</span>
                <button type="button" className="asa-qb-calc" onClick={calcFees}>Calculate fees</button>
              </span>
            ) : (
              <span className="asa-qb-sum-val">{money(fees, currency, 2)}</span>
            )}
          </div>
          {fees != null && (
            <div className="asa-qb-sum-row asa-qb-sum-total">
              <span className="asa-qb-sum-key">Estimated total</span>
              <span className="asa-qb-sum-val">{money(total, currency, 2)}</span>
            </div>
          )}
        </div>

        {acknowledgeText && (
          <label className="asa-qb-ack">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>{acknowledgeText}</span>
          </label>
        )}

        <div className="asa-qb-actions">
          {secondaryText && <button type="button" className="asa-qb-secondary">{secondaryText}</button>}
          <button type="button" className="asa-qb-submit" disabled={!!acknowledgeText && !agree}>{submitText}</button>
        </div>
      </div>
    </div>
  );
}
