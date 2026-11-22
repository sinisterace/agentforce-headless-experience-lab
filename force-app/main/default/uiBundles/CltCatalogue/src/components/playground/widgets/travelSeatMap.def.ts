import type { TravelSeatMapPayload } from '../payloads';
import { TravelSeatMapPreview } from '../TravelSeatMapEditor';
import type { WidgetDef } from './types';

/** asaTravelSeatMap — an interactive cabin seat map the visitor taps to pick a seat. */
export const travelSeatMapDef: WidgetDef = {
  kind: 'travelSeatMapJSON',
  dtoField: 'travelSeatMapJSON',
  label: 'ASA Travel · Seat Map',
  defaults: { title: 'Choose your seat', seats: [] } satisfies TravelSeatMapPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Flight', control: 'Text', bind: 'flight', note: 'context line, e.g. "SFO → JFK · AF128"' },
    { label: 'Columns', control: 'Pill list', bind: 'columns', note: 'e.g. A,B,C,D,E,F' },
    { label: 'Aisle after', control: 'Text', bind: 'aisleAfter', note: 'column letter the aisle follows' },
    {
      label: 'Seats',
      control: 'Seat grid',
      bind: 'seats[]',
      note: 'empty → test-mode sample',
      children: [
        { label: 'Id', control: 'Text', bind: 'seats[].id', note: 'e.g. "14A" — sent back on select' },
        { label: 'Row', control: 'Number', bind: 'seats[].row' },
        { label: 'Col', control: 'Text', bind: 'seats[].col' },
        { label: 'Status', control: 'Select (open | taken)', bind: 'seats[].status', note: 'default open' },
        { label: 'Kind', control: 'Select (standard | extra_legroom | exit | premium)', bind: 'seats[].kind' },
        { label: 'Price', control: 'Number', bind: 'seats[].price', note: 'seat add-on' },
      ],
    },
    { label: 'Currency', control: 'Text', bind: 'currency', note: 'ISO, default USD' },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'default "Select seat"' },
  ],
  Preview: TravelSeatMapPreview,
};
