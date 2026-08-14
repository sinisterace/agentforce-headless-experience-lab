import type { InsurancePolicySelectorPayload } from '../payloads';
import { InsurancePolicySelectorEditor, InsurancePolicySelectorPreview } from '../InsurancePolicySelectorEditor';
import type { WidgetDef } from './types';

/** asaInsurancePolicySelector — pick an insurance policy (single or multiple), with coverage + renewal. */
export const insurancePolicySelectorDef: WidgetDef = {
  kind: 'insurancePolicySelectorJSON',
  dtoField: 'insurancePolicySelectorJSON',
  label: 'ASA Insurance · Policy Selector',
  defaults: { title: 'Which policy can I help you with?', mode: 'single', policies: [] } satisfies InsurancePolicySelectorPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title' },
    { label: 'Selection mode', control: 'Segmented (single | multiple)', bind: 'mode' },
    {
      label: 'Policies',
      control: 'Policy list',
      bind: 'policies[]',
      note: 'empty → test-mode sample data',
      children: [
        { label: 'Id', control: 'Text', bind: 'policies[].id', note: 'sent back on selection' },
        { label: 'Name', control: 'Text', bind: 'policies[].name' },
        { label: 'Type', control: 'Select (Auto | Home | Renters | Life | Health | Umbrella | Pet | Travel)', bind: 'policies[].type' },
        { label: 'Status', control: 'Select (Active | Pending | Lapsed | Cancelled)', bind: 'policies[].status' },
        { label: 'Policy number', control: 'Text', bind: 'policies[].policyNumber', note: 'shown masked' },
        { label: 'Coverage', control: 'Text', bind: 'policies[].coverage', note: 'optional summary' },
        { label: 'Premium', control: 'Number', bind: 'policies[].premium', note: 'optional' },
        { label: 'Cadence', control: 'Text', bind: 'policies[].cadence', note: 'e.g. monthly / annual' },
        { label: 'Renewal date', control: 'Date', bind: 'policies[].renewalDate', note: 'optional' },
        { label: 'Badge', control: 'Text', bind: 'policies[].badge', note: 'optional tag' },
      ],
    },
    { label: 'Submit', control: 'Button', bind: 'submitText', note: 'multiple mode only' },
  ],
  Editor: InsurancePolicySelectorEditor,
  Preview: InsurancePolicySelectorPreview,
};
