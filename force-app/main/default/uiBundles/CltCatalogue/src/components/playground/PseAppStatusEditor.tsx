import { Check, X } from 'lucide-react';
import type { PseAppStatusPayload, PseAppStep } from './payloads';

/**
 * Live preview for the ASA Public Sector & Education · Application Status
 * Tracker CLT (DTO field pseAppStatusJSON), in the "Civic Records" design
 * language: navy agency masthead + seal, official-paper body, monospace
 * reference, rotated status stamp, numbered civic step tracker. No dates.
 * LWC-true fields: title?, applicationType?, referenceNumber?, status?,
 * statusLabel?, steps?[{label,state}], nextActionText?, submitText?, submitValue?.
 * An empty payload drops the preview into test-mode — mirroring the LWC.
 */

const TEST: PseAppStatusPayload = {
  title: 'Your application status',
  applicationType: 'Building permit',
  referenceNumber: 'APP-2026-1043',
  status: 'review',
  statusLabel: 'Under review',
  steps: [
    { label: 'Submitted', state: 'done' },
    { label: 'Under review', state: 'current' },
    { label: 'Approved', state: 'todo' },
    { label: 'Issued', state: 'todo' },
  ],
  nextActionText: 'We may request additional documents — no action needed right now.',
  submitText: 'Message the office',
};

const DEFAULT_TRACK = ['Submitted', 'Under review', 'Approved', 'Issued'];
const TRACK_BUCKETS = ['submitted', 'review', 'approved', 'issued'];

type Bucket = 'submitted' | 'review' | 'approved' | 'issued' | 'denied';
type StepState = 'done' | 'current' | 'upcoming' | 'denied';

function statusOf(status?: string): Bucket {
  const raw = String(status || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'submitted' || raw === 'filed' || raw === 'new' || raw === 'received') return 'submitted';
  if (raw === 'review' || raw === 'inreview' || raw === 'processing' || raw === 'pending') return 'review';
  if (raw === 'approved' || raw === 'accepted') return 'approved';
  if (raw === 'issued' || raw === 'complete' || raw === 'completed' || raw === 'granted' || raw === 'enrolled') return 'issued';
  if (raw === 'denied' || raw === 'declined' || raw === 'rejected') return 'denied';
  return 'review';
}

function stepStateOf(state?: string): StepState {
  const raw = String(state || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'done' || raw === 'complete' || raw === 'completed' || raw === 'passed') return 'done';
  if (raw === 'current' || raw === 'active' || raw === 'inprogress') return 'current';
  if (raw === 'denied' || raw === 'declined' || raw === 'rejected') return 'denied';
  return 'upcoming';
}

function deriveSteps(bucket: Bucket): { label: string; state: StepState }[] {
  if (bucket === 'denied') {
    return [
      { label: 'Submitted', state: 'done' },
      { label: 'Denied', state: 'denied' },
    ];
  }
  const currentIndex = TRACK_BUCKETS.indexOf(bucket);
  return DEFAULT_TRACK.map((label, i) => {
    let state: StepState = 'upcoming';
    if (bucket === 'issued') state = 'done';
    else if (i < currentIndex) state = 'done';
    else if (i === currentIndex) state = 'current';
    return { label, state };
  });
}

/** Faithful preview: mirrors the Civic Records Application Status Tracker LWC. */
export function PseAppStatusPreview({ value, accentColor }: { value: PseAppStatusPayload; accentColor: string }) {
  const hasContent = !!(value.referenceNumber || value.applicationType || (Array.isArray(value.steps) && value.steps.length));
  const isTestMode = !hasContent;
  const src = isTestMode ? TEST : value;

  const bucket = statusOf(src.status);
  const statusLabel = src.statusLabel || src.status || bucket;
  const rawSteps: PseAppStep[] =
    Array.isArray(src.steps) && src.steps.length ? src.steps.filter((s) => s && s.label) : deriveSteps(bucket);
  const steps = rawSteps.map((s) => ({ label: String(s.label), state: stepStateOf(s.state) }));

  return (
    <div className="clt-live-preview app-status-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>

      <div className={`asa-ast is-${bucket}`}>
        <div className="asa-ast-masthead">
          <span className="asa-ast-seal" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M4 21V10l8-5 8 5v11" /><path d="M8 21v-7" /><path d="M12 21v-7" /><path d="M16 21v-7" /><path d="M3 10h18" /></svg>
          </span>
          <span className="asa-ast-mast-text">
            <span className="asa-ast-kicker">Permits &amp; Licensing</span>
            <span className="asa-ast-mast-title">{src.title || 'Your application status'}</span>
          </span>
        </div>

        <div className="asa-ast-body">
          <div className="asa-ast-head">
            <div className="asa-ast-id-wrap">
              {src.referenceNumber && <span className="asa-ast-reflabel">Ref no.</span>}
              {src.referenceNumber && <span className="asa-ast-num">{src.referenceNumber}</span>}
              {src.applicationType && <span className="asa-ast-type">{src.applicationType}</span>}
            </div>
            <span className={`asa-ast-stamp is-${bucket}`}>{statusLabel}</span>
          </div>

          <div className="asa-ast-track">
            {steps.map((step, i) => (
              <div className="asa-ast-step" key={`${step.label}-${i}`}>
                {i > 0 && <span className={`asa-ast-bar is-${step.state}`} aria-hidden="true" />}
                <span className="asa-ast-node">
                  <span className={`asa-ast-dot is-${step.state}`} aria-hidden="true">
                    {step.state === 'done' ? <Check /> : step.state === 'denied' ? <X /> : i + 1}
                  </span>
                  <span className={`asa-ast-step-label is-${step.state}`}>{step.label}</span>
                </span>
              </div>
            ))}
          </div>

          {src.nextActionText && (
            <div className="asa-ast-next">
              <span className="asa-ast-next-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
              </span>
              <span className="asa-ast-next-body">
                <span className="asa-ast-next-label">Next step</span>
                <span className="asa-ast-next-text">{src.nextActionText}</span>
              </span>
            </div>
          )}

          {src.submitText && (
            <button type="button" className="asa-ast-submit">{src.submitText}</button>
          )}
        </div>
      </div>
    </div>
  );
}
