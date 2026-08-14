import { useState } from 'react';
import { ArrowDown, ArrowDownToLine, ArrowUp, Check, Landmark, Plus, Trash2 } from 'lucide-react';
import type { Recipient, AmountPreset, FinServMoneyMovementPayload } from './payloads';
import { recipientTypeIcon, formatMoney, buildFromLabel, buildFromParts, recipientDetail } from './moneyMovementFormat';

/**
 * Build/Input editor + live preview for the ASA Financial Services · Money
 * Movement CLT (DTO field finServMoneyMovementJSON). LWC-true fields: title,
 * fromAccount ({ label, mask? }), recipients (object[] with id, name, type?,
 * mask?, detail?), amountPresets (object[] with id, label?, amount), currency?,
 * allowOther?, otherText?, submitText?. Empty recipients drops the preview into
 * a test-mode fallback so it renders even with no payload — mirroring the LWC.
 */

const OTHER_KEY = '__other__';
const RECIPIENT_TYPES = ['person', 'card', 'account', 'business', 'external'];

export function FinServMoneyMovementEditor({
  value,
  onChange,
}: {
  value: FinServMoneyMovementPayload;
  onChange: (next: FinServMoneyMovementPayload) => void;
}) {
  const setRecipient = (index: number, patch: Partial<Recipient>) => {
    const recipients = value.recipients.slice();
    recipients[index] = { ...recipients[index], ...patch };
    onChange({ ...value, recipients });
  };
  const addRecipient = () =>
    onChange({
      ...value,
      recipients: [
        ...value.recipients,
        { id: `rcp-${value.recipients.length + 1}`, name: 'New recipient', type: 'person', mask: '', detail: '' },
      ],
    });
  const removeRecipient = (index: number) =>
    onChange({ ...value, recipients: value.recipients.filter((_, i) => i !== index) });
  const moveRecipient = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.recipients.length) return;
    const recipients = value.recipients.slice();
    [recipients[index], recipients[target]] = [recipients[target], recipients[index]];
    onChange({ ...value, recipients });
  };

  const setAmount = (index: number, patch: Partial<AmountPreset>) => {
    const amountPresets = value.amountPresets.slice();
    amountPresets[index] = { ...amountPresets[index], ...patch };
    onChange({ ...value, amountPresets });
  };
  const addAmount = () =>
    onChange({
      ...value,
      amountPresets: [...value.amountPresets, { id: `amt-${value.amountPresets.length + 1}`, label: '', amount: 50 }],
    });
  const removeAmount = (index: number) =>
    onChange({ ...value, amountPresets: value.amountPresets.filter((_, i) => i !== index) });

  return (
    <div className="playground-editor">
      <label className="playground-field">
        Title
        <input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="Send money" />
      </label>

      <div className="playground-card">
        <div className="playground-card-head">
          <strong>From account</strong>
        </div>
        <label className="playground-field">
          Label
          <input value={value.fromAccount?.label ?? ''} onChange={(e) => onChange({ ...value, fromAccount: { ...value.fromAccount, label: e.target.value } })} placeholder="Everyday Checking" />
        </label>
        <label className="playground-field">
          Mask <span className="optional-label">last 4</span>
          <input value={value.fromAccount?.mask ?? ''} onChange={(e) => onChange({ ...value, fromAccount: { label: value.fromAccount?.label ?? '', mask: e.target.value } })} placeholder="1234" />
        </label>
      </div>

      <div className="playground-list">
        <div className="playground-list-head">
          <span>Recipients</span>
          <button type="button" className="playground-add" onClick={addRecipient}><Plus aria-hidden="true" /> Add recipient</button>
        </div>
        {value.recipients.length === 0 && <p className="playground-empty">No recipients — the component shows sample test data until you add one.</p>}
        {value.recipients.map((rcp, index) => (
          <div className="playground-card" key={index}>
            <div className="playground-card-head">
              <strong>Recipient {index + 1}</strong>
              <span className="playground-card-actions">
                <button type="button" onClick={() => moveRecipient(index, -1)} disabled={index === 0} aria-label="Move up"><ArrowUp aria-hidden="true" /></button>
                <button type="button" onClick={() => moveRecipient(index, 1)} disabled={index === value.recipients.length - 1} aria-label="Move down"><ArrowDown aria-hidden="true" /></button>
                <button type="button" onClick={() => removeRecipient(index)} aria-label="Remove recipient"><Trash2 aria-hidden="true" /></button>
              </span>
            </div>
            <label className="playground-field">
              Name
              <input value={rcp.name} onChange={(e) => setRecipient(index, { name: e.target.value })} />
            </label>
            <div className="playground-field">
              <span>Type</span>
              <select value={rcp.type ?? 'person'} onChange={(e) => setRecipient(index, { type: e.target.value })}>
                {RECIPIENT_TYPES.map((t) => <option value={t} key={t}>{t}</option>)}
              </select>
            </div>
            <label className="playground-field">
              Mask <span className="optional-label">last 4</span>
              <input value={rcp.mask ?? ''} onChange={(e) => setRecipient(index, { mask: e.target.value })} placeholder="4821" />
            </label>
            <label className="playground-field">
              Detail <span className="optional-label">Optional</span>
              <input value={rcp.detail ?? ''} onChange={(e) => setRecipient(index, { detail: e.target.value })} placeholder="Checking" />
            </label>
          </div>
        ))}
      </div>

      <div className="playground-list">
        <div className="playground-list-head">
          <span>Amount presets</span>
          <button type="button" className="playground-add" onClick={addAmount}><Plus aria-hidden="true" /> Add amount</button>
        </div>
        {value.amountPresets.length === 0 && <p className="playground-empty">No preset amounts.</p>}
        {value.amountPresets.map((amt, index) => (
          <div className="playground-card" key={index}>
            <div className="playground-card-head">
              <strong>Amount {index + 1}</strong>
              <span className="playground-card-actions">
                <button type="button" onClick={() => removeAmount(index)} aria-label="Remove amount"><Trash2 aria-hidden="true" /></button>
              </span>
            </div>
            <label className="playground-field">
              Amount
              <input type="number" step="0.01" value={amt.amount} onChange={(e) => setAmount(index, { amount: Number(e.target.value) })} />
            </label>
            <label className="playground-field">
              Label <span className="optional-label">Optional — else formatted amount</span>
              <input value={amt.label ?? ''} onChange={(e) => setAmount(index, { label: e.target.value })} placeholder="Minimum" />
            </label>
          </div>
        ))}
      </div>

      <label className="playground-check">
        <input type="checkbox" checked={value.allowOther === true} onChange={(e) => onChange({ ...value, allowOther: e.target.checked })} />
        Show "Other amount" chip
      </label>
      {value.allowOther && (
        <label className="playground-field">
          Other amount text
          <input value={value.otherText ?? ''} onChange={(e) => onChange({ ...value, otherText: e.target.value })} placeholder="Other amount" />
        </label>
      )}

      <label className="playground-field">
        Continue button text
        <input value={value.submitText ?? ''} onChange={(e) => onChange({ ...value, submitText: e.target.value })} placeholder="Continue" />
      </label>
    </div>
  );
}

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
