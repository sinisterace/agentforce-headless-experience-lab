import type { WidgetDef } from './types';
import { EcwTimeOffCard, TIME_OFF_TEST } from '@/employee/cards/EcwTimeOffCard';
import { structureFromPayload } from '@/employee/cardData';

/** EcwTimeOffCard — HR · Who's out. */
export const ecwTimeOffDef: WidgetDef = {
  kind: 'ecwTimeOffJSON',
  dtoField: 'ecwTimeOffJSON',
  label: 'Agentforce Coworker · HR · Who\'s out',
  defaults: TIME_OFF_TEST,
  structure: structureFromPayload(TIME_OFF_TEST as unknown as Record<string, unknown>),
  Preview: EcwTimeOffCard,
};
