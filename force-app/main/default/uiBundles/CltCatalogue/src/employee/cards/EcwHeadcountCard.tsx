import { num } from '../ecwFormat';
import './EcwHeadcountCard.css';

/** React preview mirror of the deployed `ecwHeadcount` LWC (HR · Headcount) —
 *  a quote-builder "ledger": icon header + growth pill, a department table with
 *  share-of-total bars, and a summary ending on a prominent total. */
export type EcwDept = { name: string; count: number };
export type EcwHeadcountPayload = { periodLabel?: string; total?: number; growthText?: string; openRoles?: number; depts: EcwDept[] };

export const HEADCOUNT_TEST: EcwHeadcountPayload = {
  periodLabel: 'Company headcount', total: 482, growthText: '+18 this quarter', openRoles: 11,
  depts: [
    { name: 'Operations', count: 168 }, { name: 'Sales', count: 92 }, { name: 'Customer Service', count: 76 },
    { name: 'Installation & Field', count: 64 }, { name: 'IT', count: 28 }, { name: 'Finance & Admin', count: 24 },
    { name: 'People & HR', count: 16 }, { name: 'Marketing', count: 14 },
  ],
};

export function EcwHeadcountCard({ value }: { value?: Partial<EcwHeadcountPayload> }) {
  const hasContent = !!(value && Array.isArray(value.depts) && value.depts.length);
  const src: EcwHeadcountPayload = hasContent ? ({ ...HEADCOUNT_TEST, ...value } as EcwHeadcountPayload) : HEADCOUNT_TEST;

  const eyebrow = src.periodLabel?.trim() || 'Headcount';
  const growthText = src.growthText?.trim() || '';
  const pillClass = `ecw-hc-pill${growthText.startsWith('-') ? ' is-down' : ''}`;
  const open = num(src.openRoles);
  const hasOpenRoles = open > 0;

  const list = (src.depts || []).filter((d) => d && d.name).slice().sort((a, b) => num(b.count) - num(a.count));
  const sum = list.reduce((a, d) => a + num(d.count), 0);
  const total = num(src.total) || sum;
  const denom = total || 1;
  const rows = list.map((d, i) => {
    const c = num(d.count);
    const pct = Math.round((c / denom) * 100);
    return { key: `d-${i}`, rank: String(i + 1).padStart(2, '0'), name: d.name.trim(), countText: String(c), pctText: `${pct}%`, barWidth: `${Math.max(2, pct)}%` };
  });

  return (
    <div className="clt-live-preview ecw-hc">
      <div className="ecw-hc-head">
        <span className="ecw-hc-ico" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </span>
        <div className="ecw-hc-head-body">
          <div className="ecw-hc-head-top">
            <h3 className="ecw-hc-title">{eyebrow}</h3>
            {growthText ? <span className={pillClass}>{growthText}</span> : null}
          </div>
          <p className="ecw-hc-sub">
            <span><b>{String(list.length)}</b> departments</span>
            {hasOpenRoles ? (<><span className="ecw-hc-sub-dot" aria-hidden="true">·</span><span><b>{String(open)}</b> open roles</span></>) : null}
          </p>
        </div>
      </div>

      {rows.length ? (
        <>
          <span className="ecw-hc-sec">Headcount by department</span>
          <div className="ecw-hc-table">
            <div className="ecw-hc-thead" aria-hidden="true">
              <span>#</span><span>Department</span><span className="ecw-hc-th-count">People</span>
            </div>
            {rows.map((d) => (
              <div key={d.key} className="ecw-hc-row">
                <span className="ecw-hc-rank">{d.rank}</span>
                <span className="ecw-hc-dept">
                  <span className="ecw-hc-name">{d.name}</span>
                  <span className="ecw-hc-share">
                    <span className="ecw-hc-track"><span className="ecw-hc-bar" style={{ width: d.barWidth }} /></span>
                    <span className="ecw-hc-pct">{d.pctText}</span>
                  </span>
                </span>
                <span className="ecw-hc-count">{d.countText}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div className="ecw-hc-sum">
        {hasOpenRoles ? (
          <div className="ecw-hc-sum-row"><span className="ecw-hc-sum-key">Open roles</span><span className="ecw-hc-sum-val">{String(open)}</span></div>
        ) : null}
        <div className="ecw-hc-sum-row ecw-hc-sum-total">
          <span className="ecw-hc-sum-key">Total headcount</span><span className="ecw-hc-sum-val">{String(total)}</span>
        </div>
      </div>
    </div>
  );
}
