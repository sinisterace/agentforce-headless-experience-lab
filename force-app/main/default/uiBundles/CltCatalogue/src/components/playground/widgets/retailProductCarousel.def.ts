import type { RetailProductCarouselPayload } from '../payloads';
import { RetailProductCarouselEditor, RetailProductCarouselPreview } from '../RetailProductCarouselEditor';
import type { WidgetDef } from './types';

/** asaRetailProductCarousel — up to three products, shown one at a time. */
export const retailProductCarouselDef: WidgetDef = {
  kind: 'retailProductCarouselJSON',
  dtoField: 'retailProductCarouselJSON',
  label: 'ASA Retail · Product Carousel',
  defaults: { title: 'Picked for you', subtitle: '', currency: 'USD', products: [] } satisfies RetailProductCarouselPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title' },
    { label: 'Subtitle', control: 'Text', bind: 'subtitle', note: 'optional' },
    { label: 'Currency', control: 'Text', bind: 'currency', note: 'ISO code, default USD' },
    {
      label: 'Products',
      control: 'Single-card carousel',
      bind: 'products[]',
      note: '1–3 products; empty → test-mode sample data',
      children: [
        { label: 'Id', control: 'Text', bind: 'products[].id', note: 'sent back on Add to cart' },
        { label: 'Name', control: 'Text', bind: 'products[].name' },
        { label: 'SKU', control: 'Text', bind: 'products[].sku', note: 'optional' },
        { label: 'Category', control: 'Select (apparel | shoes | electronics | beauty | home | grocery | accessories | outdoors | toys | general)', bind: 'products[].category', note: 'drives no-photo tile' },
        { label: 'Price', control: 'Number', bind: 'products[].price' },
        { label: 'Compare-at price', control: 'Number', bind: 'products[].compareAtPrice', note: 'higher → sale' },
        { label: 'Rating', control: 'Number (0–5)', bind: 'products[].rating', note: 'optional' },
        { label: 'Review count', control: 'Number', bind: 'products[].reviewCount', note: 'optional' },
        { label: 'Image URL', control: 'Text', bind: 'products[].imageUrl', note: 'blank → category tile' },
        { label: 'Badge', control: 'Text', bind: 'products[].badge', note: 'corner tag' },
        { label: 'Availability', control: 'Select (in_stock | low | out)', bind: 'products[].availability', note: 'out → disabled' },
      ],
    },
  ],
  Editor: RetailProductCarouselEditor,
  Preview: RetailProductCarouselPreview,
};
