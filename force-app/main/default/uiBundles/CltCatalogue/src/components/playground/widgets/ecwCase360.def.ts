import type { WidgetDef } from './types';
import { EcwCase360Card, CASE360_TEST } from '@/employee/cards/EcwCase360Card';
import { structureFromPayload } from '@/employee/cardData';

/** EcwCase360Card — Service · Case 360. */
export const ecwCase360Def: WidgetDef = {
  kind: 'ecwCase360JSON',
  dtoField: 'ecwCase360JSON',
  label: 'Agentforce Coworker · Service · Case 360',
  defaults: CASE360_TEST,
  structure: structureFromPayload(CASE360_TEST as unknown as Record<string, unknown>),
  Preview: EcwCase360Card,
};
