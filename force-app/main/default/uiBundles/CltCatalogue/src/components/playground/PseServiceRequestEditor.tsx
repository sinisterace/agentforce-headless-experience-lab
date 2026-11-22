import { useState } from 'react';
import { MapPin } from 'lucide-react';
import type { PseRequestType, PseServiceRequestPayload } from './payloads';
import locationScene from '@/assets/public-sector/location-scene.jpg';

/**
 * Live preview for the ASA Public Sector & Education · Service Request CLT
 * (DTO field pseServiceRequestJSON). "Civic Records" design: navy agency
 * masthead with a seal emblem over official paper, a big central location scene
 * with an overlaid address caption, then a grid of request-type tiles. LWC-true
 * fields: title?, subtitle?, locationText?, requestTypes[] of
 * { id, label, description?, icon? }, submitText?, submitValue?. No request
 * types drops the preview into test-mode — mirroring the LWC.
 */

const TEST_REQUESTS: PseRequestType[] = [
  { id: 'pothole', label: 'Pothole / road', description: 'Damaged road or pavement', icon: 'road' },
  { id: 'streetlight', label: 'Streetlight out', description: 'Broken or flickering light', icon: 'light' },
  { id: 'graffiti', label: 'Graffiti', description: 'Vandalism or tagging', icon: 'graffiti' },
  { id: 'trash', label: 'Trash / dumping', description: 'Missed pickup or illegal dumping', icon: 'trash' },
  { id: 'water', label: 'Water / leak', description: 'Leak, flooding, or hydrant', icon: 'water' },
  { id: 'facility', label: 'Facilities', description: 'Building or campus maintenance', icon: 'building' },
];

type Bucket = 'road' | 'light' | 'graffiti' | 'trash' | 'water' | 'building' | 'tree' | 'sidewalk' | 'noise' | 'other';

function normReqIcon(icon?: string): Bucket {
  const raw = String(icon || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'road' || raw === 'pothole' || raw === 'pavement' || raw === 'street') return 'road';
  if (raw === 'light' || raw === 'streetlight' || raw === 'lamp' || raw === 'lighting') return 'light';
  if (raw === 'graffiti' || raw === 'vandalism' || raw === 'tagging') return 'graffiti';
  if (raw === 'trash' || raw === 'garbage' || raw === 'dumping' || raw === 'waste' || raw === 'litter') return 'trash';
  if (raw === 'water' || raw === 'leak' || raw === 'flood' || raw === 'hydrant' || raw === 'sewer') return 'water';
  if (raw === 'building' || raw === 'facility' || raw === 'facilities' || raw === 'maintenance') return 'building';
  if (raw === 'tree' || raw === 'park' || raw === 'landscaping' || raw === 'vegetation') return 'tree';
  if (raw === 'sidewalk' || raw === 'curb' || raw === 'walkway') return 'sidewalk';
  if (raw === 'noise' || raw === 'sound' || raw === 'nuisance') return 'noise';
  return 'other';
}

