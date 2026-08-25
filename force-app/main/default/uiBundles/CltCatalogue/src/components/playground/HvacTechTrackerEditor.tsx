import { CalendarClock, MessageSquare, Star } from 'lucide-react';
import type { HvacTechnician, HvacTechStep, HvacTechTrackerPayload } from './payloads';

/**
 * Live preview for the ASA HVAC · Technician ETA Tracker CLT (DTO field
 * hvacTechTrackerJSON). LWC-true fields: title?, status?, headline?, etaText?,
 * windowText?, updatedText?, technician{name,role?,rating?,photoUrl?,initials?,
 * skills?}, job{number?,type?,address?}, steps[]{label,state,timeText?},
 * submitText?, submitValue?, secondaryText?, secondaryValue?. An empty payload
 * (no headline / technician.name / steps) drops the preview into test-mode so
 * it renders with no payload — mirroring the LWC.
 */

type Status = 'scheduled' | 'dispatched' | 'enroute' | 'arriving' | 'onsite' | 'complete';
const STATUS_LABELS: Record<Status, string> = {
  scheduled: 'Scheduled',
  dispatched: 'Dispatched',
  enroute: 'On the way',
  arriving: 'Arriving now',
  onsite: 'On site',
  complete: 'Visit complete',
};

function normStatus(s?: string): Status {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'complete' || raw === 'completed' || raw === 'done' || raw === 'finished') return 'complete';
  if (raw === 'onsite' || raw === 'arrived' || raw === 'here') return 'onsite';
  if (raw === 'arriving' || raw === 'almost' || raw === 'nearby') return 'arriving';
  if (raw === 'dispatched' || raw === 'assigned') return 'dispatched';
  if (raw === 'scheduled' || raw === 'booked' || raw === 'confirmed') return 'scheduled';
  return 'enroute';
}

type StepState = 'done' | 'current' | 'todo';
function normState(s?: string): StepState {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'done' || raw === 'complete' || raw === 'completed') return 'done';
  if (raw === 'current' || raw === 'active' || raw === 'inprogress' || raw === 'progress') return 'current';
  return 'todo';
}

function deriveSteps(status: Status): { label: string; state: StepState }[] {
  const stages = ['Scheduled', 'Dispatched', 'En route', 'Arriving', 'On site'];
  const ci: Record<Status, number> = { scheduled: 0, dispatched: 1, enroute: 2, arriving: 3, onsite: 4, complete: 5 };
  const idx = ci[status];
  return stages.map((label, i) => ({ label, state: (i < idx ? 'done' : i === idx ? 'current' : 'todo') as StepState }));
}

const TEST: HvacTechTrackerPayload = {
  title: 'Your technician is on the way',
  status: 'enroute',
  headline: 'Marcus is heading to your home',
  etaText: 'Arriving in ~15 min',
  windowText: 'Arrival window 1:00–3:00 PM',
  updatedText: 'Updated 1 min ago',
  technician: { name: 'Marcus Reed', role: 'Senior HVAC Technician', rating: 4.9, initials: 'MR', skills: 'AC repair · Heat pumps' },
  job: { number: 'WO-48213', type: 'AC not cooling', address: '128 Maple Ave' },
  steps: [
    { label: 'Scheduled', state: 'done', timeText: '9:00 AM' },
    { label: 'Dispatched', state: 'done', timeText: '12:40 PM' },
    { label: 'En route', state: 'current', timeText: '1:05 PM' },
    { label: 'Arriving', state: 'todo' },
    { label: 'On site', state: 'todo' },
  ],
  submitText: 'Message technician',
  secondaryText: 'Reschedule visit',
};

