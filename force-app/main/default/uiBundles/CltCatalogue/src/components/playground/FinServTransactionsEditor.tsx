import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, FileText, Plus, Trash2 } from 'lucide-react';
import type { TransactionEntry, FinServTransactionsPayload } from './payloads';
import {
  transactionCategoryIcon,
  formatSignedAmount,
  formatTransactionDate,
} from './transactionFormat';

/**
 * Build/Input editor + live preview for the ASA Financial Services · Recent
 * Transactions CLT (DTO field finServTransactionsJSON). LWC-true fields: title,
 * accountLabel?, transactions (object[] with id, merchant, date, amount,
 * currency?, category?, status?, disputable?), disputeText?. Empty transactions
 * drops the preview into a test-mode fallback so it renders even with no
 * payload — mirroring the deployed LWC.
 */

const CATEGORIES = ['Groceries', 'Dining', 'Travel', 'Shopping', 'Bills', 'Transfer', 'Income', 'Other'];

export function FinServTransactionsEditor({
  value,
  onChange,
}: {
  value: FinServTransactionsPayload;
  onChange: (next: FinServTransactionsPayload) => void;
}) {
  const setTxn = (index: number, patch: Partial<TransactionEntry>) => {
    const transactions = value.transactions.slice();
    transactions[index] = { ...transactions[index], ...patch };
    onChange({ ...value, transactions });
  };
  const addTxn = () =>
    onChange({
      ...value,
      transactions: [
        ...value.transactions,
        {
          id: `txn-${value.transactions.length + 1}`,
          merchant: 'New merchant',
          date: '2026-08-09',
          amount: -0,
          currency: 'USD',
          category: 'Other',
          status: 'Posted',
        },
      ],
    });
  const removeTxn = (index: number) =>
    onChange({ ...value, transactions: value.transactions.filter((_, i) => i !== index) });
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.transactions.length) return;
    const transactions = value.transactions.slice();
    [transactions[index], transactions[target]] = [transactions[target], transactions[index]];
    onChange({ ...value, transactions });
  };

  return (
    <div className="playground-editor">
      <label className="playground-field">
        Title
        <input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="Your recent transactions" />
      </label>

      <label className="playground-field">
        Account label <span className="optional-label">Optional</span>
        <input value={value.accountLabel ?? ''} onChange={(e) => onChange({ ...value, accountLabel: e.target.value })} placeholder="Everyday Checking ••1234" />
      </label>

      <label className="playground-field">
        Dispute button text
        <input value={value.disputeText ?? ''} onChange={(e) => onChange({ ...value, disputeText: e.target.value })} placeholder="Dispute this charge" />
      </label>

      <div className="playground-list">
        <div className="playground-list-head">
          <span>Transactions</span>
          <button type="button" className="playground-add" onClick={addTxn}><Plus aria-hidden="true" /> Add transaction</button>
        </div>
        {value.transactions.length === 0 && <p className="playground-empty">No transactions — the component shows sample test data until you add one.</p>}
        {value.transactions.map((txn, index) => (
          <div className="playground-card" key={index}>
            <div className="playground-card-head">
              <strong>Transaction {index + 1}</strong>
              <span className="playground-card-actions">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up"><ArrowUp aria-hidden="true" /></button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === value.transactions.length - 1} aria-label="Move down"><ArrowDown aria-hidden="true" /></button>
                <button type="button" onClick={() => removeTxn(index)} aria-label="Remove transaction"><Trash2 aria-hidden="true" /></button>
              </span>
            </div>
            <label className="playground-field">
              Merchant
              <input value={txn.merchant} onChange={(e) => setTxn(index, { merchant: e.target.value })} />
            </label>
            <label className="playground-field">
              Date
              <input type="date" value={txn.date} onChange={(e) => setTxn(index, { date: e.target.value })} />
            </label>
            <label className="playground-field">
              Amount <span className="optional-label">negative = debit</span>
              <input type="number" step="0.01" value={txn.amount} onChange={(e) => setTxn(index, { amount: Number(e.target.value) })} />
            </label>
            <div className="playground-field">
              <span>Category</span>
              <select value={txn.category ?? 'Other'} onChange={(e) => setTxn(index, { category: e.target.value })}>
                {CATEGORIES.map((c) => <option value={c} key={c}>{c}</option>)}
              </select>
            </div>
            <div className="playground-field">
              <span>Status</span>
              <select value={txn.status ?? 'Posted'} onChange={(e) => setTxn(index, { status: e.target.value })}>
                <option value="Posted">Posted</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <label className="playground-check">
              <input type="checkbox" checked={txn.disputable !== false} onChange={(e) => setTxn(index, { disputable: e.target.checked })} />
              Disputable
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

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
