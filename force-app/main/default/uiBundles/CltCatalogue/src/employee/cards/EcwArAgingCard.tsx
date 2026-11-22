import { useMemo, useState } from 'react';
import { num } from '../ecwFormat';
import './EcwArAgingCard.css';

/** React preview mirror of the deployed `ecwArAging` LWC (Finance · AR aging).
 *  ecw family. Hero total + DSO, a stacked aging bar + legend, and a selectable
 *  top-overdue list with a Send-payment-reminder action (local confirmation in preview). */
type ArState = 'good' | 'info' | 'warn' | 'bad';
export type EcwArBucket = { label: string; amount: number; state?: ArState };
export type EcwArTop = { account: string; amount: number; bucket?: string; state?: ArState };
export type EcwArAgingPayload = { totalOutstanding?: number; dso?: string; buckets: EcwArBucket[]; top?: EcwArTop[] };

const COLOR: Record<string, string> = { good: '#15803d', info: '#0d6fd1', warn: '#b45309', bad: '#b91c1c' };

function compact(n: number): string {
  const a = Math.abs(num(n)); const s = n < 0 ? '-' : '';
  if (a >= 1e6) return `${s}$${String(Number((a / 1e6).toFixed(2)))}M`;
  if (a >= 1e3) return `${s}$${Math.round(a / 1e3)}K`;
  return `${s}$${Math.round(a)}`;
}

export const AR_AGING_TEST: EcwArAgingPayload = {
  totalOutstanding: 1240000, dso: '42 days',
  buckets: [
    { label: 'Current', amount: 720000, state: 'good' },
    { label: '1–30', amount: 300000, state: 'info' },
    { label: '31–60', amount: 140000, state: 'warn' },
    { label: '60+', amount: 80000, state: 'bad' },
  ],
  top: [
    { account: 'Alta Canyon Clinics', amount: 48000, bucket: '60+', state: 'bad' },
    { account: 'Keystone Food Markets', amount: 42000, bucket: '31–60', state: 'warn' },
    { account: 'Union Gate Apartments', amount: 36000, bucket: '31–60', state: 'warn' },
    { account: 'Pacific Ridge Builders', amount: 29000, bucket: '1–30', state: 'info' },
  ],
};

export function EcwArAgingCard({ value }: { value?: Partial<EcwArAgingPayload> }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<string>('');

  const vm = useMemo(() => {
    const hasContent = !!(value && Array.isArray(value.buckets) && value.buckets.length);
    const src: EcwArAgingPayload = hasContent ? ({ ...AR_AGING_TEST, ...value } as EcwArAgingPayload) : AR_AGING_TEST;
    const buckets = (src.buckets || []).filter((b) => b && b.label);
    const total = num(src.totalOutstanding) || buckets.reduce((a, b) => a + num(b.amount), 0);
    const denom = total || 1;
    const segments = buckets.filter((b) => num(b.amount) > 0).map((b, i) => ({ key: `seg-${i}`, width: `${Math.max(2, Math.round((num(b.amount) / denom) * 100))}%`, color: COLOR[b.state || 'info'] || '#94a3b8' }));
    const legend = buckets.map((b, i) => ({ key: `leg-${i}`, label: b.label.trim(), amountText: compact(b.amount), pctText: `${Math.round((num(b.amount) / denom) * 100)}%`, color: COLOR[b.state || 'info'] || '#94a3b8' }));
    const top = (src.top || []).filter((t) => t && t.account).map((t, i) => ({ key: `top-${i}`, account: t.account.trim(), amount: num(t.amount), amountText: compact(t.amount), bucket: t.bucket || '', state: (['good', 'info', 'warn', 'bad'].includes(t.state as string) ? t.state : 'info') as ArState }));
    return { heroValue: compact(total), dsoText: src.dso ? `DSO ${src.dso}` : '', segments, legend, top };
  }, [value]);

  const chosen = vm.top.filter((t) => selected[t.key]);

  const remind = () => {
    if (!chosen.length || done) return;
    setDone(`Reminder queued · ${chosen.length} account${chosen.length === 1 ? '' : 's'}`);
  };

  return (
    <div className="clt-live-preview ecw-ar">
      <div className="ecw-ar-hero">
        <span className="ecw-ar-eyebrow">Outstanding receivables</span>
        <div className="ecw-ar-hero-row">
          <strong className="ecw-ar-hero-val">{vm.heroValue}</strong>
          <span className="ecw-ar-dso">{vm.dsoText}</span>
        </div>
      </div>

      {vm.segments.length ? (
        <>
          <div className="ecw-ar-bar">
            {vm.segments.map((s) => <span key={s.key} className="ecw-ar-seg" style={{ width: s.width, background: s.color }} />)}
          </div>
          <ul className="ecw-ar-legend">
            {vm.legend.map((l) => (
              <li key={l.key} className="ecw-ar-leg-row">
                <span className="ecw-ar-dot" style={{ background: l.color }} />
                <span className="ecw-ar-leg-label">{l.label}</span>
                <span className="ecw-ar-leg-pct">{l.pctText}</span>
                <span className="ecw-ar-leg-amt">{l.amountText}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {vm.top.length ? (
        <div className="ecw-ar-top">
          <span className="ecw-ar-top-title">Top overdue accounts</span>
          <div className="ecw-ar-top-list">
            {vm.top.map((t) => {
              const on = !!selected[t.key];
              return (
                <button key={t.key} type="button" className={`ecw-ar-top-row selectable${on ? ' selected' : ''}`} aria-pressed={on} onClick={() => !done && setSelected((s) => ({ ...s, [t.key]: !s[t.key] }))}>
                  <span className={on ? 'ecw-ar-dot2 on' : 'ecw-ar-dot2'} aria-hidden="true" />
                  <span className="ecw-ar-top-acct">{t.account}</span>
                  <span className={`ecw-ar-bchip is-${t.state}`}>{t.bucket}</span>
                  <span className="ecw-ar-top-amt">{t.amountText}</span>
                </button>
              );
            })}
          </div>
          {chosen.length > 0 && !done ? (
            <button type="button" className="ecw-ar-cta" onClick={remind}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              Send payment reminder · {chosen.length}
            </button>
          ) : null}
          {done ? (
            <div className="ecw-ar-done">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
              <span className="ecw-ar-done-text">{done}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
