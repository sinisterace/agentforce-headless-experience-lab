import type { EnergyOutageTrackerPayload } from '../payloads';
import { EnergyOutageTrackerPreview } from '../EnergyOutageTrackerEditor';
import type { WidgetDef } from './types';

/** asaEnergyOutageTracker — active outage with a restoration progress track. */
export const energyOutageTrackerDef: WidgetDef = {
  kind: 'energyOutageTrackerJSON',
  dtoField: 'energyOutageTrackerJSON',
  label: 'ASA Energy & Utilities · Outage Tracker',
  defaults: { title: 'Outage status', steps: [] } satisfies EnergyOutageTrackerPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Status', control: 'Text', bind: 'status', note: 'investigating|outage|restoring|restored' },
    { label: 'Headline', control: 'Text', bind: 'headline', note: 'empty → test-mode sample' },
    { label: 'Area', control: 'Text', bind: 'area', note: 'optional' },
    { label: 'Cause', control: 'Text', bind: 'cause', note: 'optional' },
    { label: 'Affected', control: 'Text', bind: 'affectedText', note: 'optional' },
    { label: 'Est. restore', control: 'Text', bind: 'etaText', note: 'optional' },
    { label: 'Steps', control: 'List', bind: 'steps', note: 'blank → derived from status' },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'optional' },
  ],
  Preview: EnergyOutageTrackerPreview,
};
