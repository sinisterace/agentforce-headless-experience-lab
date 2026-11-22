import { Sparkles } from 'lucide-react';
import type { EnergyUsageCostPayload } from './payloads';
import { ENERGY_PALETTE, money } from './energyFormat';

/**
 * Live preview for the ASA Energy & Utilities · Usage & Cost
 * CLT (DTO field energyUsageCostJSON). LWC-true fields: title?, cycleText?,
 * projectedCost?, currency?, projectedText?, usedUnits?, unit?, deltaPct?,
 * deltaText?, bars[]{label,value}, breakdown[]{label,amount,color?}, submitText?,
 * submitValue?. An empty payload drops the preview into test-mode — like the LWC.
 */

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : null);

const TEST: EnergyUsageCostPayload = {
  title: 'Your energy this cycle',
  cycleText: 'Sep 1–30 · 8 days left',
  projectedCost: 142.5,
  currency: 'USD',
  projectedText: 'Projected bill',
  usedUnits: 612,
  unit: 'kWh',
  deltaPct: -8,
  deltaText: 'less than last month',
  bars: [
    { label: 'Wk1', value: 158 },
    { label: 'Wk2', value: 171 },
    { label: 'Wk3', value: 149 },
    { label: 'Wk4', value: 134 },
  ],
  breakdown: [
    { label: 'Heating & cooling', amount: 74.2, color: '#d97706' },
    { label: 'Water heating', amount: 31.0 },
    { label: 'Always-on', amount: 22.4 },
    { label: 'Other', amount: 14.9 },
  ],
  submitText: 'See ways to save',
};

/** Faithful preview: mirrors the Usage & Cost LWC, including test-mode + chart geometry. */
export function EnergyUsageCostPreview({ value, accentColor }: { value: EnergyUsageCostPayload; accentColor: string }) {
  const hasContent = !!(num(value.projectedCost) !== null || num(value.usedUnits) !== null
    || (Array.isArray(value.bars) && value.bars.length) || (Array.isArray(value.breakdown) && value.breakdown.length));
  const isTestMode = !hasContent;
  const src = isTestMode ? TEST : value;
  const currency = src.currency || 'USD';

  const pc = num(src.projectedCost);
  const used = num(src.usedUnits);
  const dp = num(src.deltaPct);
  const hasDelta = dp !== null && dp !== 0;
  const down = (dp ?? 0) < 0;
  const deltaWords = src.deltaText || (down ? 'less than last month' : 'more than last month');

  const rawBars = (src.bars ?? []).filter((b) => b && num(b.value) !== null).slice(0, 8);
  const maxVal = rawBars.reduce((m, b) => Math.max(m, num(b.value) as number), 0) || 1;

  const rawBd = (src.breakdown ?? []).filter((b) => b && b.label && num(b.amount) !== null);
  const total = rawBd.reduce((s, b) => s + (num(b.amount) as number), 0) || 1;

  return (
    <div className="clt-live-preview usage-cost-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      <div className="asa-uc-head">
        <h3 className="selector-title">{(src.title && src.title.trim()) || 'Your energy this cycle'}</h3>
        {src.cycleText && <span className="asa-uc-cycle">{src.cycleText}</span>}
      </div>

      <div className="asa-uc-projbar">
        <div className="asa-uc-proj">
          {pc !== null && (
            <>
              <span className="asa-uc-proj-eyebrow">{(src.projectedText && src.projectedText.trim()) || 'Projected bill'}</span>
              <span className="asa-uc-proj-value">{money(pc, currency)}</span>
            </>
          )}
          {used !== null && <span className="asa-uc-used">{used.toLocaleString('en-US')} {src.unit || 'kWh'} used</span>}
        </div>
        {hasDelta && (
          <span className={`asa-uc-delta ${down ? 'is-down' : 'is-up'}`}>
            <span className="asa-uc-delta-arrow" aria-hidden="true">{down ? '▼' : '▲'}</span>{Math.abs(dp as number)}% {deltaWords}
          </span>
        )}
      </div>

      {rawBars.length > 0 && (
        <div className="asa-uc-chart">
          {rawBars.map((b, i) => {
            const v = num(b.value) as number;
            const pct = Math.max(8, Math.round((v / maxVal) * 100));
            return (
              <div className="asa-uc-col" key={i}>
                <div className="asa-uc-col-track"><div className={`asa-uc-bar${v >= maxVal ? ' is-peak' : ''}`} style={{ height: `${pct}%` }} /></div>
                <span className="asa-uc-col-label">{b.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {rawBd.length > 0 && (
        <div className="asa-uc-breakdown">
          <div className="asa-uc-meter">
            {rawBd.map((b, i) => {
              const color = (b.color && b.color.trim()) || ENERGY_PALETTE[i % ENERGY_PALETTE.length];
              const pct = Math.max(2, Math.round(((num(b.amount) as number) / total) * 100));
              return <span className="asa-uc-seg" key={i} style={{ width: `${pct}%`, background: color }} />;
            })}
          </div>
          <ul className="asa-uc-legend">
            {rawBd.map((b, i) => {
              const color = (b.color && b.color.trim()) || ENERGY_PALETTE[i % ENERGY_PALETTE.length];
              return (
                <li className="asa-uc-leg" key={i}>
                  <span className="asa-uc-leg-dot" style={{ background: color }} aria-hidden="true" />
                  <span className="asa-uc-leg-label">{b.label}</span>
                  <span className="asa-uc-leg-amt">{money(num(b.amount) as number, currency)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {src.submitText && (
        <button type="button" className="asa-uc-cta"><Sparkles aria-hidden="true" /> {src.submitText}</button>
      )}
    </div>
  );
}
