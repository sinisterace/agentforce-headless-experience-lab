import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import type { LegalCaseEvaluationPayload, LegalEvalQuestion } from './payloads';

/**
 * Live preview for the ASA Legal · Free Case Evaluation CLT (DTO field
 * legalCaseEvaluationJSON). The signature law-firm-site intake, styled as a real
 * sectioned form: quick structured questions → your details → consent → submit.
 * LWC-true fields: title?, subtitle?, matter?, questions (object[] of { id,
 * label, type? (choice|date), options?[] }), describeLabel?, describePlaceholder?,
 * consentText?, disclaimer?, footerNote?, submitText?. Empty questions → test-mode.
 *
 * Disclaimer is legally accurate for a public web form: submitting does NOT create
 * an attorney–client relationship (a web submission is not privileged).
 */

const TEST_QUESTIONS: LegalEvalQuestion[] = [
  { id: 'when', label: 'When did this happen?', type: 'choice', options: ['Past week', 'Past month', '1–6 months ago', 'Over 6 months ago'] },
  { id: 'injured', label: 'Was anyone injured?', type: 'choice', options: ['Yes', 'No', 'Not sure'] },
  { id: 'represented', label: 'Have you hired a lawyer for this?', type: 'choice', options: ['No', 'Yes'] },
];

const DEFAULT_CONSENT = 'I agree to the Privacy Policy and Terms of Use.';
const DEFAULT_DISCLAIMER =
  'Submitting this form does not create an attorney–client relationship. Please don’t share confidential or time-sensitive details until we’ve agreed to represent you.';
const DEFAULT_FOOTER = 'An attorney will review your request and respond within 1 business day.';

/** Faithful preview: the guided case-evaluation intake form, including test-mode fallback. */
export function LegalCaseEvaluationPreview({
  value,
  accentColor,
}: {
  value: LegalCaseEvaluationPayload;
  accentColor: string;
}) {
  const isTestMode = !Array.isArray(value.questions) || value.questions.length === 0;
  const title = (isTestMode ? 'Free case review' : value.title) || 'Free case review';
  const subtitle = isTestMode ? "Tell us a little and we'll assess your options" : value.subtitle;
  const matter = isTestMode ? 'Personal Injury' : value.matter;
  const questions = isTestMode ? TEST_QUESTIONS : value.questions;
  const describeLabel = (value.describeLabel || 'Briefly describe your situation').trim();
  const describePlaceholder = value.describePlaceholder || 'Share what happened, in your own words…';
  const consentText = (value.consentText || DEFAULT_CONSENT).trim();
  const disclaimer = value.disclaimer === '' ? '' : (value.disclaimer || DEFAULT_DISCLAIMER).trim();
  const footerNote = value.footerNote === '' ? '' : (value.footerNote || DEFAULT_FOOTER).trim();
  const submitText = (value.submitText || 'Request my free review').trim() || 'Request my free review';

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState({ first: '', last: '', email: '', phone: '' });
  const [text, setText] = useState('');
  const [agree, setAgree] = useState(false);
  const setAnswer = (qid: string, v: string) => setAnswers((a) => ({ ...a, [qid]: v }));
  const setField = (k: keyof typeof contact, v: string) => setContact((c) => ({ ...c, [k]: v }));

  return (
    <div className="clt-live-preview legal-eval-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {title && <h3 className="selector-title">{title}</h3>}
      {subtitle && <p className="asa-card-sub">{subtitle}</p>}

      {matter && (
        <div className="asa-lce-matter">
          <span className="asa-lce-matter-label">Matter</span>
          <span className="asa-lce-matter-name">{matter}</span>
        </div>
      )}

      <div className="asa-lce-form">
        {questions.length > 0 && (
          <div className="asa-lce-section">
            <span className="asa-lce-section-title">About your matter</span>
            {questions.map((q, index) => {
              const qid = q.id || `q-${index}`;
              const isDate = (q.type || 'choice').toLowerCase() === 'date';
              const options = (q.options ?? []).filter((o) => o != null && String(o).trim());
              return (
                <div className="asa-lce-q" key={qid}>
                  <span className="asa-lce-q-label">{q.label}</span>
                  {isDate ? (
                    <label className="asa-lce-date">
                      <CalendarDays aria-hidden="true" />
                      <input type="date" value={answers[qid] || ''} onChange={(e) => setAnswer(qid, e.target.value)} />
                    </label>
                  ) : (
                    <div className="asa-lce-opts">
                      {options.map((opt, oi) => {
                        const v = String(opt).trim();
                        const selectedNow = answers[qid] === v;
                        return (
                          <button
                            type="button"
                            key={`${qid}-${oi}`}
                            className={selectedNow ? 'asa-lce-opt is-selected' : 'asa-lce-opt'}
                            aria-pressed={selectedNow}
                            onClick={() => setAnswer(qid, v)}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="asa-lce-q">
              <span className="asa-lce-q-label">{describeLabel}</span>
              <textarea
                className="asa-lce-textarea"
                rows={3}
                placeholder={describePlaceholder}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="asa-lce-section">
          <span className="asa-lce-section-title">Your details</span>
          <div className="asa-lce-row">
            <label className="asa-lce-field">
              <span className="asa-lce-flabel">First name <i aria-hidden="true">*</i></span>
              <input className="asa-lce-input" type="text" placeholder="e.g. Sarah" value={contact.first} onChange={(e) => setField('first', e.target.value)} />
            </label>
            <label className="asa-lce-field">
              <span className="asa-lce-flabel">Last name <i aria-hidden="true">*</i></span>
              <input className="asa-lce-input" type="text" placeholder="e.g. Johnson" value={contact.last} onChange={(e) => setField('last', e.target.value)} />
            </label>
          </div>
          <label className="asa-lce-field">
            <span className="asa-lce-flabel">Email address <i aria-hidden="true">*</i></span>
            <input className="asa-lce-input" type="email" placeholder="e.g. sarah@email.com" value={contact.email} onChange={(e) => setField('email', e.target.value)} />
          </label>
          <label className="asa-lce-field">
            <span className="asa-lce-flabel">Phone number (optional)</span>
            <input className="asa-lce-input" type="tel" placeholder="e.g. (555) 123-4567" value={contact.phone} onChange={(e) => setField('phone', e.target.value)} />
          </label>
        </div>

        <label className="asa-lce-consent">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>{consentText}</span>
        </label>

        {disclaimer && <p className="asa-lce-disclaimer">{disclaimer}</p>}

        <button type="button" className="asa-lce-submit">{submitText}</button>

        {footerNote && <p className="asa-lce-footer">{footerNote}</p>}
      </div>
    </div>
  );
}
