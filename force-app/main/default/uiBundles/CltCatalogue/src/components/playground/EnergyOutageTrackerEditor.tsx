import { Bell, MapPin } from 'lucide-react';
import type { EnergyOutageStep, EnergyOutageTrackerPayload } from './payloads';
import { OUTAGE_STATUS_LABELS, deriveOutageSteps, normOutageStatus, normStepState } from './energyFormat';

/**
 * Live preview for the ASA Energy & Utilities · Outage
 * Tracker CLT (DTO field energyOutageTrackerJSON). LWC-true fields: title?,
 * status?, headline?, area?, cause?, affectedText?, etaText?, updatedText?,
 * crew?, steps[]{label,state,timeText?}, submitText?, submitValue?. An empty
 * payload (no headline/area/cause/steps) drops the preview into test-mode so it
 * renders with no payload — mirroring the LWC.
 */


const TEST: EnergyOutageTrackerPayload = {
  title: 'Outage status',
  status: 'restoring',
  headline: 'Crews are on site restoring power',
  area: 'Maple Grove · ZIP 55311',
  cause: 'Storm — downed line',
  affectedText: '1,240 customers affected',
  etaText: 'Est. restore by 6:45 PM',
  updatedText: 'Updated 4 min ago',
  crew: 'Crew #17 on site',
  steps: [
    { label: 'Outage detected', state: 'done', timeText: '3:02 PM' },
    { label: 'Crew dispatched', state: 'done', timeText: '3:40 PM' },
    { label: 'On site — repairing', state: 'current', timeText: '5:15 PM' },
    { label: 'Power restored', state: 'todo' },
  ],
  submitText: 'Text me when power is back',
};

/** Faithful preview: mirrors the Outage Tracker LWC, including test-mode + derived track. */
export function EnergyOutageTrackerPreview({ value, accentColor }: { value: EnergyOutageTrackerPayload; accentColor: string }) {
  const hasContent = !!(value.headline || value.area || value.cause || (Array.isArray(value.steps) && value.steps.length));
  const isTestMode = !hasContent;
  const src = isTestMode ? TEST : value;

  const status = normOutageStatus(src.status);
  const statusLabel = OUTAGE_STATUS_LABELS[status];
  const rawSteps: EnergyOutageStep[] = Array.isArray(src.steps) && src.steps.length ? src.steps.filter((s) => s && s.label) : deriveOutageSteps(status);
  const steps = rawSteps.map((s) => ({ label: String(s.label), state: normStepState(s.state), timeText: s.timeText }));
  const info: [string, string][] = [];
  if (src.cause) info.push(['Cause', src.cause]);
  if (src.affectedText) info.push(['Affected', src.affectedText]);
  if (src.crew) info.push(['Crew', src.crew]);

  return (
    <div className="clt-live-preview outage-tracker-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add an outage to preview your content</p>}

      <div className={`asa-out-hero is-${status}`}>
        <div className="asa-out-hero-top">
          <span className={`asa-out-status is-${status}`}><span className="asa-out-status-dot" aria-hidden="true" />{statusLabel}</span>
          {src.updatedText && <span className="asa-out-updated">{src.updatedText}</span>}
        </div>
        {src.headline && <p className="asa-out-headline">{src.headline}</p>}
        {src.area && <p className="asa-out-area"><MapPin aria-hidden="true" />{src.area}</p>}
        {steps.length > 0 && (
          <ol className="asa-out-track">
            {steps.map((s, i) => (
              <li key={i} className={`asa-out-node is-${s.state}`}>
                <span className="asa-out-node-mark" aria-hidden="true">
                  {s.state === 'done' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  ) : s.state === 'current' ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" /></svg>
                  ) : null}
                </span>
                <span className="asa-out-node-label">{s.label}</span>
                {s.timeText && <span className="asa-out-node-time">{s.timeText}</span>}
              </li>
            ))}
          </ol>
        )}
      </div>

      {(info.length > 0 || src.etaText) && (
        <div className="asa-out-info">
          {info.map(([k, v], i) => (
            <div className="asa-out-row" key={i}><span className="asa-out-row-k">{k}</span><span className="asa-out-row-v">{v}</span></div>
          ))}
          {src.etaText && <div className="asa-out-row is-eta"><span className="asa-out-row-k">Est. restore</span><span className="asa-out-row-v">{src.etaText}</span></div>}
        </div>
      )}

      {src.submitText && (
        <button type="button" className="asa-out-cta"><Bell aria-hidden="true" /> {src.submitText}</button>
      )}
    </div>
  );
}
