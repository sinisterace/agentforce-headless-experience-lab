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
import { insuranceIdCardDef } from './insuranceIdCard.def';
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
import { hvacThermostatDef } from './hvacThermostat.def';
import { hvacTechTrackerDef } from './hvacTechTracker.def';
import { hvacSystemHealthDef } from './hvacSystemHealth.def';
import { hvacServicePlanDef } from './hvacServicePlan.def';
import { autoConfiguratorDef } from './autoConfigurator.def';
import { autoTestDriveDef } from './autoTestDrive.def';
import { autoVehicleStatusDef } from './autoVehicleStatus.def';
import { autoTradeInDef } from './autoTradeIn.def';
import { pseAppStatusDef } from './pseAppStatus.def';
import { pseProgramsFinderDef } from './pseProgramsFinder.def';
import { pseServiceRequestDef } from './pseServiceRequest.def';
import { pseDocsChecklistDef } from './pseDocsChecklist.def';
import { legalPracticeAreasDef } from './legalPracticeAreas.def';
import { legalCaseEvaluationDef } from './legalCaseEvaluation.def';
import { legalAttorneyMatchDef } from './legalAttorneyMatch.def';
import { legalConsultSchedulerDef } from './legalConsultScheduler.def';
import { travelSeatMapDef } from './travelSeatMap.def';
import { travelFlightStatusDef } from './travelFlightStatus.def';
import { travelBoardingPassDef } from './travelBoardingPass.def';
import { travelRoomSelectorDef } from './travelRoomSelector.def';
import { ecwSalesPipelineDef } from './ecwSalesPipeline.def';
import { ecwNeedsAttentionDef } from './ecwNeedsAttention.def';
import { ecwForecastDef } from './ecwForecast.def';
import { ecwWhatChangedDef } from './ecwWhatChanged.def';
import { ecwCardDef } from './ecwCard.def';
import { ecwFieldDispatchDef } from './ecwFieldDispatch.def';
import { ecwEscalationDef } from './ecwEscalation.def';
import { ecwCase360Def } from './ecwCase360.def';
import { ecwCsatPulseDef } from './ecwCsatPulse.def';
import { ecwCampaignFunnelDef } from './ecwCampaignFunnel.def';
import { ecwPerformanceMatrixDef } from './ecwPerformanceMatrix.def';
import { ecwAbTestDef } from './ecwAbTest.def';
import { ecwAudienceExplorerDef } from './ecwAudienceExplorer.def';
import { ecwSystemStatusDef } from './ecwSystemStatus.def';
import { ecwKnownIssuesDef } from './ecwKnownIssues.def';
import { ecwChangeCalendarDef } from './ecwChangeCalendar.def';
import { ecwMyItRequestsDef } from './ecwMyItRequests.def';
import { ecwBudgetActualDef } from './ecwBudgetActual.def';
import { ecwApApprovalsDef } from './ecwApApprovals.def';
import { ecwArAgingDef } from './ecwArAging.def';
import { ecwMonthEndCloseDef } from './ecwMonthEndClose.def';
import { ecwHeadcountDef } from './ecwHeadcount.def';
import { ecwTimeOffDef } from './ecwTimeOff.def';
import { ecwOpenRolesDef } from './ecwOpenRoles.def';
import { ecwOnboardingDef } from './ecwOnboarding.def';

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
  insuranceIdCardJSON: insuranceIdCardDef,
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
  hvacThermostatJSON: hvacThermostatDef,
  hvacTechTrackerJSON: hvacTechTrackerDef,
  hvacSystemHealthJSON: hvacSystemHealthDef,
  hvacServicePlanJSON: hvacServicePlanDef,
  autoConfiguratorJSON: autoConfiguratorDef,
  autoTestDriveJSON: autoTestDriveDef,
  autoVehicleStatusJSON: autoVehicleStatusDef,
  autoTradeInJSON: autoTradeInDef,
  pseAppStatusJSON: pseAppStatusDef,
  pseProgramsFinderJSON: pseProgramsFinderDef,
  pseServiceRequestJSON: pseServiceRequestDef,
  pseDocsChecklistJSON: pseDocsChecklistDef,
  legalPracticeAreasJSON: legalPracticeAreasDef,
  legalCaseEvaluationJSON: legalCaseEvaluationDef,
  legalAttorneyMatchJSON: legalAttorneyMatchDef,
  legalConsultSchedulerJSON: legalConsultSchedulerDef,
  travelSeatMapJSON: travelSeatMapDef,
  travelFlightStatusJSON: travelFlightStatusDef,
  travelBoardingPassJSON: travelBoardingPassDef,
  travelRoomSelectorJSON: travelRoomSelectorDef,
  ecwSalesPipelineJSON: ecwSalesPipelineDef,
  ecwNeedsAttentionJSON: ecwNeedsAttentionDef,
  ecwForecastJSON: ecwForecastDef,
  ecwWhatChangedJSON: ecwWhatChangedDef,
  ecwFieldDispatchJSON: ecwFieldDispatchDef,
  ecwEscalationJSON: ecwEscalationDef,
  ecwCase360JSON: ecwCase360Def,
  ecwCsatPulseJSON: ecwCsatPulseDef,
  ecwCampaignFunnelJSON: ecwCampaignFunnelDef,
  ecwPerformanceMatrixJSON: ecwPerformanceMatrixDef,
  ecwAbTestJSON: ecwAbTestDef,
  ecwAudienceExplorerJSON: ecwAudienceExplorerDef,
  ecwSystemStatusJSON: ecwSystemStatusDef,
  ecwKnownIssuesJSON: ecwKnownIssuesDef,
  ecwChangeCalendarJSON: ecwChangeCalendarDef,
  ecwMyItRequestsJSON: ecwMyItRequestsDef,
  ecwBudgetActualJSON: ecwBudgetActualDef,
  ecwApApprovalsJSON: ecwApApprovalsDef,
  ecwArAgingJSON: ecwArAgingDef,
  ecwMonthEndCloseJSON: ecwMonthEndCloseDef,
  ecwHeadcountJSON: ecwHeadcountDef,
  ecwTimeOffJSON: ecwTimeOffDef,
  ecwOpenRolesJSON: ecwOpenRolesDef,
  ecwOnboardingJSON: ecwOnboardingDef,
  ecwCardJSON: ecwCardDef,
};

/** Resolve a catalogue row's DTO field to its WidgetDef (Account Selector default). */
export function resolveWidget(rec: Recommendation): WidgetDef {
  const field = rec.dtoFieldName as CltKind;
  return WIDGET_REGISTRY[field] ?? WIDGET_REGISTRY.finServAccountSelectorJSON;
}
