import type { WidgetDef } from './types';
import { EcwSalesPipelineCard } from '@/employee/cards/EcwSalesPipelineCard';
import { PIPELINE_TEST } from '@/employee/ecwFormat';

/** ecwSalesPipeline — the bespoke Sales "My pipeline" Coworker card. */
export const ecwSalesPipelineDef: WidgetDef = {
  kind: 'ecwSalesPipelineJSON',
  dtoField: 'ecwSalesPipelineJSON',
  label: 'Agentforce Coworker · My pipeline',
  defaults: PIPELINE_TEST,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title' },
    { label: 'Period', control: 'Text', bind: 'periodLabel' },
    { label: 'Open pipeline', control: 'Currency', bind: 'openTotal' },
    { label: 'Trend', control: 'Percent', bind: 'deltaPct' },
    {
      label: 'Stages', control: 'Segmented bar', bind: 'stages[]',
      children: [
        { label: 'Stage', control: 'Text', bind: 'stages[].label' },
        { label: 'Amount', control: 'Currency', bind: 'stages[].amount' },
      ],
    },
    {
      label: 'Stats', control: 'Stat tiles', bind: 'stats[]',
      children: [
        { label: 'Label', control: 'Text', bind: 'stats[].label' },
        { label: 'Value', control: 'Text', bind: 'stats[].value' },
      ],
    },
    { label: 'Action', control: 'Button', bind: 'submitText' },
  ],
  Preview: EcwSalesPipelineCard,
};
