import { useState } from 'react';
import { Check } from 'lucide-react';
import type { PlanComparePlan, TmcPlanComparePayload } from './payloads';
import { cadenceSuffix, formatMoney } from './tmcFormat';

const TEST_PLANS: PlanComparePlan[] = [
  { id: 'essential', name: 'Essential', price: 45, tagline: 'For light users', features: ['10 GB premium data', '5G nationwide', 'SD streaming'] },
  { id: 'unlimited', name: 'Unlimited Plus', price: 70, tagline: 'Our most popular plan', badge: 'Most popular', recommended: true, features: ['Unlimited premium data', 'HD streaming', '50 GB hotspot', '5G Ultra Capacity'] },
  { id: 'premium', name: 'Premium 5G', price: 90, tagline: 'Everything, maxed out', features: ['Unlimited premium data', '4K UHD streaming', '100 GB hotspot', 'Global roaming'] },
];

/** Faithful preview: mirrors the Plan Comparison LWC, including test-mode fallback + interactivity. */
export function TmcPlanComparePreview({
  value,
  accentColor,
}: {
  value: TmcPlanComparePayload;
  accentColor: string;
}) {
  const rawPlans = (value.plans ?? []).filter((p) => p && p.id && p.name);
  const isTestMode = rawPlans.length === 0;
  const title = (isTestMode ? 'Compare plans' : value.title) || 'Compare plans';
  const subtitle = isTestMode ? 'Pick the plan that fits how you use your phone' : value.subtitle;
  const currency = value.currency || 'USD';
  const cadence = cadenceSuffix(value.cadence);
  const currentPlanId = isTestMode ? 'essential' : (value.currentPlanId || '');
  const plans = (isTestMode ? TEST_PLANS : rawPlans).slice(0, 4);
  const submitText = (value.submitText && value.submitText.trim()) || 'Switch plan';

  const [selectedId, setSelectedId] = useState<string>('');
  const [switched, setSwitched] = useState(false);

  return (
    <div className="clt-live-preview plan-compare-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      <div className="asa-plc-head">
        <h3 className="selector-title">{title}</h3>
        {subtitle && <p className="asa-card-sub">{subtitle}</p>}
      </div>

      <ul className="asa-plc-list">
        {plans.map((p) => {
          const isCurrent = !!currentPlanId && p.id === currentPlanId;
          const recommended = !!p.recommended && !isCurrent;
          const selectable = !isCurrent;
          const selected = selectable && p.id === selectedId;
          const badge = isCurrent ? '' : (p.badge || '').trim();
          const features = (p.features ?? []).filter(Boolean);
          const cls = ['asa-plc-card', isCurrent && 'is-current', recommended && 'is-recommended', selected && 'is-selected'].filter(Boolean).join(' ');
          const stateLabel = isCurrent ? 'Current plan' : selected ? 'Selected' : 'Select';
          return (
            <li key={p.id} className={cls}>
              <div
                className="asa-plc-btn"
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
                {badge && <span className="asa-plc-ribbon">{badge}</span>}
                {isCurrent && <span className="asa-plc-ribbon is-current-tag">Current plan</span>}
                <span className="asa-plc-top">
                  <span className="asa-plc-name-col">
                    <span className="asa-plc-name">{p.name}</span>
                    {p.tagline && <span className="asa-plc-tagline">{p.tagline}</span>}
                  </span>
                  <span className="asa-plc-price-col">
                    <span className="asa-plc-price">{formatMoney(p.price, p.currency || currency)}</span>
                    <span className="asa-plc-cadence">{cadence}</span>
                  </span>
                </span>
                {features.length > 0 && (
                  <ul className="asa-plc-features">
                    {features.map((f, i) => (
                      <li key={i} className="asa-plc-feature">
                        <svg className="asa-plc-check" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10.5 8 14.5 16 5.5" /></svg>
                        <span className="asa-plc-feature-text">{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <span className="asa-plc-state">
                  {!isCurrent && <span className="asa-plc-radio" aria-hidden="true" />}
                  <span className="asa-plc-state-label">{stateLabel}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {selectedId && (
        <button type="button" className="asa-plc-cta" disabled={switched} onClick={() => setSwitched(true)}>
          {switched ? <><Check aria-hidden="true" /> Plan switch requested</> : submitText}
        </button>
      )}
    </div>
  );
}
