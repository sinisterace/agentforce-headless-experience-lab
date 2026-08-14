import type { InsuranceFileClaimPayload } from '../payloads';
import { InsuranceFileClaimEditor, InsuranceFileClaimPreview } from '../InsuranceFileClaimEditor';
import type { WidgetDef } from './types';

/** asaInsuranceFileClaim — start a claim by picking the type of incident for a policy. */
export const insuranceFileClaimDef: WidgetDef = {
  kind: 'insuranceFileClaimJSON',
  dtoField: 'insuranceFileClaimJSON',
  label: 'ASA Insurance · File a Claim',
  defaults: { title: 'What happened?', policy: { label: '', policyNumber: '' }, incidentTypes: [] } satisfies InsuranceFileClaimPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title' },
    {
      label: 'Policy context',
      control: 'Object',
      bind: 'policy',
      note: 'optional banner',
      children: [
        { label: 'Label', control: 'Text', bind: 'policy.label' },
        { label: 'Policy number', control: 'Text', bind: 'policy.policyNumber', note: 'shown masked' },
      ],
    },
    {
      label: 'Incident types',
      control: 'Tile grid',
      bind: 'incidentTypes[]',
      note: 'empty → test-mode sample data',
      children: [
        { label: 'Id', control: 'Text', bind: 'incidentTypes[].id', note: 'sent back on selection' },
        { label: 'Label', control: 'Text', bind: 'incidentTypes[].label' },
        { label: 'Description', control: 'Text', bind: 'incidentTypes[].description', note: 'optional' },
        { label: 'Icon', control: 'Select (collision | theft | weather | water | fire | glass | liability | medical | other)', bind: 'incidentTypes[].icon' },
      ],
    },
    { label: 'Submit', control: 'Button', bind: 'submitText' },
  ],
  Editor: InsuranceFileClaimEditor,
  Preview: InsuranceFileClaimPreview,
};
