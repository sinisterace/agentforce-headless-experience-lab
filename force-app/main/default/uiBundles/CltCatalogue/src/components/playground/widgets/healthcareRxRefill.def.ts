import type { HealthcareRxRefillPayload } from '../payloads';
import { HealthcareRxRefillPreview } from '../HealthcareRxRefillEditor';
import type { WidgetDef } from './types';

/** asaHealthcareRxRefill — multi-select medications to refill and confirm a pickup pharmacy. */
export const healthcareRxRefillDef: WidgetDef = {
  kind: 'healthcareRxRefillJSON',
  dtoField: 'healthcareRxRefillJSON',
  label: 'ASA Healthcare · Prescription Refill',
  defaults: { title: 'Refill prescriptions', subtitle: '', medications: [], pharmacy: { name: '' } } satisfies HealthcareRxRefillPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title' },
    { label: 'Subtitle', control: 'Text', bind: 'subtitle', note: 'optional' },
    {
      label: 'Medications',
      control: 'Checklist',
      bind: 'medications[]',
      note: 'empty → test-mode sample data',
      children: [
        { label: 'Id', control: 'Text', bind: 'medications[].id', note: 'sent back on selection' },
        { label: 'Name', control: 'Text', bind: 'medications[].name' },
        { label: 'Dosage', control: 'Text', bind: 'medications[].dosage', note: 'optional' },
        { label: 'Supply text', control: 'Text', bind: 'medications[].supplyText', note: 'optional' },
        { label: 'Status', control: 'Select (ok | low | out)', bind: 'medications[].status', note: "'out' → not selectable" },
        { label: 'Refills left', control: 'Number', bind: 'medications[].refillsLeft', note: 'optional' },
      ],
    },
    {
      label: 'Pickup pharmacy',
      control: 'Object',
      bind: 'pharmacy',
      note: 'optional footer',
      children: [
        { label: 'Name', control: 'Text', bind: 'pharmacy.name' },
        { label: 'Address', control: 'Text', bind: 'pharmacy.address', note: 'optional' },
        { label: 'Hours', control: 'Text', bind: 'pharmacy.hours', note: 'optional' },
      ],
    },
    { label: 'Submit', control: 'Button', bind: 'submitText' },
  ],
  Preview: HealthcareRxRefillPreview,
};
