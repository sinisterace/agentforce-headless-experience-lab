import { useState } from 'react';
import { Check } from 'lucide-react';
import type { PolicyEntry, InsurancePolicySelectorPayload } from './payloads';
import { policyTypeIcon, normalizePolicyType, normalizePolicyStatus, formatMoney, formatPolicyDate } from './insurancePolicyFormat';

/**
 * Live preview for the ASA Insurance · Policy Selector CLT
 * (DTO field insurancePolicySelectorJSON). Mirrors the deployed LWC bespoke
 * "coverage certificate": a squared type glyph, policy identity with a monospace
 * policy number, a framed COVERAGE panel, a monospace premium/renewal footer,
 * and a squared bordered status stamp — trust-forward insurance-indigo, no
 * colored left spine. LWC-true fields: title, mode (single|multiple), policies
 * (object[] with id, name, type, policyNumber?, premium?, cadence?, currency?,
 * renewalDate?, status, coverage?, badge?), submitText?. Empty policies drops
 * into a test-mode fallback so it renders even with no payload.
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
  const payloadPolicies = Array.isArray(value.policies) ? value.policies : [];
  const isTestMode = payloadPolicies.length === 0;
  const title = isTestMode ? 'Which policy can I help you with?' : value.title;
  const mode = isTestMode ? 'single' : value.mode;
  const submitText = value.submitText || 'Continue';
  const policies = isTestMode ? TEST_POLICIES : payloadPolicies;

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
    <div className="clt-live-preview asa-ins" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {title && <h3 className="asa-ins-title">{title}</h3>}
      <div className="asa-ins-list">
        {policies.map((pol, index) => {
          const key = pol.id || `${pol.name}-${index}`;
          const Icon = policyTypeIcon(pol.type);
          const statusBucket = normalizePolicyStatus(pol.status);
          const isSelected = selected.has(key);
          const cardClass = `asa-ins-policy is-${normalizePolicyType(pol.type)}${isSelected ? ' is-selected' : ''}`;
          return (
            <button
              type="button"
              key={key}
              className={cardClass}
              onClick={() => toggle(key)}
              aria-pressed={isSelected}
            >
              <span className="asa-ins-top">
                <span className="asa-ins-glyph" aria-hidden="true"><Icon /></span>
                <span className="asa-ins-id">
                  <span className="asa-ins-name">{pol.name}</span>
                  <span className="asa-ins-sub">
                    <span className="asa-ins-type">{pol.type}</span>
                    {pol.policyNumber && <span className="asa-ins-num">•• {pol.policyNumber}</span>}
                  </span>
                </span>
                <span className={isSelected ? 'asa-ins-check on' : 'asa-ins-check'} aria-hidden="true">
                  <Check />
                </span>
              </span>

              {pol.coverage && (
                <span className="asa-ins-coverage">
                  <span className="asa-ins-cov-eyebrow">Coverage</span>
                  <span className="asa-ins-cov-text">{pol.coverage}</span>
                </span>
              )}

              <span className="asa-ins-foot">
                {typeof pol.premium === 'number' && (
                  <span className="asa-ins-premium">
                    <b>{formatMoney(pol.premium, pol.currency)}</b>
                    {pol.cadence && <i className="asa-ins-cadence">/{pol.cadence}</i>}
                  </span>
                )}
                {pol.renewalDate && <span className="asa-ins-renewal">Renews {formatPolicyDate(pol.renewalDate)}</span>}
                <span className="asa-ins-foot-right">
                  {pol.status && <span className={`asa-ins-status is-${statusBucket}`}>{pol.status}</span>}
                  {pol.badge && <span className="asa-ins-badge">{pol.badge}</span>}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {mode === 'multiple' && selected.size > 0 && (
        <div className="submit-container">
          <button type="button" className="asa-ins-submit">{submitText}</button>
        </div>
      )}
    </div>
  );
}
