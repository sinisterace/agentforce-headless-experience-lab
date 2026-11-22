import type { TmcDataUsagePayload } from '../payloads';
import { TmcDataUsagePreview } from '../TmcDataUsageEditor';
import type { WidgetDef } from './types';

/** asaTmcDataUsage — a radial gauge of usage vs. allowance + breakdown. */
export const tmcDataUsageDef: WidgetDef = {
  kind: 'tmcDataUsageJSON',
  dtoField: 'tmcDataUsageJSON',
  label: 'ASA Technology, Media & Comms · Data Usage Meter',
  defaults: { title: 'Your data this cycle', unit: 'GB', categories: [] } satisfies TmcDataUsagePayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Cycle text', control: 'Text', bind: 'cycleText', note: 'e.g. days left / resets' },
    { label: 'Used', control: 'Number', bind: 'used', note: 'empty → test-mode sample data' },
    { label: 'Total', control: 'Number', bind: 'total', note: 'blank → unlimited' },
    { label: 'Unit', control: 'Text', bind: 'unit', note: 'GB | min | texts' },
    {
      label: 'Categories',
      control: 'Stacked bar + legend',
      bind: 'categories[]',
      note: 'optional breakdown',
      children: [
        { label: 'Label', control: 'Text', bind: 'categories[].label' },
        { label: 'Amount', control: 'Number', bind: 'categories[].amount' },
        { label: 'Color', control: 'Text', bind: 'categories[].color', note: 'optional hex' },
      ],
    },
    { label: 'Note', control: 'Text', bind: 'note', note: 'tinted near/over limit' },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'optional add-on' },
    { label: 'Submit value', control: 'Text', bind: 'submitValue', note: 'message sent back' },
  ],
  Preview: TmcDataUsagePreview,
};
