import type { InsuranceIdCardPayload } from '../payloads';
import { InsuranceIdCardPreview } from '../InsuranceIdCardEditor';
import type { WidgetDef } from './types';

/** asaInsuranceIdCard — a wallet-style digital proof-of-insurance card with email / add-to-wallet actions. */
export const insuranceIdCardDef: WidgetDef = {
  kind: 'insuranceIdCardJSON',
  dtoField: 'insuranceIdCardJSON',
  label: 'ASA Insurance · Digital ID Card',
  defaults: { title: 'Proof of insurance' } satisfies InsuranceIdCardPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'eyebrow above the card' },
    { label: 'Carrier', control: 'Text', bind: 'carrier' },
    { label: 'Policy type', control: 'Text', bind: 'policyType', note: 'e.g. Auto' },
    { label: 'Policyholder', control: 'Text', bind: 'policyholder' },
    { label: 'Policy #', control: 'Text', bind: 'policyNumber' },
    { label: 'Vehicle', control: 'Text', bind: 'vehicle', note: 'insured item' },
    { label: 'Plate', control: 'Text', bind: 'plate', note: 'plate or VIN last-4' },
    { label: 'Effective date', control: 'Text', bind: 'effectiveDate' },
    { label: 'Expiration date', control: 'Text', bind: 'expirationDate' },
    { label: 'Status', control: 'Text', bind: 'status', note: 'e.g. Active' },
    {
      label: 'Coverages',
      control: 'Chip list',
      bind: 'coverages[]',
      note: 'empty → test-mode sample',
      children: [
        { label: 'Label', control: 'Text', bind: 'coverages[].label' },
        { label: 'Detail', control: 'Text', bind: 'coverages[].detail', note: 'e.g. "$500 deductible"' },
      ],
    },
    { label: 'Primary action', control: 'Text', bind: 'submitText', note: 'default "Email me a copy"' },
    { label: 'Secondary action', control: 'Text', bind: 'secondaryText', note: 'ghost button, e.g. "Add to wallet"' },
  ],
  Preview: InsuranceIdCardPreview,
};
