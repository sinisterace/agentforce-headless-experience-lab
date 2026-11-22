import { compactMoney, num } from '../ecwFormat';

/** React preview mirror of the deployed `ecwWhatChanged` LWC (Sales · What changed). */
export type EcwWhatChangedItem = { label: string; deal: string; detail?: string; amount?: number; when?: string; state?: 'good' | 'info' | 'warn' | 'bad' };
export type EcwWhatChangedPayload = { netText?: string; summaryText?: string; items: EcwWhatChangedItem[] };

export const WHAT_CHANGED_TEST: EcwWhatChangedPayload = {
  netText: '+$510K', summaryText: '5 updates this week',
  items: [
    { label: 'Won', deal: 'Entry System Upgrade - Juniper Mesa Schools', detail: 'Closed Won', amount: 250000, when: '2d ago', state: 'good' },
    { label: 'Advanced', deal: 'Warehouse Camera Expansion - Amber Valley Resorts', detail: 'Prospecting → Proposal', amount: 250000, when: '3d ago', state: 'info' },
    { label: 'New', deal: 'Visitor Kiosk Pilot - Ravenwood Storage', detail: 'Added to pipeline', amount: 125000, when: '4d ago', state: 'info' },
    { label: 'Slipped', deal: 'Entry System Upgrade - Yucca Trail Schools', detail: 'Close date moved out 3 weeks', amount: 250000, when: '5d ago', state: 'warn' },
    { label: 'Lost', deal: 'Warehouse Camera Expansion - Teal Ridge Schools', detail: 'Closed Lost — went with incumbent', amount: 125000, when: '6d ago', state: 'bad' },
  ],
};

export function EcwWhatChangedCard({ value }: { value?: Partial<EcwWhatChangedPayload> }) {
  const hasContent = !!(value && Array.isArray(value.items) && value.items.length);
  const src: EcwWhatChangedPayload = hasContent ? ({ ...WHAT_CHANGED_TEST, ...value } as EcwWhatChangedPayload) : WHAT_CHANGED_TEST;

  return (
    <div className="clt-live-preview ecw-wc">
      {src.netText && (
        <div className="ecw-wc-hero">
          <span className="ecw-wc-hero-label">Pipeline change · this week</span>
          <div className="ecw-wc-hero-row">
            <strong className="ecw-wc-hero-val">{src.netText}</strong>
            {src.summaryText && <span className="ecw-wc-summary">{src.summaryText}</span>}
          </div>
        </div>
      )}
      <ul className="ecw-wc-list">
        {src.items.map((ev, i) => {
          const state = ['good', 'info', 'warn', 'bad'].includes(ev.state || '') ? ev.state : 'info';
          const meta = [ev.label, ev.detail, ev.when].filter((x) => x && String(x).trim()).join(' · ');
          return (
            <li key={i} className="ecw-wc-row">
              <span className={`ecw-wc-rail is-${state}`} />
              <div className="ecw-wc-main">
                <span className="ecw-wc-deal">{ev.deal}</span>
                <span className="ecw-wc-meta">{meta}</span>
              </div>
              <span className="ecw-wc-amount">{ev.amount != null ? compactMoney(num(ev.amount)) : ''}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
