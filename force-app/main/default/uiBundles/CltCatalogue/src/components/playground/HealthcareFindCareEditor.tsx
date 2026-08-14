import { ArrowDown, ArrowUp, Clock, ExternalLink, MapPin, Phone, Plus, Timer, Trash2 } from 'lucide-react';
import type { CareFacility, HealthcareFindCarePayload } from './payloads';
import { facilityBucket, facilityIcon, facilityLabel, telHref } from './findCareFormat';

/**
 * Build/Input editor + live preview for the ASA Healthcare · Find Care Near You
 * CLT (DTO field healthcareFindCareJSON). LWC-true fields: title, subtitle?,
 * facilities (object[] of { id, name, type?, distance?, openNow?, hours?,
 * waitTime?, address?, phone?, services?[], mapsUrl? }). Wayfinding only — the
 * cards carry no patient health info and hand off via Directions / Call links.
 * An empty facility list drops the preview into a test-mode fallback so it
 * renders even with no payload — mirroring the LWC.
 */

/** The Google Maps red marker — explicit brand colors, no currentColor, so the
 *  Directions button reads unmistakably as "get directions in Google Maps". */
function GoogleMapsPin() {
  return (
    <svg className="asa-fnd-gmaps" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 2c-3.87 0-7 3.13-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.6" fill="#fff" />
    </svg>
  );
}

const FACILITY_TYPES = ['urgent_care', 'er', 'primary_care', 'pharmacy', 'clinic', 'hospital', 'lab', 'telehealth'];
const OPEN_STATES = [
  { value: 'unset', label: 'No status' },
  { value: 'open', label: 'Open now' },
  { value: 'closed', label: 'Closed' },
];

function openStateOf(openNow?: boolean): string {
  if (openNow === true) return 'open';
  if (openNow === false) return 'closed';
  return 'unset';
}

