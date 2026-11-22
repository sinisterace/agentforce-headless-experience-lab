import type { FinServMoneyMovementPayload } from '../payloads';
import { FinServMoneyMovementPreview } from '../FinServMoneyMovementEditor';
import type { WidgetDef } from './types';

/** asaFinServMoneyMovement — pick a recipient, then a preset amount, to send money. */
export const finServMoneyMovementDef: WidgetDef = {
  kind: 'finServMoneyMovementJSON',
  dtoField: 'finServMoneyMovementJSON',
  label: 'ASA Financial Services · Money Movement',
  defaults: {
    title: 'Send money',
    fromAccount: { label: '', mask: '' },
    recipients: [],
    amountPresets: [],
    currency: 'USD',
    allowOther: true,
    otherText: 'Other amount',
    submitText: 'Continue',
  } satisfies FinServMoneyMovementPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title' },
    {
      label: 'From account',
      control: 'Object',
      bind: 'fromAccount',
      children: [
        { label: 'Label', control: 'Text', bind: 'fromAccount.label' },
        { label: 'Mask', control: 'Text', bind: 'fromAccount.mask', note: 'last 4' },
      ],
    },
    {
      label: 'Recipients',
      control: 'Recipient list',
      bind: 'recipients[]',
      note: 'empty → test-mode sample data',
      children: [
        { label: 'Id', control: 'Text', bind: 'recipients[].id', note: 'sent back on selection' },
        { label: 'Name', control: 'Text', bind: 'recipients[].name' },
        { label: 'Type', control: 'Select (person | card | account | business | external)', bind: 'recipients[].type' },
        { label: 'Mask', control: 'Text', bind: 'recipients[].mask', note: 'last 4' },
        { label: 'Detail', control: 'Text', bind: 'recipients[].detail', note: 'e.g. Checking' },
      ],
    },
    {
      label: 'Amount presets',
      control: 'Amount list',
      bind: 'amountPresets[]',
      children: [
        { label: 'Id', control: 'Text', bind: 'amountPresets[].id', note: 'sent back on selection' },
        { label: 'Amount', control: 'Number', bind: 'amountPresets[].amount' },
        { label: 'Label', control: 'Text', bind: 'amountPresets[].label', note: 'else formatted amount' },
      ],
    },
    { label: 'Currency', control: 'Text', bind: 'currency', note: 'defaults to USD' },
    { label: 'Allow other', control: 'Checkbox', bind: 'allowOther', note: 'shows an Other amount chip' },
    { label: 'Other text', control: 'Text', bind: 'otherText', note: 'Other amount chip label' },
    { label: 'Continue', control: 'Button', bind: 'submitText', note: 'appears once a recipient + amount are selected' },
  ],
  Preview: FinServMoneyMovementPreview,
};
