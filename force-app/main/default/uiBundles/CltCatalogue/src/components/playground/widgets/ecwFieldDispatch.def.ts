import type { WidgetDef } from './types';
import { EcwFieldDispatchCard, FIELD_DISPATCH_TEST } from '@/employee/cards/EcwFieldDispatchCard';
import { structureFromPayload } from '@/employee/cardData';

/** EcwFieldDispatchCard — Service · Field dispatch. */
export const ecwFieldDispatchDef: WidgetDef = {
  kind: 'ecwFieldDispatchJSON',
  dtoField: 'ecwFieldDispatchJSON',
  label: 'Agentforce Coworker · Service · Field dispatch',
  defaults: FIELD_DISPATCH_TEST,
  structure: structureFromPayload(FIELD_DISPATCH_TEST as unknown as Record<string, unknown>),
  Preview: EcwFieldDispatchCard,
};
