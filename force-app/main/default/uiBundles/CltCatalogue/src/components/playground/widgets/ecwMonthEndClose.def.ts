import type { WidgetDef } from './types';
import { EcwMonthEndCloseCard, MONTH_END_CLOSE_TEST } from '@/employee/cards/EcwMonthEndCloseCard';
import { structureFromPayload } from '@/employee/cardData';

/** EcwMonthEndCloseCard — Finance · Month-end close. */
export const ecwMonthEndCloseDef: WidgetDef = {
  kind: 'ecwMonthEndCloseJSON',
  dtoField: 'ecwMonthEndCloseJSON',
  label: 'Agentforce Coworker · Finance · Month-end close',
  defaults: MONTH_END_CLOSE_TEST,
  structure: structureFromPayload(MONTH_END_CLOSE_TEST as unknown as Record<string, unknown>),
  Preview: EcwMonthEndCloseCard,
};
