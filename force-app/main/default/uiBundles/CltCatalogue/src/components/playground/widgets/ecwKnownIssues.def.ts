import type { WidgetDef } from './types';
import { EcwKnownIssuesCard, KNOWN_ISSUES_TEST } from '@/employee/cards/EcwKnownIssuesCard';
import { structureFromPayload } from '@/employee/cardData';

/** EcwKnownIssuesCard — IT · Known issues. */
export const ecwKnownIssuesDef: WidgetDef = {
  kind: 'ecwKnownIssuesJSON',
  dtoField: 'ecwKnownIssuesJSON',
  label: 'Agentforce Coworker · IT · Known issues',
  defaults: KNOWN_ISSUES_TEST,
  structure: structureFromPayload(KNOWN_ISSUES_TEST as unknown as Record<string, unknown>),
  Preview: EcwKnownIssuesCard,
};
