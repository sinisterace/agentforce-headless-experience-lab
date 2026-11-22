import { Check, X, CircleAlert } from 'lucide-react';
import type { ClaimEntry, InsuranceClaimStatusPayload } from './payloads';
import {
  normalizeClaimStatus,
  normalizeStepState,
  deriveSteps,
  formatMoney,
  formatClaimDate,
} from './claimStatusFormat';

/**
 * Live preview for the ASA Insurance · Claim Status Tracker
 * CLT (DTO field insuranceClaimStatusJSON). LWC-true fields: title, claims
 * (object[] with id, claimNumber, type?, policyLabel?, filedDate?, amount?,
 * currency?, status, statusLabel?, updatedDate?, nextActionText?, steps?), and
 * submitText?. Empty claims drops the preview into a test-mode fallback so it
 * renders even with no payload — mirroring the deployed LWC.
 */


const TEST_CLAIMS: ClaimEntry[] = [
  { id: 'clm-4471', claimNumber: 'CLM-4471', type: 'Collision', policyLabel: 'Auto — 2022 Tesla Model 3', filedDate: '2026-07-28', amount: 3200.0, currency: 'USD', status: 'Review', statusLabel: 'In review', updatedDate: '2026-08-05', nextActionText: 'Upload the repair estimate' },
  { id: 'clm-3120', claimNumber: 'CLM-3120', type: 'Water damage', policyLabel: 'Homeowners — 14 Elm St', filedDate: '2026-06-10', amount: 8750.0, currency: 'USD', status: 'Paid', statusLabel: 'Paid', updatedDate: '2026-07-02' },
];

/** Faithful preview: mirrors the Claim Status Tracker LWC, including test-mode fallback. */
export function InsuranceClaimStatusPreview({
  value,
  accentColor,
}: {
  value: InsuranceClaimStatusPayload;
  accentColor: string;
}) {
  const payloadClaims = Array.isArray(value.claims) ? value.claims : [];
  const isTestMode = payloadClaims.length === 0;
  const title = (isTestMode ? 'Your claims' : value.title) || 'Your claims';
  const claims = isTestMode ? TEST_CLAIMS : payloadClaims;
  const submitText = value.submitText || 'Ask about a claim';

  return (
    <div className="clt-live-preview claim-status-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {title && <h3 className="selector-title">{title}</h3>}

      <div className="asa-cs-list">
        {claims.map((claim, index) => {
          const key = claim.id || `${claim.claimNumber}-${index}`;
          const bucket = normalizeClaimStatus(claim.status);
          const statusLabel = claim.statusLabel || claim.status || bucket;
          const steps =
            claim.steps && claim.steps.length
              ? claim.steps.map((s) => ({ label: s.label, state: normalizeStepState(s.state) }))
              : deriveSteps(bucket);
          return (
            <div className={`asa-cs is-${bucket}`} key={key}>
              <div className="asa-cs-head">
                <div className="asa-cs-id-wrap">
                  <span className="asa-cs-num">{claim.claimNumber}</span>
                  <span className="asa-cs-meta-line">
                    {claim.type && <span className="asa-cs-type">{claim.type}</span>}
                    {claim.policyLabel && <span className="asa-cs-policy">{claim.policyLabel}</span>}
                  </span>
                </div>
                <span className={`asa-cs-status is-${bucket}`}>{statusLabel}</span>
              </div>

              <div className="asa-cs-track">
                {steps.map((step, i) => (
                  <div className="asa-cs-step" key={`${step.label}-${i}`}>
                    {i > 0 && <span className={`asa-cs-bar is-${step.state}`} aria-hidden="true" />}
                    <span className="asa-cs-node">
                      <span className={`asa-cs-dot is-${step.state}`} aria-hidden="true">
                        {step.state === 'done' && <Check />}
                        {step.state === 'denied' && <X />}
                      </span>
                      <span className={`asa-cs-step-label is-${step.state}`}>{step.label}</span>
                    </span>
                  </div>
                ))}
              </div>

              {claim.nextActionText && (
                <div className="asa-cs-next">
                  <span className="asa-cs-next-ico" aria-hidden="true"><CircleAlert /></span>
                  <span className="asa-cs-next-text">{claim.nextActionText}</span>
                </div>
              )}

              <div className="asa-cs-foot">
                {typeof claim.amount === 'number' && <span className="asa-cs-amount">{formatMoney(claim.amount, claim.currency)}</span>}
                {claim.filedDate && <span className="asa-cs-date">Filed {formatClaimDate(claim.filedDate)}</span>}
                {claim.updatedDate && <span className="asa-cs-date">Updated {formatClaimDate(claim.updatedDate)}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="submit-container">
        <button type="button" className="asa-cs-submit">{submitText}</button>
      </div>
    </div>
  );
}
