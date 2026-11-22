import type { WidgetDef } from './types';
import { EcwWhatChangedCard, WHAT_CHANGED_TEST } from '@/employee/cards/EcwWhatChangedCard';
import { structureFromPayload } from '@/employee/cardData';

/** ecwWhatChanged — Sales · recent deal motion (changelog). */
export const ecwWhatChangedDef: WidgetDef = {
  kind: 'ecwWhatChangedJSON',
  dtoField: 'ecwWhatChangedJSON',
  label: 'Agentforce Coworker · Sales · What changed',
  defaults: WHAT_CHANGED_TEST,
  structure: structureFromPayload(WHAT_CHANGED_TEST as unknown as Record<string, unknown>),
  Preview: EcwWhatChangedCard,
};
