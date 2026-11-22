import type { WidgetDef } from './types';
import { EcwAbTestCard, AB_TEST_TEST } from '@/employee/cards/EcwAbTestCard';
import { structureFromPayload } from '@/employee/cardData';

/** EcwAbTestCard — Marketing · A/B test. */
export const ecwAbTestDef: WidgetDef = {
  kind: 'ecwAbTestJSON',
  dtoField: 'ecwAbTestJSON',
  label: 'Agentforce Coworker · Marketing · A/B test',
  defaults: AB_TEST_TEST,
  structure: structureFromPayload(AB_TEST_TEST as unknown as Record<string, unknown>),
  Preview: EcwAbTestCard,
};
