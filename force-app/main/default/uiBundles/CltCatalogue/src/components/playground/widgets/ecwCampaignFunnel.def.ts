import type { WidgetDef } from './types';
import { EcwCampaignFunnelCard, CAMPAIGN_FUNNEL_TEST } from '@/employee/cards/EcwCampaignFunnelCard';
import { structureFromPayload } from '@/employee/cardData';

/** EcwCampaignFunnelCard — Marketing · Campaign conversion. */
export const ecwCampaignFunnelDef: WidgetDef = {
  kind: 'ecwCampaignFunnelJSON',
  dtoField: 'ecwCampaignFunnelJSON',
  label: 'Agentforce Coworker · Marketing · Campaign conversion',
  defaults: CAMPAIGN_FUNNEL_TEST,
  structure: structureFromPayload(CAMPAIGN_FUNNEL_TEST as unknown as Record<string, unknown>),
  Preview: EcwCampaignFunnelCard,
};
