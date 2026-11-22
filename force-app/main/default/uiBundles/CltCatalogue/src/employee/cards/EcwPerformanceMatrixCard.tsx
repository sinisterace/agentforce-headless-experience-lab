import { useMemo, useState } from 'react';
import './EcwPerformanceMatrixCard.css';

/** React preview mirror of the deployed `ecwPerformanceMatrix` LWC (Marketing · Performance matrix). */
type Trend = 'up' | 'down' | 'flat';
export type EcwPerformanceMatrixItem = { name: string; type?: string; reach: number; engagement: number; conversions: number; trend?: Trend };
export type EcwPerformanceMatrixPayload = { title?: string; xLabel?: string; yLabel?: string; items: EcwPerformanceMatrixItem[] };

export const PERFORMANCE_MATRIX_TEST: EcwPerformanceMatrixPayload = {
  title: 'Content performance', xLabel: 'Reach', yLabel: 'Engagement rate',
  items: [
    { name: 'Product launch webinar', type: 'Webinar', reach: 48000, engagement: 62, conversions: 540, trend: 'up' },
    { name: 'ROI calculator', type: 'Tool', reach: 31000, engagement: 74, conversions: 880, trend: 'up' },
    { name: 'State of the industry report', type: 'Ebook', reach: 72000, engagement: 28, conversions: 210, trend: 'down' },
    { name: 'Weekly newsletter', type: 'Email', reach: 96000, engagement: 41, conversions: 320, trend: 'flat' },
    { name: 'Customer story: Northwind', type: 'Blog', reach: 12000, engagement: 58, conversions: 190, trend: 'up' },
    { name: 'Paid retargeting set', type: 'Ad', reach: 54000, engagement: 22, conversions: 140, trend: 'down' },
  ],
};

const QUAD: Record<string, { label: string; cls: string }> = {
  scale: { label: 'Scale', cls: 'is-scale' }, optimize: { label: 'Optimize', cls: 'is-optimize' },
  test: { label: 'Test', cls: 'is-test' }, cut: { label: 'Cut', cls: 'is-cut' },
};
const n = (v: unknown) => { const x = Number(v); return isFinite(x) ? x : 0; };
const compact = (v: number) => { const a = Math.abs(n(v)); if (a >= 1e6) return `${Math.round(a / 1e5) / 10}M`; if (a >= 1e3) return `${Math.round(a / 1e2) / 10}K`; return `${Math.round(a)}`; };

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === 'up') return <svg className="ecw-pm-trend is-up" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 17 L11 10 L15 14 L20 8" /><path d="M20 8h-5m5 0v5" /></svg>;
  if (trend === 'down') return <svg className="ecw-pm-trend is-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7 L11 14 L15 10 L20 16" /><path d="M20 16h-5m5 0v-5" /></svg>;
  return <svg className="ecw-pm-trend is-flat" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h16" /></svg>;
}

