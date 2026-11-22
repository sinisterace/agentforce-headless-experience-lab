import type { WidgetDef } from './types';
import { EcwNeedsAttentionCard, NEEDS_ATTENTION_TEST } from '@/employee/cards/EcwNeedsAttentionCard';
import { structureFromPayload } from '@/employee/cardData';

/** ecwNeedsAttention — Service/Sales · deals that need attention (list). */
export const ecwNeedsAttentionDef: WidgetDef = {
  kind: 'ecwNeedsAttentionJSON',
  dtoField: 'ecwNeedsAttentionJSON',
  label: 'Agentforce Coworker · Sales · Needs attention',
  defaults: NEEDS_ATTENTION_TEST,
  structure: structureFromPayload(NEEDS_ATTENTION_TEST as unknown as Record<string, unknown>),
  Preview: EcwNeedsAttentionCard,
};
