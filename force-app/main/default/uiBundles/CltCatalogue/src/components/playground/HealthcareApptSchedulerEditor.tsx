import { useState } from 'react';
import { MapPin, ShieldCheck, Star } from 'lucide-react';
import type { ApptSlot, HealthcareApptSchedulerPayload } from './payloads';
import {
  apptMonthLabel,
  formatApptDate,
  formatApptTime,
  providerInitials,
  visitBucket,
  visitIcon,
  visitLabel,
} from './apptSchedulerFormat';
import drMayaChen from '@/assets/dr-maya-chen.jpg';

/** '/resource/<Name>' sentinels the LWC resolves via @salesforce/resourceUrl,
 *  mapped to the bundled asset so the React preview shows the same photo. A raw
 *  '/resource/...' path 404s in the preview; real https URLs pass through. */
const RESOURCE_IMG: Record<string, string> = { asaHealthcareDrMayaChen: drMayaChen };
function resolveProviderImage(url?: string): string {
  const s = String(url || '').trim();
  if (!s) return '';
  const m = /^\/resource\/([A-Za-z0-9_]+)/.exec(s);
  return m && RESOURCE_IMG[m[1]] ? RESOURCE_IMG[m[1]] : s;
}

/**
 * Live preview for the ASA Healthcare · Appointment Scheduler CLT (DTO field
 * healthcareApptSchedulerJSON). LWC-true fields: title, provider? ({ name,
 * specialty?, initials?, imageUrl? }), location? ({ name, address? }), days
 * (object[] of { date, slots[] of { id, time, visitType? } }), submitText?. A
 * day list with no bookable slots drops the preview into a test-mode fallback
 * so it renders even with no payload — mirroring the LWC.
 */

const TEST_PAYLOAD: HealthcareApptSchedulerPayload = {
  title: 'Book a visit',
  provider: { name: 'Dr. Maya Chen', specialty: 'Primary Care · Internal Medicine', initials: 'MC', imageUrl: drMayaChen, badge: 'Accepting new patients', rating: 4.9, reviews: 320 },
  location: { name: 'Yerba Buena Medical Group', address: '150 4th St, San Francisco' },
  days: [
    { date: '2026-09-18', slots: [
      { id: 's1', time: '09:00', visitType: 'in-person' },
      { id: 's2', time: '10:30', visitType: 'video' },
      { id: 's3', time: '13:15', visitType: 'phone' },
    ] },
    { date: '2026-09-21', slots: [
      { id: 's4', time: '08:45', visitType: 'in-person' },
      { id: 's5', time: '11:15', visitType: 'video' },
      { id: 's6', time: '14:30', visitType: 'in-person' },
    ] },
    { date: '2026-09-22', slots: [
      { id: 's7', time: '09:30', visitType: 'video' },
      { id: 's8', time: '12:00', visitType: 'phone' },
      { id: 's9', time: '15:45', visitType: 'in-person' },
    ] },
    { date: '2026-09-23', slots: [
      { id: 's10', time: '08:30', visitType: 'in-person' },
      { id: 's11', time: '10:00', visitType: 'in-person' },
      { id: 's12', time: '13:45', visitType: 'video' },
    ] },
    { date: '2026-09-24', slots: [
      { id: 's13', time: '09:15', visitType: 'video' },
      { id: 's14', time: '11:30', visitType: 'in-person' },
      { id: 's15', time: '16:00', visitType: 'phone' },
    ] },
    { date: '2026-09-25', slots: [
      { id: 's16', time: '08:00', visitType: 'in-person' },
      { id: 's17', time: '10:45', visitType: 'video' },
      { id: 's18', time: '14:15', visitType: 'in-person' },
    ] },
  ],
  note: 'Telehealth & in-person visits · Most major insurance accepted',
};