export function EcwPerformanceMatrixCard({ value }: { value?: Partial<EcwPerformanceMatrixPayload> }) {
  const src: EcwPerformanceMatrixPayload = (value && Array.isArray(value.items) && value.items.length)
    ? ({ ...PERFORMANCE_MATRIX_TEST, ...value } as EcwPerformanceMatrixPayload) : PERFORMANCE_MATRIX_TEST;
  const title = src.title || 'Performance matrix';
  const xLabel = src.xLabel || 'Reach';
  const yLabel = src.yLabel || 'Engagement rate';

  const { bubbles, heroStandout, countText } = useMemo(() => {
    const items = (src.items || []).filter((i) => i && i.name);
    const maxReach = Math.max(1, ...items.map((i) => n(i.reach)));
    const maxConv = Math.max(1, ...items.map((i) => n(i.conversions)));
    const totalConv = items.reduce((a, i) => a + n(i.conversions), 0) || 1;
    const bubbles = items.map((i, idx) => {
      const reach = n(i.reach), eng = Math.max(0, Math.min(100, n(i.engagement))), conv = n(i.conversions);
      const reachHigh = reach >= maxReach * 0.5, engHigh = eng >= 50;
      const quad = engHigh ? (reachHigh ? 'scale' : 'optimize') : (reachHigh ? 'test' : 'cut');
      const d = 1.1 + Math.sqrt(conv / maxConv) * 1.8;
      return {
        key: `pm-${idx}`, i: idx, name: i.name.trim(), type: i.type ? i.type.trim() : '',
        quad, trend: (['up', 'down', 'flat'] as Trend[]).includes(i.trend as Trend) ? (i.trend as Trend) : 'flat',
        reachText: compact(reach), convText: compact(conv), engText: `${Math.round(eng)}%`,
        left: 8 + (reach / maxReach) * 84, top: 8 + (1 - eng / 100) * 84, d, conv,
      };
    });
    const scale = bubbles.filter((b) => b.quad === 'scale');
    let heroStandout = '';
    if (scale.length) { const pct = Math.round((scale.reduce((a, b) => a + b.conv, 0) / totalConv) * 100); heroStandout = `Scale · ${scale.length} ${scale.length === 1 ? 'asset' : 'assets'} driving ${pct}% of conversions`; }
    else { const top = [...bubbles].sort((a, b) => b.conv - a.conv)[0]; heroStandout = top ? `Top converter · ${top.name}` : ''; }
    return { bubbles, heroStandout, countText: `${bubbles.length} ${bubbles.length === 1 ? 'asset' : 'assets'}` };
  }, [src]);

  const [pinnedKey, setPinnedKey] = useState('');
  const [hoverKey, setHoverKey] = useState('');
  const activeKey = hoverKey || pinnedKey;
  const detail = bubbles.find((b) => b.key === activeKey) || null;

  return (
    <div className="clt-live-preview ecw-pm">
      <div className="ecw-pm-hero">
        <span className="ecw-pm-eyebrow">Marketing</span>
        <div className="ecw-pm-hero-row"><strong className="ecw-pm-title">{title}</strong><span className="ecw-pm-count">{countText}</span></div>
        {heroStandout ? <span className="ecw-pm-standout">{heroStandout}</span> : null}
      </div>

      <div className="ecw-pm-chartwrap">
        <span className="ecw-pm-ylabel">{yLabel}</span>
        <div className="ecw-pm-plot">
          <span className="ecw-pm-axis-v" aria-hidden="true" />
          <span className="ecw-pm-axis-h" aria-hidden="true" />
          <span className="ecw-pm-quad ecw-pm-quad-tl">Optimize</span>
          <span className="ecw-pm-quad ecw-pm-quad-tr">Scale</span>
          <span className="ecw-pm-quad ecw-pm-quad-bl">Cut</span>
          <span className="ecw-pm-quad ecw-pm-quad-br">Test</span>
          {bubbles.map((b) => {
            const active = b.key === activeKey, pinned = b.key === pinnedKey;
            const cls = `ecw-pm-bubble ${QUAD[b.quad].cls}${active ? ' is-active' : ''}${pinned ? ' is-pinned' : ''}`;
            return (
              <button key={b.key} type="button" className={cls} aria-label={b.name}
                style={{ left: `${b.left.toFixed(2)}%`, top: `${b.top.toFixed(2)}%`, width: `${b.d.toFixed(2)}rem`, height: `${b.d.toFixed(2)}rem`, ['--i' as string]: b.i } as React.CSSProperties}
                onMouseEnter={() => setHoverKey(b.key)} onMouseLeave={() => setHoverKey('')}
                onFocus={() => setHoverKey(b.key)} onBlur={() => setHoverKey('')}
                onClick={() => setPinnedKey((k) => (k === b.key ? '' : b.key))} />
            );
          })}
        </div>
        <span className="ecw-pm-xlabel">{xLabel}</span>
      </div>

      {detail ? (
        <div className="ecw-pm-detail">
          <div className="ecw-pm-detail-head">
            <span className="ecw-pm-detail-name">{detail.name}</span>
            <span className={`ecw-pm-detail-quad ${QUAD[detail.quad].cls}`}>{QUAD[detail.quad].label}</span>
          </div>
          <div className="ecw-pm-detail-metrics">
            <div className="ecw-pm-metric"><span className="ecw-pm-metric-label">{xLabel}</span><span className="ecw-pm-metric-val">{detail.reachText}</span></div>
            <div className="ecw-pm-metric"><span className="ecw-pm-metric-label">{yLabel}</span><span className="ecw-pm-metric-val">{detail.engText}</span></div>
            <div className="ecw-pm-metric"><span className="ecw-pm-metric-label">Conversions</span><span className="ecw-pm-metric-val ecw-pm-metric-conv">{detail.convText}<TrendIcon trend={detail.trend} /></span></div>
          </div>
        </div>
      ) : <p className="ecw-pm-hint">Hover or tap an asset to see its metrics.</p>}
    </div>
  );
}
