import type { AutoTradeInPayload } from '../payloads';
import { AutoTradeInPreview } from '../AutoTradeInEditor';
import type { WidgetDef } from './types';

/** asaAutoTradeIn — a vehicle trade-in valuation with a low–high value-range bar. */
export const autoTradeInDef: WidgetDef = {
  kind: 'autoTradeInJSON',
  dtoField: 'autoTradeInJSON',
  label: 'ASA Automotive · Trade-In Estimator',
  defaults: { title: 'Your trade-in estimate', factors: [] } satisfies AutoTradeInPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Vehicle', control: 'Object', bind: 'vehicle', note: 'name (+ detail, imageUrl, initials)' },
    { label: 'Estimate', control: 'Number', bind: 'estimate', note: 'empty → test-mode sample' },
    { label: 'Low', control: 'Number', bind: 'low', note: 'range floor · default estimate×0.9' },
    { label: 'High', control: 'Number', bind: 'high', note: 'range ceiling · default estimate×1.1' },
    { label: 'Offer note', control: 'Text', bind: 'offerText', note: 'optional' },
    { label: 'Factors', control: 'List', bind: 'factors', note: 'label + detail + impact(positive|neutral|negative)' },
    { label: 'Primary action', control: 'Text', bind: 'submitText', note: 'optional' },
    { label: 'Secondary action', control: 'Text', bind: 'secondaryText', note: 'optional ghost button' },
  ],
  Preview: AutoTradeInPreview,
};
