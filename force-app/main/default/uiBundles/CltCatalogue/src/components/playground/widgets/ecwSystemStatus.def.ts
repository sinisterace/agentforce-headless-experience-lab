import type { WidgetDef } from './types';
import { EcwSystemStatusCard, SYSTEM_STATUS_TEST } from '@/employee/cards/EcwSystemStatusCard';
import { structureFromPayload } from '@/employee/cardData';

/** EcwSystemStatusCard — IT · System status. */
export const ecwSystemStatusDef: WidgetDef = {
  kind: 'ecwSystemStatusJSON',
  dtoField: 'ecwSystemStatusJSON',
  label: 'Agentforce Coworker · IT · System status',
  defaults: SYSTEM_STATUS_TEST,
  structure: structureFromPayload(SYSTEM_STATUS_TEST as unknown as Record<string, unknown>),
  Preview: EcwSystemStatusCard,
};
