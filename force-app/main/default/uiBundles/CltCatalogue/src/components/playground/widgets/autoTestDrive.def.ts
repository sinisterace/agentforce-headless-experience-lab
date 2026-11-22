import type { AutoTestDrivePayload } from '../payloads';
import { AutoTestDrivePreview } from '../AutoTestDriveEditor';
import type { WidgetDef } from './types';

/** asaAutoTestDrive — book a vehicle test drive by picking a day + time slot. */
export const autoTestDriveDef: WidgetDef = {
  kind: 'autoTestDriveJSON',
  dtoField: 'autoTestDriveJSON',
  label: 'ASA Automotive · Test Drive Scheduler',
  defaults: { title: 'Book a test drive', vehicle: { name: '' }, days: [] } satisfies AutoTestDrivePayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Vehicle', control: 'Object', bind: 'vehicle', note: 'name, trim?, imageUrl?, initials?', children: [
      { label: 'Name', control: 'Text', bind: 'vehicle.name' },
      { label: 'Trim', control: 'Text', bind: 'vehicle.trim', note: 'optional' },
    ] },
    { label: 'Location', control: 'Object', bind: 'location', note: 'dealership name + address' },
    { label: 'Days', control: 'List', bind: 'days', note: 'empty → test-mode sample', children: [
      { label: 'Date', control: 'Text (ISO)', bind: 'days[].date' },
      { label: 'Slots', control: 'List', bind: 'days[].slots', note: '{ id, time (HH:MM), driveType? showroom|at_home }' },
    ] },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'optional' },
  ],
  Preview: AutoTestDrivePreview,
};
