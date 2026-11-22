import type { WidgetDef } from './types';
import { EcwCsatPulseCard, CSAT_PULSE_TEST } from '@/employee/cards/EcwCsatPulseCard';
import { structureFromPayload } from '@/employee/cardData';

/** EcwCsatPulseCard — Service · CSAT pulse. */
export const ecwCsatPulseDef: WidgetDef = {
  kind: 'ecwCsatPulseJSON',
  dtoField: 'ecwCsatPulseJSON',
  label: 'Agentforce Coworker · Service · CSAT pulse',
  defaults: CSAT_PULSE_TEST,
  structure: structureFromPayload(CSAT_PULSE_TEST as unknown as Record<string, unknown>),
  Preview: EcwCsatPulseCard,
};
