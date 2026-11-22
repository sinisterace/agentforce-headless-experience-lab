import { Clock, ExternalLink, MapPin, Phone, Timer } from 'lucide-react';
import type { CareFacility, HealthcareFindCarePayload } from './payloads';
import { facilityBucket, facilityIcon, facilityLabel, telHref } from './findCareFormat';

/**
 * Live preview for the ASA Healthcare · Find Care Near You
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
  const payloadFacilities = Array.isArray(value.facilities) ? value.facilities : [];
  const isTestMode = payloadFacilities.length === 0;
  const title = (isTestMode ? 'Care near you' : value.title) || 'Care near you';
  const subtitle = isTestMode ? 'Near Moscone Center · SoMa, San Francisco' : value.subtitle;
  const facilities = isTestMode ? TEST_FACILITIES : payloadFacilities;

  return (
    <div className="clt-live-preview find-care-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
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
            <div className={`asa-fnd-card is-${bucket}`} key={fac.id || `fac-${index}`}>
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
                <div className="asa-fnd-line is-wait"><Timer aria-hidden="true" /><span>{fac.waitTime}</span></div>
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
