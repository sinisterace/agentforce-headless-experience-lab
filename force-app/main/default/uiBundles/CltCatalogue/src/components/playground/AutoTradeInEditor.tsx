import { useState } from 'react';
import { Clock } from 'lucide-react';
import type { AutoTradeInFactor, AutoTradeInPayload } from './payloads';

/**
 * Live preview for the ASA Automotive · Trade-In Estimator CLT (DTO field
 * autoTradeInJSON). LWC-true fields: title?, vehicle{name, detail?, imageUrl?,
 * initials?}, currency?, estimate(number), low?, high?, offerText?,
 * factors[]{label, detail?, impact?(positive|neutral|negative)}, submitText?,
 * submitValue?, secondaryText?, secondaryValue?. An absent/non-numeric estimate
 * drops the preview into test-mode so it renders with no payload — mirroring the LWC.
 */

const TEST: AutoTradeInPayload = {
  title: 'Your trade-in estimate',
  vehicle: { name: '2021 Midsize SUV', detail: '42,300 mi · Good condition', initials: 'SV' },
  currency: 'USD',
  estimate: 18400,
  low: 16900,
  high: 19800,
  offerText: 'Instant offer good for 7 days',
  factors: [
    { label: 'Mileage', detail: '42,300 mi — below average', impact: 'positive' },
    { label: 'Condition', detail: 'Good', impact: 'neutral' },
    { label: 'Market demand', detail: 'High for this trim', impact: 'positive' },
  ],
  submitText: 'Apply to a purchase',
  secondaryText: 'Book an appraisal',
};

function num(v: unknown): number | null {
  const n = Number(v);
  return isFinite(n) ? n : null;
}

function normImpact(s?: string): 'positive' | 'neutral' | 'negative' {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'positive' || raw === 'up' || raw === 'good') return 'positive';
  if (raw === 'negative' || raw === 'down' || raw === 'bad') return 'negative';
  return 'neutral';
}

function money(amount: number, currency = 'USD'): string {
  const n = Number(amount);
  if (!isFinite(n)) return '';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${currency} ${Math.round(n)}`;
  }
}

/** Faithful preview: mirrors the Trade-In Estimator LWC, including test-mode + range math. */
export function AutoTradeInPreview({ value, accentColor }: { value: AutoTradeInPayload; accentColor: string }) {
  const isTestMode = num(value.estimate) === null;
  const src = isTestMode ? TEST : value;

  const v = src.vehicle || { name: '' };
  const vehicleName = v.name ? String(v.name) : 'Your vehicle';
  const parts = vehicleName.split(/\s+/).filter(Boolean);
  const initials = (v.initials && String(v.initials).trim().slice(0, 2).toUpperCase())
    || ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
    || 'CAR';
  const imageUrl = v.imageUrl ? String(v.imageUrl).trim() : '';
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!imageUrl && !imgFailed;

  const currency = src.currency || 'USD';
  const estimate = Math.max(0, num(src.estimate) ?? 0);
  let low = num(src.low);
  let high = num(src.high);
  if (low === null) low = Math.round(estimate * 0.9);
  if (high === null) high = Math.round(estimate * 1.1);
  low = Math.min(low, estimate);
  high = Math.max(high, estimate);
  const span = high - low || 1;
  const frac = Math.max(0, Math.min(1, (estimate - low) / span));

  const factors: AutoTradeInFactor[] = Array.isArray(src.factors) ? src.factors.filter((f) => f && f.label) : [];

  return (
    <div className="clt-live-preview trade-in-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>

      <h3 className="selector-title">{src.title || 'Your trade-in estimate'}</h3>

      <div className="asa-ti-vehicle">
        <span className="asa-ti-avatar">
          {showImage ? (
            <img src={imageUrl} alt={vehicleName} onError={() => setImgFailed(true)} />
          ) : (
            <span className="asa-ti-avatar-fallback" aria-hidden="true">{initials}</span>
          )}
        </span>
        <span className="asa-ti-vehicle-text">
          <span className="asa-ti-vehicle-name">{vehicleName}</span>
          {v.detail && <span className="asa-ti-vehicle-detail">{v.detail}</span>}
        </span>
      </div>

      <div className="asa-ti-estimate">
        <span className="asa-ti-estimate-eyebrow">Estimated trade-in value</span>
        <span className="asa-ti-estimate-value">{money(estimate, currency)}</span>
      </div>
      <div className="asa-ti-range">
        <div className="asa-ti-range-track">
          <span className="asa-ti-range-marker" style={{ left: `${(frac * 100).toFixed(2)}%` }} aria-hidden="true" />
        </div>
        <div className="asa-ti-range-ends">
          <span className="asa-ti-range-low">{money(low, currency)}</span>
          <span className="asa-ti-range-high">{money(high, currency)}</span>
        </div>
      </div>

      {src.offerText && (
        <p className="asa-ti-offer"><Clock aria-hidden="true" /> {src.offerText}</p>
      )}

      {factors.length > 0 && (
        <ul className="asa-ti-factors">
          {factors.map((f, i) => {
            const impact = normImpact(f.impact);
            return (
              <li key={i} className={`asa-ti-factor is-${impact}`}>
                <span className="asa-ti-factor-mark" aria-hidden="true">
                  {impact === 'positive' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 15l6-6 6 6" /></svg>
                  ) : impact === 'negative' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                  ) : null}
                </span>
                <span className="asa-ti-factor-text">
                  <span className="asa-ti-factor-label">{f.label}</span>
                  {f.detail && <span className="asa-ti-factor-detail">{f.detail}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {src.submitText && <button type="button" className="asa-ti-cta">{src.submitText}</button>}
      {src.secondaryText && <button type="button" className="asa-ti-cta is-ghost">{src.secondaryText}</button>}
    </div>
  );
}
