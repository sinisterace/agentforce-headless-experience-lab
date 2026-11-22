import { compactMoney, num } from '../ecwFormat';
import './EcwForecastCard.css';

/** React preview mirror of the deployed `ecwForecast` LWC (Sales · Forecast) —
 *  Energy & Utilities design: an attainment readout (mono committed figure +
 *  coverage chip), an SVG column chart of the confidence tiers over a hairline
 *  baseline, and a segmented coverage meter with a hairline legend. */
export type EcwForecastTier = { label: string; amount: number; state: 'closed' | 'commit' | 'best' | 'pipeline' };
export type EcwForecastPayload = { currency?: string; committed?: number; total?: number; tiers: EcwForecastTier[] };

const TIER_COLOR: Record<string, string> = { closed: '#15803d', commit: '#b45309', best: '#d97706', pipeline: '#e3c08a' };
const DEFAULT_COLOR = '#d6ccbf';

// SVG column-chart geometry (mirrors the LWC).
const VB_W = 320, VB_H = 132, PAD_X = 6, TOP = 20, BASE_Y = 108, LABEL_Y = 124;

export const FORECAST_TEST: EcwForecastPayload = {
  currency: 'USD', committed: 1850000, total: 4120000,
  tiers: [
    { label: 'Closed', amount: 620000, state: 'closed' },
    { label: 'Commit', amount: 1230000, state: 'commit' },
    { label: 'Best case', amount: 980000, state: 'best' },
    { label: 'Pipeline', amount: 1290000, state: 'pipeline' },
  ],
};

export function EcwForecastCard({ value }: { value?: Partial<EcwForecastPayload> }) {
  const hasContent = !!(value && Array.isArray(value.tiers) && value.tiers.length);
  const src: EcwForecastPayload = hasContent ? ({ ...FORECAST_TEST, ...value } as EcwForecastPayload) : FORECAST_TEST;
  const tiers = src.tiers.filter((t) => t && t.label);
  const total = num(src.total) || tiers.reduce((a, t) => a + num(t.amount), 0);
  const denom = total || 1;
  const committed = num(src.committed);
  const cur = src.currency || 'USD';

  const hasHero = committed > 0 || src.committed != null;
  const cov = total ? Math.round((committed / total) * 100) : 0;
  const covClass = `ecw-fc-cov ${cov >= 50 ? 'is-strong' : 'is-soft'}`;

  // Column geometry
  const maxAmt = tiers.reduce((m, t) => Math.max(m, num(t.amount)), 0) || 1;
  const n = tiers.length || 1;
  const slot = (VB_W - PAD_X * 2) / n;
  const barW = Math.min(44, slot * 0.56);
  const area = BASE_Y - TOP;
  const columns = tiers.map((t, i) => {
    const amt = num(t.amount);
    const h = Math.max(2, (amt / maxAmt) * area);
    const cx = PAD_X + slot * i + slot / 2;
    const y = BASE_Y - h;
    return { key: i, x: cx - barW / 2, y, barW, h, cx, color: TIER_COLOR[t.state] || DEFAULT_COLOR, valueText: compactMoney(amt, cur), valueY: y - 5, label: t.label };
  });

  return (
    <div className="clt-live-preview ecw-fc">
      <div className="ecw-fc-head">
        <span className="ecw-fc-eyebrow">Sales · Forecast</span>
        <h3 className="ecw-fc-title">Forecast coverage</h3>
      </div>

      {hasHero && (
        <div className="ecw-fc-readout">
          <div className="ecw-fc-proj">
            <span className="ecw-fc-proj-eyebrow">Committed</span>
            <span className="ecw-fc-proj-value">{compactMoney(committed, cur)}</span>
            {total ? <span className="ecw-fc-sub">of {compactMoney(total, cur)} forecast</span> : null}
          </div>
          {total ? <span className={covClass}>{cov}% covered</span> : null}
        </div>
      )}

      {columns.length > 0 && (
        <div className="ecw-fc-chart">
          <svg className="ecw-fc-svg" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Forecast amount by confidence tier">
            <line className="ecw-fc-base" x1="6" y1={BASE_Y} x2="314" y2={BASE_Y} />
            {columns.map((c) => (
              <g key={c.key}>
                <rect className="ecw-fc-rect" x={c.x} y={c.y} width={c.barW} height={c.h} fill={c.color} rx="1.5" />
                <text className="ecw-fc-colval" x={c.cx} y={c.valueY} textAnchor="middle">{c.valueText}</text>
                <text className="ecw-fc-collabel" x={c.cx} y={LABEL_Y} textAnchor="middle">{c.label}</text>
              </g>
            ))}
          </svg>
        </div>
      )}

      {tiers.length > 0 && (
        <div className="ecw-fc-breakdown">
          <div className="ecw-fc-meter">
            {tiers.filter((t) => num(t.amount) > 0).map((t, i) => (
              <span key={i} className="ecw-fc-seg" style={{ width: `${Math.max(2, Math.round((num(t.amount) / denom) * 100))}%`, background: TIER_COLOR[t.state] || DEFAULT_COLOR }} />
            ))}
          </div>
          <ul className="ecw-fc-legend">
            {tiers.map((t, i) => (
              <li key={i} className="ecw-fc-leg">
                <span className="ecw-fc-leg-dot" style={{ background: TIER_COLOR[t.state] || DEFAULT_COLOR }} aria-hidden="true" />
                <span className="ecw-fc-leg-label">{t.label}</span>
                <span className="ecw-fc-leg-pct">{Math.round((num(t.amount) / denom) * 100)}%</span>
                <span className="ecw-fc-leg-amt">{compactMoney(num(t.amount), cur)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
