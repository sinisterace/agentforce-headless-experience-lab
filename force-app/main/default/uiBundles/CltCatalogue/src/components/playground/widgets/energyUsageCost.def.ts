import type { EnergyUsageCostPayload } from '../payloads';
import { EnergyUsageCostPreview } from '../EnergyUsageCostEditor';
import type { WidgetDef } from './types';

/** asaEnergyUsageCost — usage column chart + projected bill + cost breakdown. */
export const energyUsageCostDef: WidgetDef = {
  kind: 'energyUsageCostJSON',
  dtoField: 'energyUsageCostJSON',
  label: 'ASA Energy & Utilities · Usage & Cost',
  defaults: { title: 'Your energy this cycle', bars: [], breakdown: [] } satisfies EnergyUsageCostPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Cycle text', control: 'Text', bind: 'cycleText', note: 'optional' },
    { label: 'Projected cost', control: 'Number', bind: 'projectedCost', note: 'empty → test-mode sample' },
    { label: 'Used units', control: 'Number', bind: 'usedUnits', note: 'optional' },
    { label: 'Delta %', control: 'Number', bind: 'deltaPct', note: 'neg = down/green' },
    { label: 'Bars', control: 'List', bind: 'bars', note: 'column chart' },
    { label: 'Breakdown', control: 'List', bind: 'breakdown', note: 'segmented meter' },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'optional' },
  ],
  Preview: EnergyUsageCostPreview,
};
