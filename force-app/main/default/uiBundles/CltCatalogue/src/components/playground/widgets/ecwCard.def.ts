import type { WidgetDef } from './types';
import { EcwGenericCard } from '@/employee/cards/EcwGenericCard';

/** ecwCard — the generic Coworker record/form card (IT access, approvals, …). */
export const ecwCardDef: WidgetDef = {
  kind: 'ecwCardJSON',
  dtoField: 'ecwCardJSON',
  label: 'Agentforce Coworker card',
  defaults: {
    title: 'Request system access',
    inputs: [
      { kind: 'select', label: 'System', options: ['Salesforce', 'GitHub', 'Figma'], value: 'Salesforce' },
      { kind: 'select', label: 'Access level', options: ['Read-only', 'Write', 'Admin'], value: 'Write' },
      { kind: 'text', label: 'Business reason', placeholder: 'Why do you need this access?' },
    ],
    action: 'Submit request',
  },
  structure: [
    { label: 'Title', control: 'Text', bind: 'title' },
    { label: 'Stat', control: 'Highlighted stat', bind: 'stat', note: 'optional' },
    { label: 'Fields', control: 'Record rows', bind: 'fields[]', note: 'optional' },
    { label: 'Inputs', control: 'Form', bind: 'inputs[]', note: 'optional' },
    { label: 'Primary action', control: 'Button', bind: 'action' },
    { label: 'Secondary action', control: 'Button', bind: 'secondaryAction', note: 'optional' },
  ],
  Preview: EcwGenericCard,
};
