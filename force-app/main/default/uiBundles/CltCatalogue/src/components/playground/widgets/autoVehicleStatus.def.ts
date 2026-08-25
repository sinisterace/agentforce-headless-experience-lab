import type { AutoVehicleStatusPayload } from '../payloads';
import { AutoVehicleStatusPreview } from '../AutoVehicleStatusEditor';
import type { WidgetDef } from './types';

/** asaAutoVehicleStatus — connected-vehicle status: range ring, tires, items, alerts. */
export const autoVehicleStatusDef: WidgetDef = {
  kind: 'autoVehicleStatusJSON',
  dtoField: 'autoVehicleStatusJSON',
  label: 'ASA Automotive · Connected Car Status',
  defaults: { title: 'Your vehicle', tires: [], items: [] } satisfies AutoVehicleStatusPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Vehicle', control: 'Object', bind: 'vehicle', note: 'name, trim?, imageUrl?, initials?' },
    { label: 'Electric', control: 'Boolean', bind: 'isElectric', note: 'charge vs fuel wording' },
    { label: 'Range', control: 'Object', bind: 'range', note: 'value, total?, unit? → ring gauge; empty → test-mode' },
    { label: 'Battery', control: 'Number', bind: 'battery', note: '0–100 percent' },
    { label: 'Odometer', control: 'Number', bind: 'odometer', note: 'optional (+ odometerUnit)' },
    { label: 'Tires', control: 'List', bind: 'tires', note: 'FL/FR/RL/RR + psi + status' },
    { label: 'Service items', control: 'List', bind: 'items', note: 'label + value + status' },
    { label: 'Alerts', control: 'List', bind: 'alerts', note: 'strings, amber banner' },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'optional' },
  ],
  Preview: AutoVehicleStatusPreview,
};
