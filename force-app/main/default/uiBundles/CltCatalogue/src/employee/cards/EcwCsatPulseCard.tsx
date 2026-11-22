import { useState } from 'react';
import './EcwCsatPulseCard.css';

/** React catalogue mirror of the deployed `ecwCsatPulse` LWC (Service · CSAT pulse) —
 *  premium rebuild: arc gauge + score hero, trend sparkline (round HTML end-dot),
 *  a derived stat strip, and an editorial verbatim list with SVG star ratings. */
const SEMI = 157.08;
function n(v: unknown): number | null { const x = Number(v); return Number.isFinite(x) ? x : null; }

export type EcwCsatComment = {
  text: string; full?: string; who?: string; caseNumber?: string; caseSubject?: string;
  rating?: number; state?: 'good' | 'bad'; theme?: string;
};
export type EcwCsatPayload = {
  score: string | number; scoreMax?: string | number; label?: string;
  deltaText?: string; deltaState?: 'good' | 'bad'; metaText?: string;
  trend?: number[]; comments?: EcwCsatComment[];
};

export const CSAT_PULSE_TEST: EcwCsatPayload = {
  score: '4.6', scoreMax: '5', label: 'CSAT · last 30 days',
  deltaText: '+0.3 vs last month', deltaState: 'good',
  metaText: 'last 30 days · 42 responses · 88% positive',
  trend: [4.0, 4.1, 4.2, 4.1, 4.4, 4.6],
  comments: [
    { text: 'Tech resolved it the same day — great service.', full: 'Your technician diagnosed and fixed the issue on the first visit and walked our team through prevention.', who: 'Arroyo Medical Group', caseNumber: '00001074', caseSubject: 'Badge reader intermittent failure', rating: 5, state: 'good', theme: 'Speed' },
    { text: 'Clear, quick answer — very helpful.', full: 'Got a clear, well-documented answer within the hour — no back-and-forth needed.', who: 'Union Gate Apartments', caseNumber: '00001124', caseSubject: 'Camera retention policy question', rating: 5, state: 'good', theme: 'Knowledge' },
    { text: 'Still unresolved after the visit — needs follow-up.', full: 'The issue recurred the day after the visit and we are still waiting on a follow-up.', who: 'Alta Canyon Clinics', caseNumber: '00001129', caseSubject: 'Visitor kiosk check-in delay', rating: 2, state: 'bad', theme: 'Follow-up' },
  ],
};

const STAR = 'M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.9 6.2 20.9l1.1-6.47-4.7-4.58 6.5-.95z';

