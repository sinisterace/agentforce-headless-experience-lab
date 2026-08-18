import type { Recommendation } from '@/types/catalog';
import type { CltKind } from '../payloads';
import type { WidgetDef } from './types';
import { finServAccountSelectorDef } from './finServAccountSelector.def';
import { finServTransactionsDef } from './finServTransactions.def';
import { finServAdvisorMeetingDef } from './finServAdvisorMeeting.def';
import { finServMoneyMovementDef } from './finServMoneyMovement.def';
import { insurancePolicySelectorDef } from './insurancePolicySelector.def';
import { insuranceFileClaimDef } from './insuranceFileClaim.def';
import { insuranceClaimStatusDef } from './insuranceClaimStatus.def';
import { healthcareApptSchedulerDef } from './healthcareApptScheduler.def';
import { healthcareFindCareDef } from './healthcareFindCare.def';
import { healthcareCareOptionsDef } from './healthcareCareOptions.def';
import { healthcareRxRefillDef } from './healthcareRxRefill.def';
import { retailProductCarouselDef } from './retailProductCarousel.def';
import { retailOrderTrackingDef } from './retailOrderTracking.def';
import { retailReturnsDef } from './retailReturns.def';
import { retailStorePickupDef } from './retailStorePickup.def';
import { tmcPlanCompareDef } from './tmcPlanCompare.def';
import { tmcDataUsageDef } from './tmcDataUsage.def';
import { tmcServiceStatusDef } from './tmcServiceStatus.def';
import { tmcBillExplainerDef } from './tmcBillExplainer.def';
import { mfgEquipmentMonitorDef } from './mfgEquipmentMonitor.def';
import { mfgPartReorderDef } from './mfgPartReorder.def';
import { mfgWorkOrderDef } from './mfgWorkOrder.def';
import { mfgQuoteBuilderDef } from './mfgQuoteBuilder.def';
import { energyOutageTrackerDef } from './energyOutageTracker.def';
import { energyUsageCostDef } from './energyUsageCost.def';
import { energyBudgetBillingDef } from './energyBudgetBilling.def';
import { energyRebateOffersDef } from './energyRebateOffers.def';

/**
 * The one place the playground learns about CLTs. Adding a CLT means adding a
 * *.def.ts file and one entry here — CltPlayground never changes.
 */
export const WIDGET_REGISTRY: Record<CltKind, WidgetDef> = {
  finServAccountSelectorJSON: finServAccountSelectorDef,
  finServTransactionsJSON: finServTransactionsDef,
  finServAdvisorMeetingJSON: finServAdvisorMeetingDef,
  finServMoneyMovementJSON: finServMoneyMovementDef,
  insurancePolicySelectorJSON: insurancePolicySelectorDef,
  insuranceFileClaimJSON: insuranceFileClaimDef,
  insuranceClaimStatusJSON: insuranceClaimStatusDef,
  healthcareApptSchedulerJSON: healthcareApptSchedulerDef,
  healthcareFindCareJSON: healthcareFindCareDef,
  healthcareCareOptionsJSON: healthcareCareOptionsDef,
  healthcareRxRefillJSON: healthcareRxRefillDef,
  retailProductCarouselJSON: retailProductCarouselDef,
  retailOrderTrackingJSON: retailOrderTrackingDef,
  retailReturnsJSON: retailReturnsDef,
  retailStorePickupJSON: retailStorePickupDef,
  tmcPlanCompareJSON: tmcPlanCompareDef,
  tmcDataUsageJSON: tmcDataUsageDef,
  tmcServiceStatusJSON: tmcServiceStatusDef,
  tmcBillExplainerJSON: tmcBillExplainerDef,
  mfgEquipmentMonitorJSON: mfgEquipmentMonitorDef,
  mfgPartReorderJSON: mfgPartReorderDef,
  mfgWorkOrderJSON: mfgWorkOrderDef,
  mfgQuoteBuilderJSON: mfgQuoteBuilderDef,
  energyOutageTrackerJSON: energyOutageTrackerDef,
  energyUsageCostJSON: energyUsageCostDef,
  energyBudgetBillingJSON: energyBudgetBillingDef,
  energyRebateOffersJSON: energyRebateOffersDef,
};

/** Resolve a catalogue row's DTO field to its WidgetDef (Account Selector default). */
export function resolveWidget(rec: Recommendation): WidgetDef {
  const field = rec.dtoFieldName as CltKind;
  return WIDGET_REGISTRY[field] ?? WIDGET_REGISTRY.finServAccountSelectorJSON;
}
