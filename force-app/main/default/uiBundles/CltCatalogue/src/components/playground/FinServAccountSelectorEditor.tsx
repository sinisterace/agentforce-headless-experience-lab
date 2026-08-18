import { useState } from 'react';
import { Check } from 'lucide-react';
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
 * Live preview for the ASA Financial Services · Account
 * Selector CLT (DTO field finServAccountSelectorJSON). LWC-true fields: title,
 * mode (single|multiple), accounts (object[] with id, name, type, mask, balance,
 * currency?, available?, badge?), submitText?. Empty accounts drops the preview
 * into a test-mode fallback so it renders even with no payload — mirroring the
 * deployed LWC.
 */


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
