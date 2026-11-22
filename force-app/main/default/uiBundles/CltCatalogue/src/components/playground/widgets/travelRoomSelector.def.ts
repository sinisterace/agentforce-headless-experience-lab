import type { TravelRoomSelectorPayload } from '../payloads';
import { TravelRoomSelectorPreview } from '../TravelRoomSelectorEditor';
import type { WidgetDef } from './types';

/** asaTravelRoomSelector — hotel room cards the visitor picks from. */
export const travelRoomSelectorDef: WidgetDef = {
  kind: 'travelRoomSelectorJSON',
  dtoField: 'travelRoomSelectorJSON',
  label: 'ASA Travel · Room Selector',
  defaults: { title: 'Choose your room', rooms: [] } satisfies TravelRoomSelectorPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Subtitle', control: 'Text', bind: 'subtitle', note: 'property · dates · guests' },
    {
      label: 'Rooms',
      control: 'Card list',
      bind: 'rooms[]',
      note: 'empty → test-mode sample',
      children: [
        { label: 'Id', control: 'Text', bind: 'rooms[].id', note: 'sent back on select' },
        { label: 'Name', control: 'Text', bind: 'rooms[].name' },
        { label: 'Bed', control: 'Text', bind: 'rooms[].bed', note: 'e.g. "1 King bed"' },
        { label: 'Size', control: 'Text', bind: 'rooms[].size', note: 'e.g. "420 sq ft"' },
        { label: 'Sleeps', control: 'Number', bind: 'rooms[].sleeps' },
        { label: 'Amenities', control: 'Pill list', bind: 'rooms[].amenities' },
        { label: 'Price', control: 'Number', bind: 'rooms[].price', note: 'per cadence' },
        { label: 'Cadence', control: 'Text', bind: 'rooms[].cadence', note: 'default "night"' },
        { label: 'Image URL', control: 'Text', bind: 'rooms[].imageUrl', note: 'optional; gradient fallback' },
        { label: 'Badge', control: 'Text', bind: 'rooms[].badge', note: 'e.g. "Only 2 left"' },
      ],
    },
    { label: 'Currency', control: 'Text', bind: 'currency', note: 'ISO, default USD' },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'default "Reserve"' },
  ],
  Preview: TravelRoomSelectorPreview,
};
