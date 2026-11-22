import { useEffect, useState } from 'react';
import { Award, Briefcase, GraduationCap, HandCoins, HeartPulse, Home, Receipt, Zap } from 'lucide-react';
import type { PseProgramsFinderPayload } from './payloads';

/**
 * Live preview for the ASA Public Sector & Education · Programs & Benefits Finder
 * CLT (DTO field pseProgramsFinderJSON). LWC-true fields: title?, subtitle?,
 * programs[]{id,name,category?,detail?,eligibility?,badge?}, submitText?,
 * submitValue?. Empty programs drop the preview into test-mode — like the LWC.
 * Mirrors the LWC's "Civic Records" masthead + ruled paper rows + single-select.
 */

const CATEGORY_LABELS: Record<string, string> = {
  assistance: 'Assistance',
  education: 'Education',
  health: 'Health',
  housing: 'Housing',
  tax: 'Tax',
  employment: 'Employment',
  utility: 'Utility',
};

function categoryLabel(cat?: string): string {
  const raw = String(cat || '').toLowerCase().replace(/[^a-z_]/g, '');
  if (!raw) return '';
  return CATEGORY_LABELS[raw] || raw.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

function eligBucket(s?: string): 'good' | 'maybe' | 'navy' {
  const t = String(s || '').toLowerCase();
  if (/likely|qualif|eligible/.test(t)) return 'good';
  if (/may|might|possible|pending|review/.test(t)) return 'maybe';
  return 'navy';
}

function CategoryIcon({ cat }: { cat: string }) {
  switch (cat) {
    case 'education': return <GraduationCap />;
    case 'health': return <HeartPulse />;
    case 'housing': return <Home />;
    case 'tax': return <Receipt />;
    case 'employment': return <Briefcase />;
    case 'utility': return <Zap />;
    case 'assistance': return <HandCoins />;
    default: return <Award />;
  }
}

const CivicSeal = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M4 21V10l8-5 8 5v11" /><path d="M8 21v-7" /><path d="M12 21v-7" /><path d="M16 21v-7" /><path d="M3 10h18" /></svg>
);

const TEST: PseProgramsFinderPayload = {
  title: 'Programs & benefits you may qualify for',
  subtitle: "Based on what you've told us",
  programs: [
    { id: 'snap', name: 'Food assistance (SNAP)', category: 'assistance', detail: 'Monthly grocery benefits', eligibility: 'Likely eligible', badge: 'Popular' },
    { id: 'liheap', name: 'Energy bill relief (LIHEAP)', category: 'utility', detail: 'Help with heating & cooling costs', eligibility: 'May be eligible' },
    { id: 'grant', name: 'State tuition grant', category: 'education', detail: 'Up to $4,000/yr for residents', eligibility: 'Likely eligible' },
    { id: 'childcare', name: 'Childcare subsidy', category: 'assistance', detail: 'Sliding-scale childcare help' },
  ],
  submitText: 'Apply for selected',
};

/** Faithful preview: mirrors the Programs & Benefits Finder LWC, incl. test-mode + single-select apply. */
export function PseProgramsFinderPreview({ value, accentColor }: { value: PseProgramsFinderPayload; accentColor: string }) {
  const isTestMode = !(Array.isArray(value.programs) && value.programs.filter((p) => p && p.name).length);
  const src = isTestMode ? TEST : value;
  const programs = (src.programs ?? []).filter((p) => p && p.name);
  const submitText = (src.submitText && src.submitText.trim()) || 'Apply for selected';

  const [selectedId, setSelectedId] = useState('');
  useEffect(() => { setSelectedId(''); }, [isTestMode, programs.length]);

  return (
    <div className="clt-live-preview programs-finder-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>

      <div className="asa-card">
        <div className="asa-pf-masthead">
          <span className="asa-pf-seal" aria-hidden="true"><CivicSeal /></span>
          <span className="asa-pf-mast-text">
            <span className="asa-pf-kicker">Benefits &amp; Assistance</span>
            <h3 className="asa-pf-mast-title">{(src.title && src.title.trim()) || 'Programs & benefits you may qualify for'}</h3>
          </span>
        </div>

        <div className="asa-pf-body-wrap">
          {src.subtitle && <p className="asa-pf-sub">{src.subtitle}</p>}

          {programs.length > 0 && (
            <>
              <div className="asa-pf-panel">
                {programs.map((p, i) => {
                  const id = p.id ? String(p.id) : `program-${i}`;
                  const selected = id === selectedId;
                  const cat = String(p.category || '').toLowerCase().replace(/[^a-z_]/g, '');
                  const label = categoryLabel(p.category);
                  return (
                    <div
                      key={id}
                      className={`asa-pf-row${selected ? ' is-selected' : ''}`}
                      role="button"
                      tabIndex={0}
                      aria-pressed={selected}
                      onClick={() => setSelectedId(selected ? '' : id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(selected ? '' : id); } }}
                    >
                      <span className={`asa-pf-icon is-${cat || 'other'}`} aria-hidden="true"><CategoryIcon cat={cat} /></span>
                      <div className="asa-pf-rowbody">
                        {label && <span className="asa-pf-cat">{label}</span>}
                        <span className="asa-pf-nameline">
                          <span className="asa-pf-name">{p.name}</span>
                          {p.badge && <span className="asa-pf-badge">{p.badge}</span>}
                        </span>
                        {p.detail && <span className="asa-pf-detail">{p.detail}</span>}
                        {p.eligibility && <span className={`asa-pf-stamp is-${eligBucket(p.eligibility)}`}>{p.eligibility}</span>}
                      </div>
                      <span className="asa-pf-radio" aria-hidden="true" />
                    </div>
                  );
                })}
              </div>
              <button type="button" className="asa-pf-cta" disabled={!selectedId}>{submitText}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
