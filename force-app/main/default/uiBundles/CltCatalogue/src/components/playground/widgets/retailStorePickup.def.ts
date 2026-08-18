import type { RetailStorePickupPayload } from '../payloads';
import { RetailStorePickupPreview } from '../RetailStorePickupEditor';
import type { WidgetDef } from './types';

/** asaRetailStorePickup — nearby stores with stock + pickup ETA; reserve for pickup. */
export const retailStorePickupDef: WidgetDef = {
  kind: 'retailStorePickupJSON',
  dtoField: 'retailStorePickupJSON',
  label: 'ASA Retail · Store Pickup',
  defaults: { title: 'Pick up in store', subtitle: '', stores: [] } satisfies RetailStorePickupPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title' },
    { label: 'Subtitle', control: 'Text', bind: 'subtitle', note: 'optional' },
    {
      label: 'Product',
      control: 'Group',
      bind: 'product',
      note: 'optional context row',
      children: [
        { label: 'Name', control: 'Text', bind: 'product.name' },
        { label: 'Variant', control: 'Text', bind: 'product.variant' },
        { label: 'Category', control: 'Select (apparel | shoes | … | general)', bind: 'product.category' },
        { label: 'Image URL', control: 'Text', bind: 'product.imageUrl', note: 'blank → category tile' },
      ],
    },
    {
      label: 'Stores',
      control: 'Selectable list',
      bind: 'stores[]',
      note: 'empty → test-mode sample data',
      children: [
        { label: 'Id', control: 'Text', bind: 'stores[].id', note: 'sent back on selection' },
        { label: 'Name', control: 'Text', bind: 'stores[].name' },
        { label: 'Availability', control: 'Select (in_stock | low | out)', bind: 'stores[].availability', note: 'out → not selectable' },
        { label: 'Distance', control: 'Text', bind: 'stores[].distance', note: 'optional' },
        { label: 'Pickup ETA', control: 'Text', bind: 'stores[].pickupEta', note: 'optional' },
        { label: 'Address', control: 'Text', bind: 'stores[].address', note: 'optional' },
        { label: 'Hours', control: 'Text', bind: 'stores[].hours', note: 'optional' },
        { label: 'Phone', control: 'Text', bind: 'stores[].phone', note: 'tel: link' },
        { label: 'Maps URL', control: 'Text', bind: 'stores[].mapsUrl', note: 'Directions link' },
      ],
    },
    { label: 'Submit', control: 'Text', bind: 'submitText', note: 'default "Reserve for pickup"' },
  ],
  Preview: RetailStorePickupPreview,
};
