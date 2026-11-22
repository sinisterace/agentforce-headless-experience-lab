import type { MfgQuoteBuilderPayload } from '../payloads';
import { MfgQuoteBuilderPreview } from '../MfgQuoteBuilderEditor';
import type { WidgetDef } from './types';

/** asaMfgQuoteBuilder — cart-style quote: line items with live quantities + order details. */
export const mfgQuoteBuilderDef: WidgetDef = {
  kind: 'mfgQuoteBuilderJSON',
  dtoField: 'mfgQuoteBuilderJSON',
  label: 'ASA Manufacturing · Quote Builder',
  defaults: { title: 'Quote', lineItems: [] } satisfies MfgQuoteBuilderPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Cart / quote #', control: 'Text', bind: 'cartId', note: 'header reference, e.g. QT-00042' },
    { label: 'Status label', control: 'Text', bind: 'statusLabel', note: 'pill, e.g. "Draft quote"' },
    { label: 'Ship-To', control: 'Text', bind: 'shipTo', note: 'customer / delivery site' },
    { label: 'Ship-To id', control: 'Text', bind: 'shipToId', note: 'optional account #' },
    { label: 'Bill-To', control: 'Text', bind: 'billTo', note: 'billing account' },
    { label: 'Currency', control: 'Text', bind: 'currency', note: 'ISO code, default USD' },
    {
      label: 'Line items',
      control: 'List',
      bind: 'lineItems[]',
      note: '1–n; empty → test-mode sample data',
      children: [
        { label: 'Item #', control: 'Text', bind: 'lineItems[].itemNumber' },
        { label: 'Description', control: 'Text', bind: 'lineItems[].description' },
        { label: 'UOM', control: 'Text', bind: 'lineItems[].uom', note: 'e.g. EA, BX, KIT' },
        { label: 'Unit price', control: 'Number', bind: 'lineItems[].unitPrice' },
        { label: 'Quantity', control: 'Stepper', bind: 'lineItems[].quantity', note: 'default 1' },
      ],
    },
    { label: 'PO field label', control: 'Text', bind: 'poLabel', note: 'default "Purchase Order #"' },
    { label: 'Acknowledgement', control: 'Text', bind: 'acknowledgeText', note: 'required checkbox; blank to hide' },
    { label: 'Secondary label', control: 'Text', bind: 'secondaryText', note: 'ghost button, e.g. "Save & close"' },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'default "Request quote"' },
  ],
  Preview: MfgQuoteBuilderPreview,
};
