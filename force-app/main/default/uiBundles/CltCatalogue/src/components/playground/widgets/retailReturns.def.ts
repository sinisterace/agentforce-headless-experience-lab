import type { RetailReturnsPayload } from '../payloads';
import { RetailReturnsEditor, RetailReturnsPreview } from '../RetailReturnsEditor';
import type { WidgetDef } from './types';

/** asaRetailReturns — pick items + reason + resolution to start a return/exchange. */
export const retailReturnsDef: WidgetDef = {
  kind: 'retailReturnsJSON',
  dtoField: 'retailReturnsJSON',
  label: 'ASA Retail · Returns & Exchange',
  defaults: { title: 'Start a return', subtitle: '', orderLabel: '', items: [], reasons: [] } satisfies RetailReturnsPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title' },
    { label: 'Subtitle', control: 'Text', bind: 'subtitle', note: 'optional' },
    { label: 'Order label', control: 'Text', bind: 'orderLabel', note: 'optional' },
    {
      label: 'Items',
      control: 'Selectable list',
      bind: 'items[]',
      note: 'empty → test-mode sample data',
      children: [
        { label: 'Id', control: 'Text', bind: 'items[].id', note: 'sent back on selection' },
        { label: 'Name', control: 'Text', bind: 'items[].name' },
        { label: 'Variant', control: 'Text', bind: 'items[].variant', note: 'optional' },
        { label: 'SKU', control: 'Text', bind: 'items[].sku', note: 'optional' },
        { label: 'Price', control: 'Number', bind: 'items[].price', note: 'optional' },
        { label: 'Category', control: 'Select (apparel | shoes | … | general)', bind: 'items[].category' },
        { label: 'Image URL', control: 'Text', bind: 'items[].imageUrl', note: 'blank → category tile' },
      ],
    },
    {
      label: 'Reasons',
      control: 'Chip list',
      bind: 'reasons[]',
      children: [
        { label: 'Id', control: 'Text', bind: 'reasons[].id' },
        { label: 'Label', control: 'Text', bind: 'reasons[].label' },
      ],
    },
    {
      label: 'Resolutions',
      control: 'Segmented',
      bind: 'resolutions[]',
      note: 'empty → refund/exchange/credit',
      children: [
        { label: 'Id', control: 'Text', bind: 'resolutions[].id' },
        { label: 'Kind', control: 'Select (refund | exchange | credit)', bind: 'resolutions[].kind' },
        { label: 'Label', control: 'Text', bind: 'resolutions[].label' },
        { label: 'Description', control: 'Text', bind: 'resolutions[].description', note: 'optional' },
      ],
    },
    { label: 'Submit', control: 'Text', bind: 'submitText', note: 'default "Continue return"' },
  ],
  Editor: RetailReturnsEditor,
  Preview: RetailReturnsPreview,
};
