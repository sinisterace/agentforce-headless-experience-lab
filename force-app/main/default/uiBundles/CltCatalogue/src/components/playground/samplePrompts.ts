/**
 * Representative customer utterances per service CLT — shown as the user's "ask"
 * in the playground conversation with a tap-to-copy button, so you can paste one
 * into the real agent to trigger the matching card. Keyed by the widget `kind`.
 * Mirrors the team track's per-function `ask`.
 */
const ASKS: Record<string, string> = {
  // Automotive
  autoConfiguratorJSON: 'I want to build and price a new SUV.',
  autoTestDriveJSON: 'Can I schedule a test drive this weekend?',
  autoTradeInJSON: "What's my current car worth as a trade-in?",
  autoVehicleStatusJSON: "Show me my vehicle's range and status.",
  // Energy & Utilities
  energyBudgetBillingJSON: 'Can you set me up on budget billing?',
  energyOutageTrackerJSON: 'Is there an outage in my area?',
  energyRebateOffersJSON: 'What energy rebates do I qualify for?',
  energyUsageCostJSON: 'Why was my energy bill so high this month?',
  // Financial Services
  finServAccountSelectorJSON: 'Show me my accounts.',
  finServAdvisorMeetingJSON: "I'd like to book a meeting with my advisor.",
  finServMoneyMovementJSON: 'Transfer $500 to my savings account.',
  finServTransactionsJSON: 'Show my recent transactions.',
  // Healthcare
  healthcareApptSchedulerJSON: 'I need to schedule an appointment.',
  healthcareCareOptionsJSON: 'What are my care options for a sore throat?',
  healthcareFindCareJSON: 'Find urgent care near me.',
  healthcareRxRefillJSON: 'Can you refill my prescription?',
  // HVAC
  hvacServicePlanJSON: 'Tell me about your service plans.',
  hvacSystemHealthJSON: 'How is my HVAC system doing?',
  hvacTechTrackerJSON: 'Where is my technician right now?',
  hvacThermostatJSON: 'Set my thermostat to 70 degrees.',
  // Insurance
  insuranceClaimStatusJSON: "What's the status of my claim?",
  insuranceFileClaimJSON: 'I need to file a claim.',
  insuranceIdCardJSON: 'Can I see my insurance ID card?',
  insurancePolicySelectorJSON: 'Show me my policies.',
  // Legal
  legalAttorneyMatchJSON: 'Match me with an attorney for my case.',
  legalCaseEvaluationJSON: 'Can you evaluate my case?',
  legalConsultSchedulerJSON: "I'd like to schedule a consultation.",
  legalPracticeAreasJSON: 'What practice areas do you cover?',
  // Manufacturing
  mfgEquipmentMonitorJSON: 'Show me the status of my equipment.',
  mfgPartReorderJSON: 'I need to reorder a part.',
  mfgQuoteBuilderJSON: 'Can you build me a quote?',
  mfgWorkOrderJSON: 'Open a work order for a repair.',
  // Public Sector
  pseAppStatusJSON: "What's the status of my application?",
  pseDocsChecklistJSON: 'What documents do I need to submit?',
  pseProgramsFinderJSON: 'What assistance programs do I qualify for?',
  pseServiceRequestJSON: "I'd like to submit a service request.",
  // Retail
  retailOrderTrackingJSON: 'Where is my order?',
  retailProductCarouselJSON: 'Can you recommend some products for me?',
  retailReturnsJSON: 'I want to return an item.',
  retailStorePickupJSON: 'Is this available for pickup near me?',
  // Telco / Media
  tmcBillExplainerJSON: 'Can you explain my bill?',
  tmcDataUsageJSON: 'How much data have I used this month?',
  tmcPlanCompareJSON: 'Compare my plan options.',
  tmcServiceStatusJSON: 'Is there a service issue in my area?',
  // Travel & Hospitality
  travelBoardingPassJSON: 'Can I get my boarding pass?',
  travelFlightStatusJSON: "What's the status of my flight?",
  travelRoomSelectorJSON: 'Help me choose a room.',
  travelSeatMapJSON: "I'd like to pick my seat.",
};

/** The sample customer ask for a CLT, with a sensible fallback from its label. */
export function sampleAsk(kind: string, label: string): string {
  if (ASKS[kind]) return ASKS[kind];
  const clean = label.replace(/^.*·\s*/, '').trim().toLowerCase();
  return clean ? `Can you help me with ${clean}?` : 'Can you help me with this?';
}
