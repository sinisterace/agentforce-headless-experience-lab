import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { TransactionEntry, FinServTransactionsPayload } from './payloads';
import { formatSignedAmount, formatTransactionDate } from './transactionFormat';

/**
 * Live preview for the ASA Financial Services · Recent Transactions CLT (DTO
 * field finServTransactionsJSON). Mirrors the deployed LWC "private-bank
 * statement": a monospace cash-flow readout (money out / money in), a
 * spend-by-category segmented meter + legend computed from the debits, and a
 * typographic statement ledger where each charge is tappable to dispute.
 * LWC-true fields: title, accountLabel?, transactions (object[] with id,
 * merchant, date, amount, currency?, category?, status?, disputable?),
 * disputeText?. Empty transactions drops into a test-mode fallback so it renders
 * even with no payload.
 */

const CATEGORY_COLORS: Record<string, string> = {
  groceries: '#15803d',
  dining: '#b45309',
  travel: '#1d4ed8',
  shopping: '#7c3aed',
  bills: '#0891b2',
  transfer: '#0d9488',
  entertainment: '#be185d',
  other: '#64748b',
};

const fmtMoney = (n: number, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  } catch {
    return `${currency} ${Number(n).toFixed(2)}`;
  }
};
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const catKey = (c?: string) => String(c || 'Other').toLowerCase();
const catColor = (c?: string) => CATEGORY_COLORS[catKey(c)] || CATEGORY_COLORS.other;

export function FinServTransactionsPreview({
  value,
  accentColor,
}: {
  value: FinServTransactionsPayload;
  accentColor: string;
}) {
  const payloadTxns = Array.isArray(value.transactions) ? value.transactions : [];
  const isTestMode = payloadTxns.length === 0;
  const title = isTestMode ? 'Your recent transactions' : value.title;
  const accountLabel = isTestMode ? 'Everyday Checking ••1234' : value.accountLabel;
  const disputeText = value.disputeText || 'Dispute this charge';
  const transactions: TransactionEntry[] = isTestMode
    ? [
        { id: 'test-1', merchant: 'Whole Foods Market', date: '2026-08-09', amount: -84.23, currency: 'USD', category: 'Groceries', status: 'Posted' },
        { id: 'test-2', merchant: 'Delta Air Lines', date: '2026-08-07', amount: -412.6, currency: 'USD', category: 'Travel', status: 'Posted' },
        { id: 'test-3', merchant: 'Payroll Deposit', date: '2026-08-06', amount: 2450.0, currency: 'USD', category: 'Income', status: 'Posted', disputable: false },
        { id: 'test-4', merchant: 'Corner Bistro', date: '2026-08-05', amount: -56.8, currency: 'USD', category: 'Dining', status: 'Pending' },
      ]
    : payloadTxns;

  const currency = transactions.find((t) => t.currency)?.currency || 'USD';

  // Cash-flow + spend-by-category breakdown (debits only).
  let out = 0;
  let inc = 0;
  const byCat: Record<string, number> = {};
  transactions.forEach((t) => {
    const a = Number(t.amount) || 0;
    if (a < 0) {
      out += Math.abs(a);
      const c = catKey(t.category);
      byCat[c] = (byCat[c] || 0) + Math.abs(a);
    } else {
      inc += a;
    }
  });
  const total = out || 1;
  const breakdown = Object.keys(byCat)
    .sort((a, b) => byCat[b] - byCat[a])
    .slice(0, 5)
    .map((c, i) => ({
      key: `${c}-${i}`,
      label: titleCase(c),
      amountText: fmtMoney(byCat[c], currency),
      pct: Math.max(3, Math.round((byCat[c] / total) * 100)),
      color: CATEGORY_COLORS[c] || CATEGORY_COLORS.other,
    }));
  const moneyIn = inc > 0 ? `+${fmtMoney(inc, currency)}` : '';
  const count = `${transactions.length} ${transactions.length === 1 ? 'transaction' : 'transactions'}`;

  const [selected, setSelected] = useState<string>('');
  const toggle = (id: string, selectable: boolean) => {
    if (!selectable) return;
    setSelected((cur) => (cur === id ? '' : id));
  };

  return (
    <div className="clt-live-preview asa-fs" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {title && <h3 className="asa-fs-title">{title}</h3>}

      <div className="asa-fs-readout">
        <div className="asa-fs-flow">
          <span className="asa-fs-eyebrow">Money out</span>
          <span className="asa-fs-out">{fmtMoney(out, currency)}</span>
          {moneyIn && <span className="asa-fs-in">{moneyIn} in</span>}
        </div>
        <div className="asa-fs-acct">
          {accountLabel && <span className="asa-fs-acct-label">{accountLabel}</span>}
          <span className="asa-fs-count">{count}</span>
        </div>
      </div>

      {breakdown.length > 1 && (
        <div className="asa-fs-breakdown">
          <div className="asa-fs-meter">
            {breakdown.map((s) => (
              <span key={s.key} className="asa-fs-seg" style={{ width: `${s.pct}%`, background: s.color }} />
            ))}
          </div>
          <ul className="asa-fs-legend">
            {breakdown.map((s) => (
              <li key={s.key} className="asa-fs-leg">
                <span className="asa-fs-leg-dot" style={{ background: s.color }} aria-hidden="true" />
                <span className="asa-fs-leg-label">{s.label}</span>
                <span className="asa-fs-leg-amt">{s.amountText}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="asa-fs-ledger">
        <div className="asa-fs-ledger-head">
          <span className="asa-fs-ledger-eyebrow">Recent activity</span>
          <span className="asa-fs-ledger-hint">Tap a charge to dispute</span>
        </div>
        <div className="asa-fs-rows">
          {transactions.map((txn, index) => {
            const key = txn.id || `${txn.merchant}-${index}`;
            const selectable = txn.disputable !== false;
            const isSelected = selected === key;
            const isCredit = Number(txn.amount) > 0;
            const isPending = String(txn.status || '').toLowerCase() === 'pending';
            const color = catColor(txn.category);
            const rowClass = ['asa-fs-row', isSelected ? 'selected' : '', selectable ? '' : 'is-disabled'].filter(Boolean).join(' ');
            return (
              <button
                type="button"
                key={key}
                className={rowClass}
                onClick={() => toggle(key, selectable)}
                aria-pressed={isSelected}
                disabled={!selectable}
              >
                <span className={isSelected ? 'asa-fs-dot on' : 'asa-fs-dot'} aria-hidden="true" />
                <span className="asa-fs-meta">
                  <span className="asa-fs-merchant">
                    <span className="asa-fs-merchant-text">{txn.merchant}</span>
                    {isPending && <i className="asa-fs-badge">Pending</i>}
                  </span>
                  <span className="asa-fs-sub">
                    <span className="asa-fs-tag" style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
                      {txn.category || 'Other'}
                    </span>
                    <span className="asa-fs-date">{formatTransactionDate(txn.date)}</span>
                  </span>
                </span>
                <span className={isCredit ? 'asa-fs-amt is-credit' : 'asa-fs-amt'}>
                  {formatSignedAmount(Number(txn.amount), txn.currency || currency)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="submit-container">
          <button type="button" className="asa-fs-cta"><ShieldAlert /> {disputeText}</button>
        </div>
      )}
    </div>
  );
}
