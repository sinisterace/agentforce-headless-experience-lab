import { useMemo, useState } from 'react';
import { num } from '../ecwFormat';
import './EcwMonthEndCloseCard.css';

/** React preview mirror of the deployed `ecwMonthEndClose` LWC (Finance · Month-end close).
 *  ecw family. Hero % complete + progress bar + close target, then a status-marked task
 *  checklist; noted tasks expand; each non-done task has a Mark complete / Chase blocker
 *  action → a local "Requested ✓" state (preview is client-only). */
type McState = 'done' | 'in_progress' | 'blocked' | 'todo';
export type EcwMcTask = { name: string; state?: McState; note?: string };
export type EcwMonthEndClosePayload = { headline?: string; pct?: number; targetText?: string; tasks: EcwMcTask[] };

const MARK: Record<McState, { cls: string; label: string }> = {
  done: { cls: 'is-done', label: '✓' },
  in_progress: { cls: 'is-progress', label: '●' },
  blocked: { cls: 'is-blocked', label: '!' },
  todo: { cls: 'is-todo', label: '' },
};

export const MONTH_END_CLOSE_TEST: EcwMonthEndClosePayload = {
  headline: '6 of 11 tasks complete', pct: 55, targetText: 'Close target: Business Day 5',
  tasks: [
    { name: 'Bank reconciliations', state: 'done' },
    { name: 'Accruals & prepaids', state: 'done' },
    { name: 'Accounts payable cutoff', state: 'done' },
    { name: 'AR & revenue recognition', state: 'in_progress', note: '2 contracts pending review' },
    { name: 'Fixed assets & depreciation', state: 'in_progress' },
    { name: 'Intercompany eliminations', state: 'blocked', note: 'Awaiting FX rates from Treasury' },
    { name: 'Payroll & commissions accrual', state: 'done' },
    { name: 'Expense accruals', state: 'done' },
    { name: 'Flux / variance analysis', state: 'todo' },
    { name: 'Management reporting pack', state: 'todo' },
    { name: 'Final review & sign-off', state: 'todo' },
  ],
};

export function EcwMonthEndCloseCard({ value }: { value?: Partial<EcwMonthEndClosePayload> }) {
  const [openKey, setOpenKey] = useState<string>('');
  const [requested, setRequested] = useState<Record<string, boolean>>({});

  const vm = useMemo(() => {
    const hasContent = !!(value && Array.isArray(value.tasks) && value.tasks.length);
    const src: EcwMonthEndClosePayload = hasContent ? ({ ...MONTH_END_CLOSE_TEST, ...value } as EcwMonthEndClosePayload) : MONTH_END_CLOSE_TEST;
    const pct = Math.max(0, Math.min(100, Math.round(num(src.pct))));
    const tasks = (src.tasks || []).filter((t) => t && t.name).map((t, i) => {
      const state = (['done', 'in_progress', 'blocked', 'todo'].includes(t.state as string) ? t.state : 'todo') as McState;
      const note = t.note ? t.note.trim() : '';
      const isChase = state === 'blocked';
      return {
        key: `t-${i}`, name: t.name.trim(), markClass: `ecw-mc-mark ${MARK[state].cls}`, markLabel: MARK[state].label,
        nameClass: state === 'done' ? 'ecw-mc-name is-done' : 'ecw-mc-name', note, hasNote: !!note,
        showAction: state !== 'done', isChase, actClass: isChase ? 'ecw-mc-act is-chase' : 'ecw-mc-act', actLabel: isChase ? 'Chase blocker' : 'Mark complete',
      };
    });
    return { pctText: `${pct}%`, barWidth: `${pct}%`, headline: src.headline || '', targetText: src.targetText || '', tasks };
  }, [value]);

  return (
    <div className="clt-live-preview ecw-mc">
      <div className="ecw-mc-hero">
        <span className="ecw-mc-eyebrow">Month-end close</span>
        <div className="ecw-mc-hero-row">
          <strong className="ecw-mc-pct">{vm.pctText}</strong>
          <div className="ecw-mc-hero-meta">
            <span className="ecw-mc-headline">{vm.headline}</span>
            {vm.targetText ? <span className="ecw-mc-target">{vm.targetText}</span> : null}
          </div>
        </div>
        <div className="ecw-mc-progress"><span className="ecw-mc-progress-bar" style={{ width: vm.barWidth }} /></div>
      </div>

      {vm.tasks.length ? (
        <ul className="ecw-mc-list">
          {vm.tasks.map((t) => {
            const open = openKey === t.key && t.hasNote;
            const req = !!requested[t.key];
            return (
              <li key={t.key} className={t.hasNote ? 'ecw-mc-row is-clickable' : 'ecw-mc-row'}>
                <div className="ecw-mc-rowwrap">
                  <button type="button" className="ecw-mc-rowhead" onClick={() => t.hasNote && setOpenKey(open ? '' : t.key)}>
                    <span className={t.markClass}>{t.markLabel}</span>
                    <span className={t.nameClass}>{t.name}</span>
                    <svg className={`ecw-mc-caret${t.hasNote ? (open ? ' is-open' : '') : ' is-hidden'}`} viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  {t.showAction ? (
                    <button type="button" className={t.actClass} disabled={req} onClick={(e) => { e.stopPropagation(); setRequested((r) => ({ ...r, [t.key]: true })); }}>
                      {req ? 'Requested ✓' : t.actLabel}
                    </button>
                  ) : null}
                </div>
                {open ? <p className="ecw-mc-note">{t.note}</p> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
