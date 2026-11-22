import type { LegalConsultSchedulerPayload } from '../payloads';
import { LegalConsultSchedulerPreview } from '../LegalConsultSchedulerEditor';
import type { WidgetDef } from './types';

/** asaLegalConsultScheduler — mode + day + time picker to book a free consultation. */
export const legalConsultSchedulerDef: WidgetDef = {
  kind: 'legalConsultSchedulerJSON',
  dtoField: 'legalConsultSchedulerJSON',
  label: 'ASA Legal · Consultation Scheduler',
  defaults: { title: 'Book your free consultation', days: [] } satisfies LegalConsultSchedulerPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Subtitle', control: 'Text', bind: 'subtitle', note: 'only shown when no attorney' },
    { label: 'Attorney name', control: 'Text', bind: 'attorneyName', note: 'drives the hero header' },
    { label: 'Attorney title', control: 'Text', bind: 'attorneyTitle', note: 'e.g. "Managing Partner · Personal Injury"' },
    { label: 'Attorney photo', control: 'Text', bind: 'attorneyPhoto', note: 'lawyer-1|lawyer-2|lawyer-3 or image URL' },
    {
      label: 'Modes',
      control: 'Segmented',
      bind: 'modes[]',
      note: 'in person / phone / video',
      children: [
        { label: 'Id', control: 'Text', bind: 'modes[].id' },
        { label: 'Label', control: 'Text', bind: 'modes[].label' },
        { label: 'Icon', control: 'Text', bind: 'modes[].icon', note: 'in_person|phone|video' },
      ],
    },
    {
      label: 'Days',
      control: 'Day picker',
      bind: 'days[]',
      note: 'empty → test-mode sample',
      children: [
        { label: 'Id', control: 'Text', bind: 'days[].id' },
        { label: 'Label', control: 'Text', bind: 'days[].label', note: 'e.g. Mon' },
        { label: 'Sublabel', control: 'Text', bind: 'days[].sublabel', note: 'e.g. Aug 17' },
        {
          label: 'Slots',
          control: 'Time list',
          bind: 'days[].slots',
          children: [
            { label: 'Id', control: 'Text', bind: 'days[].slots[].id' },
            { label: 'Label', control: 'Text', bind: 'days[].slots[].label', note: 'e.g. 9:00 AM' },
            { label: 'Disabled', control: 'Toggle', bind: 'days[].slots[].disabled', note: 'optional' },
          ],
        },
      ],
    },
    { label: 'Note', control: 'Text', bind: 'note', note: 'reassurance line' },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'optional' },
  ],
  Preview: LegalConsultSchedulerPreview,
};
