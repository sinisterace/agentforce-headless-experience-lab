import { Check, MessageSquare } from 'lucide-react';
import type { MfgWorkOrderPayload } from './payloads';
import { PRIORITY_LABELS, normMilestoneState, normPriority } from './mfgFormat';

/**
 * Live preview for the ASA Manufacturing · Work Order Tracker CLT (DTO field
 * mfgWorkOrderJSON). An empty milestone list drops the preview into a test-mode
 * fallback — mirroring the LWC.
 */

const TEST: MfgWorkOrderPayload = {
  title: 'Work order WO-4821',
  orderNumber: 'WO-4821',
  product: 'Assembly Cell · 2 units',
  priority: 'high',
  etaText: 'Est. ship Oct 2',
  updatedText: 'Updated 1h ago',
  milestones: [
    { label: 'Order received', state: 'done', timeText: 'Sep 10', owner: 'Intake' },
    { label: 'Machining', state: 'done', timeText: 'Sep 14', owner: 'Cell A' },
    { label: 'Assembly', state: 'current', timeText: 'In progress', owner: 'Bay 4' },
    { label: 'Quality check', state: 'todo' },
    { label: 'Ready to ship', state: 'todo' },
  ],
  submitText: 'Message production team',
};

/** Faithful preview: mirrors the Work Order Tracker LWC, including test-mode fallback + vertical timeline. */
export function MfgWorkOrderPreview({ value, accentColor }: { value: MfgWorkOrderPayload; accentColor: string }) {
  const raw = (value.milestones ?? []).filter((m) => m && m.label);
  const isTestMode = raw.length === 0;
  const src = isTestMode ? TEST : value;
  const orderNumber = (src.orderNumber || '').trim();
  const title = (src.title && src.title.trim()) || (orderNumber ? `Work order ${orderNumber}` : 'Work order');
  const priority = normPriority(src.priority);
  const milestones = (isTestMode ? TEST.milestones : raw);

  return (
    <div className="clt-live-preview work-order-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      <div className="asa-wo-head">
        <div className="asa-wo-head-main">
          <h3 className="selector-title">{title}</h3>
          {src.product && <p className="asa-wo-product">{src.product}</p>}
        </div>
        {src.priority && <span className={`asa-wo-priority is-${priority}`}>{PRIORITY_LABELS[priority]}</span>}
      </div>

      <ol className="asa-wo-track">
        {milestones.map((m, i) => {
          const state = normMilestoneState(m.state);
          const meta = [m.timeText, m.owner].filter(Boolean).join(' · ');
          return (
            <li key={i} className={`asa-wo-step is-${state}${i === milestones.length - 1 ? ' is-last' : ''}`}>
              <span className="asa-wo-node" aria-hidden="true">{state === 'done' && <Check />}</span>
              <span className="asa-wo-step-text">
                <span className="asa-wo-step-label">{m.label}</span>
                {meta && <span className="asa-wo-step-meta">{meta}</span>}
              </span>
            </li>
          );
        })}
      </ol>

      {src.etaText && (
        <div className="asa-wo-eta">
          <svg className="asa-wo-eta-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 3v5h-7z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
          <span className="asa-wo-eta-text">{src.etaText}</span>
          {src.updatedText && <span className="asa-wo-updated">{src.updatedText}</span>}
        </div>
      )}

      {src.submitText && (
        <button type="button" className="asa-wo-cta"><MessageSquare aria-hidden="true" /> {src.submitText}</button>
      )}
    </div>
  );
}
