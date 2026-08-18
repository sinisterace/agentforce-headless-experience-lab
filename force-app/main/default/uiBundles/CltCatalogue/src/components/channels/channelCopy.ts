import type { Recommendation } from '@/types/catalog';

/**
 * Per-CLT conversation copy shared by every channel frame (ChatGPT, Claude, …).
 * Keeping it here means the starter prompts, the assistant lead-in, and the
 * tool-invocation status label stay identical across chromes — only the
 * surrounding client UI changes, never the words the CLT is introduced with.
 */

/** Four starter prompts the user can click to invoke the connector. */
export function startersFor(rec: Recommendation): string[] {
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
    default: // finServAccountSelectorJSON
      return 'Pulling up your accounts';
  }
}
