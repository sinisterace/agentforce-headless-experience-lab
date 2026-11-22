import type { TmcServiceStatusPayload } from '../payloads';
import { TmcServiceStatusPreview } from '../TmcServiceStatusEditor';
import type { WidgetDef } from './types';

/** asaTmcServiceStatus — a live service-health board with per-service rows. */
export const tmcServiceStatusDef: WidgetDef = {
  kind: 'tmcServiceStatusJSON',
  dtoField: 'tmcServiceStatusJSON',
  label: 'ASA Technology, Media & Comms · Service Status',
  defaults: { title: 'Service status', services: [] } satisfies TmcServiceStatusPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Overall', control: 'Select (operational | degraded | outage | maintenance)', bind: 'overall', note: 'auto from services if blank' },
    { label: 'Headline', control: 'Text', bind: 'headline', note: 'optional' },
    { label: 'Area', control: 'Text', bind: 'area', note: 'affected location' },
    { label: 'ETA text', control: 'Text', bind: 'etaText', note: 'restore estimate' },
    { label: 'Updated', control: 'Text', bind: 'updatedText', note: 'freshness stamp' },
    {
      label: 'Services',
      control: 'Status row list',
      bind: 'services[]',
      note: '1–6 services; empty → test-mode sample data',
      children: [
        { label: 'Id', control: 'Text', bind: 'services[].id', note: 'optional' },
        { label: 'Name', control: 'Text', bind: 'services[].name' },
        { label: 'Status', control: 'Select (operational | degraded | down | maintenance)', bind: 'services[].status' },
        { label: 'Detail', control: 'Text', bind: 'services[].detail', note: 'optional line' },
        { label: 'Icon', control: 'Select (internet | tv | mobile | voice | home)', bind: 'services[].icon' },
      ],
    },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'optional notify' },
    { label: 'Submit value', control: 'Text', bind: 'submitValue', note: 'message sent back' },
  ],
  Preview: TmcServiceStatusPreview,
};
