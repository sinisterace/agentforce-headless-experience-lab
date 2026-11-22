import type { WidgetDef } from './types';
import { EcwEscalationCard, ESCALATION_TEST } from '@/employee/cards/EcwEscalationCard';
import { structureFromPayload } from '@/employee/cardData';

/** EcwEscalationCard — Service · Escalate case. */
export const ecwEscalationDef: WidgetDef = {
  kind: 'ecwEscalationJSON',
  dtoField: 'ecwEscalationJSON',
  label: 'Agentforce Coworker · Service · Escalate case',
  defaults: ESCALATION_TEST,
  structure: structureFromPayload(ESCALATION_TEST as unknown as Record<string, unknown>),
  Preview: EcwEscalationCard,
};
