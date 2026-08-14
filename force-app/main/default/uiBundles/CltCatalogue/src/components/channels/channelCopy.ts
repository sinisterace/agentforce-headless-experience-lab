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
    default: // finServAccountSelectorJSON
      return 'Pulling up your accounts';
  }
}
