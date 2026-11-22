import {
  Activity,
  AlertTriangle,
  BarChart3,
  Briefcase,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  FileCheck2,
  Headset,
  MapPin,
  Megaphone,
  Receipt,
  ServerCog,
  Ticket,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Filter,
  FlaskConical,
  LayoutGrid,
  Target,
  FileSearch,
  Gauge,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { EmployeeFunction } from './functions';
import { PIPELINE_TEST } from './ecwFormat';
import { NEEDS_ATTENTION_TEST } from './cards/EcwNeedsAttentionCard';
import { FORECAST_TEST } from './cards/EcwForecastCard';
import { WHAT_CHANGED_TEST } from './cards/EcwWhatChangedCard';
import { SYSTEM_STATUS_TEST } from './cards/EcwSystemStatusCard';
import { KNOWN_ISSUES_TEST } from './cards/EcwKnownIssuesCard';
import { CHANGE_CALENDAR_TEST } from './cards/EcwChangeCalendarCard';
import { MY_IT_REQUESTS_TEST } from './cards/EcwMyItRequestsCard';
import { BUDGET_ACTUAL_TEST } from './cards/EcwBudgetActualCard';
import { AP_APPROVALS_TEST } from './cards/EcwApApprovalsCard';
import { AR_AGING_TEST } from './cards/EcwArAgingCard';
import { MONTH_END_CLOSE_TEST } from './cards/EcwMonthEndCloseCard';
import { HEADCOUNT_TEST } from './cards/EcwHeadcountCard';
import { OPEN_ROLES_TEST } from './cards/EcwOpenRolesCard';
import { TIME_OFF_TEST } from './cards/EcwTimeOffCard';
import { ONBOARDING_TEST } from './cards/EcwOnboardingCard';
import { FIELD_DISPATCH_TEST } from './cards/EcwFieldDispatchCard';
import { ESCALATION_TEST } from './cards/EcwEscalationCard';
import { CAMPAIGN_FUNNEL_TEST } from './cards/EcwCampaignFunnelCard';
import { PERFORMANCE_MATRIX_TEST } from './cards/EcwPerformanceMatrixCard';
import { AB_TEST_TEST } from './cards/EcwAbTestCard';
import { AUDIENCE_EXPLORER_TEST } from './cards/EcwAudienceExplorerCard';
import { CASE360_TEST } from './cards/EcwCase360Card';
import { CSAT_PULSE_TEST } from './cards/EcwCsatPulseCard';
import artSales from '@/assets/brand/df26/dept-sales.png';
import artService from '@/assets/brand/df26/dept-service.png';
import artIt from '@/assets/brand/df26/dept-it.png';
import artFinance from '@/assets/brand/df26/dept-finance.png';
import artHr from '@/assets/brand/df26/dept-hr.png';
import artMarketing from '@/assets/brand/df26/dept-marketing.png';

/**
 * The DEPARTMENT catalogue for the team track — the Coworker analogue of the
 * customer track's industry lanes. Picking a department reveals that team's
 * Coworker CLTs; selecting one previews it inside the Agentforce Coworker Ask
 * surface. v1 ships four live lanes (Sales, Customer Service, IT, Finance);
 * HR + Marketing are shown as "coming soon" to signal the roadmap without
 * building them yet. Only the Sales · My pipeline card is reference-quality in
 * Phase 1 (customCard); the rest use the generic preview until their real CLTs
 * are authored.
 */
export type Department = {
  key: string;
  label: string;
  /** One-line lane description. */
  blurb: string;
  icon: LucideIcon;
  /** Lane accent gradient endpoints (Coworker blue→violet range). */
  accentFrom: string;
  accentTo: string;
  /** Per-tile accent (drives the big-tile glow + selected ombre), oklch like the industry tiles. */
  ind: string;
  /** 3D glass tile artwork (same treatment as the service industry tiles). */
  art: string;
  functions: EmployeeFunction[];
};

const SALES: EmployeeFunction[] = [
  {
    key: 'sales-pipeline',
    fn: 'Sales',
    label: 'My pipeline',
    blurb: 'A live snapshot of your quarter — open pipeline, what’s closing, and win rate.',
    icon: TrendingUp,
    kind: 'display',
    cltApiName: 'ecwSalesPipeline',
    subagent: 'Sales Coach',
    ask: 'Show me my sales pipeline',
    lead: 'Here’s your quarter at a glance — $1.42M open across 12 opportunities, up 8% from last quarter.',
    steps: 6,
    fields: [],
    inputs: [],
    action: 'Open in CRM',
    customCard: 'salesPipeline',
    pipeline: PIPELINE_TEST,
  },
  {
    key: 'sales-forecast',
    fn: 'Sales',
    label: 'Forecast',
    blurb: 'Your forecast coverage — committed of total across Closed, Commit, Best case, and Pipeline.',
    icon: BarChart3,
    kind: 'display',
    cltApiName: 'ecwForecast',
    subagent: 'Sales Coach',
    ask: 'Show me my sales forecast',
    lead: 'Here’s your forecast — $7.76M committed of $29.24M across the confidence tiers.',
    steps: 4,
    fields: [],
    inputs: [],
    action: 'Open in CRM',
    customCard: 'forecast',
    cardPayload: FORECAST_TEST,
  },
  {
    key: 'sales-needs-attention',
    fn: 'Sales',
    label: 'Needs attention',
    blurb: 'The open deals slipping, overdue, or gone quiet — ranked by urgency with value at risk.',
    icon: ClipboardList,
    kind: 'display',
    cltApiName: 'ecwNeedsAttention',
    subagent: 'Sales Coach',
    ask: 'Which deals need my attention?',
    lead: 'Here are the deals that need you — $1.4M at risk across 6 that are overdue, closing soon, or stalled.',
    steps: 4,
    fields: [],
    inputs: [],
    action: 'Open in CRM',
    customCard: 'needsAttention',
    cardPayload: NEEDS_ATTENTION_TEST,
  },
  {
    key: 'sales-what-changed',
    fn: 'Sales',
    label: 'What changed',
    blurb: 'Recent deal motion — won, advanced, new, slipped, and lost — with net pipeline change.',
    icon: TrendingUp,
    kind: 'display',
    cltApiName: 'ecwWhatChanged',
    subagent: 'Sales Coach',
    ask: 'What changed in my pipeline this week?',
    lead: 'Here’s what moved this week — +$510K net across 5 updates.',
    steps: 4,
    fields: [],
    inputs: [],
    action: 'Open in CRM',
    customCard: 'whatChanged',
    cardPayload: WHAT_CHANGED_TEST,
  },
];

const SERVICE: EmployeeFunction[] = [
  {
    key: 'svc-field-dispatch', fn: 'Service', label: 'Field dispatch', icon: MapPin, kind: 'display',
    blurb: 'Reassign an at-risk appointment — a live map and ranked technicians by fit, ETA, and skills.',
    cltApiName: 'ecwFieldDispatch', subagent: 'Dispatch',
    ask: 'Reassign the at-risk appointment',
    lead: 'SA-10427 is 48 minutes from an SLA breach — here are the best technicians to reassign it to.',
    steps: 5, fields: [], inputs: [], action: 'Open in dispatch',
    customCard: 'fieldDispatch', cardPayload: FIELD_DISPATCH_TEST,
  },
  {
    key: 'svc-escalation', fn: 'Service', label: 'Escalate case', icon: AlertTriangle, kind: 'display',
    blurb: 'Report an escalation — impacted accounts and business impact as a ledger, routed to Tier 2.',
    cltApiName: 'ecwEscalation', subagent: 'Service',
    ask: 'Escalate this case',
    lead: 'Here’s the escalation for case 00043219 — Sev 1, ~2,400 users and $48K at risk across 7 accounts.',
    steps: 4, fields: [], inputs: [], action: 'Escalate',
    customCard: 'escalation', cardPayload: ESCALATION_TEST,
  },
  {
    key: 'svc-case-360', fn: 'Service', label: 'Case 360', icon: FileSearch, kind: 'display',
    blurb: 'A case dossier — customer, sentiment, key facts, activity timeline, and the next best action.',
    cltApiName: 'ecwCase360', subagent: 'Service',
    ask: 'Prep me for my case',
    lead: 'Here’s the dossier for case 00043219 — PixelArc, high priority, with the recent activity.',
    steps: 4, fields: [], inputs: [], action: 'Open case',
    customCard: 'case360', cardPayload: CASE360_TEST,
  },
  {
    key: 'svc-csat', fn: 'Service', label: 'CSAT pulse', icon: Gauge, kind: 'display',
    blurb: 'A rolling CSAT gauge with the trend and recent verbatim feedback by theme.',
    cltApiName: 'ecwCsatPulse', subagent: 'Service',
    ask: 'Show me my CSAT',
    lead: 'Here’s your CSAT — 4.6 of 5, up 0.3, with the latest verbatims.',
    steps: 3, fields: [], inputs: [], action: 'Open CSAT',
    customCard: 'csatPulse', cardPayload: CSAT_PULSE_TEST,
  },
];

const IT: EmployeeFunction[] = [
  {
    key: 'it-system-status', fn: 'IT', label: 'System status', icon: Activity, kind: 'display',
    blurb: 'Overall uptime and every service’s status on one operations board.',
    cltApiName: 'ecwSystemStatus', subagent: 'IT Help',
    ask: 'Show me system status',
    lead: 'Here’s system status — 99.7% 30-day uptime, 7 of 8 services operational.',
    steps: 4, fields: [], inputs: [], action: 'Open status page',
    customCard: 'systemStatus', cardPayload: SYSTEM_STATUS_TEST,
  },
  {
    key: 'it-known-issues', fn: 'IT', label: 'Known issues', icon: AlertTriangle, kind: 'display',
    blurb: 'The active incidents affecting you right now, with impact and workarounds.',
    cltApiName: 'ecwKnownIssues', subagent: 'IT Help',
    ask: 'Show me known issues',
    lead: 'Here are the active incidents — 2 open, worst is P2.',
    steps: 4, fields: [], inputs: [], action: 'Open incidents',
    customCard: 'knownIssues', cardPayload: KNOWN_ISSUES_TEST,
  },
  {
    key: 'it-change-calendar', fn: 'IT', label: 'Change calendar', icon: CalendarClock, kind: 'display',
    blurb: 'Upcoming maintenance and changes on a timeline, with risk and impact.',
    cltApiName: 'ecwChangeCalendar', subagent: 'IT Help',
    ask: 'Show me the change calendar',
    lead: 'Here’s the change calendar — 3 upcoming changes this week.',
    steps: 3, fields: [], inputs: [], action: 'Open calendar',
    customCard: 'changeCalendar', cardPayload: CHANGE_CALENDAR_TEST,
  },
  {
    key: 'it-my-requests', fn: 'IT', label: 'My IT requests', icon: Ticket, kind: 'display',
    blurb: 'The status of your IT tickets — hardware, access, and software requests.',
    cltApiName: 'ecwMyItRequests', subagent: 'IT Help',
    ask: 'Show me my IT requests',
    lead: 'Here are your IT requests — 2 open.',
    steps: 3, fields: [], inputs: [], action: 'Open requests',
    customCard: 'myItRequests', cardPayload: MY_IT_REQUESTS_TEST,
  },
];

const FINANCE: EmployeeFunction[] = [
  {
    key: 'fin-budget-actual', fn: 'Finance', label: 'Budget vs actual', icon: BarChart3, kind: 'display',
    blurb: 'Departmental spend against budget — columns, budget ticks, and variance.',
    cltApiName: 'ecwBudgetActual', subagent: 'Finance',
    ask: 'Show me budget vs actual',
    lead: 'Here’s spend against budget — $6.3M of $7.8M (81% used), IT over.',
    steps: 4, fields: [], inputs: [], action: 'Open in Finance',
    customCard: 'budgetActual', cardPayload: BUDGET_ACTUAL_TEST,
  },
  {
    key: 'fin-ap-approvals', fn: 'Finance', label: 'AP approvals', icon: Receipt, kind: 'display',
    blurb: 'Vendor invoices and POs awaiting sign-off, with due and aging.',
    cltApiName: 'ecwApApprovals', subagent: 'Finance',
    ask: 'Show me AP approvals',
    lead: 'Here’s the AP queue — $284K across 5 awaiting sign-off.',
    steps: 4, fields: [], inputs: [], action: 'Review approvals',
    customCard: 'apApprovals', cardPayload: AP_APPROVALS_TEST,
  },
  {
    key: 'fin-ar-aging', fn: 'Finance', label: 'AR aging', icon: Wallet, kind: 'display',
    blurb: 'Outstanding receivables by aging bucket, DSO, and top overdue accounts.',
    cltApiName: 'ecwArAging', subagent: 'Finance',
    ask: 'Show me AR aging',
    lead: 'Here’s AR aging — $1.24M outstanding, DSO 42 days.',
    steps: 3, fields: [], inputs: [], action: 'Open AR',
    customCard: 'arAging', cardPayload: AR_AGING_TEST,
  },
  {
    key: 'fin-month-end-close', fn: 'Finance', label: 'Month-end close', icon: FileCheck2, kind: 'display',
    blurb: 'The close checklist with status, progress, and what’s blocking the close.',
    cltApiName: 'ecwMonthEndClose', subagent: 'Finance',
    ask: 'Show me the month-end close',
    lead: '6 of 11 tasks done (55%), targeting Business Day 5.',
    steps: 4, fields: [], inputs: [], action: 'Open close',
    customCard: 'monthEndClose', cardPayload: MONTH_END_CLOSE_TEST,
  },
];

const HR: EmployeeFunction[] = [
  {
    key: 'hr-onboarding', fn: 'HR', label: 'Onboarding', icon: UserPlus, kind: 'display',
    blurb: 'New hires in onboarding, each with progress and next steps — tap for details.',
    cltApiName: 'ecwOnboarding', subagent: 'HR',
    ask: 'Help me onboard a new hire',
    lead: 'Here are your 3 new hires in onboarding — tap one for details and quick links.',
    steps: 4, fields: [], inputs: [], action: 'Open onboarding',
    customCard: 'onboarding', cardPayload: ONBOARDING_TEST,
  },
  {
    key: 'hr-headcount', fn: 'HR', label: 'Headcount', icon: Users, kind: 'display',
    blurb: 'Headcount by department and the company total, as a clean ledger.',
    cltApiName: 'ecwHeadcount', subagent: 'HR',
    ask: 'Show me headcount',
    lead: 'Here’s company headcount — 482 across 8 departments, up 18 this quarter.',
    steps: 3, fields: [], inputs: [], action: 'Open in HR',
    customCard: 'headcount', cardPayload: HEADCOUNT_TEST,
  },
  {
    key: 'hr-time-off', fn: 'HR', label: 'Who’s out', icon: CalendarDays, kind: 'display',
    blurb: 'A week calendar of who’s off each day — pick a day to see the roster.',
    cltApiName: 'ecwTimeOff', subagent: 'HR',
    ask: "Show me who's out",
    lead: 'Here’s who’s off this week — pick a day to see the roster.',
    steps: 3, fields: [], inputs: [], action: 'Open calendar',
    customCard: 'timeOff', cardPayload: TIME_OFF_TEST,
  },
  {
    key: 'hr-open-roles', fn: 'HR', label: 'Open roles', icon: Briefcase, kind: 'display',
    blurb: 'Open requisitions with stage, candidates, and time-to-fill.',
    cltApiName: 'ecwOpenRoles', subagent: 'HR',
    ask: 'Show me open roles',
    lead: 'Here are the 5 open requisitions — 33 candidates in pipeline, avg 29 days open.',
    steps: 3, fields: [], inputs: [], action: 'Open roles',
    customCard: 'openRoles', cardPayload: OPEN_ROLES_TEST,
  },
];

const MARKETING: EmployeeFunction[] = [
  {
    key: 'mkt-campaign-funnel', fn: 'Marketing', label: 'Campaign conversion', icon: Filter, kind: 'display',
    blurb: 'A campaign’s conversion funnel from impressions to won, with the biggest drop-off flagged.',
    cltApiName: 'ecwCampaignFunnel', subagent: 'Marketing',
    ask: 'Show me campaign performance',
    lead: 'Here’s the Spring Launch funnel — 128 won from 1.24M impressions, with the biggest leak at MQL to SQL.',
    steps: 4, fields: [], inputs: [], action: 'Open campaign',
    customCard: 'campaignFunnel', cardPayload: CAMPAIGN_FUNNEL_TEST,
  },
  {
    key: 'mkt-performance-matrix', fn: 'Marketing', label: 'Performance matrix', icon: LayoutGrid, kind: 'display',
    blurb: 'Content and campaigns plotted by reach and engagement, sized by conversions — what to scale vs cut.',
    cltApiName: 'ecwPerformanceMatrix', subagent: 'Marketing',
    ask: 'Show me content performance',
    lead: 'Here’s the performance matrix — the ROI calculator and launch webinar are the two to scale.',
    steps: 4, fields: [], inputs: [], action: 'Open analytics',
    customCard: 'performanceMatrix', cardPayload: PERFORMANCE_MATRIX_TEST,
  },
  {
    key: 'mkt-ab-test', fn: 'Marketing', label: 'A/B test', icon: FlaskConical, kind: 'display',
    blurb: 'A head-to-head A versus B result with a confidence meter and the winning variant.',
    cltApiName: 'ecwAbTest', subagent: 'Marketing',
    ask: 'Show me the A/B test results',
    lead: 'Variant B won at 97% confidence — a +59% lift in click-through, roughly +$18K per quarter.',
    steps: 4, fields: [], inputs: [], action: 'Open test',
    customCard: 'abTest', cardPayload: AB_TEST_TEST,
  },
  {
    key: 'mkt-audience-explorer', fn: 'Marketing', label: 'Audience builder', icon: Target, kind: 'display',
    blurb: 'Build a segment live — toggle criteria and a score threshold and watch the audience size recompute.',
    cltApiName: 'ecwAudienceExplorer', subagent: 'Marketing',
    ask: 'Show me the audience builder',
    lead: 'Here’s the audience builder — toggle criteria and the engagement threshold to size the segment live.',
    steps: 4, fields: [], inputs: [], action: 'Open segment',
    customCard: 'audienceExplorer', cardPayload: AUDIENCE_EXPLORER_TEST,
  },
];

export const DEPARTMENTS: Department[] = [
  { key: 'sales', label: 'Sales', blurb: 'Pipeline, approvals, and CRM updates for reps and managers.', icon: TrendingUp, accentFrom: '#1b96ff', accentTo: '#5d5cde', ind: 'oklch(0.68 0.17 250)', art: artSales, functions: SALES },
  { key: 'service', label: 'Customer Service', blurb: 'Agent-assist for support reps — queues, escalations, cases.', icon: Headset, accentFrom: '#0d9dda', accentTo: '#1b96ff', ind: 'oklch(0.72 0.13 220)', art: artService, functions: SERVICE },
  { key: 'it', label: 'IT', blurb: 'Access, incidents, and approvals for IT and every employee.', icon: ServerCog, accentFrom: '#5d5cde', accentTo: '#7f5cff', ind: 'oklch(0.62 0.2 285)', art: artIt, functions: IT },
  { key: 'finance', label: 'Finance', blurb: 'Expenses, approvals, and budget visibility for the team.', icon: Wallet, accentFrom: '#7f5cff', accentTo: '#1b96ff', ind: 'oklch(0.6 0.2 300)', art: artFinance, functions: FINANCE },
  { key: 'hr', label: 'HR', blurb: 'Time off, onboarding, and benefits.', icon: Users, accentFrom: '#53b1fd', accentTo: '#5d5cde', ind: 'oklch(0.75 0.14 235)', art: artHr, functions: HR },
  { key: 'marketing', label: 'Marketing', blurb: 'Campaign briefs, asset requests, and budget approvals.', icon: Megaphone, accentFrom: '#9a7cff', accentTo: '#1b96ff', ind: 'oklch(0.68 0.2 330)', art: artMarketing, functions: MARKETING },
];

/** Convenience: the default (first) department lane. */
export const DEFAULT_DEPARTMENT = DEPARTMENTS[0];
