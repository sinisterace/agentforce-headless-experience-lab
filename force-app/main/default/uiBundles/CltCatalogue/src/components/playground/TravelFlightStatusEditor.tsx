import { Bell, Luggage, Plane } from 'lucide-react';
import type { TravelFlightStatusPayload } from './payloads';

/**
 * Live preview for the ASA Travel · Flight Status Tracker CLT (DTO field
 * travelFlightStatusJSON). A live-status card: a plane glides along the route
 * arc between origin and destination, with a status pill, gates/terminals, and
 * baggage claim. LWC-true fields: title?, status?, statusLabel?, origin? / dest?
 * ({ code, city?, time?, gate?, terminal?, baggage? }), progressPct?, aircraft?,
 * durationText?, updatedText?, submitText?. Empty → test-mode sample.
 */

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Scheduled',
  boarding: 'Boarding',
  departed: 'Departed',
  in_air: 'In air',
  landed: 'Landed',
  delayed: 'Delayed',
  cancelled: 'Cancelled',
};
function normStatus(s?: string): string {
  const raw = String(s || '').toLowerCase().replace(/[^a-z_]/g, '');
  if (raw === 'boarding' || raw === 'nowboarding') return 'boarding';
  if (raw === 'departed' || raw === 'taxiing' || raw === 'takeoff') return 'departed';
  if (raw === 'inair' || raw === 'in_air' || raw === 'enroute' || raw === 'airborne') return 'in_air';
  if (raw === 'landed' || raw === 'arrived') return 'landed';
  if (raw === 'delayed' || raw === 'late') return 'delayed';
  if (raw === 'cancelled' || raw === 'canceled') return 'cancelled';
  return 'scheduled';
}

const TEST: TravelFlightStatusPayload = {
  title: 'Flight AF128',
  status: 'in_air',
  origin: { code: 'SFO', city: 'San Francisco', time: '10:35 AM', gate: 'A12', terminal: '2' },
  dest: { code: 'JFK', city: 'New York', time: '7:05 PM', terminal: '4', baggage: 'Belt 6' },
  progressPct: 62,
  aircraft: 'Airbus A321neo',
  durationText: '5h 30m',
  updatedText: 'Live · updated just now',
  submitText: 'Get gate updates',
};

/** Faithful preview: mirrors the Flight Status LWC, including test-mode fallback. */
export function TravelFlightStatusPreview({ value, accentColor }: { value: TravelFlightStatusPayload; accentColor: string }) {
  const isTestMode = !(value.origin?.code || value.dest?.code || value.status);
  const src = isTestMode ? TEST : value;
  const status = normStatus(src.status);
  const statusLabel = (src.statusLabel && src.statusLabel.trim()) || STATUS_LABEL[status];
  const origin = src.origin || { code: '—' };
  const dest = src.dest || { code: '—' };
  const pct = status === 'landed' ? 100 : status === 'scheduled' || status === 'boarding' ? 0 : Math.max(0, Math.min(100, Number(src.progressPct) || 0));
  const title = (src.title || 'Flight status').trim() || 'Flight status';
  const submitText = (src.submitText || 'Get updates').trim() || 'Get updates';

  return (
    <div className="clt-live-preview travel-flightstatus-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      <div className="asa-fs-head">
        <div className="asa-fs-headtext">
          <h3 className="selector-title">{title}</h3>
          {src.aircraft && <p className="asa-fs-aircraft">{src.aircraft}{src.durationText ? ` · ${src.durationText}` : ''}</p>}
        </div>
        <span className={`asa-fs-status is-${status}`}><span className="asa-fs-dot" aria-hidden="true" />{statusLabel}</span>
      </div>

      <div className="asa-fs-route">
        <div className="asa-fs-end">
          <span className="asa-fs-code">{origin.code}</span>
          {origin.city && <span className="asa-fs-city">{origin.city}</span>}
          {origin.time && <span className="asa-fs-time">{origin.time}</span>}
        </div>
        <div className="asa-fs-track">
          <span className="asa-fs-line" aria-hidden="true" />
          <span className="asa-fs-line-fill" style={{ width: `${pct}%` }} aria-hidden="true" />
          <span className={`asa-fs-plane is-${status}`} style={{ left: `${pct}%` }} aria-hidden="true"><Plane /></span>
        </div>
        <div className="asa-fs-end is-dest">
          <span className="asa-fs-code">{dest.code}</span>
          {dest.city && <span className="asa-fs-city">{dest.city}</span>}
          {dest.time && <span className="asa-fs-time">{dest.time}</span>}
        </div>
      </div>

      <div className="asa-fs-info">
        {(origin.gate || origin.terminal) && (
          <div className="asa-fs-info-cell">
            <span className="asa-fs-info-label">Departs</span>
            <span className="asa-fs-info-val">{[origin.terminal && `T${origin.terminal}`, origin.gate && `Gate ${origin.gate}`].filter(Boolean).join(' · ') || '—'}</span>
          </div>
        )}
        {(dest.gate || dest.terminal) && (
          <div className="asa-fs-info-cell">
            <span className="asa-fs-info-label">Arrives</span>
            <span className="asa-fs-info-val">{[dest.terminal && `T${dest.terminal}`, dest.gate && `Gate ${dest.gate}`].filter(Boolean).join(' · ') || '—'}</span>
          </div>
        )}
        {dest.baggage && (
          <div className="asa-fs-info-cell">
            <span className="asa-fs-info-label"><Luggage aria-hidden="true" /> Baggage</span>
            <span className="asa-fs-info-val">{dest.baggage}</span>
          </div>
        )}
      </div>

      {src.updatedText && <p className="asa-fs-updated">{src.updatedText}</p>}

      {submitText && (
        <button type="button" className="asa-fs-cta"><Bell aria-hidden="true" /> {submitText}</button>
      )}
    </div>
  );
}
