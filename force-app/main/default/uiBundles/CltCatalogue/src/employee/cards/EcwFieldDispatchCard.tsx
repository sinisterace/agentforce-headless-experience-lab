import { useState } from 'react';
import person1 from '@/assets/people/person1.jpg';
import person2 from '@/assets/people/person2.jpg';
import person3 from '@/assets/people/person3.jpg';
import './EcwFieldDispatchCard.css';

/** React preview mirror of the deployed `ecwFieldDispatch` LWC (Service · Field dispatch):
 *  an at-risk appointment header, a live dispatch map (job-site pin + technician headshot
 *  markers + routes), and ranked candidate technicians (fit, skills/load bars, ETA, rating)
 *  with select + confirm. */
const PHOTOS = [person1, person2, person3];

export type EcwFdCandidate = {
  name: string; status?: string; fit: number; rating?: number; etaMin: number;
  distanceKm: number; skillsMatch: number; utilization: number; best?: boolean;
  pos?: { top: number; left: number };
};
export type EcwFdAppointment = {
  number?: string; customer?: string; jobType?: string; address?: string; window?: string;
  slaText?: string; slaState?: 'ok' | 'warn' | 'bad'; priority?: string; currentTech?: string; currentIssue?: string;
};
export type EcwFieldDispatchPayload = {
  title?: string; appointment?: EcwFdAppointment; site?: { top: number; left: number }; candidates: EcwFdCandidate[];
};

export const FIELD_DISPATCH_TEST: EcwFieldDispatchPayload = {
  title: 'Reassign at-risk appointment',
  appointment: {
    number: 'SA-10427', customer: 'Northwind Traders', jobType: 'HVAC — no cooling',
    address: '1200 W 5th St, Austin TX', window: 'Today · 2:00–4:00 PM',
    slaText: 'SLA breaches in 48m', slaState: 'bad', priority: 'High',
    currentTech: 'Marcus Hale', currentIssue: 'Running 55m behind on a prior job',
  },
  site: { top: 46, left: 50 },
  candidates: [
    { name: 'Dana Price', status: 'Available now', fit: 94, rating: 4.9, etaMin: 12, distanceKm: 3.1, skillsMatch: 100, utilization: 62, best: true, pos: { top: 30, left: 24 } },
    { name: 'Grace Lin', status: 'Finishing nearby', fit: 81, rating: 4.7, etaMin: 23, distanceKm: 5.4, skillsMatch: 80, utilization: 78, pos: { top: 70, left: 70 } },
    { name: 'Omar Haddad', status: 'Available now', fit: 68, rating: 4.8, etaMin: 34, distanceKm: 8.9, skillsMatch: 60, utilization: 45, pos: { top: 24, left: 78 } },
  ],
};