export function EcwCsatPulseCard({ value }: { value?: Partial<EcwCsatPayload> }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const hasContent = !!(value && value.score != null);
  const src: EcwCsatPayload = hasContent ? ({ ...CSAT_PULSE_TEST, ...value } as EcwCsatPayload) : CSAT_PULSE_TEST;

  const score = String(src.score);
  const scoreNum = n(src.score) || 0;
  const maxNum = n(src.scoreMax) || 5;
  const scoreMax = src.scoreMax != null ? `/${String(src.scoreMax)}` : '';
  const label = (src.label || 'CSAT').trim();

  const dt = (src.deltaText || '').trim();
  const hasDelta = !!dt;
  const deltaUp = src.deltaState !== 'bad';
  const sp = dt.indexOf(' ');
  const deltaValue = sp > 0 ? dt.slice(0, sp) : dt;
  const deltaRest = sp > 0 ? dt.slice(sp + 1) : '';
  const deltaCls = `ecw-csat-delta is-${deltaUp ? 'good' : 'bad'}`;

  const frac = Math.max(0, Math.min(1, maxNum ? scoreNum / maxNum : 0));
  const ratio = frac >= 0.9 ? 'good' : frac >= 0.8 ? 'warn' : 'bad';
  const gaugeDash = `${(frac * SEMI).toFixed(2)} ${SEMI.toFixed(2)}`;
  const theta = Math.PI * (1 - frac);
  const markerX = (60 + 50 * Math.cos(theta)).toFixed(2);
  const markerY = (62 - 50 * Math.sin(theta)).toFixed(2);

  const vals = (Array.isArray(src.trend) ? src.trend.map(n).filter((v): v is number => v !== null) : []);
  let sparkPoints = '', sparkArea = '', dotStyle: React.CSSProperties = {}, hasSpark = false;
  if (vals.length >= 2) {
    const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1;
    const pts = vals.map((v, i) => ({
      x: Math.round((1 + (i / (vals.length - 1)) * 98) * 100) / 100,
      y: Math.round((4 + (1 - (v - min) / range) * 20) * 100) / 100,
    }));
    sparkPoints = pts.map((p) => `${p.x},${p.y}`).join(' ');
    sparkArea = `1,30 ${sparkPoints} 99,30`;
    const end = pts[pts.length - 1];
    dotStyle = { left: `${end.x}%`, top: `${((end.y / 32) * 100).toFixed(2)}%` };
    hasSpark = true;
  }

  const labelLow = label.toLowerCase();
  const stats = (src.metaText || '').split(/[·•|]/).map((s) => s.trim()).filter(Boolean)
    .filter((s) => !labelLow.includes(s.toLowerCase()))
    .map((s) => { const m = s.match(/^([\d.,%+-]+)\s*(.*)$/); return { num: m ? m[1] : '', text: m && m[2] ? m[2] : (m ? '' : s) }; });

  const comments = (Array.isArray(src.comments) ? src.comments.filter((c) => c && c.text) : []).map((c, i) => {
    const rating = n(c.rating);
    const caseRef = [c.caseNumber, c.caseSubject].filter((x) => x && String(x).trim()).join(' · ');
    const bad = c.state === 'bad';
    const r = rating !== null ? Math.round(rating) : 0;
    return {
      i, text: String(c.text).trim(),
      full: c.full ? String(c.full).trim() : '', who: c.who ? String(c.who).trim() : '',
      caseRef, theme: c.theme ? String(c.theme).trim() : (bad ? 'Follow-up' : 'Positive'),
      themeCls: `ecw-csat-theme is-${bad ? 'bad' : 'good'}`, railCls: `ecw-csat-rail is-${bad ? 'bad' : 'good'}`,
      hasRating: rating !== null, r,
    };
  });

  return (
    <div className="clt-live-preview ecw-csat">
      <span className="ecw-csat-eyebrow">{label}</span>

      <div className="ecw-csat-hero">
        <div className="ecw-csat-gauge">
          <div className="ecw-csat-gauge-fig">
            <div className="ecw-csat-dial">
              <svg className="ecw-csat-gauge-svg" viewBox="0 0 120 68" aria-hidden="true">
                <path className="ecw-csat-track" d="M8,62 A52,52 0 0 1 112,62" fill="none" strokeWidth="4" strokeLinecap="round" />
                <path className={`ecw-csat-arc is-${ratio}`} d="M10,62 A50,50 0 0 1 110,62" fill="none" strokeWidth="5" strokeLinecap="round" strokeDasharray={gaugeDash} />
                {frac > 0 ? <circle className={`ecw-csat-marker is-${ratio}`} cx={markerX} cy={markerY} r="4.2" /> : null}
              </svg>
              <div className="ecw-csat-readout">
                <strong className={`ecw-csat-score is-${ratio}`}>{score}</strong>
                <span className="ecw-csat-max">{scoreMax}</span>
              </div>
            </div>
            {hasDelta ? (
              <span className={deltaCls}>
                {deltaUp
                  ? <svg className="ecw-csat-tri" viewBox="0 0 10 8" aria-hidden="true"><path d="M5 0 10 8 0 8z" /></svg>
                  : <svg className="ecw-csat-tri" viewBox="0 0 10 8" aria-hidden="true"><path d="M5 8 0 0 10 0z" /></svg>}
                <span className="ecw-csat-delta-val">{deltaValue}</span>
                {deltaRest ? <span className="ecw-csat-delta-rest">{deltaRest}</span> : null}
              </span>
            ) : null}
          </div>

          <div className="ecw-csat-rule" aria-hidden="true" />

          <div className="ecw-csat-trend">
            <span className="ecw-csat-trend-label">Trend</span>
            {hasSpark ? (
              <div className="ecw-csat-spark-wrap">
                <svg className="ecw-csat-spark" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
                  <polygon className="ecw-csat-spark-area" points={sparkArea} />
                  <polyline className="ecw-csat-spark-line" points={sparkPoints} />
                </svg>
                <span className="ecw-csat-spark-dot" style={dotStyle} />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {stats.length ? (
        <div className="ecw-csat-stats">
          {stats.map((s, i) => (
            <div key={i} className="ecw-csat-stat">
              {s.num ? <span className="ecw-csat-stat-num">{s.num}</span> : null}
              <span className="ecw-csat-stat-lbl">{s.text}</span>
            </div>
          ))}
        </div>
      ) : null}

      {comments.length ? (
        <div className="ecw-csat-verbatims">
          <span className="ecw-csat-vhead">Recent verbatims</span>
          <ul className="ecw-csat-list">
            {comments.map((c) => (
              <li key={c.i} className={`ecw-csat-row${open[c.i] ? ' is-open' : ''}`}>
                <button type="button" className="ecw-csat-rowhead" onClick={() => setOpen((o) => ({ ...o, [c.i]: !o[c.i] }))}>
                  <span className={c.railCls} aria-hidden="true" />
                  <span className="ecw-csat-main">
                    <span className="ecw-csat-text">{c.text}</span>
                    <span className="ecw-csat-sub">
                      <span className={c.themeCls}>{c.theme}</span>
                      {c.who ? <span className="ecw-csat-who">{c.who}</span> : null}
                    </span>
                  </span>
                  <span className="ecw-csat-aside">
                    {c.hasRating ? (
                      <span className="ecw-csat-stars">
                        {[1, 2, 3, 4, 5].map((k) => (
                          <svg key={k} className={`ecw-csat-star${k <= c.r ? ' is-on' : ''}`} viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} /></svg>
                        ))}
                      </span>
                    ) : null}
                    <svg className={`ecw-csat-caret${open[c.i] ? ' is-open' : ''}`} viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                </button>
                {open[c.i] ? (
                  <div className="ecw-csat-body">
                    {c.full ? <p className="ecw-csat-full">{c.full}</p> : null}
                    {c.caseRef ? <span className="ecw-csat-caseref">{c.caseRef}</span> : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
