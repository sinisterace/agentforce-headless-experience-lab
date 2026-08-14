import type { HealthcareFindCarePayload } from '../payloads';
import { HealthcareFindCareEditor, HealthcareFindCarePreview } from '../HealthcareFindCareEditor';
import type { WidgetDef } from './types';

/** asaHealthcareFindCare — list nearby care facilities with Directions + Call links (wayfinding only). */
export const healthcareFindCareDef: WidgetDef = {
  kind: 'healthcareFindCareJSON',
  dtoField: 'healthcareFindCareJSON',
  label: 'ASA Healthcare · Find Care Near You',
  defaults: { title: 'Care near you', subtitle: '', facilities: [] } satisfies HealthcareFindCarePayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title' },
    { label: 'Subtitle', control: 'Text', bind: 'subtitle', note: 'optional' },
    {
      label: 'Facilities',
      control: 'Card list',
      bind: 'facilities[]',
      note: 'empty → test-mode sample data',
      children: [
        { label: 'Id', control: 'Text', bind: 'facilities[].id' },
        { label: 'Name', control: 'Text', bind: 'facilities[].name' },
        { label: 'Type', control: 'Select (urgent_care | er | primary_care | pharmacy | clinic | hospital | lab | telehealth)', bind: 'facilities[].type' },
        { label: 'Distance', control: 'Text', bind: 'facilities[].distance', note: 'optional' },
        { label: 'Open now', control: 'Boolean', bind: 'facilities[].openNow', note: 'optional pill' },
        { label: 'Hours', control: 'Text', bind: 'facilities[].hours', note: 'optional' },
        { label: 'Wait time', control: 'Text', bind: 'facilities[].waitTime', note: 'optional' },
        { label: 'Address', control: 'Text', bind: 'facilities[].address', note: 'optional' },
        { label: 'Phone', control: 'Text', bind: 'facilities[].phone', note: 'tel: link' },
        { label: 'Services', control: 'Chip list', bind: 'facilities[].services[]', note: 'optional' },
        { label: 'Maps URL', control: 'Text', bind: 'facilities[].mapsUrl', note: 'Directions link' },
      ],
    },
  ],
  Editor: HealthcareFindCareEditor,
  Preview: HealthcareFindCarePreview,
};
