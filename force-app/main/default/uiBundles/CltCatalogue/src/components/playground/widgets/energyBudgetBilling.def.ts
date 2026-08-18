import type { EnergyBudgetBillingPayload } from '../payloads';
import { EnergyBudgetBillingPreview } from '../EnergyBudgetBillingEditor';
import type { WidgetDef } from './types';

/** asaEnergyBudgetBilling — levelized plan with an actual-vs-budget chart. */
export const energyBudgetBillingDef: WidgetDef = {
  kind: 'energyBudgetBillingJSON',
  dtoField: 'energyBudgetBillingJSON',
  label: 'ASA Energy & Utilities · Budget Billing',
  defaults: { title: 'Smooth out your bill', bullets: [] } satisfies EnergyBudgetBillingPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Subtitle', control: 'Text', bind: 'subtitle', note: 'optional' },
    { label: 'Monthly amount', control: 'Number', bind: 'monthlyAmount', note: 'empty → test-mode sample' },
    { label: 'Current avg text', control: 'Text', bind: 'currentAvgText', note: 'optional' },
    { label: 'Term text', control: 'Text', bind: 'termText', note: 'optional' },
    { label: 'Benefits', control: 'List', bind: 'bullets', note: 'checklist' },
    { label: 'Primary label', control: 'Text', bind: 'submitText', note: 'optional' },
    { label: 'Secondary label', control: 'Text', bind: 'secondaryText', note: 'optional' },
  ],
  Preview: EnergyBudgetBillingPreview,
};
