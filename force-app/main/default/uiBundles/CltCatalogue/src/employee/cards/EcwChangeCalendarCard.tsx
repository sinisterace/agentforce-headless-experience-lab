import './EcwChangeCalendarCard.css';

/** React preview mirror of the deployed `ecwChangeCalendar` LWC (IT · Change calendar).
 *  Hero upcoming-change count + a vertical timeline of flat date chips and change blocks. */
export type EcwChange = { title: string; when?: string; risk?: 'low' | 'medium' | 'high'; state?: string; impact?: string };
export type EcwChangeCalendarPayload = { headline?: string; changes: EcwChange[] };

const RISK_STATE: Record<string, string> = { low: 'low', medium: 'med', high: 'high' };

export const CHANGE_CALENDAR_TEST: EcwChangeCalendarPayload = {
  headline: '3 changes this week',
  changes: [
    { title: 'VPN gateway upgrade', when: 'Sat 11:00 PM', risk: 'low', state: 'Scheduled', impact: 'Remote access briefly unavailable (~15 min) during the cutover.' },
    { title: 'Workday quarterly update', when: 'Sun 6:00 AM', risk: 'medium', state: 'Scheduled', impact: 'HR self-service read-only for ~2 hours; payroll unaffected.' },
    { title: 'Badge system firmware patch', when: 'Tue 7:00 PM', risk: 'low', state: 'Approved', impact: 'No expected downtime; readers update in rolling batches.' },
  ],
};

export function EcwChangeCalendarCard({ value }: { value?: Partial<EcwChangeCalendarPayload> }) {
  const hasContent = !!(value && Array.isArray(value.changes) && value.changes.length);
  const src: EcwChangeCalendarPayload = hasContent ? ({ ...CHANGE_CALENDAR_TEST, ...value } as EcwChangeCalendarPayload) : CHANGE_CALENDAR_TEST;
  const list = (src.changes || []).filter((c) => c && c.title);
  const changes = list.map((c, i) => {
    const risk = (['low', 'medium', 'high'].includes(c.risk as never) ? c.risk : 'low') as string;
    const r = RISK_STATE[risk];
    const when = (c.when ? String(c.when).trim() : '').split(/\s+/);
    return {
      key: i, day: when[0] || '', time: when.slice(1).join(' '), title: c.title.trim(),
      riskLabel: `${risk.charAt(0).toUpperCase()}${risk.slice(1)} risk`, r,
      state: c.state ? String(c.state).trim() : '', impact: c.impact ? String(c.impact).trim() : '',
      isLast: i === list.length - 1,
    };
  });
  const count = changes.length;
  const countUnit = count === 1 ? 'upcoming change' : 'upcoming changes';

  return (
    <div className="clt-live-preview ecw-cc">
      <div className="ecw-cc-hero">
        <span className="ecw-cc-hero-label">Scheduled changes</span>
        <div className="ecw-cc-hero-row">
          <strong className="ecw-cc-hero-val">{count}</strong>
          <span className="ecw-cc-hero-unit">{countUnit}</span>
        </div>
        {src.headline ? <span className="ecw-cc-hero-meta">{src.headline}</span> : null}
      </div>
      <div className="ecw-cc-timeline">
        {changes.map((c) => (
          <div key={c.key} className={`ecw-cc-item${c.isLast ? ' is-last' : ''}`}>
            <div className={`ecw-cc-cal is-${c.r}`}>
              <span className="ecw-cc-cal-day">{c.day}</span>
              <span className="ecw-cc-cal-time">{c.time}</span>
            </div>
            <div className="ecw-cc-rail"><span className={`ecw-cc-node is-${c.r}`} /></div>
            <div className="ecw-cc-block">
              <div className="ecw-cc-block-top">
                <span className="ecw-cc-title">{c.title}</span>
                <span className={`ecw-cc-risk is-${c.r}`}>{c.riskLabel}</span>
              </div>
              {c.impact ? <p className="ecw-cc-impact">{c.impact}</p> : null}
              {c.state ? <span className="ecw-cc-state">{c.state}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
