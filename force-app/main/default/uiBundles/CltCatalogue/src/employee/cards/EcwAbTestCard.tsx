import { useState } from 'react';
import './EcwAbTestCard.css';

/** React preview mirror of the deployed `ecwAbTest` LWC (Marketing · A/B test showdown).
 *  Metric-lens duel between two variants + confidence meter + winner reveal. Local state only. */
export type AbVariant = { key?: string; name?: string; preview?: string; sent: number; openRate: number; ctr: number; convRate: number; revenue: number };
export type EcwAbTestPayload = {
  title?: string; testName?: string; audience?: string;
  variants: AbVariant[]; confidence: number; winner?: string; lift?: string; projected?: string;
};

const METRICS: { key: keyof AbVariant; label: string; kind: 'pct' | 'money' }[] = [
  { key: 'openRate', label: 'Open rate', kind: 'pct' },
  { key: 'ctr', label: 'Click-through', kind: 'pct' },
  { key: 'convRate', label: 'Conversion', kind: 'pct' },
  { key: 'revenue', label: 'Revenue', kind: 'money' },
];

function num(v: unknown): number { const n = Number(v); return isFinite(n) ? n : 0; }
function pct(v: number): string { return (Math.round(num(v) * 10) / 10) + '%'; }
function money(v: number): string {
  const a = Math.abs(num(v));
  if (a >= 1e6) return '$' + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M';
  if (a >= 1e3) return '$' + Math.round(a / 1e3) + 'K';
  return '$' + Math.round(a);
}
function fmt(kind: 'pct' | 'money', v: number): string { return kind === 'money' ? money(v) : pct(v); }
function sentFmt(v: number): string { const n = num(v); return (n >= 1000 ? (Math.round(n / 100) / 10) + 'K' : String(n)) + ' sent'; }

export const AB_TEST_TEST: EcwAbTestPayload = {
  title: 'A/B test results',
  testName: 'Nurture email — subject line',
  audience: '18,400 sent · 50/50 split',
  variants: [
    { key: 'A', name: 'Variant A', preview: 'Your Q2 playbook is ready', sent: 9200, openRate: 41, ctr: 3.2, convRate: 1.1, revenue: 28000 },
    { key: 'B', name: 'Variant B', preview: '3 moves to hit Q2 — inside', sent: 9200, openRate: 44, ctr: 5.1, convRate: 1.8, revenue: 46000 },
  ],
  confidence: 97, winner: 'B', lift: '+59% CTR', projected: '+$18K/qtr',
};

export function EcwAbTestCard({ value }: { value?: Partial<EcwAbTestPayload> }) {
  const has = !!(value && Array.isArray(value.variants) && value.variants.length >= 2);
  const src: EcwAbTestPayload = has ? ({ ...AB_TEST_TEST, ...value } as EcwAbTestPayload) : AB_TEST_TEST;
  const [selectedKey, setSelectedKey] = useState<keyof AbVariant>('ctr');

  const raw = src.variants.slice(0, 2).map((v, i) => ({
    key: v.key ? String(v.key) : (i === 0 ? 'A' : 'B'),
    name: v.name ? String(v.name) : `Variant ${i === 0 ? 'A' : 'B'}`,
    preview: v.preview ? String(v.preview) : '',
    sent: num(v.sent), openRate: num(v.openRate), ctr: num(v.ctr), convRate: num(v.convRate), revenue: num(v.revenue),
  }));
  const winnerKey = (src.winner && String(src.winner)) || (raw[1].convRate > raw[0].convRate ? raw[1].key : raw[0].key);
  const winner = raw.find((v) => v.key === winnerKey);
  const confidence = Math.max(0, Math.min(100, Math.round(num(src.confidence))));
  const sig = confidence >= 95;
  const confNote = sig ? 'Statistically significant' : (confidence >= 90 ? 'Approaching significance' : 'Not yet significant');

  const metric = METRICS.find((m) => m.key === selectedKey) || METRICS[1];
  const vals = raw.map((v) => num(v[metric.key] as number));
  const max = Math.max(...vals, 0) || 1;
  const leaderKey = vals[1] > vals[0] ? raw[1].key : raw[0].key;
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const leader = raw.find((v) => v.key === leaderKey);
  const compareText = (lo > 0 && hi !== lo && leader)
    ? `${leader.name} leads on ${metric.label.toLowerCase()} by ${Math.round(((hi - lo) / lo) * 100)}%`
    : (hi === lo ? `Even on ${metric.label.toLowerCase()}` : `${leader ? leader.name : ''} leads on ${metric.label.toLowerCase()}`);

  return (
    <div className="clt-live-preview ecw-ab">
      <div className="ecw-ab-head">
        <span className="ecw-ab-eyebrow">A/B test</span>
        <strong className="ecw-ab-title">{src.testName}</strong>
        {src.audience ? <span className="ecw-ab-aud">{src.audience}</span> : null}
      </div>

      <div className="ecw-ab-lens" role="tablist">
        {METRICS.map((m) => (
          <button key={String(m.key)} type="button" className={`ecw-ab-tab${m.key === selectedKey ? ' is-active' : ''}`} role="tab" onClick={() => setSelectedKey(m.key)}>{m.label}</button>
        ))}
      </div>

      <div className="ecw-ab-stage">
        {raw.map((v, i) => {
          const val = vals[i];
          const isLeader = v.key === leaderKey;
          const isWinner = v.key === winnerKey;
          return (
            <div key={v.key} className={`ecw-ab-variant${isWinner ? ' is-winner' : ''}`}>
              <span className="ecw-ab-vname">{v.name}</span>
              {v.preview ? <p className="ecw-ab-preview">{v.preview}</p> : null}
              <span className="ecw-ab-sent">{sentFmt(v.sent)}</span>
              <strong className={`ecw-ab-val${isLeader ? ' is-leader' : ''}`}>{fmt(metric.kind, val)}</strong>
              <span className="ecw-ab-bar"><span className={`ecw-ab-bar-fill${isLeader ? ' is-leader' : ''}`} style={{ width: `${Math.max(4, Math.round((val / max) * 100))}%` }} /></span>
            </div>
          );
        })}
      </div>
      <p className="ecw-ab-compare">{compareText}</p>

      <div className="ecw-ab-conf">
        <div className="ecw-ab-conf-top">
          <span className="ecw-ab-conf-label">Confidence</span>
          <span className="ecw-ab-conf-val">{confidence}% confidence</span>
        </div>
        <span className="ecw-ab-conf-track"><span className={`ecw-ab-conf-fill${sig ? ' is-sig' : ''}`} style={{ width: `${confidence}%` }} /></span>
        <span className={`ecw-ab-conf-note${sig ? ' is-sig' : ''}`}>{confNote}</span>
      </div>

      {winner ? (
        <div className="ecw-ab-winner">
          <div className="ecw-ab-winner-main">
            <span className="ecw-ab-winner-eyebrow">Winner</span>
            <strong className="ecw-ab-winner-name">{winner.name}</strong>
          </div>
          <div className="ecw-ab-winner-stats">
            {src.lift ? <span className="ecw-ab-winner-lift">{src.lift}</span> : null}
            {src.projected ? <span className="ecw-ab-winner-proj">{src.projected}</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
