import type { PseServiceRequestPayload } from '../payloads';
import { PseServiceRequestPreview } from '../PseServiceRequestEditor';
import type { WidgetDef } from './types';

/** asaPseServiceRequest — a 311 / facilities "report a problem" tile-grid chooser. */
export const pseServiceRequestDef: WidgetDef = {
  kind: 'pseServiceRequestJSON',
  dtoField: 'pseServiceRequestJSON',
  label: 'ASA Public Sector & Education · Service Request',
  defaults: { title: 'Report a problem', requestTypes: [] } satisfies PseServiceRequestPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Subtitle', control: 'Text', bind: 'subtitle', note: 'optional' },
    { label: 'Location', control: 'Text', bind: 'locationText', note: 'optional context banner' },
    {
      label: 'Request types',
      control: 'Tile grid',
      bind: 'requestTypes[]',
      note: 'empty → test-mode sample',
      children: [
        { label: 'Id', control: 'Text', bind: 'id', note: 'sent back on selection' },
        { label: 'Label', control: 'Text', bind: 'label' },
        { label: 'Description', control: 'Text', bind: 'description', note: 'optional' },
        { label: 'Icon', control: 'Text', bind: 'icon', note: 'road|light|graffiti|trash|water|building|tree|sidewalk|noise|other' },
      ],
    },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'optional' },
  ],
  Preview: PseServiceRequestPreview,
};
