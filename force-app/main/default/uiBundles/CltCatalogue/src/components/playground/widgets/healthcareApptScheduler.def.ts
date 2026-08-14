import type { HealthcareApptSchedulerPayload } from '../payloads';
import { HealthcareApptSchedulerEditor, HealthcareApptSchedulerPreview } from '../HealthcareApptSchedulerEditor';
import type { WidgetDef } from './types';

/** asaHealthcareApptScheduler — book a visit by picking a day + time slot for a provider. */
export const healthcareApptSchedulerDef: WidgetDef = {
  kind: 'healthcareApptSchedulerJSON',
  dtoField: 'healthcareApptSchedulerJSON',
  label: 'ASA Healthcare · Appointment Scheduler',
  defaults: { title: 'Book a visit', provider: { name: '' }, days: [] } satisfies HealthcareApptSchedulerPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title' },
    {
      label: 'Provider',
      control: 'Object',
      bind: 'provider',
      note: 'optional header',
      children: [
        { label: 'Name', control: 'Text', bind: 'provider.name' },
        { label: 'Specialty', control: 'Text', bind: 'provider.specialty', note: 'optional' },
        { label: 'Initials', control: 'Text', bind: 'provider.initials', note: 'auto from name' },
        { label: 'Photo URL', control: 'Text', bind: 'provider.imageUrl', note: 'optional' },
      ],
    },
    {
      label: 'Location',
      control: 'Object',
      bind: 'location',
      note: 'optional',
      children: [
        { label: 'Name', control: 'Text', bind: 'location.name' },
        { label: 'Address', control: 'Text', bind: 'location.address', note: 'optional' },
      ],
    },
    {
      label: 'Days',
      control: 'Day tabs',
      bind: 'days[]',
      note: 'empty → test-mode sample data',
      children: [
        { label: 'Date', control: 'Text (ISO yyyy-mm-dd)', bind: 'days[].date' },
        {
          label: 'Slots',
          control: 'Chip grid',
          bind: 'days[].slots[]',
          children: [
            { label: 'Id', control: 'Text', bind: 'days[].slots[].id', note: 'sent back on booking' },
            { label: 'Time', control: 'Text (HH:MM)', bind: 'days[].slots[].time' },
            { label: 'Visit type', control: 'Select (in-person | video | phone)', bind: 'days[].slots[].visitType' },
          ],
        },
      ],
    },
    { label: 'Submit', control: 'Button', bind: 'submitText' },
  ],
  Editor: HealthcareApptSchedulerEditor,
  Preview: HealthcareApptSchedulerPreview,
};
