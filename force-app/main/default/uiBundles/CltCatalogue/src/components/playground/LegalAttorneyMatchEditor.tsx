import { useState } from 'react';
import { Award, Check, Scale, Star } from 'lucide-react';
import type { LegalAttorney, LegalAttorneyMatchPayload } from './payloads';
import lawyer1 from '@/assets/legal/lawyer-1.jpg';
import lawyer2 from '@/assets/legal/lawyer-2.jpg';
import lawyer3 from '@/assets/legal/lawyer-3.jpg';

/**
 * Live preview for the ASA Legal · Meet Your Attorney CLT (DTO field
 * legalAttorneyMatchJSON). Attorney cards matched to the visitor's matter, to
 * build trust and hand off to booking. LWC-true fields: title?, subtitle?,
 * attorneys (object[] of { id, name, title?, focus?, photo?, initials?, years?,
 * rating?, casesWon?, bar?, blurb? }), submitText?. Empty attorneys → test-mode
 * sample (uses bundled headshots).
 */

const TEST_ATTORNEYS: LegalAttorney[] = [
  { id: 'vale', name: 'Marcus Vale', title: 'Managing Partner', focus: 'Personal Injury & Litigation', photo: lawyer1, years: 22, rating: 4.9, casesWon: '500+ cases', bar: 'CA #148203', blurb: 'Trial-tested advocate for serious injury and negligence claims.' },
  { id: 'tanaka', name: 'Kenji Tanaka', title: 'Associate', focus: 'Business & Immigration', photo: lawyer2, years: 8, rating: 4.8, casesWon: '120+ matters', bar: 'CA #276514', blurb: 'Guides founders and families through formation, contracts and visas.' },
  { id: 'shaw', name: 'Eleanor Shaw', title: 'Partner', focus: 'Family & Estate Planning', photo: lawyer3, years: 25, rating: 5.0, casesWon: '600+ cases', bar: 'CA #093117', blurb: 'Compassionate counsel for divorce, custody, wills and trusts.' },
];

/** Stable keys so a seeded payload (which can't reference a hashed import URL) can
 *  still show the bundled headshots: photo: "lawyer-1" | "lawyer-2" | "lawyer-3".
 *  Any other value is treated as a direct image URL. */
const PHOTO_MAP: Record<string, string> = { 'lawyer-1': lawyer1, 'lawyer-2': lawyer2, 'lawyer-3': lawyer3 };
function resolvePhoto(photo?: string): string {
  if (!photo) return '';
  return PHOTO_MAP[photo] || photo;
}

function initialsOf(name?: string): string {
  return (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

/** Faithful preview: the attorney matcher, including test-mode fallback. */
export function LegalAttorneyMatchPreview({
  value,
  accentColor,
}: {
  value: LegalAttorneyMatchPayload;
  accentColor: string;
}) {
  const isTestMode = !Array.isArray(value.attorneys) || value.attorneys.length === 0;
  const title = (isTestMode ? 'Meet your attorney' : value.title) || 'Meet your attorney';
  const subtitle = isTestMode ? 'Matched to your matter — book a free consult' : value.subtitle;
  const attorneys = isTestMode ? TEST_ATTORNEYS : value.attorneys;

  const [selected, setSelected] = useState('');
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const chosen = attorneys.find((a) => (a.id || a.name) === selected);
  const submitText = (value.submitText || (chosen ? `Book with ${(chosen.name || '').split(/\s+/)[0]}` : 'Book a consult')).trim();

  return (
    <div className="clt-live-preview legal-attorney-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {title && <h3 className="selector-title">{title}</h3>}
      {subtitle && <p className="asa-card-sub">{subtitle}</p>}

      <div className="asa-lam-list">
        {attorneys.map((a, index) => {
          const id = a.id || a.name || `atty-${index}`;
          const selectedNow = selected === id;
          const initials = a.initials || initialsOf(a.name);
          const photoSrc = resolvePhoto(a.photo);
          const showImg = !!photoSrc && !failed[id];
          return (
            <button
              type="button"
              key={id}
              className={selectedNow ? 'asa-lam-card is-selected' : 'asa-lam-card'}
              aria-pressed={selectedNow}
              onClick={() => setSelected(id)}
            >
              <span className="asa-lam-avatar" aria-hidden="true">
                {showImg ? (
                  <img src={photoSrc} alt={a.name} onError={() => setFailed((f) => ({ ...f, [id]: true }))} />
                ) : (
                  <span className="asa-lam-initials">{initials}</span>
                )}
              </span>
              <span className="asa-lam-body">
                <span className="asa-lam-name-row">
                  <span className="asa-lam-name">{a.name || 'Attorney'}</span>
                  {selectedNow && <span className="asa-lam-check" aria-hidden="true"><Check /></span>}
                </span>
                {(a.title || a.focus) && (
                  <span className="asa-lam-focus">{[a.title, a.focus].filter(Boolean).join(' · ')}</span>
                )}
                {(typeof a.rating === 'number' || a.years || a.casesWon) && (
                  <span className="asa-lam-stats">
                    {typeof a.rating === 'number' && <span className="asa-lam-stat"><Star aria-hidden="true" /> {a.rating.toFixed(1)}</span>}
                    {a.years ? <span className="asa-lam-stat">{a.years} yrs</span> : null}
                    {a.casesWon && <span className="asa-lam-stat"><Award aria-hidden="true" /> {a.casesWon}</span>}
                  </span>
                )}
                {a.blurb && <span className="asa-lam-blurb">{a.blurb}</span>}
                {a.bar && <span className="asa-lam-bar"><Scale aria-hidden="true" /> {a.bar}</span>}
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="submit-container">
          <button type="button" className="asa-lam-submit">{submitText}</button>
        </div>
      )}
    </div>
  );
}