/** Inline SVG glyph per bucket (self-contained; mirrors the LWC's per-icon SVGs). */
function Glyph({ bucket }: { bucket: Bucket }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (bucket) {
    case 'road':
      return <svg viewBox="0 0 24 24" {...p}><path d="M4 19 7 5" /><path d="M20 19 17 5" /><path d="M12 6v2" /><path d="M12 11v2" /><path d="M12 16v2" /></svg>;
    case 'light':
      return <svg viewBox="0 0 24 24" {...p}><path d="M15 14c.2-1 .7-1.7 1.5-2.5C17.7 10.2 18 9 18 7.5a6 6 0 0 0-12 0c0 1.5.3 2.7 1.5 4 .8.8 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>;
    case 'graffiti':
      return <svg viewBox="0 0 24 24" {...p}><rect x="7" y="8" width="10" height="13" rx="2" /><path d="M9 8V5h6v3" /><path d="M19.5 4h.01" /><path d="M21 6.5h.01" /><path d="M19.5 9h.01" /></svg>;
    case 'trash':
      return <svg viewBox="0 0 24 24" {...p}><path d="M3 6h18" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
    case 'water':
      return <svg viewBox="0 0 24 24" {...p}><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></svg>;
    case 'building':
      return <svg viewBox="0 0 24 24" {...p}><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M9 8h.01" /><path d="M15 8h.01" /><path d="M9 12h.01" /><path d="M15 12h.01" /><path d="M10 21v-4h4v4" /></svg>;
    case 'tree':
      return <svg viewBox="0 0 24 24" {...p}><path d="M8 19a4 4 0 0 1-1-7.9A5 5 0 0 1 17 10a3.5 3.5 0 0 1-1 6.9" /><path d="M12 15v7" /></svg>;
    case 'sidewalk':
      return <svg viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="16" rx="1" /><path d="M3 10h18" /><path d="M3 16h18" /><path d="M9 4v16" /><path d="M15 4v16" /></svg>;
    case 'noise':
      return <svg viewBox="0 0 24 24" {...p}><path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></svg>;
    default:
      return <svg viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>;
  }
}

/** Faithful preview: mirrors the Service Request LWC (Civic Records), incl. test-mode. */
export function PseServiceRequestPreview({
  value,
  accentColor,
}: {
  value: PseServiceRequestPayload;
  accentColor: string;
}) {
  const isTestMode = !Array.isArray(value.requestTypes) || value.requestTypes.length === 0;
  const src = isTestMode ? { title: 'Report a problem', subtitle: "Choose what you'd like to report", locationText: 'Near 123 Main St', requestTypes: TEST_REQUESTS } : value;
  const title = (src.title && String(src.title)) || 'Report a problem';
  const requests = src.requestTypes ?? [];
  const submitText = value.submitText || 'Start report';

  const [selected, setSelected] = useState<string>('');

  return (
    <div className="clt-live-preview service-request-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>

      <div className="asa-sr-card">
        <div className="asa-sr-masthead">
          <span className="asa-sr-seal" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M4 21V10l8-5 8 5v11" /><path d="M8 21v-7" /><path d="M12 21v-7" /><path d="M16 21v-7" /><path d="M3 10h18" /></svg>
          </span>
          <span className="asa-sr-mast-text">
            <span className="asa-sr-kicker">Report an issue</span>
            <span className="asa-sr-mast-title">{title}</span>
          </span>
        </div>

        <div className="asa-sr-body">
          <div className="asa-sr-scene">
            <img className="asa-sr-scene-img" src={locationScene} alt="" />
            <span className="asa-sr-scene-scrim" aria-hidden="true" />
            {src.locationText && (
              <span className="asa-sr-scene-cap">
                <MapPin aria-hidden="true" />
                <span className="asa-sr-scene-cap-text">{src.locationText}</span>
              </span>
            )}
          </div>

          {src.subtitle && <p className="asa-sr-sub">{src.subtitle}</p>}

          <div className="asa-sr-grid">
            {requests.map((req, index) => {
              const key = req.id || `${req.label}-${index}`;
              const bucket = normReqIcon(req.icon);
              const isSelected = selected === key;
              const tileClass = `asa-sr-tile is-${bucket}${isSelected ? ' is-selected' : ''}`;
              return (
                <button type="button" key={key} className={tileClass} onClick={() => setSelected(key)} aria-pressed={isSelected}>
                  <span className="asa-sr-ico" aria-hidden="true"><Glyph bucket={bucket} /></span>
                  <span className="asa-sr-text">
                    <span className="asa-sr-label">{req.label}</span>
                    {req.description && <span className="asa-sr-desc">{req.description}</span>}
                  </span>
                  <span className={isSelected ? 'asa-sr-check on' : 'asa-sr-check'} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  </span>
                </button>
              );
            })}
          </div>

          {selected && <button type="button" className="asa-sr-submit">{submitText}</button>}
        </div>
      </div>
    </div>
  );
}
