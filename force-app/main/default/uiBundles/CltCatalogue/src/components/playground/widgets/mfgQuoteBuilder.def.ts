import type { MfgQuoteBuilderPayload } from '../payloads';
import { MfgQuoteBuilderPreview } from '../MfgQuoteBuilderEditor';
import type { WidgetDef } from './types';

/** asaMfgQuoteBuilder — configure-to-order option chips + live estimate. */
export const mfgQuoteBuilderDef: WidgetDef = {
  kind: 'mfgQuoteBuilderJSON',
  dtoField: 'mfgQuoteBuilderJSON',
  label: 'ASA Manufacturing · Quote Builder',
  defaults: { title: 'Configure your quote', optionGroups: [] } satisfies MfgQuoteBuilderPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Product', control: 'Text', bind: 'product', note: 'optional' },
    { label: 'Base price', control: 'Number', bind: 'basePrice', note: 'before options' },
    { label: 'Currency', control: 'Text', bind: 'currency', note: 'ISO code, default USD' },
    {
      label: 'Option groups',
      control: 'Single-select chips per group',
      bind: 'optionGroups[]',
      note: '1–5; empty → test-mode sample data',
      children: [
        { label: 'Label', control: 'Text', bind: 'optionGroups[].label' },
        { label: 'Selected', control: 'Text', bind: 'optionGroups[].selectedId', note: 'default first' },
        { label: 'Options', control: 'Chips {label, priceDelta, detail}', bind: 'optionGroups[].options[]' },
      ],
    },
    { label: 'Quantity', control: 'Stepper', bind: 'quantity', note: 'multiplies estimate' },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'default "Request quote"' },
  ],
  Preview: MfgQuoteBuilderPreview,
};
