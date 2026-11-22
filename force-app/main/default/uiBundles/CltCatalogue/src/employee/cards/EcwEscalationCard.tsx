import { useState } from 'react';
import './EcwEscalationCard.css';

/** React preview mirror of the deployed `ecwEscalation` LWC (Service · Escalate case) —
 *  premium invoice-ledger / incident treatment. */
type EscLine = { item: string; detail?: string; metric?: string };
export type EcwEscalationPayload = {
  title?: string;
  caseInfo?: { number?: string; subject?: string; account?: string; priority?: string; opened?: string; channel?: string };
  severity?: { label?: string; state?: 'ok' | 'warn' | 'bad' };
  reason?: string;
  lines: EscLine[];
  summary?: { label?: string; total?: string; note?: string };
  routeTo?: string;
  ackText?: string;
  action?: string;
};

export const ESCALATION_TEST: EcwEscalationPayload = {
  title: 'Escalate case',
  caseInfo: { number: '00043219', subject: 'SSO login outage — enterprise', account: 'PixelArc', priority: 'High', opened: 'Opened 2h 10m ago', channel: 'Web' },
  severity: { label: 'Sev 1', state: 'bad' },
  reason: "Multiple enterprise customers can't authenticate via SSO; impact is widening.",
  lines: [
    { item: 'Affected accounts', detail: 'PixelArc, Northwind, Acme +4', metric: '7' },
    { item: 'Users impacted', detail: 'SSO authentication failures', metric: '~2,400' },
    { item: 'Revenue at risk', detail: 'Enterprise SLA credits', metric: '$48K' },
    { item: 'SLA window', detail: 'P1 response SLA', metric: '22m left' },
  ],
  summary: { label: 'Business impact', total: 'High', note: '7 accounts · ~2,400 users · $48K at risk' },
  routeTo: 'Tier 2 · Platform on-call',
  ackText: 'I confirm this meets Sev 1 escalation criteria.',
  action: 'Escalate to Tier 2',
};

export function EcwEscalationCard({ value }: { value?: Partial<EcwEscalationPayload> }) {
  const hasContent = !!(value && Array.isArray(value.lines) && value.lines.length);
  const src = (hasContent ? { ...ESCALATION_TEST, ...value } : ESCALATION_TEST) as EcwEscalationPayload;
  const ci = src.caseInfo || {};
  const sev = src.severity || {};
  const sevState = (['ok', 'warn', 'bad'].includes(sev.state as string) ? sev.state : 'warn') as string;
  const sum = src.summary || {};
  const lines = (src.lines || []).filter((l) => l && l.item);
  const route = src.routeTo || 'Tier 2';

  const [acked, setAcked] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <div className={`clt-live-preview ecw-esc is-${sevState}`}>
      <div className="ecw-esc-head">
        <div className="ecw-esc-eyebrow-row">
          <span className="ecw-esc-eyebrow">Escalation</span>
          {sev.label ? <span className="ecw-esc-sev">{sev.label}</span> : null}
        </div>
        {ci.subject ? <h3 className="ecw-esc-subject">{ci.subject}</h3> : null}
        <div className="ecw-esc-meta">
          {ci.number ? <span className="ecw-esc-meta-case">{ci.number}</span> : null}
          {ci.account ? <><span className="ecw-esc-dot" aria-hidden="true"></span><span className="ecw-esc-meta-acct">{ci.account}</span></> : null}
          {ci.priority ? <><span className="ecw-esc-dot" aria-hidden="true"></span><span>{ci.priority} priority</span></> : null}
          {ci.channel ? <><span className="ecw-esc-dot" aria-hidden="true"></span><span>{ci.channel}</span></> : null}
          {ci.opened ? <><span className="ecw-esc-dot" aria-hidden="true"></span><span>{ci.opened}</span></> : null}
        </div>
      </div>

      {src.reason ? <p className="ecw-esc-reason">{src.reason}</p> : null}

      {lines.length ? (
        <>
          <div className="ecw-esc-ledger">
            <div className="ecw-esc-ledger-head"><span>Impact</span><span>Scope</span></div>
            {lines.map((l, i) => (
              <div key={i} className="ecw-esc-row">
                <span className="ecw-esc-row-main">
                  <span className="ecw-esc-item">{l.item}</span>
                  {l.detail ? <span className="ecw-esc-detail">{l.detail}</span> : null}
                </span>
                <span className="ecw-esc-metric">{l.metric}</span>
              </div>
            ))}
            <div className="ecw-esc-total">
              <span className="ecw-esc-total-k">{sum.label || 'Business impact'}</span>
              <span className="ecw-esc-total-v">{sum.total}</span>
            </div>
          </div>
          {sum.note ? <p className="ecw-esc-note">{sum.note}</p> : null}
        </>
      ) : null}

      {src.routeTo ? (
        <div className="ecw-esc-route">
          <span className="ecw-esc-route-k">Route to</span>
          <span className="ecw-esc-route-v">{src.routeTo}</span>
        </div>
      ) : null}

      <div className="ecw-esc-foot">
        {!done ? (
          <>
            <label className="ecw-esc-ack">
              <input type="checkbox" checked={acked} onChange={(e) => setAcked(e.target.checked)} />
              <span className="ecw-esc-ack-text">{src.ackText}</span>
            </label>
            <button type="button" className="ecw-esc-cta" disabled={!acked} onClick={() => acked && setDone(true)}>{src.action}</button>
          </>
        ) : (
          <div className="ecw-esc-done">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
            <span>{`Escalated to ${route} · ref ESC-20481`}</span>
          </div>
        )}
      </div>
    </div>
  );
}
