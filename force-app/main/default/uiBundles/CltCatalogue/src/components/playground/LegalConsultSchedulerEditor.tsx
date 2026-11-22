import { useState } from 'react';
import { CalendarClock, MapPin, Phone, ShieldCheck, Video } from 'lucide-react';
import lawyer1 from '@/assets/legal/lawyer-1.jpg';
import lawyer2 from '@/assets/legal/lawyer-2.jpg';
import lawyer3 from '@/assets/legal/lawyer-3.jpg';
import type { LegalConsultDay, LegalConsultMode, LegalConsultSchedulerPayload, LegalConsultSlot } from './payloads';

/**
 * Live preview for the ASA Legal · Consultation Scheduler CLT (DTO field
 * legalConsultSchedulerJSON). Its own identity vs. the other pickers: an attorney
 * "hero" (headshot + name + focus) sits above the booking flow, so the visitor is
 * booking a person, not a slot. Then: mode toggle → day picker → time slots.
 * LWC-true fields: title?, subtitle?, attorneyName?, attorneyTitle?, attorneyPhoto?
 * ("lawyer-1|2|3" or URL), modes? (object[] of { id, label, icon? }), days (object[]
 * of { id, label, sublabel?, slots[] of { id, label, disabled? } }), note?,
 * submitText?. Days with no slots → test-mode sample.
 */

const MODE_ICONS: Record<string, typeof CalendarClock> = {
  in_person: MapPin,
  phone: Phone,
  video: Video,
};
function modeIcon(key?: string): typeof CalendarClock {
  return MODE_ICONS[(key || '').toLowerCase()] || CalendarClock;
}

// Bundled headshots so a payload can reference a stable key and still render.
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

const TEST_MODES: LegalConsultMode[] = [
  { id: 'in_person', label: 'In person', icon: 'in_person' },
  { id: 'phone', label: 'Phone', icon: 'phone' },
  { id: 'video', label: 'Video', icon: 'video' },
];
const TEST_DAYS: LegalConsultDay[] = [
  { id: 'mon', label: 'Mon', sublabel: 'Sep 21', slots: [{ id: 'm1', label: '9:00 AM' }, { id: 'm2', label: '11:30 AM' }, { id: 'm3', label: '2:00 PM' }] },
  { id: 'tue', label: 'Tue', sublabel: 'Sep 22', slots: [{ id: 't1', label: '10:00 AM' }, { id: 't2', label: '1:00 PM', disabled: true }, { id: 't3', label: '3:30 PM' }] },
  { id: 'wed', label: 'Wed', sublabel: 'Sep 23', slots: [{ id: 'w1', label: '9:30 AM' }, { id: 'w2', label: '12:00 PM' }, { id: 'w3', label: '4:00 PM' }] },
  { id: 'thu', label: 'Thu', sublabel: 'Sep 24', slots: [{ id: 'h1', label: '11:00 AM' }, { id: 'h2', label: '2:30 PM' }] },
  { id: 'fri', label: 'Fri', sublabel: 'Sep 25', slots: [{ id: 'f1', label: '9:00 AM' }, { id: 'f2', label: '10:30 AM' }, { id: 'f3', label: '1:30 PM' }] },
];

