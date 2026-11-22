import type { InsuranceClaimStatusPayload } from '../payloads';
import { InsuranceClaimStatusPreview } from '../InsuranceClaimStatusEditor';
import type { WidgetDef } from './types';

/** asaInsuranceClaimStatus — track filed claims with a step-by-step progress tracker. */
export const insuranceClaimStatusDef: WidgetDef = {
  kind: 'insuranceClaimStatusJSON',
  dtoField: 'insuranceClaimStatusJSON',
  label: 'ASA Insurance · Claim Status Tracker',
  defaults: { title: 'Your claims', claims: [] } satisfies InsuranceClaimStatusPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title' },
    {
      label: 'Claims',
      control: 'Claim list',
      bind: 'claims[]',
      note: 'empty → test-mode sample data',
      children: [
        { label: 'Id', control: 'Text', bind: 'claims[].id', note: 'sent back on tap' },
        { label: 'Claim number', control: 'Text', bind: 'claims[].claimNumber' },
        { label: 'Status', control: 'Select (Submitted | Review | Approved | Paid | Denied)', bind: 'claims[].status', note: 'drives tracker + accent' },
        { label: 'Status label', control: 'Text', bind: 'claims[].statusLabel', note: 'optional pill text' },
        { label: 'Type', control: 'Text', bind: 'claims[].type', note: 'optional' },
        { label: 'Policy label', control: 'Text', bind: 'claims[].policyLabel', note: 'optional' },
        { label: 'Amount', control: 'Number', bind: 'claims[].amount', note: 'optional' },
        { label: 'Filed date', control: 'Date', bind: 'claims[].filedDate', note: 'optional' },
        { label: 'Updated date', control: 'Date', bind: 'claims[].updatedDate', note: 'optional' },
        { label: 'Next action', control: 'Text', bind: 'claims[].nextActionText', note: 'optional callout' },
        { label: 'Steps', control: 'Step list', bind: 'claims[].steps[]', note: 'optional; derived from status if omitted' },
      ],
    },
    { label: 'Submit', control: 'Button', bind: 'submitText' },
  ],
  Preview: InsuranceClaimStatusPreview,
};
