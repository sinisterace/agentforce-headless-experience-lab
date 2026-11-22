import type { LucideIcon } from 'lucide-react';
import type { EcwPipelinePayload } from './ecwFormat';

/**
 * Type model for the EMPLOYEE ("For your team") track. Unlike the customer
 * track — gated by the detected industry — the team track is organized by
 * DEPARTMENT (Sales, Customer Service, IT, Finance…), because Agentforce
 * Coworker is horizontal: a teammate for each function regardless of the
 * company's vertical. The department catalogue lives in `departments.ts`.
 *
 * This is a FRONT-END catalogue only. There is no employee CLT bundle in the
 * org yet, so these drive the dual-track *experience* (the lanes + previews)
 * without any backend dependency. When we author the real employee CLTs, each
 * `cltApiName` becomes the deployed Custom Lightning Type and `subagent` the
 * Coworker subagent that renders it (Coworker renders CLTs only via subagent
 * delegation — see docs/memory).
 */
export type EmpKind = 'form' | 'display' | 'approval';

/** A read-only labelled row shown in a card (context or a display card's data). */
export type EmpField = { label: string; value: string };

/** A single form control rendered in an input-CLT preview. */
export type EmpInput =
  | { kind: 'select'; label: string; options: string[]; value: string }
  | { kind: 'text'; label: string; placeholder: string; value?: string }
  | { kind: 'date'; label: string; value: string };

export type EmployeeFunction = {
  /** Stable key for selection + (future) catalogue row. */
  key: string;
  /** The business function badge, e.g. "IT". */
  fn: string;
  /** The card's title — what the employee is doing. */
  label: string;
  /** One-line description for the list row. */
  blurb: string;
  icon: LucideIcon;
  kind: EmpKind;
  /** Proposed Custom Lightning Type API name for the eventual real build. */
  cltApiName: string;
  /** The Coworker subagent that would emit this CLT — teaches the delegation model. */
  subagent: string;
  /** The employee's ask — shown as the user bubble in the Coworker surface. */
  ask: string;
  /** Coworker's short intro line above the card. */
  lead: string;
  /** How many reasoning steps Coworker "completed" (surface flavor). */
  steps: number;
  /** Optional highlighted stat rendered above the card body (e.g. PTO balance). */
  stat?: EmpField;
  /** Read-only context/data rows. */
  fields: EmpField[];
  /** Form controls — non-empty only for input-form / approval cards. */
  inputs: EmpInput[];
  /** Primary action label. */
  action: string;
  /** Optional secondary action (e.g. an approval's "Decline"). */
  secondaryAction?: string;
  /** When set, the Coworker surface renders a bespoke card instead of the
   *  generic field/stat/input preview. One key per bespoke ecw CLT. */
  customCard?:
    | 'salesPipeline' | 'needsAttention' | 'forecast' | 'whatChanged'
    | 'case360' | 'csatPulse' | 'fieldDispatch' | 'escalation'
    | 'systemStatus' | 'knownIssues' | 'changeCalendar' | 'myItRequests'
    | 'budgetActual' | 'apApprovals' | 'arAging' | 'monthEndClose'
    | 'headcount' | 'timeOff' | 'openRoles' | 'onboarding'
    | 'campaignFunnel' | 'performanceMatrix' | 'abTest' | 'audienceExplorer';
  /** Payload for the bespoke Sales pipeline card (when customCard === 'salesPipeline'). */
  pipeline?: EcwPipelinePayload;
  /** Payload for any other bespoke card (when customCard is set to a non-pipeline key). */
  cardPayload?: unknown;
};
