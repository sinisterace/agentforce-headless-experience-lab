import { useMemo, useState } from 'react';
import { num } from '../ecwFormat';
import './EcwBudgetActualCard.css';

/** React preview mirror of the deployed `ecwBudgetActual` LWC (Finance · Budget vs actual).
 *  Energy & Utilities language: warm-stone + amber, squared hairlines, mono numerals, an
 *  SVG column chart (actual columns + dashed budget ticks) and a spend-share meter whose
 *  legend rows expand to variance detail with an Investigate action. */
export type EcwBudgetLine = { dept: string; budget: number; actual: number; state?: 'ok' | 'warn' | 'over' };
export type EcwBudgetActualPayload = { periodLabel?: string; headline?: string; totalBudget?: number; totalActual?: number; lines: EcwBudgetLine[] };

const STATE_COLOR: Record<string, string> = { ok: '#15803d', warn: '#b45309', over: '#b91c1c' };

function compact(n: number): string {
  const a = Math.abs(num(n)); const s = n < 0 ? '-' : '';
  if (a >= 1e9) return `${s}$${String(Number((a / 1e9).toFixed(2)))}B`;
  if (a >= 1e6) return `${s}$${String(Number((a / 1e6).toFixed(2)))}M`;
  if (a >= 1e3) return `${s}$${Math.round(a / 1e3)}K`;
  return `${s}$${Math.round(a)}`;
}

export const BUDGET_ACTUAL_TEST: EcwBudgetActualPayload = {
  periodLabel: 'FY26 · YTD', headline: '81% of budget used',
  totalBudget: 7800000, totalActual: 6300000,
  lines: [
    { dept: 'Sales', budget: 2400000, actual: 1680000, state: 'ok' },
    { dept: 'Customer Service', budget: 1800000, actual: 1710000, state: 'warn' },
    { dept: 'IT', budget: 1200000, actual: 1320000, state: 'over' },
    { dept: 'Facilities', budget: 900000, actual: 540000, state: 'ok' },
    { dept: 'R&D', budget: 1500000, actual: 1050000, state: 'ok' },
  ],
};

