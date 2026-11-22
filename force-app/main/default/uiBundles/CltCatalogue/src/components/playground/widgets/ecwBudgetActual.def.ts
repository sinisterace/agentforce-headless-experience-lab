import type { WidgetDef } from './types';
import { EcwBudgetActualCard, BUDGET_ACTUAL_TEST } from '@/employee/cards/EcwBudgetActualCard';
import { structureFromPayload } from '@/employee/cardData';

/** EcwBudgetActualCard — Finance · Budget vs actual. */
export const ecwBudgetActualDef: WidgetDef = {
  kind: 'ecwBudgetActualJSON',
  dtoField: 'ecwBudgetActualJSON',
  label: 'Agentforce Coworker · Finance · Budget vs actual',
  defaults: BUDGET_ACTUAL_TEST,
  structure: structureFromPayload(BUDGET_ACTUAL_TEST as unknown as Record<string, unknown>),
  Preview: EcwBudgetActualCard,
};
