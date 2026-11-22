import type { HvacTechTrackerPayload } from '../payloads';
import { HvacTechTrackerPreview } from '../HvacTechTrackerEditor';
import type { WidgetDef } from './types';

/** asaHvacTechTracker — live dispatch status for a field-service technician. */
export const hvacTechTrackerDef: WidgetDef = {
  kind: 'hvacTechTrackerJSON',
  dtoField: 'hvacTechTrackerJSON',
  label: 'ASA HVAC · Technician ETA Tracker',
  defaults: { title: 'Your technician is on the way', steps: [] } satisfies HvacTechTrackerPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Status', control: 'Text', bind: 'status', note: 'scheduled|dispatched|enroute|arriving|onsite|complete' },
    { label: 'Headline', control: 'Text', bind: 'headline', note: 'empty → test-mode sample' },
    { label: 'ETA', control: 'Text', bind: 'etaText', note: 'optional chip' },
    { label: 'Arrival window', control: 'Text', bind: 'windowText', note: 'optional chip' },
    {
      label: 'Technician', control: 'Object', bind: 'technician', children: [
        { label: 'Name', control: 'Text', bind: 'technician.name' },
        { label: 'Role', control: 'Text', bind: 'technician.role', note: 'optional' },
        { label: 'Rating', control: 'Number', bind: 'technician.rating', note: 'optional ★' },
        { label: 'Skills', control: 'Text', bind: 'technician.skills', note: 'optional' },
      ],
    },
    {
      label: 'Job', control: 'Object', bind: 'job', children: [
        { label: 'Number', control: 'Text', bind: 'job.number', note: 'optional' },
        { label: 'Service', control: 'Text', bind: 'job.type', note: 'optional' },
        { label: 'Address', control: 'Text', bind: 'job.address', note: 'optional' },
      ],
    },
    { label: 'Steps', control: 'List', bind: 'steps', note: 'blank → derived from status' },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'optional primary CTA' },
    { label: 'Secondary label', control: 'Text', bind: 'secondaryText', note: 'optional ghost CTA' },
  ],
  Preview: HvacTechTrackerPreview,
};
