import type { Recommendation } from '@/types/catalog';
import type { StructureNode } from '@/components/playground/widgets/types';
import type { EmployeeFunction } from './functions';

/**
 * Shared derivations for a Coworker function's card — the DTO payload, the
 * authored Structure tree, the Source JSON, and a synthesized catalogue
 * Recommendation. Split out of EmployeeTrack so the preview channels (which are
 * driven by a Recommendation + the widget registry) can render the same card
 * the playground shows.
 */

/** Maps a function's bespoke customCard key to the registered widget's DTO field. */
const CUSTOM_CARD_KIND: Record<string, string> = {
  salesPipeline: 'ecwSalesPipelineJSON',
  needsAttention: 'ecwNeedsAttentionJSON', forecast: 'ecwForecastJSON', whatChanged: 'ecwWhatChangedJSON',
  case360: 'ecwCase360JSON', csatPulse: 'ecwCsatPulseJSON', fieldDispatch: 'ecwFieldDispatchJSON', escalation: 'ecwEscalationJSON',
  campaignFunnel: 'ecwCampaignFunnelJSON', performanceMatrix: 'ecwPerformanceMatrixJSON', abTest: 'ecwAbTestJSON', audienceExplorer: 'ecwAudienceExplorerJSON',
  systemStatus: 'ecwSystemStatusJSON', knownIssues: 'ecwKnownIssuesJSON', changeCalendar: 'ecwChangeCalendarJSON', myItRequests: 'ecwMyItRequestsJSON',
  budgetActual: 'ecwBudgetActualJSON', apApprovals: 'ecwApApprovalsJSON', arAging: 'ecwArAgingJSON', monthEndClose: 'ecwMonthEndCloseJSON',
  headcount: 'ecwHeadcountJSON', timeOff: 'ecwTimeOffJSON', openRoles: 'ecwOpenRolesJSON', onboarding: 'ecwOnboardingJSON',
};

function ctrl(v: unknown): string { return typeof v === 'number' ? 'Number' : (typeof v === 'boolean' ? 'Boolean' : 'Text'); }

/** Generic Structure tree from any bespoke payload (keys → nodes; arrays → children). */
export function structureFromPayload(p: Record<string, unknown>): StructureNode[] {
  const nodes: StructureNode[] = [];
  for (const [k, v] of Object.entries(p || {})) {
    if (Array.isArray(v)) {
      const first = v.find((x) => x && typeof x === 'object') as Record<string, unknown> | undefined;
      nodes.push({
        label: k, control: 'List', bind: `${k}[]`,
        children: first ? Object.keys(first).map((ck) => ({ label: ck, control: ctrl(first[ck]), bind: `${k}[].${ck}` })) : undefined,
      });
    } else {
      nodes.push({ label: k, control: ctrl(v), bind: k });
    }
  }
  return nodes;
}

/** Which registered widget renders this function's card. */
export function dtoKindForFunction(fn: EmployeeFunction): string {
  if (fn.customCard && CUSTOM_CARD_KIND[fn.customCard]) return CUSTOM_CARD_KIND[fn.customCard];
  return 'ecwCardJSON';
}

/**
 * Suggested asks per Coworker function — the team-track analogue of the
 * service side's `suggestedPromptsFor`, so the preview chips match the selected
 * department function (Sales / IT / HR …) instead of a generic default. Keyed
 * by the function's stable `key`; anything unlisted falls back to its own `ask`.
 */
// Starter prompts shown in the Coworker preview + Builder guide. Kept deliberately
// simple and keyword-forward so Agentforce Coworker routes to the right Employee
// Agent CLT reliably — each leads with a plain "Show me my X" that carries the
// routing keyword, with a few natural variants. Not robotic ("render this card").
const FUNCTION_PROMPTS: Record<string, string[]> = {
  'sales-pipeline': ['Show me my sales pipeline', "How's my pipeline this quarter?", "What's in my pipeline?", 'Show my open pipeline'],
  'sales-forecast': ['Show me my sales forecast', "What's my forecast this quarter?", 'Show my commit vs best case', 'How is my forecast tracking?'],
  'sales-needs-attention': ['Which deals need my attention?', 'Show my deals at risk', "What's slipping in my pipeline?", 'Which deals need follow-up?'],
  'sales-what-changed': ['What changed in my pipeline this week?', 'Show what changed on my deals', 'What moved in my deals?', 'Any new or lost deals?'],
  'svc-field-dispatch': ['Reassign the at-risk appointment', 'Who can cover this service job?', 'Find a technician to reassign this job', 'Show nearby technicians to dispatch'],
  'svc-escalation': ['Escalate this case', 'Escalate the SSO outage to Tier 2', 'Raise this case to Tier 2', 'Report an escalation'],
  'svc-case-360': ['Prep me for my case', 'Show me the case 360', 'Pull up the case details', 'Give me context on the PixelArc case'],
  'svc-csat': ['Show me my CSAT', "What's my CSAT this month?", 'How is my customer satisfaction?', 'Show my CSAT pulse'],
  'it-system-status': ['Show me system status', 'Are all systems up?', 'Is anything down right now?', 'Show the status board'],
  'it-known-issues': ['Show me known issues', "What's broken right now?", 'Any active incidents?', "What's affecting me right now?"],
  'it-change-calendar': ['Show me the change calendar', 'What changes are scheduled this week?', 'Any upcoming maintenance?', "What's deploying soon?"],
  'it-my-requests': ['Show me my IT requests', "What's the status of my tickets?", 'Any updates on my IT requests?', 'Show my open IT tickets'],
  'fin-budget-actual': ['Show me budget vs actual', 'How are we tracking against budget?', 'Which departments are over budget?', 'Show spend against budget'],
  'fin-ap-approvals': ['Show me AP approvals', "What's awaiting AP approval?", 'Which invoices need sign-off?', 'Show the AP approval queue'],
  'fin-ar-aging': ['Show me AR aging', "What's our DSO?", 'Which accounts are overdue?', 'Show outstanding receivables'],
  'fin-month-end-close': ['Show me the month-end close', "How's the close going?", "What's blocking the close?", 'Show the close checklist'],
  'hr-onboarding': ['Help me onboard a new hire', 'Show me onboarding', "Who's in onboarding?", 'Show new-hire onboarding status'],
  'hr-headcount': ['Show me headcount', "What's our headcount?", 'Headcount by department', 'Show company headcount'],
  'hr-time-off': ["Show me who's out", "Who's out this week?", "Who's on PTO?", 'Show the time-off calendar'],
  'hr-open-roles': ['Show me open roles', 'What roles are we hiring for?', 'Show open requisitions', 'How many roles are open?'],
  'mkt-campaign-funnel': ['Show me campaign performance', 'How is the campaign converting?', 'Show the campaign funnel', 'Where are leads dropping off?'],
  'mkt-performance-matrix': ['Show me content performance', 'What should we scale or cut?', 'Show the performance matrix', 'Which content is working?'],
  'mkt-ab-test': ['Show me the A/B test results', 'Which variant won?', 'Show the A/B test', "What's the test lift?"],
  'mkt-audience-explorer': ['Show me the audience builder', 'How big is my audience?', 'Build an audience segment', 'Size my segment'],
};

