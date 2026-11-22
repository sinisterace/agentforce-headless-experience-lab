import type { MfgWorkOrderPayload } from '../payloads';
import { MfgWorkOrderPreview } from '../MfgWorkOrderEditor';
import type { WidgetDef } from './types';

/** asaMfgWorkOrder — vertical milestone timeline for a work order. */
export const mfgWorkOrderDef: WidgetDef = {
  kind: 'mfgWorkOrderJSON',
  dtoField: 'mfgWorkOrderJSON',
  label: 'ASA Manufacturing · Work Order Tracker',
  defaults: { title: 'Work order', milestones: [] } satisfies MfgWorkOrderPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Order number', control: 'Text', bind: 'orderNumber', note: 'optional' },
    { label: 'Product', control: 'Text', bind: 'product', note: 'optional' },
    { label: 'Priority', control: 'Select (low | normal | high | urgent)', bind: 'priority' },
    { label: 'ETA', control: 'Text', bind: 'etaText', note: 'estimated ship' },
    { label: 'Updated', control: 'Text', bind: 'updatedText', note: 'freshness stamp' },
    {
      label: 'Milestones',
      control: 'Vertical timeline',
      bind: 'milestones[]',
      note: '2–7; empty → test-mode sample data',
      children: [
        { label: 'Label', control: 'Text', bind: 'milestones[].label' },
        { label: 'State', control: 'Select (done | current | todo)', bind: 'milestones[].state' },
        { label: 'Time', control: 'Text', bind: 'milestones[].timeText', note: 'optional' },
        { label: 'Owner', control: 'Text', bind: 'milestones[].owner', note: 'optional' },
      ],
    },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'optional' },
  ],
  Preview: MfgWorkOrderPreview,
};
