import type { RetailOrderTrackingPayload } from '../payloads';
import { RetailOrderTrackingPreview } from '../RetailOrderTrackingEditor';
import type { WidgetDef } from './types';

/** asaRetailOrderTracking — live delivery map (self-contained SVG) + ETA + status timeline. */
export const retailOrderTrackingDef: WidgetDef = {
  kind: 'retailOrderTrackingJSON',
  dtoField: 'retailOrderTrackingJSON',
  label: 'ASA Retail · Order Tracking',
  defaults: { title: 'Track your order' } satisfies RetailOrderTrackingPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title' },
    { label: 'Live', control: 'Boolean', bind: 'live', note: 'pulsing LIVE badge' },
    { label: 'Status', control: 'Select (submitted | packed | out_for_delivery | delivered)', bind: 'status', note: 'positions courier on map' },
    { label: 'ETA text', control: 'Text', bind: 'etaText', note: 'optional' },
    {
      label: 'Destination',
      control: 'Group',
      bind: 'destination',
      note: 'optional',
      children: [
        { label: 'Label', control: 'Text', bind: 'destination.label' },
        { label: 'Address', control: 'Text', bind: 'destination.address' },
      ],
    },
    {
      label: 'Courier',
      control: 'Group',
      bind: 'courier',
      note: 'optional',
      children: [
        { label: 'Name', control: 'Text', bind: 'courier.name' },
        { label: 'Vehicle', control: 'Select (bike | van | car | foot)', bind: 'courier.vehicle' },
        { label: 'Initials', control: 'Text', bind: 'courier.initials', note: 'auto if blank' },
        { label: 'Photo URL', control: 'Text', bind: 'courier.photoUrl', note: 'optional' },
        { label: 'Rating', control: 'Text', bind: 'courier.rating', note: 'optional' },
      ],
    },
    {
      label: 'Timeline steps',
      control: 'List',
      bind: 'steps[]',
      note: 'empty → derived from status',
      children: [
        { label: 'Label', control: 'Text', bind: 'steps[].label' },
        { label: 'State', control: 'Select (done | current | todo)', bind: 'steps[].state' },
        { label: 'Time', control: 'Text', bind: 'steps[].time', note: 'optional' },
      ],
    },
    { label: 'Action button', control: 'Text', bind: 'submitText', note: 'optional; hands back' },
    { label: 'Action value', control: 'Text', bind: 'submitValue', note: 'defaults to label' },
  ],
  Preview: RetailOrderTrackingPreview,
};
