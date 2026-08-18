import { useState } from 'react';
import { Check } from 'lucide-react';
import type { PolicyEntry, InsurancePolicySelectorPayload } from './payloads';
import { policyTypeIcon, normalizePolicyType, normalizePolicyStatus, formatMoney, formatPolicyDate } from './insurancePolicyFormat';

/**
 * Live preview for the ASA Insurance · Policy Selector CLT
 * (DTO field insurancePolicySelectorJSON). LWC-true fields: title, mode
 * (single|multiple), policies (object[] with id, name, type, policyNumber?,
 * premium?, cadence?, currency?, renewalDate?, status, coverage?, badge?),
 * submitText?. Empty policies drops the preview into a test-mode fallback so it
 * renders even with no payload — mirroring the deployed LWC.
 */


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
