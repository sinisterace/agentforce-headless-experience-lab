import { compactMoney, num } from '../ecwFormat';

/** React preview mirror of the deployed `ecwNeedsAttention` LWC (Service · Needs
 *  attention). Keep in sync so catalogue preview == deployed card. */
export type EcwNeedsAttentionItem = { name: string; account?: string; stage?: string; amount: number; flag?: string; state?: 'bad' | 'warn' };
export type EcwNeedsAttentionPayload = { atRiskTotal?: number; count?: number; items: EcwNeedsAttentionItem[] };

export const NEEDS_ATTENTION_TEST: EcwNeedsAttentionPayload = {
  atRiskTotal: 1375000,
  count: 6,
  items: [
    { name: 'Entry System Upgrade - Juniper Hill Academy', stage: 'Negotiation/Review', amount: 250000, flag: 'Overdue 8d', state: 'bad' },
    { name: 'Warehouse Camera Expansion - Alta Canyon Clinics', stage: 'Proposal/Price Quote', amount: 250000, flag: 'Closes in 5d', state: 'warn' },
    { name: 'Warehouse Camera Expansion - Lakepoint Distribution', stage: 'Negotiation/Review', amount: 250000, flag: 'No activity 41d', state: 'warn' },
    { name: 'Visitor Kiosk Pilot - Iron Mesa Manufacturing', stage: 'Prospecting', amount: 250000, flag: 'No activity 36d', state: 'warn' },
    { name: 'Entry System Upgrade - Valencia Campus Services', stage: 'Value Proposition', amount: 250000, flag: 'No activity 33d', state: 'warn' },
    { name: 'Visitor Kiosk Pilot - Keystone Food Markets', stage: 'Proposal/Price Quote', amount: 125000, flag: 'Closes in 9d', state: 'warn' },
  ],
};

export function EcwNeedsAttentionCard({ value }: { value?: Partial<EcwNeedsAttentionPayload> }) {
  const hasContent = !!(value && Array.isArray(value.items) && value.items.length);
  const src: EcwNeedsAttentionPayload = hasContent ? ({ ...NEEDS_ATTENTION_TEST, ...value } as EcwNeedsAttentionPayload) : NEEDS_ATTENTION_TEST;
  const total = num(src.atRiskTotal);
  const count = typeof src.count === 'number' ? src.count : src.items.length;
  const plural = count === 1 ? 'deal needs' : 'deals need';

  return (
    <div className="clt-live-preview ecw-na">
      <div className="ecw-na-hero">
        <span className="ecw-na-hero-label">At risk</span>
        <div className="ecw-na-hero-row">
          <strong className="ecw-na-hero-val">{compactMoney(total)}</strong>
          <span className="ecw-na-summary">{count} {plural} attention</span>
        </div>
      </div>
      <ul className="ecw-na-list">
        {src.items.map((it, i) => {
          const sub = [it.account, it.stage].filter((x) => x && String(x).trim()).join(' · ');
          return (
            <li key={i} className="ecw-na-row">
              <div className="ecw-na-main">
                <span className="ecw-na-name">{it.name}</span>
                {sub && <span className="ecw-na-sub">{sub}</span>}
              </div>
              <div className="ecw-na-side">
                <span className="ecw-na-amount">{compactMoney(num(it.amount))}</span>
                <span className={`ecw-na-flag is-${it.state === 'bad' ? 'bad' : 'warn'}`}>{it.flag}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
