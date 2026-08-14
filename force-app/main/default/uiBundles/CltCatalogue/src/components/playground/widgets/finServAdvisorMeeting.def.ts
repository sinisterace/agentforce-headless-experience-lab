import type { FinServAdvisorMeetingPayload } from '../payloads';
import { FinServAdvisorMeetingEditor, FinServAdvisorMeetingPreview } from '../FinServAdvisorMeetingEditor';
import type { WidgetDef } from './types';

/** asaFinServAdvisorMeeting — matched advisor + day/time slots; pick one to book. */
export const finServAdvisorMeetingDef: WidgetDef = {
  kind: 'finServAdvisorMeetingJSON',
  dtoField: 'finServAdvisorMeetingJSON',
  label: 'ASA Financial Services · Advisor Appointment',
  defaults: {
    title: 'Book time with your advisor',
    advisor: { name: '', title: '', specialty: '', photoUrl: '', initials: '' },
    days: [],
    submitText: 'Book appointment',
  } satisfies FinServAdvisorMeetingPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title' },
    {
      label: 'Advisor',
      control: 'Object',
      bind: 'advisor',
      children: [
        { label: 'Name', control: 'Text', bind: 'advisor.name' },
        { label: 'Title', control: 'Text', bind: 'advisor.title', note: 'optional' },
        { label: 'Specialty', control: 'Text', bind: 'advisor.specialty', note: 'optional focus line' },
        { label: 'Photo URL', control: 'Text', bind: 'advisor.photoUrl', note: 'optional; else initials avatar' },
        { label: 'Initials', control: 'Text', bind: 'advisor.initials', note: 'optional; auto from name' },
      ],
    },
    {
      label: 'Days',
      control: 'Day list',
      bind: 'days[]',
      note: 'empty → test-mode sample data',
      children: [
        { label: 'Date', control: 'Date (yyyy-mm-dd)', bind: 'days[].date' },
        {
          label: 'Slots',
          control: 'Slot list',
          bind: 'days[].slots[]',
          children: [
            { label: 'Id', control: 'Text', bind: 'days[].slots[].id', note: 'sent back when booked' },
            { label: 'Time', control: 'Time (HH:MM)', bind: 'days[].slots[].time', note: '24h → shown as 9:00 AM' },
            { label: 'Meeting type', control: 'Select (video | phone | in-branch)', bind: 'days[].slots[].meetingType', note: 'drives the slot icon' },
          ],
        },
      ],
    },
    { label: 'Book', control: 'Button', bind: 'submitText', note: 'appears once a slot is selected' },
  ],
  Editor: FinServAdvisorMeetingEditor,
  Preview: FinServAdvisorMeetingPreview,
};
