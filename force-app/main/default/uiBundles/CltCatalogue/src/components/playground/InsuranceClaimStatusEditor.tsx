import { ArrowDown, ArrowUp, Check, Plus, Trash2, X, CircleAlert } from 'lucide-react';
import type { ClaimEntry, InsuranceClaimStatusPayload } from './payloads';
import {
  normalizeClaimStatus,
  normalizeStepState,
  deriveSteps,
  formatMoney,
  formatClaimDate,
} from './claimStatusFormat';

/**
 * Build/Input editor + live preview for the ASA Insurance · Claim Status Tracker
 * CLT (DTO field insuranceClaimStatusJSON). LWC-true fields: title, claims
 * (object[] with id, claimNumber, type?, policyLabel?, filedDate?, amount?,
 * currency?, status, statusLabel?, updatedDate?, nextActionText?, steps?), and
 * submitText?. Empty claims drops the preview into a test-mode fallback so it
 * renders even with no payload — mirroring the deployed LWC.
 */

const CLAIM_STATUSES = ['Submitted', 'Review', 'Approved', 'Paid', 'Denied'];

export function InsuranceClaimStatusEditor({
  value,
  onChange,
}: {
  value: InsuranceClaimStatusPayload;
  onChange: (next: InsuranceClaimStatusPayload) => void;
}) {
  const setClaim = (index: number, patch: Partial<ClaimEntry>) => {
    const claims = value.claims.slice();
    claims[index] = { ...claims[index], ...patch };
    onChange({ ...value, claims });
  };
  const addClaim = () =>
    onChange({
      ...value,
      claims: [
        ...value.claims,
        { id: `clm-${value.claims.length + 1}`, claimNumber: `CLM-${1000 + value.claims.length + 1}`, status: 'Review', currency: 'USD' },
      ],
    });
  const removeClaim = (index: number) => onChange({ ...value, claims: value.claims.filter((_, i) => i !== index) });
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.claims.length) return;
    const claims = value.claims.slice();
    [claims[index], claims[target]] = [claims[target], claims[index]];
    onChange({ ...value, claims });
  };

  return (
    <div className="playground-editor">
      <label className="playground-field">
        Title
        <input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="Your claims" />
      </label>

      <label className="playground-field">
        Submit button text
        <input value={value.submitText ?? ''} onChange={(e) => onChange({ ...value, submitText: e.target.value })} placeholder="Ask about a claim" />
      </label>

      <div className="playground-list">
        <div className="playground-list-head">
          <span>Claims</span>
          <button type="button" className="playground-add" onClick={addClaim}><Plus aria-hidden="true" /> Add claim</button>
        </div>
        {value.claims.length === 0 && <p className="playground-empty">No claims — the component shows sample test data until you add one.</p>}
        {value.claims.map((claim, index) => (
          <div className="playground-card" key={index}>
            <div className="playground-card-head">
              <strong>Claim {index + 1}</strong>
              <span className="playground-card-actions">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up"><ArrowUp aria-hidden="true" /></button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === value.claims.length - 1} aria-label="Move down"><ArrowDown aria-hidden="true" /></button>
                <button type="button" onClick={() => removeClaim(index)} aria-label="Remove claim"><Trash2 aria-hidden="true" /></button>
              </span>
            </div>
            <label className="playground-field">
              Claim number
              <input value={claim.claimNumber} onChange={(e) => setClaim(index, { claimNumber: e.target.value })} placeholder="CLM-4471" />
            </label>
            <div className="playground-field">
              <span>Status</span>
              <select value={claim.status} onChange={(e) => setClaim(index, { status: e.target.value })}>
                {CLAIM_STATUSES.map((s) => <option value={s} key={s}>{s}</option>)}
              </select>
            </div>
            <label className="playground-field">
              Status label <span className="optional-label">Optional</span>
              <input value={claim.statusLabel ?? ''} onChange={(e) => setClaim(index, { statusLabel: e.target.value })} placeholder="In review" />
            </label>
            <label className="playground-field">
              Type <span className="optional-label">Optional</span>
              <input value={claim.type ?? ''} onChange={(e) => setClaim(index, { type: e.target.value })} placeholder="Collision" />
            </label>
            <label className="playground-field">
              Policy label <span className="optional-label">Optional</span>
              <input value={claim.policyLabel ?? ''} onChange={(e) => setClaim(index, { policyLabel: e.target.value })} placeholder="Auto — 2022 Tesla Model 3" />
            </label>
            <label className="playground-field">
              Amount <span className="optional-label">Optional</span>
              <input type="number" step="0.01" value={claim.amount ?? ''} onChange={(e) => setClaim(index, { amount: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="3200.00" />
            </label>
            <label className="playground-field">
              Filed date <span className="optional-label">Optional</span>
              <input type="date" value={claim.filedDate ?? ''} onChange={(e) => setClaim(index, { filedDate: e.target.value })} />
            </label>
            <label className="playground-field">
              Updated date <span className="optional-label">Optional</span>
              <input type="date" value={claim.updatedDate ?? ''} onChange={(e) => setClaim(index, { updatedDate: e.target.value })} />
            </label>
            <label className="playground-field">
              Next action <span className="optional-label">Optional</span>
              <input value={claim.nextActionText ?? ''} onChange={(e) => setClaim(index, { nextActionText: e.target.value })} placeholder="Upload the repair estimate" />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const isTestMode = value.claims.length === 0;
  const title = (isTestMode ? 'Your claims' : value.title) || 'Your claims';
  const claims = isTestMode ? TEST_CLAIMS : value.claims;
  const submitText = value.submitText || 'Ask about a claim';

  return (
    <div className="clt-live-preview claim-status-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add claims to preview your content</p>}
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
