import { useState } from 'react';
import { ArrowDownToLine, Check, Landmark } from 'lucide-react';
import type { Recipient, AmountPreset, FinServMoneyMovementPayload } from './payloads';
import { recipientTypeIcon, formatMoney, buildFromLabel, buildFromParts, recipientDetail } from './moneyMovementFormat';

/**
 * Live preview for the ASA Financial Services · Money
 * Movement CLT (DTO field finServMoneyMovementJSON). LWC-true fields: title,
 * fromAccount ({ label, mask? }), recipients (object[] with id, name, type?,
 * mask?, detail?), amountPresets (object[] with id, label?, amount), currency?,
 * allowOther?, otherText?, submitText?. Empty recipients drops the preview into
 * a test-mode fallback so it renders even with no payload — mirroring the LWC.
 */

const OTHER_KEY = '__other__';

const TEST_RECIPIENTS: Recipient[] = [
  { id: 'test-1', name: 'Alex Rivera', type: 'person', mask: '4821', detail: 'Checking' },
  { id: 'test-2', name: 'Rewards Card', type: 'card', mask: '9012', detail: 'Credit Card' },
  { id: 'test-3', name: 'High-Yield Savings', type: 'account', mask: '5678', detail: 'Savings' },
];
const TEST_AMOUNTS: AmountPreset[] = [
  { id: 'test-a1', label: '$50', amount: 50 },
  { id: 'test-a2', label: '$100', amount: 100 },
  { id: 'test-a3', label: '$250', amount: 250 },
  { id: 'test-a4', label: 'Minimum', amount: 35 },
];

/** Faithful preview: mirrors the Money Movement LWC, including test-mode fallback. */
export function FinServMoneyMovementPreview({
  value,
  accentColor,
}: {
  value: FinServMoneyMovementPayload;
  accentColor: string;
}) {
  const isTestMode = value.recipients.length === 0;
  const title = isTestMode ? 'Send money' : value.title;
  const fromAccount = isTestMode ? { label: 'Everyday Checking', mask: '1234' } : value.fromAccount;
  const fromLabel = buildFromLabel(fromAccount);
  const fromParts = buildFromParts(fromAccount);
  const recipients = isTestMode ? TEST_RECIPIENTS : value.recipients;
  const amountPresets = isTestMode ? TEST_AMOUNTS : value.amountPresets;
  const currency = value.currency || 'USD';
  const allowOther = isTestMode ? true : value.allowOther === true;
  const otherText = value.otherText || 'Other amount';
  const submitText = value.submitText || 'Continue';

  const [recipientKey, setRecipientKey] = useState<string>('');
  const [amountKey, setAmountKey] = useState<string>('');
  const toggleRecipient = (key: string) => setRecipientKey((cur) => (cur === key ? '' : key));
  const toggleAmount = (key: string) => setAmountKey((cur) => (cur === key ? '' : key));
  const showSubmit = !!recipientKey && !!amountKey;

  return (
    <div className="clt-live-preview mm-selector-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add recipients to preview your content</p>}
      {title && <h3 className="selector-title">{title}</h3>}

      {fromLabel && (
        <>
          <div className="mm-node" aria-label="From account">
            <span className="mm-node-ico" aria-hidden="true"><Landmark /></span>
            <span className="mm-node-meta">
              <span className="mm-node-label">From</span>
              <span className="mm-node-value">
                {fromParts.name}
                {fromParts.mask && <i className="mm-node-mask"> {fromParts.mask}</i>}
              </span>
            </span>
          </div>
          <span className="mm-rail" aria-hidden="true">
            <span className="mm-rail-badge"><ArrowDownToLine /></span>
          </span>
        </>
      )}

      <p className="mm-to-label">To</p>
      <div className="mm-list">
        {recipients.map((rcp, index) => {
          const key = rcp.id || `rcp-${index}`;
          const Icon = recipientTypeIcon(rcp.type);
          const isSelected = recipientKey === key;
          const detail = recipientDetail(rcp.detail, rcp.mask);
          return (
            <button
              type="button"
              key={key}
              className={isSelected ? 'mm-row selected' : 'mm-row'}
              onClick={() => toggleRecipient(key)}
              aria-pressed={isSelected}
            >
              <span className="mm-icon" aria-hidden="true"><Icon /></span>
              <span className="mm-meta">
                <span className="mm-name-text">{rcp.name}</span>
                {detail && <small>{detail}</small>}
              </span>
              <span className={isSelected ? 'mm-select on' : 'mm-select'} aria-hidden="true">
                <Check />
              </span>
            </button>
          );
        })}
      </div>

      {(amountPresets.length > 0 || allowOther) && (
        <>
          <p className="mm-amount-label">Amount</p>
          <div className="mm-chips">
            {amountPresets.map((amt, index) => {
              const key = amt.id || `amt-${index}`;
              const isSelected = amountKey === key;
              const label = (amt.label && amt.label.trim()) || formatMoney(amt.amount, currency);
              return (
                <button
                  type="button"
                  key={key}
                  className={isSelected ? 'mm-chip selected' : 'mm-chip'}
                  onClick={() => toggleAmount(key)}
                  aria-pressed={isSelected}
                >
                  {label}
                </button>
              );
            })}
            {allowOther && (
              <button
                type="button"
                className={amountKey === OTHER_KEY ? 'mm-chip is-other selected' : 'mm-chip is-other'}
                onClick={() => toggleAmount(OTHER_KEY)}
                aria-pressed={amountKey === OTHER_KEY}
              >
                {otherText}
              </button>
            )}
          </div>
        </>
      )}

      {showSubmit && (
        <div className="submit-container">
          <button type="button" className="mm-submit">{submitText}</button>
        </div>
      )}
    </div>
  );
}
