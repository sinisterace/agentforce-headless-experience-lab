import { useState } from 'react';
import { Home, MapPin, Store } from 'lucide-react';
import type { AutoTestDriveDay, AutoTestDrivePayload, AutoTestDriveSlot } from './payloads';

/**
 * Live preview for the ASA Automotive · Test Drive Scheduler CLT (DTO field
 * autoTestDriveJSON). LWC-true fields: title, vehicle? ({ name, trim?,
 * initials?, imageUrl? }), location? ({ name, address? }), days (object[] of
 * { date, slots[] of { id, time, driveType? } }), submitText?. A day list with
 * no bookable slots drops the preview into a test-mode fallback so it renders
 * even with no payload — mirroring the LWC.
 */

const TEST_PAYLOAD: AutoTestDrivePayload = {
  title: 'Book a test drive',
  vehicle: { name: 'Electric SUV', trim: 'RS AWD · Radiant Red', initials: 'EV', imageUrl: '' },
  location: { name: 'Downtown Dealership', address: '500 Market St, San Francisco' },
  days: [
    { date: '2026-09-16', slots: [
      { id: 'a', time: '09:30', driveType: 'showroom' },
      { id: 'b', time: '13:00', driveType: 'at_home' },
    ] },
    { date: '2026-09-17', slots: [
      { id: 'c', time: '10:00', driveType: 'showroom' },
      { id: 'd', time: '15:30', driveType: 'showroom' },
    ] },
    { date: '2026-09-18', slots: [
      { id: 'e', time: '11:00', driveType: 'at_home' },
      { id: 'f', time: '16:00', driveType: 'showroom' },
    ] },
    { date: '2026-09-21', slots: [
      { id: 'g', time: '09:00', driveType: 'showroom' },
      { id: 'h', time: '14:00', driveType: 'at_home' },
    ] },
    { date: '2026-09-22', slots: [
      { id: 'i', time: '10:30', driveType: 'showroom' },
      { id: 'j', time: '17:00', driveType: 'showroom' },
    ] },
  ],
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type DriveBucket = 'showroom' | 'athome';

function driveBucket(v?: string): DriveBucket {
  const raw = String(v || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'athome' || raw === 'home' || raw === 'mobile' || raw === 'atyourdoor') return 'athome';
  return 'showroom';
}
function driveLabel(bucket: DriveBucket): string {
  return bucket === 'athome' ? 'At home' : 'Showroom';
}
function formatDate(iso?: string): { weekday: string; dayNum: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return { weekday: '', dayNum: String(iso || '') };
  const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return { weekday: WEEKDAYS[dt.getUTCDay()] || '', dayNum: String(Number(m[3])) };
}
function monthLabelFor(iso?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return '';
  return `${MONTHS[Number(m[2]) - 1] || ''} ${m[1]}`;
}
function formatTime(hhmm?: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
  if (!m) return String(hhmm || '');
  let h = Number(m[1]);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h %= 12;
  if (h === 0) h = 12;
  return `${h}:${m[2]} ${ampm}`;
}
function vehicleInitials(vehicle?: { name?: string; initials?: string }): string {
  if (!vehicle) return '';
  if (vehicle.initials) return String(vehicle.initials).trim().slice(0, 2).toUpperCase();
  const name = vehicle.name ? String(vehicle.name).trim() : '';
  if (!name) return '';
  const parts = name.split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

/** Faithful preview: mirrors the Test Drive Scheduler LWC, including test-mode fallback. */
export function AutoTestDrivePreview({ value, accentColor }: { value: AutoTestDrivePayload; accentColor: string }) {
  const usableDays = (value.days || []).filter((d) => d && Array.isArray(d.slots) && d.slots.length > 0);
  const isTestMode = usableDays.length === 0;
  const source = isTestMode ? TEST_PAYLOAD : value;
  const days: AutoTestDriveDay[] = isTestMode ? TEST_PAYLOAD.days : usableDays;
  const title = (source.title || 'Book a test drive').trim() || 'Book a test drive';
  const submitText = (value.submitText || 'Book test drive').trim() || 'Book test drive';
  const vehicle = source.vehicle;
  const location = source.location;

  const [dayIndex, setDayIndex] = useState(0);
  const [slotId, setSlotId] = useState('');
  const [imageFailed, setImageFailed] = useState(false);

  const activeIdx = Math.min(dayIndex, days.length - 1);
  const activeDay = days[activeIdx] ?? { slots: [] as AutoTestDriveSlot[] };
  const initials = vehicleInitials(vehicle);
  const showImage = !!vehicle?.imageUrl && !imageFailed;
  const monthLabel = monthLabelFor((activeDay as { date?: string }).date);

  return (
    <div className="clt-live-preview test-drive-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {title && <h3 className="selector-title">{title}</h3>}

      {vehicle?.name && (
        <div className="asa-td-vehicle">
          <span className="asa-td-avatar" aria-hidden="true">
            {showImage ? (
              <img src={vehicle.imageUrl} alt={vehicle.name} onError={() => setImageFailed(true)} />
            ) : (
              <span className="asa-td-initials">{initials}</span>
            )}
          </span>
          <span className="asa-td-vehicle-text">
            <span className="asa-td-vehicle-name">{vehicle.name}</span>
            {vehicle.trim && <span className="asa-td-vehicle-trim">{vehicle.trim}</span>}
            {location?.name && (
              <span className="asa-td-location">
                <MapPin aria-hidden="true" />
                <span className="asa-td-location-text">{location.name}</span>
              </span>
            )}
          </span>
        </div>
      )}

      <div className="asa-td-cal-head">
        <span className="asa-td-eyebrow">Select a day</span>
        {monthLabel && <span className="asa-td-month">{monthLabel}</span>}
      </div>
      <div className="asa-td-days" role="tablist" aria-label="Choose a day">
        {days.map((day, index) => {
          const fmt = formatDate(day.date);
          const selected = index === activeIdx;
          return (
            <button
              type="button"
              role="tab"
              key={`day-${index}`}
              className={selected ? 'asa-td-day is-selected' : 'asa-td-day'}
              aria-selected={selected}
              onClick={() => { setDayIndex(index); setSlotId(''); }}
            >
              <span className="asa-td-day-wd">{fmt.weekday}</span>
              <span className="asa-td-day-num">{fmt.dayNum}</span>
            </button>
          );
        })}
      </div>

      <span className="asa-td-eyebrow asa-td-eyebrow-times">Choose a time</span>
      <div className="asa-td-slots">
        {activeDay.slots.map((slot, index) => {
          const bucket = driveBucket(slot.driveType);
          const id = slot.id || `d${activeIdx}-s${index}`;
          const selected = id === slotId;
          const Icon = bucket === 'athome' ? Home : Store;
          return (
            <button
              type="button"
              key={id}
              className={`asa-td-slot is-${bucket}${selected ? ' is-selected' : ''}`}
              aria-pressed={selected}
              onClick={() => setSlotId(id)}
            >
              <span className="asa-td-slot-ico" aria-hidden="true"><Icon /></span>
              <span className="asa-td-slot-body">
                <span className="asa-td-slot-time">{formatTime(slot.time)}</span>
                <span className="asa-td-slot-type">{driveLabel(bucket)}</span>
              </span>
            </button>
          );
        })}
      </div>

      {slotId && (
        <div className="submit-container">
          <button type="button" className="asa-td-submit">{submitText}</button>
        </div>
      )}
    </div>
  );
}
