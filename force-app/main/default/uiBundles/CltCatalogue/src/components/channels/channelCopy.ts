import type { Recommendation } from '@/types/catalog';

/**
 * Per-CLT conversation copy shared by every channel frame (ChatGPT, Claude, …).
 * Keeping it here means the starter prompts, the assistant lead-in, and the
 * tool-invocation status label stay identical across chromes — only the
 * surrounding client UI changes, never the words the CLT is introduced with.
 */

/** Four starter prompts the user can click to invoke the connector. */
export function startersFor(rec: Recommendation): string[] {
  // Recommendations that carry their own prompts (the team/Coworker track, keyed
  // to the selected function) win over the dtoFieldName lookup below.
  if (rec.prompts && rec.prompts.length) return rec.prompts;
  switch (rec.dtoFieldName) {
    case 'finServMoneyMovementJSON':
      return [
        'I want to send money',
        'Pay my credit card',
        'Transfer to my savings',
        'Send $100 to Alex',
      ];
    case 'finServAdvisorMeetingJSON':
      return [
        'I want to meet with my advisor',
        'Book me an appointment',
        'When is my advisor free this week?',
        'Schedule a call about my retirement plan',
      ];
    case 'finServTransactionsJSON':
      return [
        'Show me my recent transactions',
        'I want to dispute a charge',
        "There's a payment I don't recognize",
        'What did I spend at the weekend?',
      ];
    case 'insurancePolicySelectorJSON':
      return [
        'Show me my policies',
        'Which policies do I have with you?',
        'I need to review my coverage',
        'What am I paying for insurance?',
      ];
    case 'insuranceFileClaimJSON':
      return [
        'I need to file a claim',
        'I was in a car accident',
        'There was storm damage to my house',
        'Someone broke into my car',
      ];
    case 'insuranceClaimStatusJSON':
      return [
        'Where is my claim?',
        'What is the status of my claim?',
        'Was my claim approved?',
        'When will I get paid for my claim?',
      ];
    case 'tmcPlanCompareJSON':
      return [
        'Show me your plans',
        'I want to upgrade my plan',
        'Which plan is right for me?',
        'Can I get more data?',
      ];
    case 'tmcDataUsageJSON':
      return [
        'How much data have I used?',
        "What's left on my plan this month?",
        'Am I close to my data limit?',
        'Show me my usage',
      ];
    case 'tmcServiceStatusJSON':
      return [
        'Is my internet down?',
        "Why isn't my TV working?",
        'Is there an outage in my area?',
        "When will service be back?",
      ];
    case 'tmcBillExplainerJSON':
      return [
        'Why is my bill higher this month?',
        'Explain my bill',
        'What am I being charged for?',
        'How much do I owe?',
      ];
    case 'mfgEquipmentMonitorJSON':
      return [
        'How is my machine running?',
        'Show me the status of LINE-3',
        'Is the assembly cell in a fault?',
        "What's the OEE on my line?",
      ];
    case 'mfgPartReorderJSON':
      return [
        'I need to reorder a part',
        'Order more I/O controllers',
        'Is this part in stock?',
        'Reorder SKU IOC-4820',
      ];
    case 'mfgWorkOrderJSON':
      return [
        "Where is my work order?",
        'What is the status of WO-4821?',
        'When will my build ship?',
        'Is my order in QC yet?',
      ];
    case 'mfgQuoteBuilderJSON':
      return [
        'I need a quote',
        'Configure a TB-9000 cell',
        'Price this with stainless frame',
        'How much for the advanced controls?',
      ];
    case 'energyOutageTrackerJSON':
      return [
        'Is my power out?',
        'Is there an outage in my area?',
        'When will my power be back?',
        'Report a power outage',
      ];
    case 'energyUsageCostJSON':
      return [
        'How much energy have I used?',
        "What's my projected bill?",
        'Why is my usage higher?',
        'Show me my energy usage',
      ];
    case 'energyBudgetBillingJSON':
      return [
        'Can I even out my monthly bills?',
        'Tell me about Budget Billing',
        'My bills swing too much',
        'How do I get a flat monthly payment?',
      ];
    case 'energyRebateOffersJSON':
      return [
        'What rebates do I qualify for?',
        'Are there energy-efficiency incentives?',
        'Rebate for a smart thermostat',
        'How can I save on upgrades?',
      ];
    case 'hvacThermostatJSON':
      return [
        'Set my thermostat',
        "What's the temperature at home?",
        'Turn on the AC',
        'Adjust my thermostat',
      ];
    case 'hvacTechTrackerJSON':
      return [
        'Where is my technician?',
        'When will the technician arrive?',
        'Track my service visit',
        'Is my tech on the way?',
      ];
    case 'hvacSystemHealthJSON':
      return [
        'How is my HVAC system doing?',
        'Check my system health',
        'Is my air filter due?',
        'When is my next maintenance?',
      ];
    case 'hvacServicePlanJSON':
      return [
        'What maintenance plans do you offer?',
        'Compare comfort plans',
        'Tell me about your membership',
        'How do I enroll in a service plan?',
      ];
    case 'autoConfiguratorJSON':
      return [
        'Help me build my car',
        'Configure an electric SUV',
        'What packages are available?',
        'Price out a build',
      ];
    case 'autoTestDriveJSON':
      return [
        'Book a test drive',
        'Can I test drive the EV this weekend?',
        'Schedule a test drive at the dealership',
        'I want to try the car',
      ];
    case 'autoVehicleStatusJSON':
      return [
        'How is my vehicle doing?',
        'Check my tire pressure',
        "What's my range?",
        'Show my car status',
      ];
    case 'autoTradeInJSON':
      return [
        "What's my car worth?",
        'Estimate my trade-in',
        'Trade in my vehicle',
        'How much for my trade-in?',
      ];
    case 'pseAppStatusJSON':
      return [
        'Check my application status',
        'Where is my permit?',
        "What's the status of my application?",
        'Track my case',
      ];
    case 'pseProgramsFinderJSON':
      return [
        'What programs do I qualify for?',
        'Find benefits & assistance',
        'Are there grants or scholarships?',
        'What help is available?',
      ];
    case 'pseServiceRequestJSON':
      return [
        'Report a pothole',
        'Report a problem',
        'A streetlight is out',
        'File a service request',
      ];
    case 'pseDocsChecklistJSON':
      return [
        'What documents do I need?',
        'Show my required documents',
        'What do I need to apply?',
        'Document checklist',
      ];
    case 'retailProductCarouselJSON':
      return [
        "Show me what's popular",
        'What do you recommend?',
        'Help me find a gift',
        "What's on sale right now?",
      ];
    case 'retailOrderTrackingJSON':
      return [
        'Where is my order?',
        'Track my delivery',
        'When will my order arrive?',
        "What's the status of order #4821?",
      ];
    case 'retailReturnsJSON':
      return [
        'I want to return something',
        'Start a return',
        "This didn't fit — can I exchange it?",
        'How do I send an item back?',
      ];
    case 'retailStorePickupJSON':
      return [
        'Is this in stock near me?',
        'Can I pick this up in store?',
        'Which store has this?',
        'Set up store pickup',
      ];
    case 'healthcareApptSchedulerJSON':
      return [
        'I need to book an appointment',
        'Schedule a visit with my doctor',
        'When is the next available appointment?',
        'Book a checkup',
      ];
    case 'healthcareFindCareJSON':
      return [
        'Find a doctor near me',
        'I need to see a specialist',
        "Where's the nearest clinic?",
        'Help me find care',
      ];
    case 'healthcareCareOptionsJSON':
      return [
        'What are my care options?',
        'Should I go to urgent care or the ER?',
        'Can I see someone virtually?',
        "I'm not feeling well — where should I go?",
      ];
    case 'healthcareRxRefillJSON':
      return [
        'Refill my prescription',
        'I need more of my medication',
        'Is my refill ready?',
        'Renew my prescription',
      ];
    case 'insuranceIdCardJSON':
      return [
        'Show my insurance card',
        'I need proof of insurance',
        'Pull up my ID card',
        'Email me my insurance card',
      ];
    case 'legalPracticeAreasJSON':
      return [
        'What kind of cases do you handle?',
        'I have a legal question',
        'Which practice area do I need?',
        'Can you help with my situation?',
      ];
    case 'legalCaseEvaluationJSON':
      return [
        'Do I have a case?',
        'Can you evaluate my case?',
        'I was injured — what are my options?',
        'Is my claim worth pursuing?',
      ];
    case 'legalAttorneyMatchJSON':
      return [
        'Match me with an attorney',
        'Who would handle my case?',
        'I want to meet a lawyer',
        'Find me the right attorney',
      ];
    case 'legalConsultSchedulerJSON':
      return [
        'Schedule a consultation',
        'Book a free consultation',
        'When can I speak with an attorney?',
        'Set up a call with a lawyer',
      ];
    case 'travelSeatMapJSON':
      return [
        'I want to choose my seat',
        'Show me the seat map',
        'Can I get a window seat?',
        'Change my seat',
      ];
    case 'travelFlightStatusJSON':
      return [
        'Is my flight on time?',
        "What's the status of my flight?",
        'Has my gate changed?',
        'Track my flight',
      ];
    case 'travelBoardingPassJSON':
      return [
        'Show my boarding pass',
        'Pull up my boarding pass',
        'I need to check in',
        'Add my boarding pass to my wallet',
      ];
    case 'travelRoomSelectorJSON':
      return [
        'Help me pick a room',
        'Show me available rooms',
        'I want a room with a view',
        'Which room should I book?',
      ];
    case 'ecwSalesPipelineJSON':
      return [
        'Show me my pipeline this quarter',
        "How's my pipeline looking?",
        'What is closing this month?',
        'What is my win rate this quarter?',
      ];
    case 'ecwCardJSON':
      return [
        'Help me with this',
        'Show me the details',
        'What do I need to do here?',
        'Walk me through it',
      ];
    default: // finServAccountSelectorJSON
      return [
        'Which of my accounts can you see?',
        "What's my checking balance?",
        'Help me choose an account to pay from',
        'Show me my accounts',
      ];
  }
}

