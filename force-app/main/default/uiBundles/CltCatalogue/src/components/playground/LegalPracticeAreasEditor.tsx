import { useState } from 'react';
import { ArrowUpRight, Briefcase, Building2, ChevronDown, Gavel, Globe, HeartPulse, Home, Scale, ScrollText, Users } from 'lucide-react';
import type { LegalPracticeArea, LegalPracticeAreasPayload } from './payloads';

/**
 * Live preview for the ASA Legal · Practice-Area Selector CLT (DTO field
 * legalPracticeAreasJSON). The entry point for a law-firm site agent — but built
 * to actually inform: each area is an expandable row that opens to reveal what
 * the firm handles there (a short description, a trust stat, the common matter
 * types, a display-only "Learn more" affordance (styled like a link but not
 * clickable), and a Get-help CTA that continues the conversation). LWC-true fields: title?, subtitle?, areas (object[]
 * of { id, name, blurb?, icon?, description?, services?[], stat?, href? }),
 * linkText?, submitText?. Empty areas → test-mode sample so it renders with no payload.
 */

const AREA_ICONS: Record<string, typeof Scale> = {
  injury: HeartPulse,
  family: Users,
  estate: ScrollText,
  business: Building2,
  immigration: Globe,
  criminal: Gavel,
  employment: Briefcase,
  realestate: Home,
  other: Scale,
};
function areaIcon(key?: string): typeof Scale {
  return AREA_ICONS[(key || 'other').toLowerCase()] || Scale;
}

const TEST_AREAS: LegalPracticeArea[] = [
  { id: 'injury', name: 'Personal Injury', blurb: 'Accidents, negligence & claims', icon: 'injury', description: 'We pursue full compensation for accident and negligence victims — medical bills, lost wages, and pain and suffering. No fee unless we win.', services: ['Car & truck accidents', 'Slip & fall', 'Medical malpractice', 'Wrongful death'], stat: '$50M+ recovered', href: '/practice-areas/personal-injury' },
  { id: 'family', name: 'Family Law', blurb: 'Divorce, custody & support', icon: 'family', description: 'Compassionate guidance through divorce, custody, and support — protecting your family and your future at every step.', services: ['Divorce', 'Child custody', 'Child & spousal support', 'Prenuptial agreements'], stat: '1,200+ families helped', href: '/practice-areas/family-law' },
  { id: 'estate', name: 'Estate Planning', blurb: 'Wills, trusts & probate', icon: 'estate', description: 'Plan ahead with wills, trusts, and powers of attorney so your wishes are honored and your loved ones are protected.', services: ['Wills', 'Living trusts', 'Probate', 'Power of attorney'], stat: 'Flat-fee packages', href: '/practice-areas/estate-planning' },
  { id: 'business', name: 'Business & Corporate', blurb: 'Formation, contracts & disputes', icon: 'business', description: 'From formation to contracts to disputes, we help businesses operate and grow with confidence.', services: ['Entity formation', 'Contracts', 'Partnership disputes', 'M&A'], stat: '500+ businesses advised', href: '/practice-areas/business-law' },
  { id: 'immigration', name: 'Immigration', blurb: 'Visas, green cards & citizenship', icon: 'immigration', description: 'Guiding individuals, families, and employers through visas, green cards, and citizenship.', services: ['Family visas', 'Work visas', 'Green cards', 'Naturalization'], stat: '98% approval rate', href: '/practice-areas/immigration' },
  { id: 'criminal', name: 'Criminal Defense', blurb: 'Charges, DUI & expungement', icon: 'criminal', description: 'Aggressive, confidential defense against charges — protecting your rights, your record, and your freedom.', services: ['DUI / DWI', 'Drug charges', 'Assault', 'Expungement'], stat: 'Available 24/7', href: '/practice-areas/criminal-defense' },
  { id: 'employment', name: 'Employment', blurb: 'Disputes, contracts & rights', icon: 'employment', description: 'Standing up for employees and advising employers on workplace rights and compliance.', services: ['Wrongful termination', 'Discrimination', 'Wage & hour', 'Severance review'], stat: 'Free consultation', href: '/practice-areas/employment-law' },
  { id: 'realestate', name: 'Real Estate', blurb: 'Purchases, leases & closings', icon: 'realestate', description: 'Smooth closings and sound advice for buyers, sellers, landlords, and investors.', services: ['Purchases & sales', 'Leases', 'Title review', 'Zoning & disputes'], stat: '2,000+ closings', href: '/practice-areas/real-estate' },
];

