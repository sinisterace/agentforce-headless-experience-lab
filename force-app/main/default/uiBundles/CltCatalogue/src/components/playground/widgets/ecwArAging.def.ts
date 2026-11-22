import type { WidgetDef } from './types';
import { EcwArAgingCard, AR_AGING_TEST } from '@/employee/cards/EcwArAgingCard';
import { structureFromPayload } from '@/employee/cardData';

/** EcwArAgingCard — Finance · AR aging. */
export const ecwArAgingDef: WidgetDef = {
  kind: 'ecwArAgingJSON',
  dtoField: 'ecwArAgingJSON',
  label: 'Agentforce Coworker · Finance · AR aging',
  defaults: AR_AGING_TEST,
  structure: structureFromPayload(AR_AGING_TEST as unknown as Record<string, unknown>),
  Preview: EcwArAgingCard,
};
