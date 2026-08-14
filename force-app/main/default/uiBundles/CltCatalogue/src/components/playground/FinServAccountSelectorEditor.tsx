import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from 'lucide-react';
import type { AccountEntry, FinServAccountSelectorPayload } from './payloads';
import { accountTypeModifier, formatMoney } from './accountFormat';

/** EMV chip glyph — the signature "payment card" detail on every wallet tile. */
function ChipGlyph() {
  return (
    <svg viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden="true">
      <rect x="1" y="1" width="22" height="16" rx="3" />
      <path d="M1 6h6M1 12h6M23 6h-6M23 12h-6M9 1v4a3 3 0 0 0 6 0V1M9 17v-4a3 3 0 0 1 6 0v4" />
    </svg>
  );
}

/**
 * Build/Input editor + live preview for the ASA Financial Services · Account
 * Selector CLT (DTO field finServAccountSelectorJSON). LWC-true fields: title,
 * mode (single|multiple), accounts (object[] with id, name, type, mask, balance,
 * currency?, available?, badge?), submitText?. Empty accounts drops the preview
 * into a test-mode fallback so it renders even with no payload — mirroring the
 * deployed LWC.
 */

const ACCOUNT_TYPES = ['Checking', 'Savings', 'Credit Card', 'Loan', 'Investment'];