export function HealthcareFindCareEditor({
  value,
  onChange,
}: {
  value: HealthcareFindCarePayload;
  onChange: (next: HealthcareFindCarePayload) => void;
}) {
  const setFacility = (index: number, patch: Partial<CareFacility>) => {
    const facilities = value.facilities.slice();
    facilities[index] = { ...facilities[index], ...patch };
    onChange({ ...value, facilities });
  };
  const addFacility = () =>
    onChange({
      ...value,
      facilities: [
        ...value.facilities,
        { id: `f-${value.facilities.length + 1}`, name: 'New facility', type: 'clinic', distance: '', openNow: true },
      ],
    });
  const removeFacility = (index: number) => onChange({ ...value, facilities: value.facilities.filter((_, i) => i !== index) });
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.facilities.length) return;
    const facilities = value.facilities.slice();
    [facilities[index], facilities[target]] = [facilities[target], facilities[index]];
    onChange({ ...value, facilities });
  };
  const setOpen = (index: number, state: string) =>
    setFacility(index, { openNow: state === 'open' ? true : state === 'closed' ? false : undefined });
  const setServices = (index: number, raw: string) =>
    setFacility(index, { services: raw.split(',').map((s) => s.trim()).filter(Boolean) });

  return (
    <div className="playground-editor">
      <label className="playground-field">
        Title
        <input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="Care near you" />
      </label>
      <label className="playground-field">
        Subtitle <span className="optional-label">Optional</span>
        <input value={value.subtitle ?? ''} onChange={(e) => onChange({ ...value, subtitle: e.target.value })} placeholder="Based on your location" />
      </label>

      <div className="playground-list">
        <div className="playground-list-head">
          <span>Facilities</span>
          <button type="button" className="playground-add" onClick={addFacility}><Plus aria-hidden="true" /> Add facility</button>
        </div>
        {value.facilities.length === 0 && <p className="playground-empty">No facilities — the component shows sample test data until you add one.</p>}
        {value.facilities.map((fac, index) => (
          <div className="playground-card" key={index}>
            <div className="playground-card-head">
              <strong>Facility {index + 1}</strong>
              <span className="playground-card-actions">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up"><ArrowUp aria-hidden="true" /></button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === value.facilities.length - 1} aria-label="Move down"><ArrowDown aria-hidden="true" /></button>
                <button type="button" onClick={() => removeFacility(index)} aria-label="Remove facility"><Trash2 aria-hidden="true" /></button>
              </span>
            </div>
            <label className="playground-field">
              Name
              <input value={fac.name} onChange={(e) => setFacility(index, { name: e.target.value })} placeholder="CityMed Urgent Care" />
            </label>
            <div className="playground-field">
              <span>Type</span>
              <select value={facilityBucketToType(fac.type)} onChange={(e) => setFacility(index, { type: e.target.value })}>
                {FACILITY_TYPES.map((t) => <option value={t} key={t}>{t}</option>)}
              </select>
            </div>
            <div className="playground-field">
              <span>Status</span>
              <select value={openStateOf(fac.openNow)} onChange={(e) => setOpen(index, e.target.value)}>
                {OPEN_STATES.map((s) => <option value={s.value} key={s.value}>{s.label}</option>)}
              </select>
            </div>
            <label className="playground-field">
              Distance <span className="optional-label">Optional</span>
              <input value={fac.distance ?? ''} onChange={(e) => setFacility(index, { distance: e.target.value })} placeholder="0.8 mi" />
            </label>
            <label className="playground-field">
              Hours <span className="optional-label">Optional</span>
              <input value={fac.hours ?? ''} onChange={(e) => setFacility(index, { hours: e.target.value })} placeholder="Open until 9:00 PM" />
            </label>
            <label className="playground-field">
              Wait time <span className="optional-label">Optional</span>
              <input value={fac.waitTime ?? ''} onChange={(e) => setFacility(index, { waitTime: e.target.value })} placeholder="12 min wait" />
            </label>
            <label className="playground-field">
              Address <span className="optional-label">Optional</span>
              <input value={fac.address ?? ''} onChange={(e) => setFacility(index, { address: e.target.value })} placeholder="220 Pine St" />
            </label>
            <label className="playground-field">
              Phone <span className="optional-label">Optional</span>
              <input value={fac.phone ?? ''} onChange={(e) => setFacility(index, { phone: e.target.value })} placeholder="+14155550142" />
            </label>
            <label className="playground-field">
              Services <span className="optional-label">comma-separated</span>
              <input value={(fac.services ?? []).join(', ')} onChange={(e) => setServices(index, e.target.value)} placeholder="X-ray, Labs, Stitches" />
            </label>
            <label className="playground-field">
              Maps URL <span className="optional-label">Directions link</span>
              <input value={fac.mapsUrl ?? ''} onChange={(e) => setFacility(index, { mapsUrl: e.target.value })} placeholder="https://www.google.com/maps/dir/?api=1&destination=..." />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Snap a stored free-text type back onto one of the select's canonical values. */
function facilityBucketToType(type?: string): string {
  const bucket = facilityBucket(type);
  switch (bucket) {
    case 'urgentcare':
      return 'urgent_care';
    case 'primarycare':
      return 'primary_care';
    default:
      return bucket;
  }
}

const TEST_FACILITIES: CareFacility[] = [
  { id: 'f1', name: 'GoHealth Urgent Care – SoMa', type: 'urgent_care', distance: '0.3 mi', openNow: true, hours: 'Open until 8:00 PM', waitTime: '15 min wait', address: '876 Folsom St, San Francisco', phone: '+14155550142', services: ['X-ray', 'Labs', 'Stitches'], mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=876%20Folsom%20St%2C%20San%20Francisco%2C%20CA%2094107' },
  { id: 'f2', name: 'One Medical – Yerba Buena', type: 'primary_care', distance: '0.2 mi', openNow: true, hours: 'Open until 6:00 PM', address: '631 Mission St, San Francisco', phone: '+14155550111', services: ['Primary care', 'Vaccines', 'Labs'], mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=631%20Mission%20St%2C%20San%20Francisco%2C%20CA%2094105' },
  { id: 'f3', name: 'Saint Francis Memorial Hospital ER', type: 'er', distance: '1.5 mi', openNow: true, hours: 'Open 24 hours', address: '900 Hyde St, San Francisco', phone: '+14155550190', mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=900%20Hyde%20St%2C%20San%20Francisco%2C%20CA%2094109' },
  { id: 'f4', name: 'Walgreens Pharmacy – Powell St', type: 'pharmacy', distance: '0.6 mi', openNow: false, hours: 'Opens 8:00 AM Mon', address: '135 Powell St, San Francisco', phone: '+14155550170', services: ['Rx pickup', 'Vaccines'], mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=135%20Powell%20St%2C%20San%20Francisco%2C%20CA%2094102' },
];

/** Faithful preview: mirrors the Find Care LWC, including test-mode fallback. */
export function HealthcareFindCarePreview({
  value,
  accentColor,
}: {
  value: HealthcareFindCarePayload;
  accentColor: string;
}) {
  const isTestMode = value.facilities.length === 0;
  const title = (isTestMode ? 'Care near you' : value.title) || 'Care near you';
  const subtitle = isTestMode ? 'Near Moscone Center · SoMa, San Francisco' : value.subtitle;
  const facilities = isTestMode ? TEST_FACILITIES : value.facilities;

  return (
    <div className="clt-live-preview find-care-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add a facility to preview your content</p>}
      {title && <h3 className="selector-title">{title}</h3>}
      {subtitle && <p className="asa-card-sub">{subtitle}</p>}

      <div className="asa-fnd-list">
        {facilities.map((fac, index) => {
          const bucket = facilityBucket(fac.type);
          const Icon = facilityIcon(bucket);
          const tel = telHref(fac.phone);
          const mapsUrl = fac.mapsUrl ? String(fac.mapsUrl).trim() : '';
          const services = (fac.services ?? []).filter((s) => s != null && String(s).trim());
          const showStatus = fac.openNow === true || fac.openNow === false;
          return (
            <div className="asa-fnd-card" key={fac.id || `fac-${index}`}>
              <div className="asa-fnd-head">
                <span className={`asa-fnd-ico is-${bucket}`} aria-hidden="true"><Icon /></span>
                <span className="asa-fnd-headtext">
                  <span className="asa-fnd-name">{fac.name || 'Care facility'}</span>
                  <span className="asa-fnd-meta">
                    <span className="asa-fnd-type">{facilityLabel(bucket)}</span>
                    {fac.distance && (
                      <>
                        <span className="asa-fnd-dot" aria-hidden="true">·</span>
                        <span className="asa-fnd-dist">{fac.distance}</span>
                      </>
                    )}
                  </span>
                </span>
                {showStatus && (
                  <span className={fac.openNow ? 'asa-fnd-status is-open' : 'asa-fnd-status is-closed'}>{fac.openNow ? 'Open now' : 'Closed'}</span>
                )}
              </div>

              {fac.hours && (
                <div className="asa-fnd-line"><Clock aria-hidden="true" /><span>{fac.hours}</span></div>
              )}
              {fac.waitTime && (
                <div className="asa-fnd-line"><Timer aria-hidden="true" /><span>{fac.waitTime}</span></div>
              )}
              {fac.address && (
                <div className="asa-fnd-line"><MapPin aria-hidden="true" /><span>{fac.address}</span></div>
              )}

              {services.length > 0 && (
                <div className="asa-fnd-chips">
                  {services.map((svc, i) => <span className="asa-fnd-chip" key={`svc-${index}-${i}`}>{String(svc).trim()}</span>)}
                </div>
              )}

              {mapsUrl ? (
                <div className="asa-fnd-actions">
                  <a className="asa-fnd-btn is-maps" href={mapsUrl} target="_blank" rel="noopener noreferrer"><GoogleMapsPin /><span>Directions</span></a>
                  {tel && <a className="asa-fnd-btn" href={tel}><Phone aria-hidden="true" /><span>Call</span></a>}
                </div>
              ) : tel ? (
                <div className="asa-fnd-actions">
                  <a className="asa-fnd-btn is-primary" href={tel}><Phone aria-hidden="true" /><span>Call</span></a>
                </div>
              ) : (
                <div className="asa-fnd-actions">
                  <span className="asa-fnd-btn is-muted"><ExternalLink aria-hidden="true" /><span>No link provided</span></span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