/** The assistant's lead-in before the card renders. */
export function leadFor(rec: Recommendation, company: string): string {
  switch (rec.dtoFieldName) {
    case 'finServMoneyMovementJSON':
      return `Sure — let's move some money with ${company}. Who would you like to send to, and how much?`;
    case 'finServAdvisorMeetingJSON':
      return `Let's get you on your ${company} advisor's calendar. Pick a time that works for you:`;
    case 'finServTransactionsJSON':
      return `Here are your recent transactions with ${company}. Tap the one you'd like to dispute:`;
    case 'insurancePolicySelectorJSON':
      return `Here are your ${company} policies. Which one can I help you with?`;
    case 'insuranceFileClaimJSON':
      return `I'm sorry that happened — let's get a ${company} claim started. What kind of incident was it?`;
    case 'insuranceClaimStatusJSON':
      return `Here's where your ${company} claims stand. Tap one for more detail:`;
    case 'tmcPlanCompareJSON':
      return `Here are the ${company} plans available to you. Compare them and pick the one you'd like:`;
    case 'tmcDataUsageJSON':
      return `Here's your ${company} usage for this billing cycle:`;
    case 'tmcServiceStatusJSON':
      return `Let me check ${company} service in your area — here's the current status:`;
    case 'tmcBillExplainerJSON':
      return `Here's a breakdown of your latest ${company} bill:`;
    case 'mfgEquipmentMonitorJSON':
      return `Here's the live status of your ${company} equipment:`;
    case 'mfgPartReorderJSON':
      return `Here's the ${company} part — set a quantity and I'll queue the reorder:`;
    case 'mfgWorkOrderJSON':
      return `Here's where your ${company} work order stands:`;
    case 'mfgQuoteBuilderJSON':
      return `Let's configure your ${company} quote — pick your options and I'll estimate the price:`;
    case 'energyOutageTrackerJSON':
      return `Let me check ${company} outages in your area — here's the current status:`;
    case 'energyUsageCostJSON':
      return `Here's your ${company} energy usage and projected bill this cycle:`;
    case 'energyBudgetBillingJSON':
      return `Here's how ${company} Budget Billing would smooth out your monthly payment:`;
    case 'energyRebateOffersJSON':
      return `Here are the ${company} rebates you qualify for — tap one to apply:`;
    case 'hvacThermostatJSON':
      return `Here's your ${company} thermostat — set the temperature and mode you'd like:`;
    case 'hvacTechTrackerJSON':
      return `Here's where your ${company} technician is right now:`;
    case 'hvacSystemHealthJSON':
      return `Here's the latest ${company} checkup on your comfort system:`;
    case 'hvacServicePlanJSON':
      return `Here are the ${company} maintenance plans — compare them and pick one to enroll:`;
    case 'autoConfiguratorJSON':
      return `Let's build your ${company} vehicle — pick your color and options and I'll price it out:`;
    case 'autoTestDriveJSON':
      return `Let's get you behind the wheel at ${company}. Pick a day and time for your test drive:`;
    case 'autoVehicleStatusJSON':
      return `Here's the latest status from your ${company} vehicle:`;
    case 'autoTradeInJSON':
      return `Here's your ${company} trade-in estimate:`;
    case 'pseAppStatusJSON':
      return `Here's the latest status of your ${company} application:`;
    case 'pseProgramsFinderJSON':
      return `Here are ${company} programs and benefits you may qualify for — tap one to apply:`;
    case 'pseServiceRequestJSON':
      return `Let's get that reported to ${company}. What would you like to report?`;
    case 'pseDocsChecklistJSON':
      return `Here's what you'll need for your ${company} application — select the documents to upload:`;
    case 'retailProductCarouselJSON':
      return `Here are a few ${company} picks I think you'll like — tap to add any to your cart:`;
    case 'retailOrderTrackingJSON':
      return `Here's where your ${company} order is right now:`;
    case 'retailReturnsJSON':
      return `No problem — let's start a ${company} return. Which item would you like to send back?`;
    case 'retailStorePickupJSON':
      return `Here's ${company} store availability near you — pick a store to collect from:`;
    case 'healthcareApptSchedulerJSON':
      return `Let's get you on the schedule at ${company}. Pick a time that works for you:`;
    case 'healthcareFindCareJSON':
      return `Here's ${company} care near you — choose a location or provider:`;
    case 'healthcareCareOptionsJSON':
      return `Here are your ${company} care options — pick the one that fits how you're feeling:`;
    case 'healthcareRxRefillJSON':
      return `Let's refill your ${company} prescription. Confirm the medication below:`;
    case 'insuranceIdCardJSON':
      return `Here's your ${company} proof of insurance — email a copy or add it to your wallet:`;
    case 'legalPracticeAreasJSON':
      return `Here are the areas ${company} can help with — tap the one that fits your situation:`;
    case 'legalCaseEvaluationJSON':
      return `Let's see how ${company} can help — tell me a bit about what happened:`;
    case 'legalAttorneyMatchJSON':
      return `Here's the ${company} attorney matched to your case:`;
    case 'legalConsultSchedulerJSON':
      return `Let's get you a consultation with ${company}. Pick a time that works:`;
    case 'travelSeatMapJSON':
      return `Here's the seat map for your ${company} flight — tap an open seat to select it:`;
    case 'travelFlightStatusJSON':
      return `Here's the latest status for your ${company} flight:`;
    case 'travelBoardingPassJSON':
      return `Here's your ${company} boarding pass — ready when you are:`;
    case 'travelRoomSelectorJSON':
      return `Here are the ${company} rooms available for your stay — pick your favorite:`;
    case 'ecwSalesPipelineJSON':
      return `Here's your quarter at a glance for ${company} — open pipeline, what's closing, and win rate.`;
    case 'ecwCardJSON':
      return `Here you go — I've pulled this together for ${company}, right in the flow of work.`;
    default: // finServAccountSelectorJSON
      return `Happy to help with your ${company} accounts. Which one would you like to use?`;
  }
}

