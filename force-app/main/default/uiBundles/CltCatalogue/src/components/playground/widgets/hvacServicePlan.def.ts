import type { HvacServicePlanPayload } from '../payloads';
import { HvacServicePlanPreview } from '../HvacServicePlanEditor';
import type { WidgetDef } from './types';

/** asaHvacServicePlan — annual HVAC maintenance membership tiers as plan cards. */
export const hvacServicePlanDef: WidgetDef = {
  kind: 'hvacServicePlanJSON',
  dtoField: 'hvacServicePlanJSON',
  label: 'ASA HVAC · Service Plan Selector',
  defaults: { title: 'Choose a comfort plan', plans: [] } satisfies HvacServicePlanPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Subtitle', control: 'Text', bind: 'subtitle', note: 'optional' },
    { label: 'Currency', control: 'Text', bind: 'currency', note: 'ISO code, default USD' },
    { label: 'Cadence', control: 'Text', bind: 'cadence', note: 'mo|yr|wk → price suffix' },
    { label: 'Current plan', control: 'Text', bind: 'currentPlanId', note: 'that card is locked' },
    {
      label: 'Plans',
      control: 'List',
      bind: 'plans[]',
      note: 'empty → test-mode sample',
      children: [
        { label: 'Id', control: 'Text', bind: 'id', note: 'sent back on selection' },
        { label: 'Name', control: 'Text', bind: 'name' },
        { label: 'Price', control: 'Number', bind: 'price', note: 'optional' },
        { label: 'Tagline', control: 'Text', bind: 'tagline', note: 'optional' },
        { label: 'Badge', control: 'Text', bind: 'badge', note: 'optional ribbon' },
        { label: 'Recommended', control: 'Toggle', bind: 'recommended', note: 'accent highlight' },
        { label: 'Features', control: 'List', bind: 'features[]', note: 'checklist' },
      ],
    },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'optional' },
  ],
  Preview: HvacServicePlanPreview,
};
