import { useState } from 'react';
import { ArrowDown, ArrowUp, MapPin, Plus, Trash2 } from 'lucide-react';
import type { ApptDay, ApptSlot, HealthcareApptSchedulerPayload } from './payloads';
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

/**
 * Build/Input editor + live preview for the ASA Healthcare · Appointment
 * Scheduler CLT (DTO field healthcareApptSchedulerJSON). LWC-true fields: title,
 * provider? ({ name, specialty?, initials?, imageUrl? }), location? ({ name,
 * address? }), days (object[] of { date, slots[] of { id, time, visitType? } }),
 * submitText?. A day list with no bookable slots drops the preview into a
 * test-mode fallback so it renders even with no payload — mirroring the LWC.
 */

const VISIT_TYPES = ['in-person', 'video', 'phone'];

export function HealthcareApptSchedulerEditor({
  value,
  onChange,
}: {
  value: HealthcareApptSchedulerPayload;
  onChange: (next: HealthcareApptSchedulerPayload) => void;
}) {
  const provider = value.provider ?? { name: '', specialty: '', initials: '', imageUrl: '' };
  const location = value.location ?? { name: '', address: '' };
  const setProvider = (patch: Partial<NonNullable<HealthcareApptSchedulerPayload['provider']>>) =>
    onChange({ ...value, provider: { ...provider, ...patch } });
  const setLocation = (patch: Partial<NonNullable<HealthcareApptSchedulerPayload['location']>>) =>
    onChange({ ...value, location: { ...location, ...patch } });

  const setDay = (index: number, patch: Partial<ApptDay>) => {
    const days = value.days.slice();
    days[index] = { ...days[index], ...patch };
    onChange({ ...value, days });
  };
  const addDay = () =>
    onChange({ ...value, days: [...value.days, { date: '', slots: [{ id: `s${value.days.length + 1}-1`, time: '09:00', visitType: 'in-person' }] }] });
  const removeDay = (index: number) => onChange({ ...value, days: value.days.filter((_, i) => i !== index) });
  const moveDay = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.days.length) return;
    const days = value.days.slice();
    [days[index], days[target]] = [days[target], days[index]];
    onChange({ ...value, days });
  };

  const setSlot = (dayIndex: number, slotIndex: number, patch: Partial<ApptSlot>) => {
    const slots = value.days[dayIndex].slots.slice();
    slots[slotIndex] = { ...slots[slotIndex], ...patch };
    setDay(dayIndex, { slots });
  };
  const addSlot = (dayIndex: number) => {
    const slots = value.days[dayIndex].slots.slice();
    slots.push({ id: `s${dayIndex + 1}-${slots.length + 1}`, time: '10:00', visitType: 'in-person' });
    setDay(dayIndex, { slots });
  };
  const removeSlot = (dayIndex: number, slotIndex: number) =>
    setDay(dayIndex, { slots: value.days[dayIndex].slots.filter((_, i) => i !== slotIndex) });

  return (
    <div className="playground-editor">
      <label className="playground-field">
        Title
        <input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="Book a visit" />
      </label>

      <div className="playground-card">
        <div className="playground-card-head">
          <strong>Provider</strong>
          <span className="optional-label">Optional</span>
        </div>
        <label className="playground-field">
          Name
          <input value={provider.name ?? ''} onChange={(e) => setProvider({ name: e.target.value })} placeholder="Dr. Maya Chen" />
        </label>
        <label className="playground-field">
          Specialty <span className="optional-label">Optional</span>
          <input value={provider.specialty ?? ''} onChange={(e) => setProvider({ specialty: e.target.value })} placeholder="Primary Care · Internal Medicine" />
        </label>
        <label className="playground-field">
          Initials <span className="optional-label">auto from name</span>
          <input value={provider.initials ?? ''} onChange={(e) => setProvider({ initials: e.target.value })} placeholder="MC" maxLength={2} />
        </label>
        <label className="playground-field">
          Photo URL <span className="optional-label">Optional</span>
          <input value={provider.imageUrl ?? ''} onChange={(e) => setProvider({ imageUrl: e.target.value })} placeholder="/resource/asaProviderMaya" />
        </label>
      </div>

      <div className="playground-card">
        <div className="playground-card-head">
          <strong>Location</strong>
          <span className="optional-label">Optional</span>
        </div>
        <label className="playground-field">
          Name
          <input value={location.name ?? ''} onChange={(e) => setLocation({ name: e.target.value })} placeholder="Downtown Health Center" />
        </label>
        <label className="playground-field">
          Address <span className="optional-label">Optional</span>
          <input value={location.address ?? ''} onChange={(e) => setLocation({ address: e.target.value })} placeholder="500 Market St, Suite 300" />
        </label>
      </div>

      <label className="playground-field">
        Submit button text
        <input value={value.submitText ?? ''} onChange={(e) => onChange({ ...value, submitText: e.target.value })} placeholder="Confirm appointment" />
      </label>

      <div className="playground-list">
        <div className="playground-list-head">
          <span>Days</span>
          <button type="button" className="playground-add" onClick={addDay}><Plus aria-hidden="true" /> Add day</button>
        </div>
        {value.days.length === 0 && <p className="playground-empty">No days — the component shows sample test data until you add one.</p>}
        {value.days.map((day, dayIndex) => (
          <div className="playground-card" key={dayIndex}>
            <div className="playground-card-head">
              <strong>Day {dayIndex + 1}</strong>
              <span className="playground-card-actions">
                <button type="button" onClick={() => moveDay(dayIndex, -1)} disabled={dayIndex === 0} aria-label="Move up"><ArrowUp aria-hidden="true" /></button>
                <button type="button" onClick={() => moveDay(dayIndex, 1)} disabled={dayIndex === value.days.length - 1} aria-label="Move down"><ArrowDown aria-hidden="true" /></button>
                <button type="button" onClick={() => removeDay(dayIndex)} aria-label="Remove day"><Trash2 aria-hidden="true" /></button>
              </span>
            </div>
            <label className="playground-field">
              Date <span className="optional-label">ISO yyyy-mm-dd</span>
              <input value={day.date} onChange={(e) => setDay(dayIndex, { date: e.target.value })} placeholder="2026-08-14" />
            </label>
            <div className="playground-list">
              <div className="playground-list-head">
                <span>Slots</span>
                <button type="button" className="playground-add" onClick={() => addSlot(dayIndex)}><Plus aria-hidden="true" /> Add slot</button>
              </div>
              {day.slots.map((slot, slotIndex) => (
                <div className="playground-inline-row" key={slotIndex}>
                  <input value={slot.time} onChange={(e) => setSlot(dayIndex, slotIndex, { time: e.target.value })} placeholder="09:00" aria-label="Time (HH:MM)" />
                  <select value={visitBucket(slot.visitType) === 'inperson' ? 'in-person' : visitBucket(slot.visitType)} onChange={(e) => setSlot(dayIndex, slotIndex, { visitType: e.target.value })} aria-label="Visit type">
                    {VISIT_TYPES.map((t) => <option value={t} key={t}>{t}</option>)}
                  </select>
                  <button type="button" onClick={() => removeSlot(dayIndex, slotIndex)} aria-label="Remove slot"><Trash2 aria-hidden="true" /></button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TEST_PAYLOAD: HealthcareApptSchedulerPayload = {
  title: 'Book a visit',
  provider: { name: 'Dr. Maya Chen', specialty: 'Primary Care · Internal Medicine', initials: 'MC', imageUrl: drMayaChen },
  location: { name: 'Yerba Buena Medical Group', address: '150 4th St, San Francisco' },
  days: [
    { date: '2026-08-14', slots: [
      { id: 's1', time: '09:00', visitType: 'in-person' },
      { id: 's2', time: '10:30', visitType: 'video' },
      { id: 's3', time: '13:15', visitType: 'phone' },
    ] },
    { date: '2026-08-15', slots: [
      { id: 's4', time: '09:30', visitType: 'video' },
      { id: 's5', time: '11:45', visitType: 'in-person' },
      { id: 's6', time: '15:00', visitType: 'in-person' },
    ] },
  ],
};

/** Faithful preview: mirrors the Appointment Scheduler LWC, including test-mode fallback. */
export function HealthcareApptSchedulerPreview({
  value,
  accentColor,
}: {
  value: HealthcareApptSchedulerPayload;
  accentColor: string;
}) {
  const usableDays = value.days.filter((d) => d && Array.isArray(d.slots) && d.slots.length > 0);
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
  const showImage = !!provider?.imageUrl && !imageFailed;
  const monthLabel = apptMonthLabel((activeDay as { date?: string }).date);

  return (
    <div className="clt-live-preview appt-scheduler-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add a day with slots to preview your content</p>}
      {title && <h3 className="selector-title">{title}</h3>}

      {provider?.name && (
        <div className="asa-ap-provider">
          <span className="asa-ap-avatar" aria-hidden="true">
            {showImage ? (
              <img src={provider.imageUrl} alt={provider.name} onError={() => setImageFailed(true)} />
            ) : (
              <span className="asa-ap-initials">{initials}</span>
            )}
          </span>
          <span className="asa-ap-provider-text">
            <span className="asa-ap-provider-name">{provider.name}</span>
            {provider.specialty && <span className="asa-ap-provider-spec">{provider.specialty}</span>}
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

      {slotId && (
        <div className="submit-container">
          <button type="button" className="asa-ap-submit">{submitText}</button>
        </div>
      )}
    </div>
  );
}