/** Faithful preview: the consultation scheduler, including test-mode fallback. */
export function LegalConsultSchedulerPreview({
  value,
  accentColor,
}: {
  value: LegalConsultSchedulerPayload;
  accentColor: string;
}) {
  const usableDays = (Array.isArray(value.days) ? value.days : []).filter((d) => d && Array.isArray(d.slots) && d.slots.length > 0);
  const isTestMode = usableDays.length === 0;
  const title = (isTestMode ? 'Book your free consultation' : value.title) || 'Book your free consultation';
  const attorneyName = isTestMode ? 'Marcus Vale' : value.attorneyName;
  const attorneyTitle = isTestMode ? 'Managing Partner · Personal Injury' : value.attorneyTitle;
  const photoSrc = resolvePhoto(isTestMode ? 'lawyer-1' : value.attorneyPhoto);
  const subtitle = attorneyName ? '' : value.subtitle || '';
  const modes = value.modes && value.modes.length ? value.modes : (isTestMode ? TEST_MODES : []);
  const days = isTestMode ? TEST_DAYS : usableDays;
  const note = (value.note || 'Free 30-minute consultation · no obligation').trim();
  const submitText = (value.submitText || 'Confirm consultation').trim() || 'Confirm consultation';

  const [modeId, setModeId] = useState(modes[0]?.id || '');
  const [dayIndex, setDayIndex] = useState(0);
  const [slotId, setSlotId] = useState('');
  const activeDay = days[Math.min(dayIndex, days.length - 1)] ?? { slots: [] as LegalConsultSlot[] };

  return (
    <div className="clt-live-preview legal-consult-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {title && <h3 className="selector-title">{title}</h3>}
      {subtitle && <p className="asa-card-sub">{subtitle}</p>}

      {attorneyName && (
        <div className="asa-lcs-hero">
          <span className="asa-lcs-hero-photo">
            {photoSrc ? <img src={photoSrc} alt="" /> : <span className="asa-lcs-hero-initials">{initialsOf(attorneyName)}</span>}
          </span>
          <span className="asa-lcs-hero-body">
            <span className="asa-lcs-hero-name">{attorneyName}</span>
            {attorneyTitle && <span className="asa-lcs-hero-title">{attorneyTitle}</span>}
            <span className="asa-lcs-hero-badge"><CalendarClock aria-hidden="true" /> Free 30-min consult</span>
          </span>
        </div>
      )}

      {modes.length > 0 && (
        <div className="asa-lcs-modes" role="tablist" aria-label="Consultation type">
          {modes.map((m) => {
            const Icon = modeIcon(m.icon || m.id);
            const selectedNow = modeId === m.id;
            return (
              <button
                type="button"
                role="tab"
                key={m.id}
                className={selectedNow ? 'asa-lcs-mode is-selected' : 'asa-lcs-mode'}
                aria-selected={selectedNow}
                onClick={() => setModeId(m.id)}
              >
                <Icon aria-hidden="true" /><span>{m.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <span className="asa-lcs-eyebrow">Select a day</span>
      <div className="asa-lcs-days" role="tablist" aria-label="Choose a day">
        {days.map((day, index) => {
          const selectedNow = index === Math.min(dayIndex, days.length - 1);
          return (
            <button
              type="button"
              role="tab"
              key={day.id || `day-${index}`}
              className={selectedNow ? 'asa-lcs-day is-selected' : 'asa-lcs-day'}
              aria-selected={selectedNow}
              onClick={() => { setDayIndex(index); setSlotId(''); }}
            >
              <span className="asa-lcs-day-wd">{day.label}</span>
              {day.sublabel && <span className="asa-lcs-day-num">{day.sublabel}</span>}
            </button>
          );
        })}
      </div>

      <span className="asa-lcs-eyebrow">Choose a time</span>
      <div className="asa-lcs-slots">
        {activeDay.slots.map((slot, index) => {
          const id = slot.id || `s-${dayIndex}-${index}`;
          const selectedNow = id === slotId && !slot.disabled;
          return (
            <button
              type="button"
              key={id}
              disabled={slot.disabled}
              className={selectedNow ? 'asa-lcs-slot is-selected' : 'asa-lcs-slot'}
              aria-pressed={selectedNow}
              onClick={() => setSlotId(id)}
            >
              {slot.label}
            </button>
          );
        })}
      </div>

      {note && <p className="asa-lcs-note"><ShieldCheck aria-hidden="true" /> {note}</p>}

      {slotId && (
        <div className="submit-container">
          <button type="button" className="asa-lcs-submit">{submitText}</button>
        </div>
      )}
    </div>
  );
}