/** The connector's "invoking" status label (mirrors cltcat-mcp toolInvocation). */
export function invokingLabelFor(rec: Recommendation): string {
  switch (rec.dtoFieldName) {
    case 'finServMoneyMovementJSON':
      return 'Setting up your transfer';
    case 'finServAdvisorMeetingJSON':
      return 'Finding times with your advisor';
    case 'finServTransactionsJSON':
      return 'Pulling up your recent transactions';
    case 'insurancePolicySelectorJSON':
      return 'Pulling up your policies';
    case 'insuranceFileClaimJSON':
      return 'Opening a new claim';
    case 'insuranceClaimStatusJSON':
      return 'Checking on your claims';
    case 'tmcPlanCompareJSON':
      return 'Comparing plans for you';
    case 'tmcDataUsageJSON':
      return 'Checking your usage';
    case 'tmcServiceStatusJSON':
      return 'Checking service status in your area';
    case 'tmcBillExplainerJSON':
      return 'Breaking down your bill';
    case 'mfgEquipmentMonitorJSON':
      return 'Pulling live machine telemetry';
    case 'mfgPartReorderJSON':
      return 'Looking up the part';
    case 'mfgWorkOrderJSON':
      return 'Checking your work order';
    case 'mfgQuoteBuilderJSON':
      return 'Building your configuration';
    case 'energyOutageTrackerJSON':
      return 'Checking outages in your area';
    case 'energyUsageCostJSON':
      return 'Pulling your energy usage';
    case 'energyBudgetBillingJSON':
      return 'Building your Budget Billing plan';
    case 'energyRebateOffersJSON':
      return 'Finding rebates you qualify for';
    case 'hvacThermostatJSON':
      return 'Connecting to your thermostat';
    case 'hvacTechTrackerJSON':
      return 'Locating your technician';
    case 'hvacSystemHealthJSON':
      return 'Checking your system health';
    case 'hvacServicePlanJSON':
      return 'Pulling up maintenance plans';
    case 'autoConfiguratorJSON':
      return 'Building your configuration';
    case 'autoTestDriveJSON':
      return 'Finding test drive times';
    case 'autoVehicleStatusJSON':
      return 'Checking your vehicle';
    case 'autoTradeInJSON':
      return 'Estimating your trade-in';
    case 'pseAppStatusJSON':
      return 'Checking your application status';
    case 'pseProgramsFinderJSON':
      return 'Finding programs you qualify for';
    case 'pseServiceRequestJSON':
      return 'Starting your service request';
    case 'pseDocsChecklistJSON':
      return 'Pulling up your document checklist';
    case 'retailProductCarouselJSON':
      return 'Finding products for you';
    case 'retailOrderTrackingJSON':
      return 'Tracking your order';
    case 'retailReturnsJSON':
      return 'Starting your return';
    case 'retailStorePickupJSON':
      return 'Checking store availability';
    case 'healthcareApptSchedulerJSON':
      return 'Finding appointment times';
    case 'healthcareFindCareJSON':
      return 'Finding care near you';
    case 'healthcareCareOptionsJSON':
      return 'Pulling up your care options';
    case 'healthcareRxRefillJSON':
      return 'Processing your refill';
    case 'insuranceIdCardJSON':
      return 'Pulling up your ID card';
    case 'legalPracticeAreasJSON':
      return 'Pulling up practice areas';
    case 'legalCaseEvaluationJSON':
      return 'Reviewing your case';
    case 'legalAttorneyMatchJSON':
      return 'Matching you with an attorney';
    case 'legalConsultSchedulerJSON':
      return 'Finding consultation times';
    case 'travelSeatMapJSON':
      return 'Loading the seat map';
    case 'travelFlightStatusJSON':
      return 'Checking your flight status';
    case 'travelBoardingPassJSON':
      return 'Pulling up your boarding pass';
    case 'travelRoomSelectorJSON':
      return 'Finding available rooms';
    case 'ecwSalesPipelineJSON':
      return 'Pulling your pipeline';
    case 'ecwCardJSON':
      return 'Getting that ready';
    default: // finServAccountSelectorJSON
      return 'Pulling up your accounts';
  }
}
