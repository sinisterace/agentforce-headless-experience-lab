import type { TmcPlanComparePayload } from '../payloads';
import { TmcPlanComparePreview } from '../TmcPlanCompareEditor';
import type { WidgetDef } from './types';

/** asaTmcPlanCompare — a stack of price-forward plan cards; pick one to switch. */
export const tmcPlanCompareDef: WidgetDef = {
  kind: 'tmcPlanCompareJSON',
  dtoField: 'tmcPlanCompareJSON',
  label: 'ASA Technology, Media & Comms · Plan Comparison',
  defaults: { title: 'Compare plans', subtitle: '', currency: 'USD', cadence: 'mo', plans: [] } satisfies TmcPlanComparePayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title' },
    { label: 'Subtitle', control: 'Text', bind: 'subtitle', note: 'optional' },
    { label: 'Currency', control: 'Text', bind: 'currency', note: 'ISO code, default USD' },
    { label: 'Cadence', control: 'Select (mo | yr | wk)', bind: 'cadence', note: 'price suffix' },
    { label: 'Current plan', control: 'Text', bind: 'currentPlanId', note: 'marked, not selectable' },
    {
      label: 'Plans',
      control: 'Selectable card list',
      bind: 'plans[]',
      note: '2–4 plans; empty → test-mode sample data',
      children: [
        { label: 'Id', control: 'Text', bind: 'plans[].id', note: 'sent back on switch' },
        { label: 'Name', control: 'Text', bind: 'plans[].name' },
        { label: 'Price', control: 'Number', bind: 'plans[].price' },
        { label: 'Tagline', control: 'Text', bind: 'plans[].tagline', note: 'optional' },
        { label: 'Badge', control: 'Text', bind: 'plans[].badge', note: 'corner tag' },
        { label: 'Recommended', control: 'Boolean', bind: 'plans[].recommended', note: 'accent highlight' },
        { label: 'Features', control: 'String list', bind: 'plans[].features', note: '2–5 check rows' },
      ],
    },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'default "Switch plan"' },
  ],
  Preview: TmcPlanComparePreview,
};