/** Faithful preview: mirrors the Technician ETA Tracker LWC, including test-mode + derived track. */
export function HvacTechTrackerPreview({ value, accentColor }: { value: HvacTechTrackerPayload; accentColor: string }) {
  const tech: Partial<HvacTechnician> = value.technician ?? {};
  const hasContent = !!(value.headline || tech.name || (Array.isArray(value.steps) && value.steps.length));
  const isTestMode = !hasContent;
  const src = isTestMode ? TEST : value;

  const status = normStatus(src.status);
  const statusLabel = STATUS_LABELS[status];
  const t: Partial<HvacTechnician> = src.technician ?? {};
  const initials = (t.initials && String(t.initials).trim().slice(0, 2).toUpperCase())
    || String(t.name || '').split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    || 'HV';
  const rating = Number(t.rating);
  const hasRating = isFinite(rating) && rating > 0;

  const rawSteps: HvacTechStep[] = Array.isArray(src.steps) && src.steps.length ? src.steps.filter((s) => s && s.label) : deriveSteps(status);
  const steps = rawSteps.map((s) => ({ label: String(s.label), state: normState(s.state), timeText: s.timeText }));

  const job = src.job || {};
  const jobRows: [string, string][] = [];
  if (job.number) jobRows.push(['Job', String(job.number)]);
  if (job.type) jobRows.push(['Service', String(job.type)]);
  if (job.address) jobRows.push(['Address', String(job.address)]);

  return (
    <div className="clt-live-preview tech-tracker-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add a technician + status to preview your content</p>}

      {src.title && <h3 className="selector-title">{src.title}</h3>}

      <div className={`asa-tt-hero is-${status}`}>
        <div className="asa-tt-hero-top">
          <span className={`asa-tt-status is-${status}`}><span className="asa-tt-status-dot" aria-hidden="true" />{statusLabel}</span>
          {src.updatedText && <span className="asa-tt-updated">{src.updatedText}</span>}
        </div>
        {src.headline && <p className="asa-tt-headline">{src.headline}</p>}
        {(src.etaText || src.windowText) && (
          <div className="asa-tt-chips">
            {src.etaText && (
              <span className="asa-tt-chip is-eta">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                {src.etaText}
              </span>
            )}
            {src.windowText && (
              <span className="asa-tt-chip">
                <CalendarClock aria-hidden="true" />
                {src.windowText}
              </span>
            )}
          </div>
        )}
        {steps.length > 0 && (
          <ol className="asa-tt-track">
            {steps.map((s, i) => (
              <li key={i} className={`asa-tt-node is-${s.state}`}>
                <span className="asa-tt-node-mark" aria-hidden="true">
                  {s.state === 'done' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  ) : s.state === 'current' ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" /></svg>
                  ) : null}
                </span>
                <span className="asa-tt-node-label">{s.label}</span>
                {s.timeText && <span className="asa-tt-node-time">{s.timeText}</span>}
              </li>
            ))}
          </ol>
        )}
      </div>

      {t.name && (
        <div className="asa-tt-tech">
          <span className="asa-tt-avatar"><span className="asa-tt-avatar-fallback" aria-hidden="true">{initials}</span></span>
          <div className="asa-tt-tech-body">
            <div className="asa-tt-tech-line">
              <span className="asa-tt-tech-name">{t.name}</span>
              {hasRating && (
                <span className="asa-tt-rating"><Star aria-hidden="true" />{(Math.round(rating * 10) / 10).toFixed(1)}</span>
              )}
            </div>
            {t.role && <span className="asa-tt-tech-role">{t.role}</span>}
            {t.skills && <span className="asa-tt-tech-skills">{t.skills}</span>}
          </div>
        </div>
      )}

      {jobRows.length > 0 && (
        <div className="asa-tt-info">
          {jobRows.map(([k, v], i) => (
            <div className="asa-tt-row" key={i}><span className="asa-tt-row-k">{k}</span><span className="asa-tt-row-v">{v}</span></div>
          ))}
        </div>
      )}

      {src.submitText && (
        <button type="button" className="asa-tt-cta"><MessageSquare aria-hidden="true" /> {src.submitText}</button>
      )}
      {src.secondaryText && (
        <button type="button" className="asa-tt-cta is-ghost"><CalendarClock aria-hidden="true" /> {src.secondaryText}</button>
      )}
    </div>
  );
}