export function FinServAccountSelectorEditor({
  value,
  onChange,
}: {
  value: FinServAccountSelectorPayload;
  onChange: (next: FinServAccountSelectorPayload) => void;
}) {
  const setAcct = (index: number, patch: Partial<AccountEntry>) => {
    const accounts = value.accounts.slice();
    accounts[index] = { ...accounts[index], ...patch };
    onChange({ ...value, accounts });
  };
  const addAcct = () =>
    onChange({
      ...value,
      accounts: [
        ...value.accounts,
        { id: `acct-${value.accounts.length + 1}`, name: 'New account', type: 'Checking', mask: '0000', balance: 0, currency: 'USD' },
      ],
    });
  const removeAcct = (index: number) => onChange({ ...value, accounts: value.accounts.filter((_, i) => i !== index) });
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.accounts.length) return;
    const accounts = value.accounts.slice();
    [accounts[index], accounts[target]] = [accounts[target], accounts[index]];
    onChange({ ...value, accounts });
  };

  return (
    <div className="playground-editor">
      <label className="playground-field">
        Title
        <input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="Which account can I help you with?" />
      </label>

      <div className="playground-field">
        <span>Selection mode</span>
        <div className="playground-segment" role="group" aria-label="Selection mode">
          {(['single', 'multiple'] as const).map((mode) => (
            <button type="button" key={mode} className={value.mode === mode ? 'active' : ''} aria-pressed={value.mode === mode} onClick={() => onChange({ ...value, mode })}>
              {mode === 'single' ? 'Single' : 'Multiple'}
            </button>
          ))}
        </div>
      </div>

      {value.mode === 'multiple' && (
        <label className="playground-field">
          Submit button text
          <input value={value.submitText ?? ''} onChange={(e) => onChange({ ...value, submitText: e.target.value })} placeholder="Continue" />
        </label>
      )}

      <div className="playground-list">
        <div className="playground-list-head">
          <span>Accounts</span>
          <button type="button" className="playground-add" onClick={addAcct}><Plus aria-hidden="true" /> Add account</button>
        </div>
        {value.accounts.length === 0 && <p className="playground-empty">No accounts — the component shows sample test data until you add one.</p>}
        {value.accounts.map((acct, index) => (
          <div className="playground-card" key={index}>
            <div className="playground-card-head">
              <strong>Account {index + 1}</strong>
              <span className="playground-card-actions">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up"><ArrowUp aria-hidden="true" /></button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === value.accounts.length - 1} aria-label="Move down"><ArrowDown aria-hidden="true" /></button>
                <button type="button" onClick={() => removeAcct(index)} aria-label="Remove account"><Trash2 aria-hidden="true" /></button>
              </span>
            </div>
            <label className="playground-field">
              Name
              <input value={acct.name} onChange={(e) => setAcct(index, { name: e.target.value })} />
            </label>
            <div className="playground-field">
              <span>Type</span>
              <select value={acct.type} onChange={(e) => setAcct(index, { type: e.target.value })}>
                {ACCOUNT_TYPES.map((t) => <option value={t} key={t}>{t}</option>)}
              </select>
            </div>
            <label className="playground-field">
              Last 4 digits
              <input value={acct.mask} onChange={(e) => setAcct(index, { mask: e.target.value.replace(/\D/g, '').slice(0, 4) })} inputMode="numeric" placeholder="1234" />
            </label>
            <label className="playground-field">
              Balance
              <input type="number" value={acct.balance} onChange={(e) => setAcct(index, { balance: Number(e.target.value) })} />
            </label>
            <label className="playground-field">
              Badge <span className="optional-label">Optional</span>
              <input value={acct.badge ?? ''} onChange={(e) => setAcct(index, { badge: e.target.value })} placeholder="Primary" />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Faithful preview: mirrors the Account Selector LWC, including test-mode fallback. */
export function FinServAccountSelectorPreview({
  value,
  accentColor,
}: {
  value: FinServAccountSelectorPayload;
  accentColor: string;
}) {
  const isTestMode = value.accounts.length === 0;
  const title = isTestMode ? 'Which account can I help you with?' : value.title;
  const mode = isTestMode ? 'single' : value.mode;
  const submitText = value.submitText || 'Continue';
  const accounts: AccountEntry[] = isTestMode
    ? [
        { id: 'test-checking', name: 'Everyday Checking', type: 'Checking', mask: '1234', balance: 4820.55, currency: 'USD', badge: 'Primary' },
        { id: 'test-savings', name: 'High-Yield Savings', type: 'Savings', mask: '5678', balance: 15230.0, currency: 'USD' },
        { id: 'test-card', name: 'Rewards Card', type: 'Credit Card', mask: '9012', balance: -742.18, currency: 'USD', available: 9257.82 },
      ]
    : value.accounts;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    if (mode === 'single') {
      setSelected(new Set([id]));
      return;
    }
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  return (
    <div className="clt-live-preview account-selector-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add accounts to preview your content</p>}
      {title && <h3 className="selector-title">{title}</h3>}
      <div className="asa-wallet">
        {accounts.map((acct, index) => {
          const isSelected = selected.has(acct.id);
          const negative = acct.balance < 0;
          const cardClass = `asa-wcard ${accountTypeModifier(acct.type)}${isSelected ? ' is-selected' : ''}`;
          return (
            <button
              type="button"
              key={acct.id || `${acct.name}-${index}`}
              className={cardClass}
              onClick={() => toggle(acct.id || acct.name)}
              aria-pressed={isSelected}
            >
              <span className="asa-wcard-top">
                <span className="asa-wcard-brand">
                  <span className="asa-wcard-chip"><ChipGlyph /></span>
                  <span className="asa-wcard-type">{acct.type}</span>
                </span>
                {acct.badge && <span className="asa-wcard-badge">{acct.badge}</span>}
              </span>
              {acct.mask && (
                <span className="asa-wcard-num"><i aria-hidden="true">••••</i>&nbsp;{acct.mask}</span>
              )}
              <span className="asa-wcard-foot">
                <span className="asa-wcard-holder">
                  <span className="asa-wcard-name">{acct.name}</span>
                  <span className="asa-wcard-bal-row">
                    <b className={negative ? 'asa-wcard-bal is-negative' : 'asa-wcard-bal'}>{formatMoney(acct.balance, acct.currency)}</b>
                    {typeof acct.available === 'number' && <small>{formatMoney(acct.available, acct.currency)} available</small>}
                  </span>
                </span>
                <span className={isSelected ? 'asa-wcard-check on' : 'asa-wcard-check'} aria-hidden="true">
                  <Check />
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {mode === 'multiple' && selected.size > 0 && (
        <div className="submit-container">
          <button type="button" className="account-submit">{submitText}</button>
        </div>
      )}
    </div>
  );
}
