import { FormEvent } from 'react';
import { Sparkle } from 'lucide-react';

/** The payload shape the generic Coworker card reads (see cardData.payloadForFunction). */
type EcwInput =
  | { kind: 'select'; label: string; options: string[]; value?: string }
  | { kind: 'text'; label: string; placeholder?: string; value?: string }
  | { kind: 'date'; label: string; value?: string };
type EcwCardPayload = {
  title?: string;
  stat?: { label: string; value: string };
  fields?: { label: string; value: string }[];
  inputs?: EcwInput[];
  action?: string;
  secondaryAction?: string;
};

/**
 * The generic Coworker record/form card — the non-bespoke team cards (IT access,
 * expense approval, case queue, …) render through this from their DTO payload.
 * Reuses the native-Coworker `.emp-card` styling so it matches the playground.
 */
export function EcwGenericCard({ value }: { value?: EcwCardPayload }) {
  const src = value || {};
  const fields = src.fields || [];
  const inputs = src.inputs || [];
  function onSubmit(e: FormEvent) {
    e.preventDefault();
  }
  return (
    <form className="emp-card" onSubmit={onSubmit}>
      <header className="emp-card-head">
        <span className="emp-card-glyph" aria-hidden="true"><Sparkle /></span>
        <div>
          <span className="emp-card-fn">Agentforce Coworker</span>
          <strong>{src.title || 'Card'}</strong>
        </div>
      </header>

      {src.stat && (
        <div className="emp-stat">
          <span className="emp-stat-label">{src.stat.label}</span>
          <strong className="emp-stat-value">{src.stat.value}</strong>
        </div>
      )}

      {fields.length > 0 && (
        <dl className="emp-fields">
          {fields.map((f) => (
            <div className="emp-field" key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {inputs.length > 0 && (
        <div className="emp-inputs">
          {inputs.map((input) => (
            <label className="emp-input" key={input.label}>
              <span className="emp-input-label">{input.label}</span>
              {input.kind === 'select' && (
                <select defaultValue={input.value}>
                  {input.options.map((opt) => <option key={opt}>{opt}</option>)}
                </select>
              )}
              {input.kind === 'text' && <input type="text" placeholder={input.placeholder} defaultValue={input.value} />}
              {input.kind === 'date' && <input type="date" defaultValue={input.value} />}
            </label>
          ))}
        </div>
      )}

      <div className={src.secondaryAction ? 'emp-actions is-split' : 'emp-actions'}>
        {src.secondaryAction && <button type="button" className="emp-action-secondary">{src.secondaryAction}</button>}
        <button type="submit" className="emp-action-primary">{src.action || 'Submit'}</button>
      </div>
    </form>
  );
}
