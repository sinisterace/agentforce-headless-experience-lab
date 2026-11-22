import type { WidgetDef } from './types';
import { EcwChangeCalendarCard, CHANGE_CALENDAR_TEST } from '@/employee/cards/EcwChangeCalendarCard';
import { structureFromPayload } from '@/employee/cardData';

/** EcwChangeCalendarCard — IT · Change calendar. */
export const ecwChangeCalendarDef: WidgetDef = {
  kind: 'ecwChangeCalendarJSON',
  dtoField: 'ecwChangeCalendarJSON',
  label: 'Agentforce Coworker · IT · Change calendar',
  defaults: CHANGE_CALENDAR_TEST,
  structure: structureFromPayload(CHANGE_CALENDAR_TEST as unknown as Record<string, unknown>),
  Preview: EcwChangeCalendarCard,
};
