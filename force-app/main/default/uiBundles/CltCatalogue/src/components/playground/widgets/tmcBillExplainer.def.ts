import type { TmcBillExplainerPayload } from '../payloads';
import { TmcBillExplainerPreview } from '../TmcBillExplainerEditor';
import type { WidgetDef } from './types';

/** asaTmcBillExplainer — a statement card with a category bar + delta callout. */
export const tmcBillExplainerDef: WidgetDef = {
  kind: 'tmcBillExplainerJSON',
  dtoField: 'tmcBillExplainerJSON',
  label: 'ASA Technology, Media & Comms · Bill Explainer',
  defaults: { title: 'Your bill', currency: 'USD', items: [] } satisfies TmcBillExplainerPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Total', control: 'Number', bind: 'total', note: 'blank → sum of items' },
    { label: 'Currency', control: 'Text', bind: 'currency', note: 'ISO code, default USD' },
    { label: 'Due date text', control: 'Text', bind: 'dueDateText', note: 'due-date pill' },
    { label: 'Period text', control: 'Text', bind: 'periodText', note: 'billing period' },
    {
      label: 'Items',
      control: 'Itemized rows + stacked bar',
      bind: 'items[]',
      note: '2–7 items; empty → test-mode sample data',
      children: [
        { label: 'Id', control: 'Text', bind: 'items[].id', note: 'optional' },
        { label: 'Label', control: 'Text', bind: 'items[].label' },
        { label: 'Amount', control: 'Number', bind: 'items[].amount', note: 'negative = credit' },
        { label: 'Category', control: 'Select (plan | data | device | streaming | taxes | onetime | discount | other)', bind: 'items[].category' },
      ],
    },
    { label: 'Delta amount', control: 'Number', bind: 'deltaAmount', note: '+ up (amber) / − down (green)' },
    { label: 'Delta text', control: 'Text', bind: 'deltaText', note: 'reason for change' },
    { label: 'Note', control: 'Text', bind: 'note', note: 'footnote' },
    { label: 'Primary label', control: 'Text', bind: 'submitText', note: 'e.g. Pay now' },
    { label: 'Secondary label', control: 'Text', bind: 'secondaryText', note: 'e.g. Set up autopay' },
  ],
  Preview: TmcBillExplainerPreview,
};
