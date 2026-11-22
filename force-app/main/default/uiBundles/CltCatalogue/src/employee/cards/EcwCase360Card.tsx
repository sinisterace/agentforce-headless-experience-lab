import { useState } from 'react';
import './EcwCase360Card.css';

/** React preview mirror of the deployed `ecwCase360` LWC (Service · Case 360) — a
 *  premium case dossier: header lockup (monogram, case id, subject, a typographic
 *  status line), a hairline-ruled spec grid, contact lines, the "ask", a suggested
 *  next step, an aligned activity timeline, and a related-cases accordion. */
export type Case360Related = { caseNumber?: string; subject: string; account?: string; priority?: string; ageText?: string };
export type Case360Timeline = { label: string; time?: string; state?: 'info' | 'good' | 'warn' | 'bad' };
export type EcwCase360Payload = {
  caseNumber?: string; subject: string; description?: string; priority?: string; status?: string;
  origin?: string; ageText?: string; account?: string; contactName?: string; contactRole?: string;
  contactEmail?: string; contactPhone?: string; accountOpen?: number; product?: string; slaText?: string;
  owner?: string; sentiment?: 'positive' | 'neutral' | 'negative'; nextAction?: string;
  timeline?: Case360Timeline[]; related?: Case360Related[];
};

const STATUS_STATE: Record<string, string> = { New: 'info', Working: 'info', 'On Hold': 'warn', Escalated: 'bad', Closed: 'good' };
const PRIORITY_STATE: Record<string, string> = { High: 'bad', Medium: 'warn', Low: 'neutral', Normal: 'neutral' };
const SENTIMENT: Record<string, { label: string; cls: string }> = {
  positive: { label: 'Positive', cls: 'is-pos' },
  neutral: { label: 'Neutral', cls: 'is-neu' },
  negative: { label: 'Frustrated', cls: 'is-neg' },
};

