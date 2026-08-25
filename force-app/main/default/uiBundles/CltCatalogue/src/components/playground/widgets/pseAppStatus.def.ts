import type { PseAppStatusPayload } from '../payloads';
import { PseAppStatusPreview } from '../PseAppStatusEditor';
import type { WidgetDef } from './types';

/** asaPseAppStatus — a single application shown as a horizontal progress track. */
export const pseAppStatusDef: WidgetDef = {
  kind: 'pseAppStatusJSON',
  dtoField: 'pseAppStatusJSON',
  label: 'ASA Public Sector & Education · Application Status Tracker',
  defaults: { title: 'Your application status', steps: [] } satisfies PseAppStatusPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Application type', control: 'Text', bind: 'applicationType', note: 'e.g. Building permit' },
    { label: 'Reference number', control: 'Text', bind: 'referenceNumber', note: 'empty → test-mode sample' },
    { label: 'Status', control: 'Text', bind: 'status', note: 'submitted|review|approved|issued|denied' },
    { label: 'Status label', control: 'Text', bind: 'statusLabel', note: 'optional pill text' },
    { label: 'Submitted stamp', control: 'Text', bind: 'submittedText', note: 'optional' },
    { label: 'Updated stamp', control: 'Text', bind: 'updatedText', note: 'optional' },
    { label: 'Steps', control: 'List', bind: 'steps', note: 'blank → derived from status', children: [
      { label: 'Label', control: 'Text', bind: 'label' },
      { label: 'State', control: 'Text', bind: 'state', note: 'done|current|todo|denied' },
      { label: 'Time', control: 'Text', bind: 'timeText', note: 'optional' },
    ] },
    { label: 'Next action', control: 'Text', bind: 'nextActionText', note: 'optional callout' },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'optional' },
  ],
  Preview: PseAppStatusPreview,
};
