import type { WidgetDef } from './types';
import { EcwApApprovalsCard, AP_APPROVALS_TEST } from '@/employee/cards/EcwApApprovalsCard';
import { structureFromPayload } from '@/employee/cardData';

/** EcwApApprovalsCard — Finance · AP approvals. */
export const ecwApApprovalsDef: WidgetDef = {
  kind: 'ecwApApprovalsJSON',
  dtoField: 'ecwApApprovalsJSON',
  label: 'Agentforce Coworker · Finance · AP approvals',
  defaults: AP_APPROVALS_TEST,
  structure: structureFromPayload(AP_APPROVALS_TEST as unknown as Record<string, unknown>),
  Preview: EcwApApprovalsCard,
};
