import { useState } from 'react';
import type { Advisor, MeetingDay, FinServAdvisorMeetingPayload } from './payloads';
import {
  meetingTypeIcon,
  meetingTypeLabel,
  formatMeetingDate,
  formatMeetingDateParts,
  formatMeetingTime,
  advisorInitials,
} from './advisorMeetingFormat';

/**
 * Live preview for the ASA Financial Services · Advisor
 * Appointment CLT (DTO field finServAdvisorMeetingJSON). LWC-true fields: title,
 * advisor (object: name, title?, specialty?, photoUrl?, initials?), days
 * (object[] with date + slots[] of { id, time, meetingType? }), submitText?.
 * No bookable slots drops the preview into a test-mode fallback so it renders
 * even with no payload — mirroring the deployed LWC.
 */


const TEST_ADVISOR: Advisor = {
  name: 'Jordan Lee',
  title: 'Senior Financial Advisor',
  specialty: 'Retirement & investment planning',
  initials: 'JL',
};
const TEST_DAYS: MeetingDay[] = [
  {
    date: '2026-09-18',
    slots: [
      { id: 'test-1', time: '09:00', meetingType: 'video' },
      { id: 'test-2', time: '10:30', meetingType: 'phone' },
      { id: 'test-3', time: '13:00', meetingType: 'in-branch' },
    ],
  },
  {
    date: '2026-09-19',
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
  const payloadDays = Array.isArray(value.days) ? value.days : [];
  const hasSlots = payloadDays.some((d) => d && Array.isArray(d.slots) && d.slots.length > 0);
  const isTestMode = !hasSlots;
  const title = isTestMode ? 'Book time with your advisor' : value.title;
  const advisor = isTestMode ? TEST_ADVISOR : value.advisor;
  const days = isTestMode ? TEST_DAYS : payloadDays;
  const submitText = value.submitText || 'Book appointment';
  const initials = advisorInitials(advisor.name || 'Your advisor', advisor.initials);

  const [selected, setSelected] = useState<string>('');
  const toggle = (key: string) => setSelected((cur) => (cur === key ? '' : key));

  return (
    <div className="clt-live-preview appt-selector-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
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
              {(Array.isArray(day.slots) ? day.slots : []).map((slot, slotIndex) => {
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
