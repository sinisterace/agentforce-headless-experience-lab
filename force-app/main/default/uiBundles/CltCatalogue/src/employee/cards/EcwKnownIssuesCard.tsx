import './EcwKnownIssuesCard.css';

/** React preview mirror of the deployed `ecwKnownIssues` LWC (IT · Known issues).
 *  Hero active-incident count + a left severity rail per incident with hairline fields. */
export type EcwIncident = { id?: string; title: string; severity?: 'P1' | 'P2' | 'P3'; state?: string; started?: string; impact?: string; workaround?: string; update?: string };
export type EcwKnownIssuesPayload = { openCount?: number; headline?: string; incidents: EcwIncident[] };

const SEV_STATE: Record<string, string> = { P1: 'bad', P2: 'warn', P3: 'info' };

export const KNOWN_ISSUES_TEST: EcwKnownIssuesPayload = {
  openCount: 2, headline: '2 active incidents',
  incidents: [
    { id: 'INC-20481', title: 'Badge Access System — intermittent reader timeouts', severity: 'P2', state: 'Investigating', started: '1h 20m ago', impact: 'HQ east-entrance badge readers; some employees see delayed unlocks.', workaround: 'Use the main-lobby reader or ask the front desk for a manual override.', update: 'Engineering identified a firmware regression; a fix is rolling out across readers.' },
    { id: 'INC-20474', title: 'Camera Cloud — slower video uploads', severity: 'P3', state: 'Monitoring', started: '3h ago', impact: 'Recorded clips take longer than usual to appear in Camera Cloud.', workaround: 'No action needed; uploads are completing, just delayed.', update: 'A capacity fix was applied; latency is recovering and being monitored.' },
  ],
};

export function EcwKnownIssuesCard({ value }: { value?: Partial<EcwKnownIssuesPayload> }) {
  const hasContent = !!(value && Array.isArray(value.incidents) && value.incidents.length);
  const src: EcwKnownIssuesPayload = hasContent ? ({ ...KNOWN_ISSUES_TEST, ...value } as EcwKnownIssuesPayload) : KNOWN_ISSUES_TEST;
  const incidents = (src.incidents || []).filter((i) => i && i.title).map((i, idx) => {
    const sev = (['P1', 'P2', 'P3'].includes(i.severity as never) ? i.severity : 'P3') as string;
    const st = SEV_STATE[sev];
    const fields: { key: string; label: string; value: string }[] = [];
    if (i.impact) fields.push({ key: `${idx}i`, label: 'Impact', value: String(i.impact).trim() });
    if (i.workaround) fields.push({ key: `${idx}w`, label: 'Workaround', value: String(i.workaround).trim() });
    if (i.update) fields.push({ key: `${idx}u`, label: 'Latest update', value: String(i.update).trim() });
    return { key: idx, title: i.title.trim(), sev, st, state: i.state ? String(i.state).trim() : '', started: i.started ? String(i.started).trim() : '', id: i.id ? String(i.id).trim() : '', fields };
  });
  const count = incidents.length;
  const countUnit = count === 1 ? 'open incident' : 'open incidents';

  return (
    <div className="clt-live-preview ecw-ki">
      <div className="ecw-ki-hero">
        <span className="ecw-ki-hero-label"><span className="ecw-ki-live" />Active incidents</span>
        <div className="ecw-ki-hero-row">
          <strong className="ecw-ki-hero-val">{count}</strong>
          <span className="ecw-ki-hero-unit">{countUnit}</span>
        </div>
        {src.headline ? <span className="ecw-ki-hero-meta">{src.headline}</span> : null}
      </div>
      <ul className="ecw-ki-list">
        {incidents.map((i) => (
          <li key={i.key} className={`ecw-ki-row is-${i.st}`}>
            <span className="ecw-ki-rail" />
            <div className="ecw-ki-content">
              <div className="ecw-ki-top">
                <span className={`ecw-ki-sev is-${i.st}`}>{i.sev}</span>
                <span className="ecw-ki-title">{i.title}</span>
              </div>
              <div className="ecw-ki-meta">
                {i.state ? <span className="ecw-ki-state">{i.state}</span> : null}
                {i.started ? <span className="ecw-ki-started"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>{i.started}</span> : null}
                {i.id ? <span className="ecw-ki-id">{i.id}</span> : null}
              </div>
              <dl className="ecw-ki-fields">
                {i.fields.map((f) => (
                  <div key={f.key} className="ecw-ki-field"><dt>{f.label}</dt><dd>{f.value}</dd></div>
                ))}
              </dl>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