export function EcwFieldDispatchCard({ value }: { value?: Partial<EcwFieldDispatchPayload> }) {
  const hasContent = !!(value && Array.isArray(value.candidates) && value.candidates.length);
  const src: EcwFieldDispatchPayload = hasContent ? ({ ...FIELD_DISPATCH_TEST, ...value } as EcwFieldDispatchPayload) : FIELD_DISPATCH_TEST;
  const a = src.appointment || {};
  const slaState = a.slaState && ['ok', 'warn', 'bad'].includes(a.slaState) ? a.slaState : 'warn';
  const site = src.site || { top: 46, left: 50 };
  const cands = (src.candidates || []).filter((c) => c && c.name);
  const best = cands.find((c) => c.best) || cands[0];
  const bestEta = best && best.etaMin ? `${Math.round(best.etaMin)} min` : '';

  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState<EcwFdCandidate | null>(null);

  const pick = (i: number) => { if (!done) setSelected(selected === i ? null : i); };
  const confirm = () => { if (selected == null || done) return; setDone(cands[selected]); };

  const fitClass = (fit: number) => `ecw-fd-fit ${fit >= 85 ? 'is-high' : fit >= 70 ? 'is-mid' : 'is-low'}`;

  return (
    <div className="clt-live-preview ecw-fd">
      {/* appointment context */}
      <div className="ecw-fd-head">
        <div className="ecw-fd-head-top">
          <span className="ecw-fd-eyebrow">Dispatch</span>
          {a.slaText ? <span className={`ecw-fd-sla is-${slaState}`}>{a.slaText}</span> : null}
        </div>
        <div className="ecw-fd-appt">
          <div className="ecw-fd-appt-main">
            <span className="ecw-fd-appt-cust">{a.customer}</span>
            <span className="ecw-fd-appt-sub">
              {a.number ? <span className="ecw-fd-appt-num">{a.number}</span> : null}
              {a.jobType ? <span>· {a.jobType}</span> : null}
            </span>
          </div>
          {a.priority ? <span className="ecw-fd-prio">{a.priority}</span> : null}
        </div>
        <div className="ecw-fd-meta">
          {a.window ? <span className="ecw-fd-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>{a.window}</span> : null}
          {a.address ? <span className="ecw-fd-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-5.3-7-11a7 7 0 0 1 14 0c0 5.7-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>{a.address}</span> : null}
        </div>
        {(a.currentTech || a.currentIssue) ? (
          <div className="ecw-fd-current">
            <span className="ecw-fd-current-dot" aria-hidden="true" />
            <span className="ecw-fd-current-text">{a.currentTech} · {a.currentIssue}</span>
          </div>
        ) : null}
      </div>

      {/* live dispatch map */}
      <div className="ecw-fd-map">
        <div className="ecw-fd-map-head">
          <span className="ecw-fd-map-title">Nearby technicians</span>
          <span className="ecw-fd-live"><span className="ecw-fd-live-dot" aria-hidden="true" />LIVE</span>
        </div>
        <div className="ecw-fd-canvas">
          <svg className="ecw-fd-mapbase" viewBox="0 0 400 220" preserveAspectRatio="none" aria-hidden="true">
            {/* land */}
            <rect width="400" height="220" fill="#edf0f5" />
            {/* green space */}
            <rect x="14" y="150" width="76" height="58" rx="6" fill="#dcebd4" />
            <path d="M312,150 q40,-8 74,8 l0,50 -74,0 z" fill="#dcebd4" />
            {/* water */}
            <ellipse cx="352" cy="34" rx="44" ry="26" fill="#d1e3f3" />
            {/* building blocks */}
            <g fill="#e4e8f0">
              <rect x="14" y="12" width="74" height="34" rx="3" /><rect x="120" y="12" width="76" height="34" rx="3" /><rect x="228" y="12" width="66" height="30" rx="3" />
              <rect x="14" y="70" width="74" height="46" rx="3" /><rect x="120" y="70" width="76" height="46" rx="3" /><rect x="228" y="70" width="68" height="46" rx="3" />
              <rect x="322" y="86" width="64" height="30" rx="3" /><rect x="120" y="142" width="76" height="60" rx="3" /><rect x="228" y="142" width="68" height="60" rx="3" />
            </g>
            <g fill="#e9edf4">
              <rect x="40" y="12" width="24" height="34" rx="2" /><rect x="150" y="70" width="26" height="46" rx="2" /><rect x="250" y="142" width="24" height="60" rx="2" />
            </g>
            {/* minor streets */}
            <g stroke="#e6eaf1" strokeWidth="4" fill="none">
              <line x1="56" y1="0" x2="56" y2="220" /><line x1="156" y1="0" x2="156" y2="220" /><line x1="260" y1="0" x2="260" y2="220" /><line x1="356" y1="0" x2="356" y2="220" /><line x1="0" y1="96" x2="400" y2="96" />
            </g>
            {/* arterial casing */}
            <g stroke="#d7dce6" strokeWidth="13" fill="none">
              <line x1="0" y1="56" x2="400" y2="56" /><line x1="0" y1="128" x2="400" y2="128" /><line x1="104" y1="0" x2="104" y2="220" /><line x1="208" y1="0" x2="208" y2="220" /><line x1="308" y1="0" x2="308" y2="220" />
            </g>
            {/* arterial fill */}
            <g stroke="#ffffff" strokeWidth="9" fill="none">
              <line x1="0" y1="56" x2="400" y2="56" /><line x1="0" y1="128" x2="400" y2="128" /><line x1="104" y1="0" x2="104" y2="220" /><line x1="208" y1="0" x2="208" y2="220" /><line x1="308" y1="0" x2="308" y2="220" />
            </g>
            {/* centre lane dashes */}
            <g stroke="#e5e8ef" strokeWidth="1.2" strokeDasharray="7,8" fill="none">
              <line x1="0" y1="56" x2="400" y2="56" /><line x1="0" y1="128" x2="400" y2="128" /><line x1="104" y1="0" x2="104" y2="220" /><line x1="208" y1="0" x2="208" y2="220" /><line x1="308" y1="0" x2="308" y2="220" />
            </g>
            {/* street labels */}
            <text x="150" y="53" className="ecw-fd-street">W 5th St</text>
            <text x="206" y="150" className="ecw-fd-street" transform="rotate(-90 206 150)">Lavaca</text>
            {/* active route: casing + animated flow + moving vehicle */}
            <path id="fdRoute" d="M104,70 L104,128 L208,128 L208,101" fill="none" stroke="#1d4ed8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.2" />
            <path className="ecw-fd-route" d="M104,70 L104,128 L208,128 L208,101" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle className="ecw-fd-veh" r="3.4" fill="#1d4ed8" stroke="#fff" strokeWidth="1.4">
              <animateMotion dur="4.5s" repeatCount="indefinite" rotate="auto"><mpath href="#fdRoute" /></animateMotion>
            </circle>
          </svg>

          <div className="ecw-fd-site" style={{ top: `${site.top}%`, left: `${site.left}%` }}>
            <span className="ecw-fd-site-pulse" aria-hidden="true" />
            <svg className="ecw-fd-site-pin" viewBox="0 0 32 40" aria-hidden="true"><path d="M16 2C9.4 2 4 7.4 4 14c0 8.75 12 24 12 24s12-15.25 12-24C28 7.4 22.6 2 16 2z" fill="#dc2626" stroke="#fff" strokeWidth="1.6" /><circle cx="16" cy="14" r="4.6" fill="#fff" /></svg>
            <span className="ecw-fd-site-label">Job site</span>
          </div>

          {cands.map((c, i) => {
            const pos = c.pos || { top: 30 + i * 20, left: 24 + i * 26 };
            const cls = `ecw-fd-mk${c.best ? ' is-best' : ''}${selected === i ? ' is-selected' : ''}`;
            return (
              <div key={i} className={cls} style={{ top: `${pos.top}%`, left: `${pos.left}%` }}>
                <span className="ecw-fd-mk-pulse" aria-hidden="true" />
                <img className="ecw-fd-mk-photo" src={PHOTOS[i % PHOTOS.length]} alt={c.name} loading="lazy" />
                {c.best ? <span className="ecw-fd-mk-badge">Best</span> : null}
              </div>
            );
          })}

          {bestEta ? (
            <span className="ecw-fd-eta" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
              {bestEta}
            </span>
          ) : null}
        </div>
      </div>

      {/* candidate technicians */}
      {cands.length > 0 && (
        <div className="ecw-fd-list">
          <span className="ecw-fd-list-title">{src.title || 'Suggested reassignment'}</span>
          {cands.map((c, i) => (
            <button
              key={i}
              type="button"
              className={`ecw-fd-cand${selected === i ? ' is-selected' : ''}${c.best ? ' is-best' : ''}`}
              aria-pressed={selected === i}
              onClick={() => pick(i)}
            >
              <span className={`ecw-fd-radio${selected === i ? ' on' : ''}`} aria-hidden="true" />
              <img className="ecw-fd-cand-photo" src={PHOTOS[i % PHOTOS.length]} alt={c.name} loading="lazy" />
              <span className="ecw-fd-cand-body">
                <span className="ecw-fd-cand-top">
                  <span className="ecw-fd-cand-name">{c.name}</span>
                  {c.best ? <span className="ecw-fd-cand-best">Best match</span> : null}
                </span>
                <span className="ecw-fd-cand-meta">
                  {c.status ? <span className="ecw-fd-cand-status">{c.status}</span> : null}
                  <span className="ecw-fd-cand-eta">{Math.round(c.etaMin)} min ETA · {c.distanceKm} km</span>
                  {c.rating ? <span className="ecw-fd-cand-rating">{Number(c.rating).toFixed(1)}★</span> : null}
                </span>
                <span className="ecw-fd-cand-bars">
                  <span className="ecw-fd-bar">
                    <span className="ecw-fd-bar-label">Skills</span>
                    <span className="ecw-fd-bar-track"><span className="ecw-fd-bar-fill is-skills" style={{ width: `${c.skillsMatch}%` }} /></span>
                  </span>
                  <span className="ecw-fd-bar">
                    <span className="ecw-fd-bar-label">Load</span>
                    <span className="ecw-fd-bar-track"><span className="ecw-fd-bar-fill is-util" style={{ width: `${c.utilization}%` }} /></span>
                  </span>
                </span>
              </span>
              <span className={fitClass(c.fit)}>
                <span className="ecw-fd-fit-num">{Math.round(c.fit)}</span>
                <span className="ecw-fd-fit-label">fit</span>
              </span>
            </button>
          ))}

          {selected != null && !done && (
            <button type="button" className="ecw-fd-confirm" onClick={confirm}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
              Reassign to {cands[selected].name}
            </button>
          )}

          {done && (
            <div className="ecw-fd-done">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
              <span>{a.number || 'Appointment'} reassigned to {done.name} — {Math.round(done.etaMin)} min ETA</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
