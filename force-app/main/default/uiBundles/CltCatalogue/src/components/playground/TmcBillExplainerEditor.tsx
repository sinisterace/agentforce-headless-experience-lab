import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Check } from 'lucide-react';
import type { TmcBillExplainerPayload } from './payloads';
import { BILL_COLORS, formatMoney, normBillCategory } from './tmcFormat';

const TEST_BILL: TmcBillExplainerPayload = {
  title: 'Your September bill',
  currency: 'USD',
  total: 118.4,
  dueDateText: 'Due Sep 28',
  periodText: 'Sep 1 – Sep 30',
  items: [
    { id: 'plan', label: 'Unlimited Plus plan', amount: 70, category: 'plan' },
    { id: 'device', label: 'iPhone installment', amount: 27.08, category: 'device' },
    { id: 'stream', label: 'Streaming add-on', amount: 9.99, category: 'streaming' },
    { id: 'taxes', label: 'Taxes & fees', amount: 11.33, category: 'taxes' },
  ],
  deltaAmount: 12.4,
  deltaText: 'You added the Streaming add-on this cycle.',
  note: 'Autopay is on. This amount will be charged automatically.',
  submitText: 'Pay now',
  secondaryText: 'Set up autopay',
};

/** Faithful preview: mirrors the Bill Explainer LWC, including test-mode fallback + delta/chart logic. */
export function TmcBillExplainerPreview({
  value,
  accentColor,
}: {
  value: TmcBillExplainerPayload;
  accentColor: string;
}) {
  const rawItems = (value.items ?? []).filter((i) => i && i.label && Number.isFinite(i.amount));
  const isTestMode = rawItems.length === 0 && !Number.isFinite(value.total as number);
  const src = isTestMode ? TEST_BILL : value;
  const title = (src.title && src.title.trim()) || 'Your bill';
  const currency = src.currency || 'USD';
  const items = (src.items ?? []).filter((i) => i && i.label && Number.isFinite(i.amount));
  const summed = items.reduce((acc, i) => acc + i.amount, 0);
  const total = Number.isFinite(src.total as number) ? (src.total as number) : summed;

  const decorated = items.map((i, idx) => {
    const cat = normBillCategory(i.category);
    const isCredit = cat === 'discount' || i.amount < 0;
    return { ...i, cat, isCredit, abs: Math.abs(i.amount), key: i.id || `it-${idx}` };
  });
  const charges = decorated.filter((i) => !i.isCredit && i.abs > 0);
  const chargeSum = charges.reduce((acc, i) => acc + i.abs, 0) || 1;

  const delta = src.deltaAmount;
  const hasDeltaNum = Number.isFinite(delta as number) && (delta as number) !== 0;
  const deltaUp = hasDeltaNum && (delta as number) > 0;
  const deltaClass = hasDeltaNum ? (deltaUp ? 'is-up' : 'is-down') : src.deltaText ? 'is-flat' : '';
  const showDelta = hasDeltaNum || !!src.deltaText;

  const [paid, setPaid] = useState(false);
  const [autopay, setAutopay] = useState(false);

  return (
    <div className="clt-live-preview bill-explainer-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add items to preview your content</p>}
      <div className="asa-be-head">
        <h3 className="selector-title">{title}</h3>
        {src.periodText && <span className="asa-be-period">{src.periodText}</span>}
      </div>

      <div className="asa-be-total">
        <span className="asa-be-total-amt">{formatMoney(total, currency)}</span>
        {src.dueDateText && <span className="asa-be-due">{src.dueDateText}</span>}
      </div>

      {charges.length > 1 && (
        <div className="asa-be-bar">
          {charges.map((i, idx) => {
            const color = BILL_COLORS[i.cat];
            const pct = Math.max(3, (i.abs / chargeSum) * 100);
            return <span key={idx} className="asa-be-seg" style={{ width: `${pct.toFixed(2)}%`, background: color }} />;
          })}
        </div>
      )}

      <ul className="asa-be-items">
        {decorated.map((i) => (
          <li key={i.key} className="asa-be-item">
            <span className="asa-be-dot" style={{ background: BILL_COLORS[i.cat] }} />
            <span className="asa-be-label">{i.label}</span>
            <span className={`asa-be-amt${i.isCredit ? ' is-credit' : ''}`}>
              {i.isCredit ? `−${formatMoney(i.abs, currency)}` : formatMoney(i.amount, currency)}
            </span>
          </li>
        ))}
      </ul>

      {showDelta && (
        <div className={`asa-be-delta ${deltaClass}`}>
          <span className="asa-be-trend" aria-hidden="true">{deltaUp ? <ArrowUpRight /> : <ArrowDownRight />}</span>
          <span className="asa-be-delta-body">
            {hasDeltaNum && (
              <span className="asa-be-delta-lead">
                <b className="asa-be-delta-amt">{formatMoney(Math.abs(delta as number), currency)}</b> {deltaUp ? 'more than last month' : 'less than last month'}
              </span>
            )}
            {src.deltaText && <span className="asa-be-delta-reason">{src.deltaText}</span>}
          </span>
        </div>
      )}

      {src.note && <p className="asa-be-note">{src.note}</p>}

      {src.submitText && (
        <button type="button" className="asa-be-cta" disabled={paid} onClick={() => setPaid(true)}>
          {paid ? <><Check aria-hidden="true" /> Payment started</> : src.submitText}
        </button>
      )}
      {src.secondaryText && (
        <button type="button" className="asa-be-cta-secondary" disabled={autopay} onClick={() => setAutopay(true)}>
          {autopay ? 'Autopay requested' : src.secondaryText}
        </button>
      )}
    </div>
  );
}
