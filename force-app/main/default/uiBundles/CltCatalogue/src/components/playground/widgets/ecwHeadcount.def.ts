import type { WidgetDef } from './types';
import { EcwHeadcountCard, HEADCOUNT_TEST } from '@/employee/cards/EcwHeadcountCard';
import { structureFromPayload } from '@/employee/cardData';

/** EcwHeadcountCard — HR · Headcount. */
export const ecwHeadcountDef: WidgetDef = {
  kind: 'ecwHeadcountJSON',
  dtoField: 'ecwHeadcountJSON',
  label: 'Agentforce Coworker · HR · Headcount',
  defaults: HEADCOUNT_TEST,
  structure: structureFromPayload(HEADCOUNT_TEST as unknown as Record<string, unknown>),
  Preview: EcwHeadcountCard,
};