function monogram(name?: string) {
  const parts = String(name || '').trim().split(/\s+/);
  if (!parts[0]) return '—';
  return ((parts[0][0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export const CASE360_TEST: EcwCase360Payload = {
  caseNumber: '00001074',
  subject: 'Badge reader intermittent failure at east entrance',
  description: 'Badge readers at the east entrance intermittently fail to register valid credentials during morning peak. Customer requests a diagnostic and firmware check before the account sync meeting.',
  priority: 'High', status: 'Escalated', origin: 'Web', ageText: '36d open',
  account: 'Arroyo Medical Group', contactName: 'Alex Garcia', contactRole: 'Facilities Manager',
  contactEmail: 'alex.garcia@example.com', contactPhone: '(636) 555-9171', accountOpen: 1,
  product: 'Badge Access System', slaText: 'Response due in 2h', owner: 'Priya Nair',
  sentiment: 'negative',
  nextAction: 'Run a remote diagnostic on the east-entrance readers, then schedule a firmware check ahead of the account sync.',
  timeline: [
    { label: 'Case opened via Web', time: '36d ago', state: 'info' },
    { label: 'Assigned to Priya Nair', time: '35d ago', state: 'info' },
    { label: 'Customer replied — "still happening every morning"', time: '2d ago', state: 'warn' },
    { label: 'Escalated to Tier 2 hardware', time: '1d ago', state: 'bad' },
  ],
  related: [
    { caseNumber: '00001124', subject: 'Camera retention policy question', account: 'Union Gate Apartments', priority: 'High', ageText: '34d open' },
    { caseNumber: '00001119', subject: 'Smart lock battery alert', account: 'Pacific Ridge Builders', priority: 'High', ageText: '33d open' },
    { caseNumber: '00001129', subject: 'Visitor kiosk check-in delay', account: 'Alta Canyon Clinics', priority: 'High', ageText: '30d open' },
  ],
};

export function EcwCase360Card({ value }: { value?: Partial<EcwCase360Payload> }) {
  const hasContent = !!(value && value.subject);
  const src: EcwCase360Payload = hasContent ? ({ ...CASE360_TEST, ...value } as EcwCase360Payload) : CASE360_TEST;
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const eyebrow = src.caseNumber ? `Case ${src.caseNumber}` : 'Case';
  const priority = src.priority || 'Normal';
  const priorityClass = `ecw-c3-prio is-${PRIORITY_STATE[priority] || 'neutral'}`;
  const status = src.status || 'New';
  const statusDotClass = `ecw-c3-dot is-${STATUS_STATE[status] || 'info'}`;
  const sent = SENTIMENT[String(src.sentiment || '').toLowerCase()];

  const ao = Number(src.accountOpen);
  const origin = src.origin ? String(src.origin).trim() : '';
  const opened = [origin, src.ageText].filter(Boolean).join(' · ');
  const strip: { key: string; label: string; value: string; sub?: string }[] = [];
  if (src.account) strip.push({ key: 's-acct', label: 'Account', value: src.account, sub: isFinite(ao) && ao > 0 ? `${ao} open` : '' });
  if (src.owner) strip.push({ key: 's-owner', label: 'Owner', value: src.owner });
  if (src.slaText) strip.push({ key: 's-sla', label: 'SLA', value: src.slaText });
  if (src.product) strip.push({ key: 's-prod', label: 'Product', value: src.product });
  if (opened) strip.push({ key: 's-open', label: 'Opened', value: opened });

  const contactName = src.contactName ? (src.contactRole ? `${src.contactName} · ${src.contactRole}` : src.contactName) : '';
  const timeline = (src.timeline || []).filter((t) => t && t.label);
  const related = (src.related || []).filter((r) => r && r.subject);

  return (
    <div className="clt-live-preview ecw-c3">
      <header className="ecw-c3-head">
        <span className="ecw-c3-mono" aria-hidden="true">{monogram(src.account || src.contactName || src.subject)}</span>
        <div className="ecw-c3-head-main">
          <span className="ecw-c3-eyebrow">{eyebrow}</span>
          <strong className="ecw-c3-subject">{src.subject}</strong>
          <div className="ecw-c3-metaline">
            <span className="ecw-c3-status"><span className={statusDotClass} />{status}</span>
            <span className={priorityClass}>{priority}</span>
            {src.ageText && <span className="ecw-c3-age">{src.ageText}</span>}
            {sent && <span className={`ecw-c3-sent ${sent.cls}`}>{sent.label}</span>}
          </div>
        </div>
      </header>

      {strip.length > 0 && (
        <div className="ecw-c3-strip">
          {strip.map((s) => (
            <div key={s.key} className="ecw-c3-cell">
              <span className="ecw-c3-cell-l">{s.label}</span>
              <span className="ecw-c3-cell-v">{s.value}{s.sub ? <span className="ecw-c3-cell-sub">{s.sub}</span> : null}</span>
            </div>
          ))}
        </div>
      )}

      {(contactName || src.contactEmail || src.contactPhone) && (
        <div className="ecw-c3-contact">
          {contactName && <span className="ecw-c3-contact-name">{contactName}</span>}
          {src.contactEmail && (
            <span className="ecw-c3-cline">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="1.5" /><path d="m4 7 8 5.5L20 7" /></svg>
              {src.contactEmail}
            </span>
          )}
          {src.contactPhone && (
            <span className="ecw-c3-cline">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h3l2 5-2 1a12 12 0 0 0 5 5l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z" /></svg>
              {src.contactPhone}
            </span>
          )}
        </div>
      )}

      {src.description && <p className="ecw-c3-lead">{src.description}</p>}

      {src.nextAction && (
        <div className="ecw-c3-nba">
          <svg className="ecw-c3-nba-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M13 2 4.5 13H11l-1 9 8.5-11H12l1-9z" /></svg>
          <span className="ecw-c3-nba-body">
            <span className="ecw-c3-nba-label">Suggested next step</span>
            <span className="ecw-c3-nba-text">{src.nextAction}</span>
          </span>
        </div>
      )}

      {timeline.length > 0 && (
        <section className="ecw-c3-sect">
          <span className="ecw-c3-sectlabel">Activity</span>
          <ul className="ecw-c3-tl-list">
            {timeline.map((t, i) => {
              const state = ['info', 'good', 'warn', 'bad'].includes(t.state || '') ? t.state : 'info';
              return (
                <li key={i} className={i === timeline.length - 1 ? 'ecw-c3-titem is-last' : 'ecw-c3-titem'}>
                  <span className="ecw-c3-trail" aria-hidden="true"><span className={`ecw-c3-tnode is-${state}`} /></span>
                  <span className="ecw-c3-tlabel">{t.label}</span>
                  {t.time && <span className="ecw-c3-ttime">{t.time}</span>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section className="ecw-c3-sect">
          <span className="ecw-c3-sectlabel">Also in your queue</span>
          <ul className="ecw-c3-related-list">
            {related.map((r, i) => {
              const key = `rel-${i}`;
              const isOpen = !!open[key];
              const meta = [r.priority, r.ageText].filter(Boolean).join(' · ');
              return (
                <li key={key} className={isOpen ? 'ecw-c3-related-row is-open' : 'ecw-c3-related-row'}>
                  <button type="button" className="ecw-c3-related-head" onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}>
                    <span className={`ecw-c3-rtick is-${PRIORITY_STATE[r.priority || ''] || 'neutral'}`} aria-hidden="true" />
                    <span className="ecw-c3-related-subj">{r.subject}</span>
                    <span className="ecw-c3-related-num">{r.caseNumber}</span>
                    <svg className={isOpen ? 'ecw-c3-caret is-open' : 'ecw-c3-caret'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 10 4 4 4-4" /></svg>
                  </button>
                  {isOpen && (
                    <div className="ecw-c3-related-body">
                      <span>{r.account}</span>
                      <span className="ecw-c3-related-meta">{meta}</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
