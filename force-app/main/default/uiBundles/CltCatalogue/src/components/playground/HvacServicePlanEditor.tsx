import { useState } from 'react';
import { Check } from 'lucide-react';
import type { HvacPlan, HvacServicePlanPayload } from './payloads';

/**
 * Live preview for the ASA HVAC · Service Plan Selector CLT (DTO field
 * hvacServicePlanJSON). LWC-true fields: title?, subtitle?, currency?,
 * cadence?(mo|yr|wk), currentPlanId?, plans[]{id,name,price,tagline?,badge?,
 * recommended?,features?[string]}, submitText?. An empty payload (no plans)
 * drops the preview into test-mode so it renders with no payload — mirroring
 * the Service Plan Selector LWC.
 */

const TEST_PLANS: HvacPlan[] = [
  { id: 'basic', name: 'Comfort Basic', price: 149, tagline: 'Seasonal peace of mind', features: ['1 annual tune-up', 'Priority scheduling', '10% off repairs'] },
  { id: 'plus', name: 'Comfort Plus', price: 249, tagline: 'Most popular', badge: 'Most popular', recommended: true, features: ['2 tune-ups (heating + cooling)', 'Priority scheduling', '15% off repairs', 'No overtime fees', 'Filter delivery'] },
  { id: 'total', name: 'Comfort Total', price: 399, tagline: 'Total protection', features: ['2 tune-ups + mid-season check', '24/7 priority dispatch', '20% off repairs', 'Free diagnostics', 'Extended parts warranty'] },
];

function formatMoney(amount: number | undefined, currency = 'USD'): string {
  const n = Number(amount);
  if (!isFinite(n)) return '';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

function cadenceSuffix(cadence?: string): string {
  const raw = String(cadence || 'mo').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'yr' || raw === 'year' || raw === 'yearly' || raw === 'annual' || raw === 'annually') return '/yr';
  if (raw === 'wk' || raw === 'week' || raw === 'weekly') return '/wk';
  return '/mo';
}

/** Faithful preview: mirrors the Service Plan Selector LWC, including test-mode fallback + interactivity. */
export function HvacServicePlanPreview({ value, accentColor }: { value: HvacServicePlanPayload; accentColor: string }) {
  const rawPlans = (value.plans ?? []).filter((p) => p && p.id && p.name);
  const isTestMode = rawPlans.length === 0;
  const title = (isTestMode ? 'Choose a comfort plan' : value.title) || 'Choose a comfort plan';
  const subtitle = isTestMode ? 'Annual maintenance memberships that keep your system running' : value.subtitle;
  const currency = value.currency || 'USD';
  const cadence = cadenceSuffix(value.cadence);
  const currentPlanId = isTestMode ? 'basic' : (value.currentPlanId || '');
  const plans = (isTestMode ? TEST_PLANS : rawPlans).slice(0, 4);
  const submitText = (value.submitText && value.submitText.trim()) || 'Enroll in plan';

  const [selectedId, setSelectedId] = useState<string>('');
  const [enrolled, setEnrolled] = useState(false);

  return (
    <div className="clt-live-preview service-plan-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add plans to preview your content</p>}
      <div className="asa-svp-head">
        <h3 className="selector-title">{title}</h3>
        {subtitle && <p className="asa-card-sub">{subtitle}</p>}
      </div>

      <ul className="asa-svp-list">
        {plans.map((p) => {
          const isCurrent = !!currentPlanId && p.id === currentPlanId;
          const recommended = !!p.recommended && !isCurrent;
          const selectable = !isCurrent;
          const selected = selectable && p.id === selectedId;
          const badge = isCurrent ? '' : (p.badge || '').trim();
          const features = (p.features ?? []).filter(Boolean);
          const cls = ['asa-svp-card', isCurrent && 'is-current', recommended && 'is-recommended', selected && 'is-selected'].filter(Boolean).join(' ');
          const stateLabel = isCurrent ? 'Current plan' : selected ? 'Selected' : 'Select';
          return (
            <li key={p.id} className={cls}>
              <div
                className="asa-svp-btn"
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                onClick={() => { if (selectable) setSelectedId(selectedId === p.id ? '' : p.id); }}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && selectable) {
                    e.preventDefault();
                    setSelectedId(selectedId === p.id ? '' : p.id);
                  }
                }}
              >
                {badge && <span className="asa-svp-ribbon">{badge}</span>}
                {isCurrent && <span className="asa-svp-ribbon is-current-tag">Current plan</span>}
                <span className="asa-svp-top">
                  <span className="asa-svp-name-col">
                    <span className="asa-svp-name">{p.name}</span>
                    {p.tagline && <span className="asa-svp-tagline">{p.tagline}</span>}
                  </span>
                  <span className="asa-svp-price-col">
                    <span className="asa-svp-price">{formatMoney(p.price, p.currency || currency)}</span>
                    <span className="asa-svp-cadence">{cadence}</span>
                  </span>
                </span>
                {features.length > 0 && (
                  <ul className="asa-svp-features">
                    {features.map((f, i) => (
                      <li key={i} className="asa-svp-feature">
                        <svg className="asa-svp-check" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10.5 8 14.5 16 5.5" /></svg>
                        <span className="asa-svp-feature-text">{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <span className="asa-svp-state">
                  {!isCurrent && <span className="asa-svp-radio" aria-hidden="true" />}
                  <span className="asa-svp-state-label">{stateLabel}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {selectedId && (
        <button type="button" className="asa-svp-cta" disabled={enrolled} onClick={() => setEnrolled(true)}>
          {enrolled ? <><Check aria-hidden="true" /> Enrollment requested</> : submitText}
        </button>
      )}
    </div>
  );
}
