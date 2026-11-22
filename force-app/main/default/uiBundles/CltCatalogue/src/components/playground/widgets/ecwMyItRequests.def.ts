import type { WidgetDef } from './types';
import { EcwMyItRequestsCard, MY_IT_REQUESTS_TEST } from '@/employee/cards/EcwMyItRequestsCard';
import { structureFromPayload } from '@/employee/cardData';

/** EcwMyItRequestsCard — IT · My IT requests. */
export const ecwMyItRequestsDef: WidgetDef = {
  kind: 'ecwMyItRequestsJSON',
  dtoField: 'ecwMyItRequestsJSON',
  label: 'Agentforce Coworker · IT · My IT requests',
  defaults: MY_IT_REQUESTS_TEST,
  structure: structureFromPayload(MY_IT_REQUESTS_TEST as unknown as Record<string, unknown>),
  Preview: EcwMyItRequestsCard,
};