export function EcwBudgetActualCard({ value }: { value?: Partial<EcwBudgetActualPayload> }) {
  const [openKey, setOpenKey] = useState<string>('');
  const [requested, setRequested] = useState<Record<string, boolean>>({});

  const vm = useMemo(() => {
    const hasContent = !!(value && Array.isArray(value.lines) && value.lines.length);
    const src: EcwBudgetActualPayload = hasContent ? ({ ...BUDGET_ACTUAL_TEST, ...value } as EcwBudgetActualPayload) : BUDGET_ACTUAL_TEST;
    const rawLines = (src.lines || []).filter((l) => l && l.dept).map((l) => {
      const budget = num(l.budget), actual = num(l.actual);
      const pct = budget ? (actual / budget) * 100 : 0;
      const state = (['ok', 'warn', 'over'].includes(l.state as string) ? l.state : (pct > 100 ? 'over' : pct >= 90 ? 'warn' : 'ok')) as 'ok' | 'warn' | 'over';
      return { dept: l.dept.trim(), budget, actual, pct, state };
    });
    const tb = num(src.totalBudget) || rawLines.reduce((s, l) => s + l.budget, 0);
    const ta = num(src.totalActual) || rawLines.reduce((s, l) => s + l.actual, 0);
    const totalPct = tb ? Math.round((ta / tb) * 100) : 0;
    const totalVar = ta - tb;

    const n = rawLines.length || 1;
    const slot = 10, barW = 5, top = 6, baseline = 94, plotH = baseline - top;
    const vbW = n * slot;
    const scaleMax = (rawLines.reduce((m, l) => Math.max(m, l.actual, l.budget), 0) || 1) * 1.06;
    const columns = rawLines.map((l, i) => {
      const left = i * slot;
      const barH = Math.max(1.2, (l.actual / scaleMax) * plotH);
      return { key: `col-${i}`, barX: left + (slot - barW) / 2, barY: baseline - barH, barW, barH, fill: STATE_COLOR[l.state], budgetY: baseline - (l.budget / scaleMax) * plotH, budgetX1: left + 1, budgetX2: left + slot - 1 };
    });

    const totalActual = rawLines.reduce((s, l) => s + l.actual, 0) || 1;
    const lines = rawLines.map((l, i) => {
      const variance = l.actual - l.budget;
      const sharePct = Math.max(2, Math.round((l.actual / totalActual) * 100));
      const color = STATE_COLOR[l.state];
      return {
        key: `bl-${i}`, dept: l.dept, state: l.state,
        amountText: compact(l.actual), pctText: `${Math.round(l.pct)}%`,
        chipText: variance > 0 ? `${compact(variance)} over` : `${compact(Math.abs(variance))} left`,
        varianceText: variance > 0 ? `${compact(variance)} over budget` : `${compact(Math.abs(variance))} remaining`,
        color, segStyle: { width: `${sharePct}%`, background: color },
        isActionable: l.state === 'over' || l.state === 'warn',
      };
    });

    return {
      eyebrow: src.periodLabel || 'YTD',
      heroValue: compact(ta), budgetText: `of ${compact(tb)} budget`, pctUsedText: `${totalPct}% used`,
      hasDelta: totalVar !== 0, over: totalVar > 0,
      deltaLabel: totalVar > 0 ? `${compact(totalVar)} over` : `${compact(Math.abs(totalVar))} under`,
      chartViewBox: `0 0 ${vbW} 100`, baselineX2: vbW, columns, lines,
    };
  }, [value]);

  return (
    <div className="clt-live-preview ecw-ba asa-ba">
      <div className="asa-ba-head">
        <h3 className="asa-ba-title">Budget vs actual</h3>
        {vm.eyebrow ? <span className="asa-ba-cycle">{vm.eyebrow}</span> : null}
      </div>

      <div className="asa-ba-projbar">
        <div className="asa-ba-proj">
          <span className="asa-ba-proj-eyebrow">Actual spend</span>
          <span className="asa-ba-proj-value">{vm.heroValue}</span>
          <span className="asa-ba-proj-sub">{vm.budgetText} · {vm.pctUsedText}</span>
        </div>
        {vm.hasDelta ? (
          <span className={`asa-ba-delta ${vm.over ? 'is-up' : 'is-down'}`}>
            <span className="asa-ba-delta-arrow" aria-hidden="true">{vm.over ? '▲' : '▼'}</span>{vm.deltaLabel}
          </span>
        ) : null}
      </div>

      {vm.columns.length ? (
        <div className="asa-ba-chart">
          <svg className="asa-ba-plot" viewBox={vm.chartViewBox} preserveAspectRatio="none" aria-hidden="true">
            {vm.columns.map((c) => <rect key={c.key} className="asa-ba-bar" x={c.barX} y={c.barY} width={c.barW} height={c.barH} fill={c.fill} />)}
            {vm.columns.map((c) => <line key={c.key} className="asa-ba-budget-tick" x1={c.budgetX1} y1={c.budgetY} x2={c.budgetX2} y2={c.budgetY} />)}
            <line className="asa-ba-baseline" x1={0} y1={94} x2={vm.baselineX2} y2={94} />
          </svg>
          <div className="asa-ba-xaxis">
            {vm.lines.map((l) => <span key={l.key} className="asa-ba-xlabel">{l.dept}</span>)}
          </div>
          <div className="asa-ba-chart-key">
            <span className="asa-ba-key-item"><span className="asa-ba-key-bar" aria-hidden="true" />Actual</span>
            <span className="asa-ba-key-item"><span className="asa-ba-key-tick" aria-hidden="true" />Budget</span>
          </div>
        </div>
      ) : null}

      {vm.lines.length ? (
        <div className="asa-ba-breakdown">
          <div className="asa-ba-meter">
            {vm.lines.map((l) => <span key={l.key} className="asa-ba-seg" style={l.segStyle} />)}
          </div>
          <ul className="asa-ba-legend">
            {vm.lines.map((l) => {
              const open = openKey === l.key;
              return (
                <li key={l.key} className={`asa-ba-leg${open ? ' is-open' : ''}`}>
                  <div className="asa-ba-leg-row">
                    <button type="button" className="asa-ba-leg-main" onClick={() => setOpenKey(open ? '' : l.key)} aria-expanded={open}>
                      <span className="asa-ba-leg-dot" style={{ background: l.color }} aria-hidden="true" />
                      <span className="asa-ba-leg-label">{l.dept}</span>
                      <span className={`asa-ba-chip is-${l.state}`}>{l.chipText}</span>
                      <span className="asa-ba-leg-amt">{l.amountText}</span>
                    </button>
                    {l.isActionable ? (
                      <button type="button" className="asa-ba-act" disabled={!!requested[l.key]} onClick={(e) => { e.stopPropagation(); setRequested((r) => ({ ...r, [l.key]: true })); }}>
                        {requested[l.key] ? 'Requested ✓' : 'Investigate'}
                      </button>
                    ) : null}
                  </div>
                  {open ? <p className="asa-ba-detail">{l.varianceText} · {l.pctText} of budget</p> : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