/** Faithful preview: the expandable practice-area chooser, including test-mode fallback. */
export function LegalPracticeAreasPreview({
  value,
  accentColor,
}: {
  value: LegalPracticeAreasPayload;
  accentColor: string;
}) {
  const isTestMode = !Array.isArray(value.areas) || value.areas.length === 0;
  const title = (isTestMode ? 'How can we help?' : value.title) || 'How can we help?';
  const subtitle = isTestMode ? 'Tap an area to see how we can help — then start your conversation' : value.subtitle;
  const areas = isTestMode ? TEST_AREAS : value.areas;
  const linkText = (value.linkText || 'Learn more').trim() || 'Learn more';
  const submitText = (value.submitText || 'Get help with {name}').trim() || 'Get help with {name}';

  // Open the first area by default so the card is informative on first render.
  const firstId = areas[0] ? areas[0].id || areas[0].name || 'area-0' : '';
  const [open, setOpen] = useState(firstId);

  return (
    <div className="clt-live-preview legal-areas-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {title && <h3 className="selector-title">{title}</h3>}
      {subtitle && <p className="asa-card-sub">{subtitle}</p>}

      <div className="asa-lpa-list">
        {areas.map((area, index) => {
          const id = area.id || area.name || `area-${index}`;
          const Icon = areaIcon(area.icon);
          const isOpen = open === id;
          const services = (area.services ?? []).filter((s) => s != null && String(s).trim());
          const hasBody = !!(area.description || services.length || area.href || area.stat);
          const submitLabel = submitText.includes('{name}')
            ? submitText.replace('{name}', area.name || 'this')
            : `${submitText}`;
          return (
            <div key={id} className={isOpen ? 'asa-lpa-item is-open' : 'asa-lpa-item'}>
              <button
                type="button"
                className="asa-lpa-row"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? '' : id)}
              >
                <span className="asa-lpa-ico" aria-hidden="true"><Icon /></span>
                <span className="asa-lpa-head">
                  <span className="asa-lpa-name">{area.name || 'Practice area'}</span>
                  {area.blurb && <span className="asa-lpa-blurb">{area.blurb}</span>}
                </span>
                {hasBody && <span className="asa-lpa-chev" aria-hidden="true"><ChevronDown /></span>}
              </button>

              {isOpen && hasBody && (
                <div className="asa-lpa-body">
                  {area.description && <p className="asa-lpa-desc">{area.description}</p>}
                  {area.stat && <span className="asa-lpa-stat">{area.stat}</span>}
                  {services.length > 0 && (
                    <div className="asa-lpa-services">
                      <span className="asa-lpa-services-label">Common matters</span>
                      <div className="asa-lpa-chips">
                        {services.map((s, si) => (
                          <span className="asa-lpa-chip" key={`${id}-svc-${si}`}>{String(s).trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="asa-lpa-actions">
                    {area.href && (
                      // Display-only: looks like a "Learn more" link but is intentionally
                      // not clickable (no href / navigation) in this preview.
                      <span className="asa-lpa-link" aria-hidden="true">
                        {linkText} <ArrowUpRight aria-hidden="true" />
                      </span>
                    )}
                    <button type="button" className="asa-lpa-cta">{submitLabel}</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="asa-lpa-confidential"><Scale aria-hidden="true" /> Free consultation · no obligation.</p>
    </div>
  );
}
