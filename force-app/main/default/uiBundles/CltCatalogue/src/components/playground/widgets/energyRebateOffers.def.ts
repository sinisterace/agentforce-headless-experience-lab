import type { EnergyRebateOffersPayload } from '../payloads';
import { EnergyRebateOffersPreview } from '../EnergyRebateOffersEditor';
import type { WidgetDef } from './types';

/** asaEnergyRebateOffers — perforated voucher tiles for energy-efficiency rebates. */
export const energyRebateOffersDef: WidgetDef = {
  kind: 'energyRebateOffersJSON',
  dtoField: 'energyRebateOffersJSON',
  label: 'ASA Energy & Utilities · Rebate Offers',
  defaults: { title: 'Rebates you qualify for', offers: [] } satisfies EnergyRebateOffersPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Subtitle', control: 'Text', bind: 'subtitle', note: 'optional' },
    { label: 'Offers', control: 'List', bind: 'offers', note: 'empty → test-mode sample' },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'default "Apply for rebate"' },
  ],
  Preview: EnergyRebateOffersPreview,
};
