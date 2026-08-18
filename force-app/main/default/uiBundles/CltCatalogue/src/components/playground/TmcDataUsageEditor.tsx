import { useState } from 'react';
import { Check } from 'lucide-react';
import type { TmcDataUsagePayload } from './payloads';
import { USAGE_COLORS, computeUsage, trimNum } from './tmcFormat';

const TEST_USAGE: TmcDataUsagePayload = {
  title: 'Your data this cycle',
  cycleText: '12 days left · resets Sep 30',
  used: 42.1,
  total: 50,
  unit: 'GB',
  categories: [
    { label: 'Streaming', amount: 24.6 },
    { label: 'Social', amount: 9.8 },
    { label: 'Other', amount: 7.7 },
  ],
  note: "You're on track to stay under your limit.",
  submitText: 'Add a data pass',
};

/** Faithful preview: mirrors the Data Usage Meter LWC, including test-mode fallback + gauge geometry. */
export function TmcDataUsagePreview({
  value,
  accentColor,
}: {
  value: TmcDataUsagePayload;
  accentColor: string;
}) {
  const isTestMode = !Number.isFinite(value.used as number);
  const src = isTestMode ? TEST_USAGE : value;
  const title = (src.title && src.title.trim()) || 'Your usage';
  const unit = src.unit || 'GB';
  const gauge = computeUsage(src.used, src.total, unit);

  const cats = (src.categories ?? []).filter((c) => c && c.label && Number.isFinite(c.amount) && c.amount > 0);
  const sum = cats.reduce((acc, c) => acc + c.amount, 0) || 1;

  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="clt-live-preview data-usage-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add a used value to preview your content</p>}
      <div className="asa-du-head">
        <h3 className="selector-title">{title}</h3>
        {src.cycleText && <p className="asa-du-cycle">{src.cycleText}</p>}
      </div>

      <div className="asa-du-meter">
        <svg className={`asa-du-gauge is-${gauge.bucket}`} viewBox="0 0 120 120" role="img" aria-label="Data usage gauge">
          <circle className="asa-du-track" cx="60" cy="60" r="52" pathLength={100} strokeDasharray={gauge.trackDash} transform="rotate(135 60 60)" />
          <circle className="asa-du-value" cx="60" cy="60" r="52" pathLength={100} strokeDasharray={gauge.valueDash} transform="rotate(135 60 60)" />
        </svg>
        <div className="asa-du-center">
          <span className="asa-du-used">{gauge.usedLabel}<span className="asa-du-unit">{unit}</span></span>
          <span className="asa-du-total">{gauge.totalLabel}</span>
        </div>
      </div>

      <p className="asa-du-remaining">{gauge.remainingLabel}</p>

      {cats.length > 0 && (
        <div className="asa-du-breakdown">
          <div className="asa-du-bar">
            {cats.map((c, i) => {
              const color = c.color?.trim() || USAGE_COLORS[i % USAGE_COLORS.length];
              const pct = Math.max(2, (c.amount / sum) * 100);
              return <span key={i} className="asa-du-seg" style={{ width: `${pct.toFixed(2)}%`, background: color }} />;
            })}
          </div>
          <ul className="asa-du-legend">
            {cats.map((c, i) => {
              const color = c.color?.trim() || USAGE_COLORS[i % USAGE_COLORS.length];
              return (
                <li key={i} className="asa-du-legend-item">
                  <span className="asa-du-dot" style={{ background: color }} />
                  <span className="asa-du-legend-label">{c.label}</span>
                  <span className="asa-du-legend-amt">{trimNum(c.amount)} {unit}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {src.note && <p className={`asa-du-note${gauge.bucket === 'over' ? ' is-over' : gauge.bucket === 'warn' ? ' is-warn' : ''}`}>{src.note}</p>}

      {src.submitText && (
        <button type="button" className="asa-du-cta" disabled={submitted} onClick={() => setSubmitted(true)}>
          {submitted ? <><Check aria-hidden="true" /> Request sent</> : src.submitText}
        </button>
      )}
    </div>
  );
}