/** Faithful preview: mirrors the Appointment Scheduler LWC, including test-mode fallback. */
export function HealthcareApptSchedulerPreview({
  value,
  accentColor,
}: {
  value: HealthcareApptSchedulerPayload;
  accentColor: string;
}) {
  const usableDays = (Array.isArray(value.days) ? value.days : []).filter((d) => d && Array.isArray(d.slots) && d.slots.length > 0);
  const isTestMode = usableDays.length === 0;
  const source = isTestMode ? TEST_PAYLOAD : value;
  const days = isTestMode ? TEST_PAYLOAD.days : usableDays;
  const title = (source.title || 'Book a visit').trim() || 'Book a visit';
  const submitText = (value.submitText || 'Confirm appointment').trim() || 'Confirm appointment';
  const provider = source.provider;
  const location = source.location;

  const [dayIndex, setDayIndex] = useState(0);
  const [slotId, setSlotId] = useState('');
  const [imageFailed, setImageFailed] = useState(false);

  const activeDay = days[Math.min(dayIndex, days.length - 1)] ?? { slots: [] as ApptSlot[] };
  const initials = providerInitials(provider);
  const providerImage = resolveProviderImage(provider?.imageUrl);
  const showImage = !!providerImage && !imageFailed;
  const monthLabel = apptMonthLabel((activeDay as { date?: string }).date);

  return (
    <div className="clt-live-preview appt-scheduler-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {title && <h3 className="selector-title">{title}</h3>}

      {provider?.name && (
        <div className="asa-ap-provider">
          <span className="asa-ap-avatar" aria-hidden="true">
            {showImage ? (
              <img src={providerImage} alt={provider.name} onError={() => setImageFailed(true)} />
            ) : (
              <span className="asa-ap-initials">{initials}</span>
            )}
          </span>
          <span className="asa-ap-provider-text">
            <span className="asa-ap-provider-name">{provider.name}</span>
            {provider.specialty && <span className="asa-ap-provider-spec">{provider.specialty}</span>}
            {(provider.rating != null || provider.badge) && (
              <span className="asa-ap-trust">
                {provider.rating != null && (
                  <span className="asa-ap-rating"><Star aria-hidden="true" /> {Number(provider.rating).toFixed(1)}{provider.reviews ? <span className="asa-ap-reviews">({provider.reviews})</span> : null}</span>
                )}
                {provider.badge && <span className="asa-ap-badge">{provider.badge}</span>}
              </span>
            )}
            {location?.name && (
              <span className="asa-ap-location">
                <MapPin aria-hidden="true" />
                <span className="asa-ap-location-text">{location.name}</span>
              </span>
            )}
          </span>
        </div>
      )}

      <div className="asa-ap-cal-head">
        <span className="asa-ap-eyebrow">Select a day</span>
        {monthLabel && <span className="asa-ap-month">{monthLabel}</span>}
      </div>
      <div className="asa-ap-days" role="tablist" aria-label="Choose a day">
        {days.map((day, index) => {
          const fmt = formatApptDate(day.date);
          const selected = index === Math.min(dayIndex, days.length - 1);
          return (
            <button
              type="button"
              role="tab"
              key={`day-${index}`}
              className={selected ? 'asa-ap-day is-selected' : 'asa-ap-day'}
              aria-selected={selected}
              onClick={() => { setDayIndex(index); setSlotId(''); }}
            >
              <span className="asa-ap-day-wd">{fmt.weekday}</span>
              <span className="asa-ap-day-num">{fmt.dayNum}</span>
            </button>
          );
        })}
      </div>

      <span className="asa-ap-eyebrow asa-ap-eyebrow-times">Choose a time</span>
      <div className="asa-ap-slots">
        {activeDay.slots.map((slot, index) => {
          const bucket = visitBucket(slot.visitType);
          const id = slot.id || `d${dayIndex}-s${index}`;
          const selected = id === slotId;
          const Icon = visitIcon(bucket);
          return (
            <button
              type="button"
              key={id}
              className={`asa-ap-slot is-${bucket}${selected ? ' is-selected' : ''}`}
              aria-pressed={selected}
              onClick={() => setSlotId(id)}
            >
              <span className="asa-ap-slot-ico" aria-hidden="true"><Icon /></span>
              <span className="asa-ap-slot-body">
                <span className="asa-ap-slot-time">{formatApptTime(slot.time)}</span>
                <span className="asa-ap-slot-type">{visitLabel(bucket)}</span>
              </span>
            </button>
          );
        })}
      </div>

      {source.note && <p className="asa-ap-note"><ShieldCheck aria-hidden="true" /> {source.note}</p>}

      {slotId && (
        <div className="submit-container">
          <button type="button" className="asa-ap-submit">{submitText}</button>
        </div>
      )}
    </div>
  );
}
