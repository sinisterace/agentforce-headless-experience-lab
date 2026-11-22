import { Mail, ShieldCheck, Wallet } from 'lucide-react';
import type { InsuranceIdCardPayload, InsuranceIdCoverage } from './payloads';

/**
 * Live preview for the ASA Insurance · Digital ID Card CLT (DTO field
 * insuranceIdCardJSON). A wallet-style proof-of-insurance card the visitor can
 * pull up on demand ("show me my insurance card" / "I need proof of insurance")
 * and hand off (email a copy / add to wallet). Administrative only — nothing
 * beyond what a physical ID card shows. LWC-true fields: title?, carrier?,
 * policyType?, policyholder?, policyNumber?, vehicle?, plate?, effectiveDate?,
 * expirationDate?, status?, coverages?[] ({ label, detail? }), submitText?,
 * secondaryText?. An empty payload drops into test-mode so it renders with no data.
 */

const TEST: InsuranceIdCardPayload = {
  title: 'Proof of insurance',
  carrier: 'Meridian Mutual',
  policyType: 'Auto',
  policyholder: 'Jordan Rivera',
  policyNumber: 'AUTO-8842-XY',
  vehicle: '2022 Tesla Model 3',
  plate: '8ABC123',
  effectiveDate: 'Jan 1, 2026',
  expirationDate: 'Jul 1, 2028',
  status: 'Active',
  coverages: [
    { label: 'Liability' },
    { label: 'Collision', detail: '$500 ded.' },
    { label: 'Comprehensive', detail: '$500 ded.' },
    { label: 'Uninsured motorist' },
  ],
  submitText: 'Email me a copy',
  secondaryText: 'Add to wallet',
};

/** Faithful preview: the digital insurance ID card, including test-mode fallback. */
export function InsuranceIdCardPreview({ value, accentColor }: { value: InsuranceIdCardPayload; accentColor: string }) {
  const isTestMode = !(value.policyNumber || value.carrier || (Array.isArray(value.coverages) && value.coverages.length > 0));
  const src = isTestMode ? TEST : value;

  const title = (src.title || 'Proof of insurance').trim();
  const carrier = (src.carrier || 'Your insurer').trim();
  const status = (src.status || '').trim();
  const coverages: InsuranceIdCoverage[] = (src.coverages ?? []).filter((c) => c && c.label);
  const submitText = (src.submitText || 'Email me a copy').trim() || 'Email me a copy';
  const secondaryText = (src.secondaryText || '').trim();

  const fields = [
    ['Policyholder', src.policyholder, false],
    ['Policy #', src.policyNumber, true],
    ['Vehicle', src.vehicle, false],
    ['Plate', src.plate, true],
    ['Effective', src.effectiveDate, false],
    ['Expires', src.expirationDate, false],
  ].filter(([, v]) => v != null && String(v).trim()) as [string, string, boolean][];

  return (
    <div className="clt-live-preview insurance-id-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {title && <p className="asa-iid-eyebrow">{title}</p>}

      <div className="asa-iid-card">
        <span className="asa-iid-sheen" aria-hidden="true" />
        <div className="asa-iid-top">
          <span className="asa-iid-carrier"><ShieldCheck aria-hidden="true" /> {carrier}</span>
          {status && <span className="asa-iid-status">{status}</span>}
        </div>
        {src.policyType && <span className="asa-iid-kind">{src.policyType} · ID Card</span>}

        <div className="asa-iid-grid">
          {fields.map(([label, val, mono]) => (
            <div className="asa-iid-field" key={label}>
              <span className="asa-iid-flabel">{label}</span>
              <span className={mono ? 'asa-iid-fval is-mono' : 'asa-iid-fval'}>{val}</span>
            </div>
          ))}
        </div>

        {coverages.length > 0 && (
          <div className="asa-iid-cov">
            {coverages.map((c, i) => (
              <span className="asa-iid-cov-chip" key={`${c.label}-${i}`}>
                {c.label}{c.detail && <em className="asa-iid-cov-detail">{c.detail}</em>}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="asa-iid-actions">
        <button type="button" className="asa-iid-submit"><Mail aria-hidden="true" /> {submitText}</button>
        {secondaryText && <button type="button" className="asa-iid-secondary"><Wallet aria-hidden="true" /> {secondaryText}</button>}
      </div>
    </div>
  );
}
