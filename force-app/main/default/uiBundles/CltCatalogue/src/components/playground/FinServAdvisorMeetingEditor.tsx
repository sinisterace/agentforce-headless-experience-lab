import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { Advisor, MeetingDay, MeetingSlot, FinServAdvisorMeetingPayload } from './payloads';
import {
  meetingTypeIcon,
  meetingTypeLabel,
  formatMeetingDate,
  formatMeetingDateParts,
  formatMeetingTime,
  advisorInitials,
} from './advisorMeetingFormat';

/**
 * Build/Input editor + live preview for the ASA Financial Services · Advisor
 * Appointment CLT (DTO field finServAdvisorMeetingJSON). LWC-true fields: title,
 * advisor (object: name, title?, specialty?, photoUrl?, initials?), days
 * (object[] with date + slots[] of { id, time, meetingType? }), submitText?.
 * No bookable slots drops the preview into a test-mode fallback so it renders
 * even with no payload — mirroring the deployed LWC.
 */

const MEETING_TYPES = ['video', 'phone', 'in-branch'];

export function FinServAdvisorMeetingEditor({
  value,
  onChange,
}: {
  value: FinServAdvisorMeetingPayload;
  onChange: (next: FinServAdvisorMeetingPayload) => void;
}) {
  const setAdvisor = (patch: Partial<Advisor>) =>
    onChange({ ...value, advisor: { ...value.advisor, ...patch } });

  const setDay = (dayIndex: number, patch: Partial<MeetingDay>) => {
    const days = value.days.slice();
    days[dayIndex] = { ...days[dayIndex], ...patch };
    onChange({ ...value, days });
  };
  const addDay = () =>
    onChange({
      ...value,
      days: [...value.days, { date: '2026-08-14', slots: [] }],
    });
  const removeDay = (dayIndex: number) =>
    onChange({ ...value, days: value.days.filter((_, i) => i !== dayIndex) });
  const moveDay = (dayIndex: number, delta: number) => {
    const target = dayIndex + delta;
    if (target < 0 || target >= value.days.length) return;
    const days = value.days.slice();
    [days[dayIndex], days[target]] = [days[target], days[dayIndex]];
    onChange({ ...value, days });
  };

  const setSlot = (dayIndex: number, slotIndex: number, patch: Partial<MeetingSlot>) => {
    const slots = value.days[dayIndex].slots.slice();
    slots[slotIndex] = { ...slots[slotIndex], ...patch };
    setDay(dayIndex, { slots });
  };
  const addSlot = (dayIndex: number) => {
    const slots = value.days[dayIndex].slots.slice();
    slots.push({ id: `slot-${dayIndex + 1}-${slots.length + 1}`, time: '09:00', meetingType: 'video' });
    setDay(dayIndex, { slots });
  };
  const removeSlot = (dayIndex: number, slotIndex: number) =>
    setDay(dayIndex, { slots: value.days[dayIndex].slots.filter((_, i) => i !== slotIndex) });

  return (
    <div className="playground-editor">
      <label className="playground-field">
        Title
        <input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="Book time with your advisor" />
      </label>

      <div className="playground-card">
        <div className="playground-card-head">
          <strong>Advisor</strong>
        </div>
        <label className="playground-field">
          Name
          <input value={value.advisor.name} onChange={(e) => setAdvisor({ name: e.target.value })} placeholder="Jordan Lee" />
        </label>
        <label className="playground-field">
          Title <span className="optional-label">Optional</span>
          <input value={value.advisor.title ?? ''} onChange={(e) => setAdvisor({ title: e.target.value })} placeholder="Senior Financial Advisor" />
        </label>
        <label className="playground-field">
          Specialty <span className="optional-label">Optional</span>
          <input value={value.advisor.specialty ?? ''} onChange={(e) => setAdvisor({ specialty: e.target.value })} placeholder="Retirement & investment planning" />
        </label>
        <label className="playground-field">
          Photo URL <span className="optional-label">Optional</span>
          <input value={value.advisor.photoUrl ?? ''} onChange={(e) => setAdvisor({ photoUrl: e.target.value })} placeholder="https://…" />
        </label>
        <label className="playground-field">
          Initials <span className="optional-label">Optional — auto from name</span>
          <input value={value.advisor.initials ?? ''} onChange={(e) => setAdvisor({ initials: e.target.value })} placeholder="JL" />
        </label>
      </div>

      <label className="playground-field">
        Book button text
        <input value={value.submitText ?? ''} onChange={(e) => onChange({ ...value, submitText: e.target.value })} placeholder="Book appointment" />
      </label>

      <div className="playground-list">
        <div className="playground-list-head">
          <span>Days</span>
          <button type="button" className="playground-add" onClick={addDay}><Plus aria-hidden="true" /> Add day</button>
        </div>
        {value.days.length === 0 && <p className="playground-empty">No days — the component shows sample test data until you add one with slots.</p>}
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
              Date
              <input type="date" value={day.date} onChange={(e) => setDay(dayIndex, { date: e.target.value })} />
            </label>

            <div className="playground-list">
              <div className="playground-list-head">
                <span>Slots</span>
                <button type="button" className="playground-add" onClick={() => addSlot(dayIndex)}><Plus aria-hidden="true" /> Add slot</button>
              </div>
              {day.slots.length === 0 && <p className="playground-empty">No slots on this day.</p>}
              {day.slots.map((slot, slotIndex) => (
                <div className="playground-card" key={slotIndex}>
                  <div className="playground-card-head">
                    <strong>Slot {slotIndex + 1}</strong>
                    <span className="playground-card-actions">
                      <button type="button" onClick={() => removeSlot(dayIndex, slotIndex)} aria-label="Remove slot"><Trash2 aria-hidden="true" /></button>
                    </span>
                  </div>
                  <label className="playground-field">
                    Time <span className="optional-label">24h HH:MM</span>
                    <input type="time" value={slot.time} onChange={(e) => setSlot(dayIndex, slotIndex, { time: e.target.value })} />
                  </label>
                  <div className="playground-field">
                    <span>Meeting type</span>
                    <select value={slot.meetingType ?? 'video'} onChange={(e) => setSlot(dayIndex, slotIndex, { meetingType: e.target.value })}>
                      {MEETING_TYPES.map((t) => <option value={t} key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TEST_ADVISOR: Advisor = {
  name: 'Jordan Lee',
  title: 'Senior Financial Advisor',
  specialty: 'Retirement & investment planning',
  initials: 'JL',
};
const TEST_DAYS: MeetingDay[] = [
  {
    date: '2026-08-14',
    slots: [
      { id: 'test-1', time: '09:00', meetingType: 'video' },
      { id: 'test-2', time: '10:30', meetingType: 'phone' },
      { id: 'test-3', time: '13:00', meetingType: 'in-branch' },
    ],
  },
  {
    date: '2026-08-15',
    slots: [
      { id: 'test-4', time: '11:00', meetingType: 'video' },
      { id: 'test-5', time: '14:30', meetingType: 'phone' },
      { id: 'test-6', time: '16:00', meetingType: 'in-branch' },
    ],
  },
];

/** Faithful preview: mirrors the Advisor Appointment LWC, including test-mode fallback. */
export function FinServAdvisorMeetingPreview({
  value,
  accentColor,
}: {
  value: FinServAdvisorMeetingPayload;
  accentColor: string;
}) {
  const hasSlots = value.days.some((d) => Array.isArray(d.slots) && d.slots.length > 0);
  const isTestMode = !hasSlots;
  const title = isTestMode ? 'Book time with your advisor' : value.title;
  const advisor = isTestMode ? TEST_ADVISOR : value.advisor;
  const days = isTestMode ? TEST_DAYS : value.days;
  const submitText = value.submitText || 'Book appointment';
  const initials = advisorInitials(advisor.name || 'Your advisor', advisor.initials);

  const [selected, setSelected] = useState<string>('');
  const toggle = (key: string) => setSelected((cur) => (cur === key ? '' : key));

  return (
    <div className="clt-live-preview appt-selector-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add days &amp; slots to preview your content</p>}
      {title && <h3 className="selector-title">{title}</h3>}

      <div className="appt-advisor">
        <span className="appt-advisor-avatar" aria-hidden="true">
          {advisor.photoUrl ? (
            <img className="appt-advisor-photo" src={advisor.photoUrl} alt="" />
          ) : (
            <span className="appt-advisor-initials">{initials}</span>
          )}
        </span>
        <span className="appt-advisor-meta">
          <span className="appt-advisor-name">{advisor.name || 'Your advisor'}</span>
          {advisor.title && <span className="appt-advisor-title">{advisor.title}</span>}
          {advisor.specialty && <span className="appt-advisor-specialty">{advisor.specialty}</span>}
        </span>
      </div>

      <div className="appt-days">
        {days.map((day, dayIndex) => {
          const parts = formatMeetingDateParts(day.date);
          return (
          <div className="appt-day-group" key={dayIndex}>
            <div className="appt-day-head">
              {parts && (
                <span className="appt-cal" aria-hidden="true">
                  <span className="appt-cal-wd">{parts.weekday}</span>
                  <span className="appt-cal-day">{parts.day}</span>
                </span>
              )}
              <span className="appt-day-label">{parts ? parts.month : formatMeetingDate(day.date)}</span>
            </div>
            <div className="appt-slots">
              {day.slots.map((slot, slotIndex) => {
                const key = `d${dayIndex}-s${slotIndex}`;
                const Icon = meetingTypeIcon(slot.meetingType);
                const isSelected = selected === key;
                return (
                  <button
                    type="button"
                    key={slot.id || key}
                    className={isSelected ? 'appt-slot selected' : 'appt-slot'}
                    onClick={() => toggle(key)}
                    aria-pressed={isSelected}
                    title={meetingTypeLabel(slot.meetingType)}
                  >
                    <span className="appt-type" aria-hidden="true"><Icon /></span>
                    <span className="appt-time">{formatMeetingTime(slot.time)}</span>
                  </button>
                );
              })}
            </div>
          </div>
          );
        })}
      </div>

      {selected && (
        <div className="submit-container">
          <button type="button" className="appt-submit">{submitText}</button>
        </div>
      )}
    </div>
  );
}
