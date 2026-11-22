import type { TravelBoardingPassPayload } from '../payloads';
import { TravelBoardingPassPreview } from '../TravelBoardingPassEditor';
import type { WidgetDef } from './types';

/** asaTravelBoardingPass — a wallet-style digital boarding pass with add-to-wallet action. */
export const travelBoardingPassDef: WidgetDef = {
  kind: 'travelBoardingPassJSON',
  dtoField: 'travelBoardingPassJSON',
  label: 'ASA Travel · Digital Boarding Pass',
  defaults: { title: 'Boarding pass' } satisfies TravelBoardingPassPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'eyebrow above the pass' },
    { label: 'Airline', control: 'Text', bind: 'airline' },
    { label: 'Passenger', control: 'Text', bind: 'passenger' },
    { label: 'From (code)', control: 'Text', bind: 'from' },
    { label: 'From city', control: 'Text', bind: 'fromCity' },
    { label: 'To (code)', control: 'Text', bind: 'to' },
    { label: 'To city', control: 'Text', bind: 'toCity' },
    { label: 'Flight', control: 'Text', bind: 'flight' },
    { label: 'Date', control: 'Text', bind: 'date' },
    { label: 'Boards', control: 'Text', bind: 'boardingTime' },
    { label: 'Departs', control: 'Text', bind: 'departTime' },
    { label: 'Gate', control: 'Text', bind: 'gate' },
    { label: 'Terminal', control: 'Text', bind: 'terminal' },
    { label: 'Seat', control: 'Text', bind: 'seat' },
    { label: 'Group', control: 'Text', bind: 'group', note: 'boarding group' },
    { label: 'Status', control: 'Text', bind: 'status', note: 'e.g. Boarding' },
    { label: 'Primary action', control: 'Text', bind: 'submitText', note: 'default "Add to wallet"' },
    { label: 'Secondary action', control: 'Text', bind: 'secondaryText', note: 'ghost button' },
  ],
  Preview: TravelBoardingPassPreview,
};
