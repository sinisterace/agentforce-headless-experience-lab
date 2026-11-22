import type { TravelFlightStatusPayload } from '../payloads';
import { TravelFlightStatusPreview } from '../TravelFlightStatusEditor';
import type { WidgetDef } from './types';

/** asaTravelFlightStatus — live flight status: a plane along the route arc, gates + baggage. */
export const travelFlightStatusDef: WidgetDef = {
  kind: 'travelFlightStatusJSON',
  dtoField: 'travelFlightStatusJSON',
  label: 'ASA Travel · Flight Status Tracker',
  defaults: { title: 'Flight status' } satisfies TravelFlightStatusPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'e.g. "Flight AF128"' },
    { label: 'Status', control: 'Select (scheduled | boarding | departed | in_air | landed | delayed | cancelled)', bind: 'status' },
    { label: 'Status label', control: 'Text', bind: 'statusLabel', note: 'optional override' },
    { label: 'Origin', control: 'Object { code, city?, time?, gate?, terminal? }', bind: 'origin' },
    { label: 'Destination', control: 'Object { code, city?, time?, gate?, terminal?, baggage? }', bind: 'dest' },
    { label: 'Progress %', control: 'Number', bind: 'progressPct', note: '0–100 plane position' },
    { label: 'Aircraft', control: 'Text', bind: 'aircraft', note: 'optional' },
    { label: 'Duration', control: 'Text', bind: 'durationText', note: 'e.g. "5h 30m"' },
    { label: 'Updated', control: 'Text', bind: 'updatedText', note: 'optional' },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'default "Get updates"' },
  ],
  Preview: TravelFlightStatusPreview,
};
