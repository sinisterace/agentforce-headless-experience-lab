import { Check } from 'lucide-react';
import type { EnergyBudgetBillingPayload } from './payloads';
import { budgetChart, money } from './energyFormat';

/**
 * Live preview for the ASA Energy & Utilities · Budget
 * Billing CLT (DTO field energyBudgetBillingJSON). LWC-true fields: title?,
 * subtitle?, currency?, monthlyAmount?, currentAvgText?, termText?,
 * series{actual[],budget}, bullets[], submitText?, submitValue?, secondaryText?,
 * secondaryValue?. An empty payload drops the preview into test-mode — like the LWC.
 */

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : null);

const TEST: EnergyBudgetBillingPayload = {
  title: 'Smooth out your bill',
  subtitle: 'Budget Billing keeps your payment the same every month',
  currency: 'USD',
  monthlyAmount: 118,
  currentAvgText: 'Your bills now swing $64–$210',
  termText: 'Recalculated every 12 months',
  series: { actual: [96, 120, 168, 210, 150, 88, 64, 72, 110, 175, 190, 140], budget: 118 },
  bullets: ['No surprises in peak season', 'Cancel anytime', 'Settles up once a year'],
  submitText: 'Enroll in Budget Billing',
  secondaryText: 'Maybe later',
};

/** Faithful preview: mirrors the Budget Billing LWC, including test-mode + chart geometry. */
export function EnergyBudgetBillingPreview({ value, accentColor }: { value: EnergyBudgetBillingPayload; accentColor: string }) {
  const hasContent = !!(num(value.monthlyAmount) !== null
    || (value.series && Array.isArray(value.series.actual) && value.series.actual.length)
    || (Array.isArray(value.bullets) && value.bullets.length));
  const isTestMode = !hasContent;
  const src = isTestMode ? TEST : value;
  const currency = src.currency || 'USD';

  const m = num(src.monthlyAmount);
  const chart = budgetChart(src.series?.actual, src.series?.budget);
  const bullets = (src.bullets ?? []).filter(Boolean);

  return (
    <div className="clt-live-preview budget-billing-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add a plan to preview your content</p>}
      <div className="asa-bb-head">
        <h3 className="selector-title">{(src.title && src.title.trim()) || 'Smooth out your bill'}</h3>
        {src.subtitle && <p className="asa-bb-sub">{src.subtitle}</p>}
      </div>

      <div className="asa-bb-amount">
        {m !== null && (
          <>
            <span className="asa-bb-amount-eyebrow">Your fixed monthly payment</span>
            <span className="asa-bb-amount-value">{money(m, currency, 0)}<span className="asa-bb-amount-per">/mo</span></span>
          </>
        )}
        {src.currentAvgText && <span className="asa-bb-swing">{src.currentAvgText}</span>}
      </div>

      {chart && (
        <div className="asa-bb-chart">
          <svg viewBox="0 0 100 44" preserveAspectRatio="none" role="img" aria-label="Your bills versus a flat budget line">
            <path className="asa-bb-actual-area" d={chart.area} />
            <path className="asa-bb-actual-line" d={chart.line} />
            {chart.budgetLine && <path className="asa-bb-budget-line" d={chart.budgetLine} />}
          </svg>
          <div className="asa-bb-legend">
            <span className="asa-bb-leg"><span className="asa-bb-leg-swatch is-actual" aria-hidden="true" />Your bills now</span>
            {chart.budgetLine && <span className="asa-bb-leg"><span className="asa-bb-leg-swatch is-budget" aria-hidden="true" />Budget Billing</span>}
          </div>
        </div>
      )}

      {bullets.length > 0 && (
        <ul className="asa-bb-bullets">
          {bullets.map((b, i) => (
            <li className="asa-bb-bullet" key={i}><Check aria-hidden="true" /><span>{b}</span></li>
          ))}
        </ul>
      )}

      {src.termText && <p className="asa-bb-term">{src.termText}</p>}

      {src.submitText && <button type="button" className="asa-bb-cta">{src.submitText}</button>}
      {src.secondaryText && <button type="button" className="asa-bb-cta2">{src.secondaryText}</button>}
    </div>
  );
}
