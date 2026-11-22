import { num } from '../ecwFormat';
import './EcwOpenRolesCard.css';

/** React preview mirror of the deployed `ecwOpenRoles` LWC (HR · Open roles) —
 *  a recruiting requisition ledger: icon header + context, a requisition table
 *  with stage chips and a right-aligned candidate column, and a summary total. */
export type EcwRole = { title: string; dept?: string; stage?: string; daysOpen: number; candidates: number; hiringManager?: string; state: 'ok' | 'warn' | 'bad' };
export type EcwOpenRolesPayload = { headline?: string; roles: EcwRole[] };

export const OPEN_ROLES_TEST: EcwOpenRolesPayload = {
  headline: '5 open roles',
  roles: [
    { title: 'Field Installation Technician', dept: 'Installation & Field', stage: 'Interviewing', daysOpen: 22, candidates: 6, hiringManager: 'Alex Monroe', state: 'ok' },
    { title: 'Enterprise Account Executive', dept: 'Sales', stage: 'Offer out', daysOpen: 41, candidates: 2, hiringManager: 'Jordan Lee', state: 'warn' },
    { title: 'Support Engineer', dept: 'Customer Service', stage: 'Sourcing', daysOpen: 9, candidates: 14, hiringManager: 'Priya Nair', state: 'ok' },
    { title: 'Security Systems Architect', dept: 'IT', stage: 'Interviewing', daysOpen: 55, candidates: 3, hiringManager: 'Devin Clark', state: 'bad' },
    { title: 'Staff Accountant', dept: 'Finance & Admin', stage: 'Screening', daysOpen: 17, candidates: 8, hiringManager: 'Rosa Behn', state: 'ok' },
  ],
};

export function EcwOpenRolesCard({ value }: { value?: Partial<EcwOpenRolesPayload> }) {
  const hasContent = !!(value && Array.isArray(value.roles) && value.roles.length);
  const src: EcwOpenRolesPayload = hasContent ? ({ ...OPEN_ROLES_TEST, ...value } as EcwOpenRolesPayload) : OPEN_ROLES_TEST;

  const list = (src.roles || []).filter((r) => r && r.title);
  let totalCand = 0, offers = 0, totalDays = 0;
  const depts = new Set<string>();
  const rows = list.map((r, i) => {
    const state = ['ok', 'warn', 'bad'].includes(r.state) ? r.state : 'ok';
    const cand = num(r.candidates); const days = num(r.daysOpen);
    const stage = r.stage?.trim() || '';
    totalCand += cand; totalDays += days;
    if (stage.toLowerCase().includes('offer')) offers += 1;
    if (r.dept?.trim()) depts.add(r.dept.trim());
    return {
      key: `r-${i}`, num: String(i + 1).padStart(2, '0'), title: r.title.trim(), dept: r.dept?.trim() || '',
      stage, stageClass: `ecw-or-stage is-${state}`, daysText: `${days}d`, daysClass: `ecw-or-tdays is-${state}`,
      candidates: cand, hiringManager: r.hiringManager?.trim() || '', hasHm: !!r.hiringManager?.trim(),
    };
  });
  const n = list.length;
  const avgDays = `${n ? Math.round(totalDays / n) : 0}d`;

  return (
    <div className="clt-live-preview ecw-or">
      <div className="ecw-or-cart">
        <span className="ecw-or-cart-ico" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
          </svg>
        </span>
        <div className="ecw-or-cart-body">
          <div className="ecw-or-cart-top">
            <h3 className="ecw-or-title">Open roles</h3>
            {src.headline ? <span className="ecw-or-cart-pill">{src.headline}</span> : null}
          </div>
          <p className="ecw-or-cart-line">
            <span className="ecw-or-cart-kv"><span className="ecw-or-cart-key">Depts</span><span className="ecw-or-cart-val">{String(depts.size)}</span></span>
            <span className="ecw-or-cart-kv"><span className="ecw-or-cart-key">Offers out</span><span className="ecw-or-cart-val">{String(offers)}</span></span>
            <span className="ecw-or-cart-kv"><span className="ecw-or-cart-key">Avg age</span><span className="ecw-or-cart-val">{avgDays}</span></span>
          </p>
        </div>
      </div>

      {rows.length ? (
        <>
          <div className="ecw-or-lines">
            <span className="ecw-or-section-title">Requisitions</span>
            <div className="ecw-or-table">
              <div className="ecw-or-thead" aria-hidden="true"><span>#</span><span>Role</span><span className="ecw-or-th-cand">Cand.</span></div>
              {rows.map((r) => (
                <div key={r.key} className="ecw-or-trow">
                  <span className="ecw-or-tnum">{r.num}</span>
                  <span className="ecw-or-tdesc">
                    <span className="ecw-or-tname">{r.title}</span>
                    <span className="ecw-or-tmeta">
                      {r.dept ? <span className="ecw-or-tdept">{r.dept}</span> : null}
                      {r.stage ? <span className={r.stageClass}>{r.stage}</span> : null}
                      <span className={r.daysClass}>{r.daysText} open</span>
                      {r.hasHm ? <span className="ecw-or-thm">HM <b>{r.hiringManager}</b></span> : null}
                    </span>
                  </span>
                  <span className="ecw-or-tcand"><span className="ecw-or-tcand-n">{r.candidates}</span><span className="ecw-or-tcand-l">cand</span></span>
                </div>
              ))}
            </div>
          </div>

          <div className="ecw-or-details">
            <div className="ecw-or-sum">
              <div className="ecw-or-sum-row"><span className="ecw-or-sum-key">In pipeline</span><span className="ecw-or-sum-val">{String(totalCand)}</span></div>
              <div className="ecw-or-sum-row"><span className="ecw-or-sum-key">Avg days open</span><span className="ecw-or-sum-val">{avgDays}</span></div>
              <div className="ecw-or-sum-row ecw-or-sum-total"><span className="ecw-or-sum-key">Open roles</span><span className="ecw-or-sum-val">{String(n)}</span></div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
