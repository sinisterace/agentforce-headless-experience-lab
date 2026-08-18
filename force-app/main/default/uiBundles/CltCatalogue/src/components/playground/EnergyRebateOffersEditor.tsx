import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import type { EnergyRebateOffersPayload } from './payloads';
import { money, rebateCategoryLabel } from './energyFormat';

/**
 * Live preview for the ASA Energy & Utilities · Rebate
 * Offers CLT (DTO field energyRebateOffersJSON). LWC-true fields: title?,
 * subtitle?, currency?, offers[]{id,name,category?,rebateAmount?,detail?,badge?},
 * submitText?, submitValue?. Empty offers drop the preview into test-mode — like
 * the LWC. The preview mirrors the LWC's single-select + apply behavior.
 */

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : null);

const TEST: EnergyRebateOffersPayload = {
  title: 'Rebates you qualify for',
  subtitle: 'Save on energy-efficient upgrades',
  currency: 'USD',
  offers: [
    { id: 'thermostat', name: 'Smart thermostat', category: 'thermostat', rebateAmount: 75, detail: 'ENERGY STAR models', badge: 'Popular' },
    { id: 'heatpump', name: 'Heat pump HVAC', category: 'heat_pump', rebateAmount: 1200, detail: 'Whole-home system' },
    { id: 'evcharger', name: 'Level 2 EV charger', category: 'ev_charger', rebateAmount: 500, detail: 'Install included' },
    { id: 'insulation', name: 'Attic insulation', category: 'insulation', rebateAmount: 350, detail: 'Up to R-49' },
  ],
  submitText: 'Apply for rebate',
};

/** Faithful preview: mirrors the Rebate Offers LWC, including test-mode + single-select apply. */
export function EnergyRebateOffersPreview({ value, accentColor }: { value: EnergyRebateOffersPayload; accentColor: string }) {
  const isTestMode = !(Array.isArray(value.offers) && value.offers.filter((o) => o && o.name).length);
  const src = isTestMode ? TEST : value;
  const currency = src.currency || 'USD';
  const offers = (src.offers ?? []).filter((o) => o && o.name);
  const submitText = (src.submitText && src.submitText.trim()) || 'Apply for rebate';

  const [selectedId, setSelectedId] = useState('');
  useEffect(() => { setSelectedId(''); }, [isTestMode, offers.length]);

  return (
    <div className="clt-live-preview rebate-offers-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add offers to preview your content</p>}
      <div className="asa-ro-head">
        <h3 className="selector-title">{(src.title && src.title.trim()) || 'Rebates you qualify for'}</h3>
        {src.subtitle && <p className="asa-ro-sub">{src.subtitle}</p>}
      </div>

      {offers.length > 0 && (
        <>
          <div className="asa-ro-list">
            {offers.map((o, i) => {
              const id = o.id ? String(o.id) : `offer-${i}`;
              const selected = id === selectedId;
              const rebate = num(o.rebateAmount);
              const cat = rebateCategoryLabel(o.category);
              return (
                <div
                  key={id}
                  className={`asa-ro-voucher${selected ? ' is-selected' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  onClick={() => setSelectedId(selected ? '' : id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(selected ? '' : id); } }}
                >
                  <div className="asa-ro-stub">
                    <span className="asa-ro-bolt" aria-hidden="true"><Zap /></span>
                    {rebate !== null && (
                      <>
                        <span className="asa-ro-stub-amt">{money(rebate, currency, 0)}</span>
                        <span className="asa-ro-stub-cap">rebate</span>
                      </>
                    )}
                  </div>
                  <div className="asa-ro-body">
                    {cat && <span className="asa-ro-cat">{cat}</span>}
                    <span className="asa-ro-name">{o.name}</span>
                    {o.detail && <span className="asa-ro-detail">{o.detail}</span>}
                  </div>
                  {o.badge && <span className="asa-ro-badge">{o.badge}</span>}
                  <span className="asa-ro-check" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                </div>
              );
            })}
          </div>
          <button type="button" className="asa-ro-cta" disabled={!selectedId}>{submitText}</button>
        </>
      )}
    </div>
  );
}
