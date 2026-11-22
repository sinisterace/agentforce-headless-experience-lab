import { useMemo, useState } from 'react';
import { num } from '../ecwFormat';
import './EcwApApprovalsCard.css';

/** React preview mirror of the deployed `ecwApApprovals` LWC (Finance · AP approvals).
 *  ecw family (airy navy, hairlines, mono). Hero total awaiting; selectable invoice rows;
 *  Approve / Hold action bar → a local confirmation banner (preview is client-only). */
export type EcwApItem = { id?: string; vendor: string; type?: string; amount: number; due?: string; aging?: string; state?: 'ok' | 'warn' | 'bad' };
export type EcwApApprovalsPayload = { headline?: string; totalAmount?: number; items: EcwApItem[] };

function compact(n: number): string {
  const a = Math.abs(num(n)); const s = n < 0 ? '-' : '';
  if (a >= 1e6) return `${s}$${String(Number((a / 1e6).toFixed(2)))}M`;
  if (a >= 1e3) return `${s}$${Math.round(a / 1e3)}K`;
  return `${s}$${Math.round(a)}`;
}

export const AP_APPROVALS_TEST: EcwApApprovalsPayload = {
  headline: '5 awaiting approval', totalAmount: 284000,
  items: [
    { id: 'INV-4821', vendor: 'Sentinel Hardware Co.', type: 'Invoice', amount: 82000, due: 'Due in 2 days', aging: 'Received 3d ago', state: 'warn' },
    { id: 'PO-2290', vendor: 'NorthGate Camera Supply', type: 'PO', amount: 64000, due: 'Due in 5 days', aging: 'Received 1d ago', state: 'ok' },
    { id: 'INV-4809', vendor: 'Veritas Access Controls', type: 'Invoice', amount: 58000, due: 'Overdue 1 day', aging: 'Received 9d ago', state: 'bad' },
    { id: 'INV-4815', vendor: 'BluePeak Installations', type: 'Invoice', amount: 46000, due: 'Due in 6 days', aging: 'Received 2d ago', state: 'ok' },
    { id: 'PO-2284', vendor: 'Cedar Signal Networks', type: 'PO', amount: 34000, due: 'Due in 8 days', aging: 'Received 4d ago', state: 'ok' },
  ],
};

export function EcwApApprovalsCard({ value }: { value?: Partial<EcwApApprovalsPayload> }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<string>('');

  const vm = useMemo(() => {
    const hasContent = !!(value && Array.isArray(value.items) && value.items.length);
    const src: EcwApApprovalsPayload = hasContent ? ({ ...AP_APPROVALS_TEST, ...value } as EcwApApprovalsPayload) : AP_APPROVALS_TEST;
    const items = (src.items || []).filter((i) => i && i.vendor).map((i, idx) => {
      const state = (['ok', 'warn', 'bad'].includes(i.state as string) ? i.state : 'ok') as 'ok' | 'warn' | 'bad';
      const sub = [i.type, i.id].filter((x) => x && String(x).trim()).join(' · ');
      return { key: `ap-${idx}`, vendor: i.vendor.trim(), sub, amount: num(i.amount), amountText: compact(num(i.amount)), due: i.due || '', aging: i.aging || '', state };
    });
    return { heroValue: compact(num(src.totalAmount)), headline: src.headline || '', items };
  }, [value]);

  const selKeys = vm.items.filter((i) => selected[i.key]);
  const n = selKeys.length;

  const act = (verb: 'approve' | 'hold') => {
    if (!n || done) return;
    const total = compact(selKeys.reduce((a, i) => a + i.amount, 0));
    setDone(verb === 'hold' ? `${n} invoice${n > 1 ? 's' : ''} placed on hold` : `${n} invoice${n > 1 ? 's' : ''} approved · ${total}`);
  };

  return (
    <div className="clt-live-preview ecw-ap">
      <div className="ecw-ap-hero">
        <span className="ecw-ap-eyebrow">Awaiting approval</span>
        <div className="ecw-ap-hero-row">
          <strong className="ecw-ap-hero-val">{vm.heroValue}</strong>
          <span className="ecw-ap-headline">{vm.headline}</span>
        </div>
      </div>

      <ul className="ecw-ap-list">
        {vm.items.map((i) => {
          const on = !!selected[i.key];
          return (
            <li key={i.key} className={on ? 'ecw-ap-row selected' : 'ecw-ap-row'}>
              <button type="button" className="ecw-ap-rowhead" aria-pressed={on} onClick={() => !done && setSelected((s) => ({ ...s, [i.key]: !s[i.key] }))}>
                <span className={on ? 'ecw-ap-dot on' : 'ecw-ap-dot'} aria-hidden="true" />
                <span className="ecw-ap-main">
                  <span className="ecw-ap-vendor">{i.vendor}</span>
                  <span className="ecw-ap-sub">
                    <span className="ecw-ap-subtext">{i.sub}</span>
                    {i.aging ? <span className="ecw-ap-aging">{i.aging}</span> : null}
                  </span>
                </span>
                <span className="ecw-ap-amount">{i.amountText}</span>
                {i.due ? <span className={`ecw-ap-due is-${i.state}`}>{i.due}</span> : null}
              </button>
            </li>
          );
        })}
      </ul>

      {n > 0 && !done ? (
        <div className="ecw-ap-actions">
          <button type="button" className="ecw-ap-cta" onClick={() => act('approve')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg>
            Approve · {n}
          </button>
          <button type="button" className="ecw-ap-cta is-ghost" onClick={() => act('hold')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            Hold · {n}
          </button>
        </div>
      ) : null}

      {done ? (
        <div className="ecw-ap-done">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
          <span className="ecw-ap-done-text">{done}</span>
        </div>
      ) : null}
    </div>
  );
}
