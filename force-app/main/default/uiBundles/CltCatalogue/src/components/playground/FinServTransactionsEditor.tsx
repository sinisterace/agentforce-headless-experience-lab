import { useState } from 'react';
import { Check, FileText } from 'lucide-react';
import type { TransactionEntry, FinServTransactionsPayload } from './payloads';
import {
  transactionCategoryIcon,
  formatSignedAmount,
  formatTransactionDate,
} from './transactionFormat';

/**
 * Live preview for the ASA Financial Services · Recent
 * Transactions CLT (DTO field finServTransactionsJSON). LWC-true fields: title,
 * accountLabel?, transactions (object[] with id, merchant, date, amount,
 * currency?, category?, status?, disputable?), disputeText?. Empty transactions
 * drops the preview into a test-mode fallback so it renders even with no
 * payload — mirroring the deployed LWC.
 */


/** Faithful preview: mirrors the Recent Transactions LWC, including test-mode fallback. */
export function FinServTransactionsPreview({
  value,
  accentColor,
}: {
  value: FinServTransactionsPayload;
  accentColor: string;
}) {
  const isTestMode = value.transactions.length === 0;
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
    : value.transactions;

  const [selected, setSelected] = useState<string>('');
  const toggle = (id: string, selectable: boolean) => {
    if (!selectable) return;
    setSelected((cur) => (cur === id ? '' : id));
  };

  return (
    <div className="clt-live-preview txn-selector-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add transactions to preview your content</p>}
      {title && <h3 className="selector-title">{title}</h3>}
      <div className="asa-stmt">
        {accountLabel && (
          <div className="asa-stmt-head">
            <span className="asa-stmt-head-ico" aria-hidden="true"><FileText /></span>
            <span className="asa-stmt-head-label">{accountLabel}</span>
          </div>
        )}
        <div className="asa-stmt-rows">
          {transactions.map((txn, index) => {
            const key = txn.id || `${txn.merchant}-${index}`;
            const Icon = transactionCategoryIcon(txn.category);
            const selectable = txn.disputable !== false;
            const isSelected = selected === key;
            const isCredit = Number(txn.amount) > 0;
            const isPending = String(txn.status || '').toLowerCase() === 'pending';
            const rowClass = ['asa-stmt-row', isSelected ? 'selected' : '', selectable ? '' : 'is-disabled'].filter(Boolean).join(' ');
            return (
              <button
                type="button"
                key={key}
                className={rowClass}
                onClick={() => toggle(key, selectable)}
                aria-pressed={isSelected}
                disabled={!selectable}
              >
                <span className="asa-stmt-ico" aria-hidden="true"><Icon /></span>
                <span className="asa-stmt-meta">
                  <span className="asa-stmt-merchant">
                    <span className="asa-stmt-merchant-text">{txn.merchant}</span>
                    {isPending && <i className="asa-stmt-badge">Pending</i>}
                  </span>
                  <span className="asa-stmt-sub">{formatTransactionDate(txn.date)} · {txn.category || 'Other'}</span>
                </span>
                <span className="asa-stmt-right">
                  <span className={isCredit ? 'asa-stmt-amount is-credit' : 'asa-stmt-amount'}>
                    {formatSignedAmount(Number(txn.amount), txn.currency)}
                  </span>
                  {selectable && (
                    <span className={isSelected ? 'asa-stmt-check on' : 'asa-stmt-check'} aria-hidden="true">
                      <Check />
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {selected && (
        <div className="submit-container">
          <button type="button" className="txn-submit">{disputeText}</button>
        </div>
      )}
    </div>
  );
}
