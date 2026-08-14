import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from 'lucide-react';
import type { PolicyEntry, InsurancePolicySelectorPayload } from './payloads';
import { policyTypeIcon, normalizePolicyType, normalizePolicyStatus, formatMoney, formatPolicyDate } from './insurancePolicyFormat';

/**
 * Build/Input editor + live preview for the ASA Insurance · Policy Selector CLT
 * (DTO field insurancePolicySelectorJSON). LWC-true fields: title, mode
 * (single|multiple), policies (object[] with id, name, type, policyNumber?,
 * premium?, cadence?, currency?, renewalDate?, status, coverage?, badge?),
 * submitText?. Empty policies drops the preview into a test-mode fallback so it
 * renders even with no payload — mirroring the deployed LWC.
 */

const POLICY_TYPES = ['Auto', 'Home', 'Renters', 'Life', 'Health', 'Umbrella', 'Pet', 'Travel'];
const POLICY_STATUSES = ['Active', 'Pending', 'Lapsed', 'Cancelled'];

export function InsurancePolicySelectorEditor({
  value,
  onChange,
}: {
  value: InsurancePolicySelectorPayload;
  onChange: (next: InsurancePolicySelectorPayload) => void;
}) {
  const setPolicy = (index: number, patch: Partial<PolicyEntry>) => {
    const policies = value.policies.slice();
    policies[index] = { ...policies[index], ...patch };
    onChange({ ...value, policies });
  };
  const addPolicy = () =>
    onChange({
      ...value,
      policies: [
        ...value.policies,
        { id: `pol-${value.policies.length + 1}`, name: 'New policy', type: 'Auto', policyNumber: '', status: 'Active', currency: 'USD' },
      ],
    });
  const removePolicy = (index: number) => onChange({ ...value, policies: value.policies.filter((_, i) => i !== index) });
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.policies.length) return;
    const policies = value.policies.slice();
    [policies[index], policies[target]] = [policies[target], policies[index]];
    onChange({ ...value, policies });
  };

  return (
    <div className="playground-editor">
      <label className="playground-field">
        Title
        <input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="Which policy can I help you with?" />
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
          <span>Policies</span>
          <button type="button" className="playground-add" onClick={addPolicy}><Plus aria-hidden="true" /> Add policy</button>
        </div>
        {value.policies.length === 0 && <p className="playground-empty">No policies — the component shows sample test data until you add one.</p>}
        {value.policies.map((pol, index) => (
          <div className="playground-card" key={index}>
            <div className="playground-card-head">
              <strong>Policy {index + 1}</strong>
              <span className="playground-card-actions">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up"><ArrowUp aria-hidden="true" /></button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === value.policies.length - 1} aria-label="Move down"><ArrowDown aria-hidden="true" /></button>
                <button type="button" onClick={() => removePolicy(index)} aria-label="Remove policy"><Trash2 aria-hidden="true" /></button>
              </span>
            </div>
            <label className="playground-field">
              Name
              <input value={pol.name} onChange={(e) => setPolicy(index, { name: e.target.value })} placeholder="Auto — 2022 Tesla Model 3" />
            </label>
            <div className="playground-field">
              <span>Type</span>
              <select value={pol.type} onChange={(e) => setPolicy(index, { type: e.target.value })}>
                {POLICY_TYPES.map((t) => <option value={t} key={t}>{t}</option>)}
              </select>
            </div>
            <div className="playground-field">
              <span>Status</span>
              <select value={pol.status} onChange={(e) => setPolicy(index, { status: e.target.value })}>
                {POLICY_STATUSES.map((s) => <option value={s} key={s}>{s}</option>)}
              </select>
            </div>
            <label className="playground-field">
              Policy number <span className="optional-label">last digits</span>
              <input value={pol.policyNumber ?? ''} onChange={(e) => setPolicy(index, { policyNumber: e.target.value })} placeholder="8842" />
            </label>
            <label className="playground-field">
              Coverage <span className="optional-label">Optional</span>
              <input value={pol.coverage ?? ''} onChange={(e) => setPolicy(index, { coverage: e.target.value })} placeholder="Collision + Comprehensive · $500 deductible" />
            </label>
            <label className="playground-field">
              Premium <span className="optional-label">Optional</span>
              <input type="number" step="0.01" value={pol.premium ?? ''} onChange={(e) => setPolicy(index, { premium: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="142.50" />
            </label>
            <label className="playground-field">
              Billing cadence <span className="optional-label">Optional</span>
              <input value={pol.cadence ?? ''} onChange={(e) => setPolicy(index, { cadence: e.target.value })} placeholder="monthly" />
            </label>
            <label className="playground-field">
              Renewal date <span className="optional-label">Optional</span>
              <input type="date" value={pol.renewalDate ?? ''} onChange={(e) => setPolicy(index, { renewalDate: e.target.value })} />
            </label>
            <label className="playground-field">
              Badge <span className="optional-label">Optional</span>
              <input value={pol.badge ?? ''} onChange={(e) => setPolicy(index, { badge: e.target.value })} placeholder="Primary" />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

const TEST_POLICIES: PolicyEntry[] = [
  { id: 'test-auto', name: 'Auto — 2022 Tesla Model 3', type: 'Auto', policyNumber: '8842', premium: 142.5, cadence: 'monthly', currency: 'USD', renewalDate: '2026-11-01', status: 'Active', coverage: 'Collision + Comprehensive · $500 deductible', badge: 'Primary' },
  { id: 'test-home', name: 'Homeowners — 14 Elm St', type: 'Home', policyNumber: '3391', premium: 1820.0, cadence: 'annual', currency: 'USD', renewalDate: '2027-02-15', status: 'Active', coverage: 'Dwelling $420k · $1,000 deductible' },
  { id: 'test-life', name: 'Term Life — 20yr', type: 'Life', policyNumber: '5567', premium: 48.0, cadence: 'monthly', currency: 'USD', renewalDate: '2038-06-01', status: 'Active', coverage: '$500,000 benefit' },
];

/** Faithful preview: mirrors the Policy Selector LWC, including test-mode fallback. */
export function InsurancePolicySelectorPreview({
  value,
  accentColor,
}: {
  value: InsurancePolicySelectorPayload;
  accentColor: string;
}) {
  const isTestMode = value.policies.length === 0;
  const title = isTestMode ? 'Which policy can I help you with?' : value.title;
  const mode = isTestMode ? 'single' : value.mode;
  const submitText = value.submitText || 'Continue';
  const policies = isTestMode ? TEST_POLICIES : value.policies;

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
    <div className="clt-live-preview pol-selector-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add policies to preview your content</p>}
      {title && <h3 className="selector-title">{title}</h3>}
      <div className="asa-pol-list">
        {policies.map((pol, index) => {
          const key = pol.id || `${pol.name}-${index}`;
          const Icon = policyTypeIcon(pol.type);
          const statusBucket = normalizePolicyStatus(pol.status);
          const isSelected = selected.has(key);
          const cardClass = `asa-pol is-${normalizePolicyType(pol.type)}${isSelected ? ' is-selected' : ''}`;
          return (
            <button
              type="button"
              key={key}
              className={cardClass}
              onClick={() => toggle(key)}
              aria-pressed={isSelected}
            >
              <span className="asa-pol-spine" aria-hidden="true" />
              <span className="asa-pol-body">
                <span className="asa-pol-head">
                  <span className="asa-pol-ico" aria-hidden="true"><Icon /></span>
                  <span className="asa-pol-name-wrap">
                    <span className="asa-pol-name">{pol.name}</span>
                    <span className="asa-pol-meta-line">
                      <span className="asa-pol-type">{pol.type}</span>
                      {pol.policyNumber && <span className="asa-pol-num">•• {pol.policyNumber}</span>}
                    </span>
                  </span>
                  {pol.status && <span className={`asa-pol-status is-${statusBucket}`}>{pol.status}</span>}
                </span>
                {pol.coverage && <span className="asa-pol-coverage">{pol.coverage}</span>}
                <span className="asa-pol-foot">
                  {typeof pol.premium === 'number' && (
                    <span className="asa-pol-premium">
                      <b>{formatMoney(pol.premium, pol.currency)}</b>
                      {pol.cadence && <i className="asa-pol-cadence">/{pol.cadence}</i>}
                    </span>
                  )}
                  {pol.renewalDate && <span className="asa-pol-renewal">Renews {formatPolicyDate(pol.renewalDate)}</span>}
                  {pol.badge && <span className="asa-pol-badge">{pol.badge}</span>}
                </span>
              </span>
              <span className={isSelected ? 'asa-pol-check on' : 'asa-pol-check'} aria-hidden="true">
                <Check />
              </span>
            </button>
          );
        })}
      </div>
      {mode === 'multiple' && selected.size > 0 && (
        <div className="submit-container">
          <button type="button" className="asa-pol-submit">{submitText}</button>
        </div>
      )}
    </div>
  );
}