/** Suggested asks for a Coworker function; falls back to the function's own ask. */
export function promptsForFunction(fn: EmployeeFunction): string[] {
  return FUNCTION_PROMPTS[fn.key] ?? [fn.ask];
}

/** The DTO payload the deployed LWC reads — bespoke cards expose their real
 *  payload; generic cards assemble a representative one from their fields. */
export function payloadForFunction(fn: EmployeeFunction): Record<string, unknown> {
  if (fn.customCard === 'salesPipeline' && fn.pipeline) return fn.pipeline as unknown as Record<string, unknown>;
  if (fn.customCard && fn.cardPayload) return fn.cardPayload as Record<string, unknown>;
  return {
    title: fn.label,
    ...(fn.stat ? { stat: fn.stat } : {}),
    ...(fn.fields.length ? { fields: fn.fields } : {}),
    ...(fn.inputs.length ? { inputs: fn.inputs } : {}),
    action: fn.action,
    ...(fn.secondaryAction ? { secondaryAction: fn.secondaryAction } : {}),
  };
}

export function sourceForFunction(fn: EmployeeFunction): string {
  return JSON.stringify(payloadForFunction(fn), null, 2);
}

/** The authored structure tree shown in the Structure inspector. */
export function structureForFunction(fn: EmployeeFunction): StructureNode[] {
  if (fn.customCard === 'salesPipeline') {
    return [
      { label: 'Title', control: 'Text', bind: 'title' },
      { label: 'Period', control: 'Text', bind: 'periodLabel' },
      { label: 'Open pipeline', control: 'Currency', bind: 'openTotal' },
      { label: 'Trend', control: 'Percent', bind: 'deltaPct' },
      {
        label: 'Stages', control: 'Segmented bar', bind: 'stages[]',
        children: [
          { label: 'Stage', control: 'Text', bind: 'stages[].label' },
          { label: 'Amount', control: 'Currency', bind: 'stages[].amount' },
        ],
      },
      {
        label: 'Stats', control: 'Stat tiles', bind: 'stats[]',
        children: [
          { label: 'Label', control: 'Text', bind: 'stats[].label' },
          { label: 'Value', control: 'Text', bind: 'stats[].value' },
        ],
      },
      { label: 'Action', control: 'Button', bind: 'submitText' },
    ];
  }
  if (fn.customCard) return structureFromPayload(payloadForFunction(fn));
  const nodes: StructureNode[] = [{ label: 'Title', control: 'Text', bind: 'title' }];
  if (fn.stat) nodes.push({ label: fn.stat.label, control: 'Highlighted stat', bind: 'stat' });
  if (fn.fields.length) {
    nodes.push({
      label: 'Fields', control: 'Record rows', bind: 'fields[]',
      children: [
        { label: 'Label', control: 'Text', bind: 'fields[].label' },
        { label: 'Value', control: 'Text', bind: 'fields[].value' },
      ],
    });
  }
  if (fn.inputs.length) {
    nodes.push({
      label: 'Inputs', control: 'Form', bind: 'inputs[]',
      children: [
        { label: 'Label', control: 'Text', bind: 'inputs[].label' },
        { label: 'Control', control: 'select · text · date', bind: 'inputs[].kind' },
      ],
    });
  }
  nodes.push({ label: 'Primary action', control: 'Button', bind: 'action' });
  if (fn.secondaryAction) nodes.push({ label: 'Secondary action', control: 'Button', bind: 'secondaryAction' });
  return nodes;
}

/**
 * Synthesize the catalogue Recommendation the service preview components
 * (BuildingScreen, PreviewScreen, ChannelViewer, the client frames) expect, so
 * the Coworker card renders across every surface without a backend row.
 */
export function employeeRecommendation(fn: EmployeeFunction): Recommendation {
  return {
    cltApiName: fn.cltApiName,
    industryKey: 'coworker',
    capabilityKey: fn.key,
    label: fn.label,
    description: fn.blurb,
    displayOrder: 0,
    defaultPayloadJson: JSON.stringify(payloadForFunction(fn)),
    dtoFieldName: dtoKindForFunction(fn),
    prompts: promptsForFunction(fn),
  };
}
