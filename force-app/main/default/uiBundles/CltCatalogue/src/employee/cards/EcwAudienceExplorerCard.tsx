import { useEffect, useRef, useState } from 'react';
import './EcwAudienceExplorerCard.css';

/** React preview mirror of the deployed `ecwAudienceExplorer` LWC (Marketing · Audience builder).
 *  Live-sizing segment Venn: toggle criteria / drag the threshold → the Venn resizes and the
 *  audience count tweens, all client-side. */
export type AudienceCriterion = { key?: string; label: string; fraction: number; on?: boolean };
export type EcwAudienceExplorerPayload = {
  title?: string;
  baseLabel?: string;
  baseSize: number;
  criteria: AudienceCriterion[];
  threshold: { label: string; min: number; max: number; value: number };
};

const HUES = ['#0d6fd1', '#0f766e', '#6d28d9'];

export const AUDIENCE_EXPLORER_TEST: EcwAudienceExplorerPayload = {
  title: 'Audience builder',
  baseLabel: 'All contacts',
  baseSize: 128000,
  criteria: [
    { key: 'industry', label: 'Healthcare & public sector', fraction: 0.34, on: true },
    { key: 'engaged', label: 'Engaged in last 90 days', fraction: 0.52, on: true },
    { key: 'nurture', label: 'Not already in a nurture', fraction: 0.61, on: false },
  ],
  threshold: { label: 'Min. engagement score', min: 0, max: 100, value: 40 },
};

function num(v: unknown, d = 0): number { const n = Number(v); return isFinite(n) ? n : d; }
function clamp01(n: number): number { return Math.max(0, Math.min(1, n)); }

const VENN_POS: Record<number, { cx: number; cy: number }[]> = {
  1: [{ cx: 60, cy: 50 }],
  2: [{ cx: 46, cy: 50 }, { cx: 74, cy: 50 }],
  3: [{ cx: 50, cy: 42 }, { cx: 70, cy: 42 }, { cx: 60, cy: 66 }],
};

export function EcwAudienceExplorerCard({ value }: { value?: Partial<EcwAudienceExplorerPayload> }) {
  const has = !!(value && Array.isArray(value.criteria) && value.criteria.length);
  const src: EcwAudienceExplorerPayload = has ? ({ ...AUDIENCE_EXPLORER_TEST, ...value } as EcwAudienceExplorerPayload) : AUDIENCE_EXPLORER_TEST;
  const baseSize = num(src.baseSize);
  const threshold = src.threshold || AUDIENCE_EXPLORER_TEST.threshold;

  const [criteria, setCriteria] = useState(() =>
    (src.criteria || []).filter((c) => c && c.label).map((c, i) => ({
      key: c.key || `cr-${i}`, label: String(c.label), fraction: clamp01(num(c.fraction, 0.5)), on: c.on !== false, hue: HUES[i % HUES.length],
    })),
  );
  const [thresholdValue, setThresholdValue] = useState(() => num(threshold.value, 40));

  const thresholdFraction = Math.max(0.05, 1 - (thresholdValue / 100) * 0.85);
  const onList = criteria.filter((c) => c.on);
  const target = Math.round(baseSize * onList.reduce((a, c) => a * c.fraction, 1) * thresholdFraction);
  const pct = baseSize ? `${Math.round((target / baseSize) * 100)}%` : '0%';

  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  const rafRef = useRef(0);
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { displayRef.current = target; setDisplay(target); return; }
    cancelAnimationFrame(rafRef.current);
    const from = displayRef.current;
    const startT = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - startT) / 450);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (target - from) * eased;
      displayRef.current = v; setDisplay(v);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);

  const baseSizeText = baseSize.toLocaleString('en-US');
  const displayText = Math.round(display).toLocaleString('en-US');
  const pos = VENN_POS[onList.length] || [];

  return (
    <div className="clt-live-preview ecw-ae">
      <div className="ecw-ae-head">
        <span className="ecw-ae-eyebrow">Audience builder</span>
        <span className="ecw-ae-base">{src.baseLabel || 'All contacts'} · {baseSizeText}</span>
      </div>

      <div className="ecw-ae-stage">
        <svg className="ecw-ae-venn" viewBox="0 0 120 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          {onList.length === 0 ? <circle className="ecw-ae-empty" cx="60" cy="50" r="38" fill="none" /> : null}
          {onList.map((c, i) => {
            const p = pos[i] || { cx: 60, cy: 50 };
            const r = Math.round((24 + 16 * c.fraction) * 10) / 10;
            return <circle key={c.key} className="ecw-ae-circle" cx={p.cx} cy={p.cy} r={r} style={{ fill: c.hue }} />;
          })}
        </svg>
        <div className="ecw-ae-count">
          <strong className="ecw-ae-count-val">{displayText}</strong>
          <span className="ecw-ae-count-sub">of {baseSizeText} · {pct} of base</span>
        </div>
      </div>

      <ul className="ecw-ae-criteria">
        {criteria.map((c) => (
          <li key={c.key} className="ecw-ae-crit">
            <button
              type="button"
              className={`ecw-ae-switch${c.on ? ' is-on' : ''}`}
              role="switch"
              aria-checked={c.on}
              aria-label={c.label}
              onClick={() => setCriteria((prev) => prev.map((x) => (x.key === c.key ? { ...x, on: !x.on } : x)))}
            >
              <span className="ecw-ae-switch-thumb" />
            </button>
            <span className="ecw-ae-crit-dot" style={{ background: c.hue }} aria-hidden="true" />
            <span className="ecw-ae-crit-label">{c.label}</span>
            <span className="ecw-ae-crit-frac">{Math.round(c.fraction * 100)}%</span>
          </li>
        ))}
      </ul>

      <div className="ecw-ae-threshold">
        <div className="ecw-ae-threshold-top">
          <span className="ecw-ae-threshold-label">{threshold.label}</span>
          <span className="ecw-ae-threshold-val">{thresholdValue}</span>
        </div>
        <input
          type="range"
          className="ecw-ae-slider"
          min={threshold.min}
          max={threshold.max}
          value={thresholdValue}
          onChange={(e) => setThresholdValue(num(e.target.value))}
        />
      </div>
    </div>
  );
}
