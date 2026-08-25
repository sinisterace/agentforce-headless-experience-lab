import { Check, X, CircleAlert } from 'lucide-react';
import type { PseAppStatusPayload, PseAppStep } from './payloads';

/**
 * Live preview for the ASA Public Sector & Education · Application Status
 * Tracker CLT (DTO field pseAppStatusJSON). LWC-true fields: title?,
 * applicationType?, referenceNumber?, status?, statusLabel?, submittedText?,
 * updatedText?, steps?[{label,state,timeText?}], nextActionText?, submitText?,
 * submitValue?. An empty payload (no referenceNumber/applicationType/steps)
 * drops the preview into test-mode — mirroring the deployed LWC.
 */

const TEST: PseAppStatusPayload = {
  title: 'Your application status',
  applicationType: 'Building permit',
  referenceNumber: 'APP-2026-1043',
  status: 'review',
  statusLabel: 'Under review',
  submittedText: 'Submitted Sep 3',
  updatedText: 'Updated 2 days ago',
  steps: [
    { label: 'Submitted', state: 'done', timeText: 'Sep 3' },
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

/** Faithful preview: mirrors the Application Status Tracker LWC, including test-mode + derived track. */
export function PseAppStatusPreview({ value, accentColor }: { value: PseAppStatusPayload; accentColor: string }) {
  const hasContent = !!(value.referenceNumber || value.applicationType || (Array.isArray(value.steps) && value.steps.length));
  const isTestMode = !hasContent;
  const src = isTestMode ? TEST : value;

  const bucket = statusOf(src.status);
  const statusLabel = src.statusLabel || src.status || bucket;
  const rawSteps: PseAppStep[] =
    Array.isArray(src.steps) && src.steps.length ? src.steps.filter((s) => s && s.label) : deriveSteps(bucket);
  const steps = rawSteps.map((s) => ({ label: String(s.label), state: stepStateOf(s.state), timeText: s.timeText }));

  return (
    <div className="clt-live-preview app-status-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add an application to preview your content</p>}
      {src.title && <h3 className="selector-title">{src.title}</h3>}

      <div className={`asa-ast is-${bucket}`}>
        <div className="asa-ast-head">
          <div className="asa-ast-id-wrap">
            {src.referenceNumber && <span className="asa-ast-num">{src.referenceNumber}</span>}
            {src.applicationType && <span className="asa-ast-type">{src.applicationType}</span>}
          </div>
          <span className={`asa-ast-status is-${bucket}`}>{statusLabel}</span>
        </div>

        <div className="asa-ast-track">
          {steps.map((step, i) => (
            <div className="asa-ast-step" key={`${step.label}-${i}`}>
              {i > 0 && <span className={`asa-ast-bar is-${step.state}`} aria-hidden="true" />}
              <span className="asa-ast-node">
                <span className={`asa-ast-dot is-${step.state}`} aria-hidden="true">
                  {step.state === 'done' && <Check />}
                  {step.state === 'denied' && <X />}
                </span>
                <span className={`asa-ast-step-label is-${step.state}`}>{step.label}</span>
                {step.timeText && <span className="asa-ast-step-time">{step.timeText}</span>}
              </span>
            </div>
          ))}
        </div>

        {src.nextActionText && (
          <div className="asa-ast-next">
            <span className="asa-ast-next-ico" aria-hidden="true"><CircleAlert /></span>
            <span className="asa-ast-next-text">{src.nextActionText}</span>
          </div>
        )}

        {(src.submittedText || src.updatedText) && (
          <div className="asa-ast-foot">
            {src.submittedText && <span className="asa-ast-date">{src.submittedText}</span>}
            {src.updatedText && <span className="asa-ast-date">{src.updatedText}</span>}
          </div>
        )}
      </div>

      {src.submitText && (
        <button type="button" className="asa-ast-submit">{src.submitText}</button>
      )}
    </div>
  );
}
