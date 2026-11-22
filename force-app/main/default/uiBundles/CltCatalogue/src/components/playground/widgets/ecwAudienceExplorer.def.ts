import type { WidgetDef } from './types';
import { EcwAudienceExplorerCard, AUDIENCE_EXPLORER_TEST } from '@/employee/cards/EcwAudienceExplorerCard';
import { structureFromPayload } from '@/employee/cardData';

/** EcwAudienceExplorerCard — Marketing · Audience builder. */
export const ecwAudienceExplorerDef: WidgetDef = {
  kind: 'ecwAudienceExplorerJSON',
  dtoField: 'ecwAudienceExplorerJSON',
  label: 'Agentforce Coworker · Marketing · Audience builder',
  defaults: AUDIENCE_EXPLORER_TEST,
  structure: structureFromPayload(AUDIENCE_EXPLORER_TEST as unknown as Record<string, unknown>),
  Preview: EcwAudienceExplorerCard,
};
