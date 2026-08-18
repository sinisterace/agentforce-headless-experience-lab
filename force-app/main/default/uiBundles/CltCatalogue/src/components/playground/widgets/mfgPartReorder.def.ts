import type { MfgPartReorderPayload } from '../payloads';
import { MfgPartReorderPreview } from '../MfgPartReorderEditor';
import type { WidgetDef } from './types';

/** asaMfgPartReorder — a single spare part with a quantity stepper. */
export const mfgPartReorderDef: WidgetDef = {
  kind: 'mfgPartReorderJSON',
  dtoField: 'mfgPartReorderJSON',
  label: 'ASA Manufacturing · Part Reorder',
  defaults: { title: 'Reorder part', part: { name: '' } } satisfies MfgPartReorderPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    {
      label: 'Part',
      control: 'Group',
      bind: 'part',
      note: 'empty → test-mode sample data',
      children: [
        { label: 'Name', control: 'Text', bind: 'part.name' },
        { label: 'SKU', control: 'Text', bind: 'part.sku', note: 'optional' },
        { label: 'Image URL', control: 'Text', bind: 'part.imageUrl', note: 'blank → initials' },
        { label: 'Unit price', control: 'Number', bind: 'part.unitPrice', note: 'enables subtotal' },
        { label: 'Lead time', control: 'Text', bind: 'part.leadTime', note: 'optional' },
        { label: 'In stock', control: 'Number', bind: 'part.inStock', note: 'stock bar; caps qty' },
        { label: 'Min order', control: 'Number', bind: 'part.minOrder', note: 'default 1' },
        { label: 'Step', control: 'Number', bind: 'part.incrementStep', note: 'default 1' },
      ],
    },
    { label: 'Quantity', control: 'Stepper', bind: 'quantity', note: 'starting qty' },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'default "Reorder"' },
  ],
  Preview: MfgPartReorderPreview,
};
