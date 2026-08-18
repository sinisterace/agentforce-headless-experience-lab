import type { FinServAccountSelectorPayload } from '../payloads';
import { FinServAccountSelectorPreview } from '../FinServAccountSelectorEditor';
import type { WidgetDef } from './types';

/** asaFinServAccountSelector — pick a financial account (single or multiple), with balances. */
export const finServAccountSelectorDef: WidgetDef = {
  kind: 'finServAccountSelectorJSON',
  dtoField: 'finServAccountSelectorJSON',
  label: 'ASA Financial Services · Account Selector',
  defaults: { title: 'Which account can I help you with?', mode: 'single', accounts: [] } satisfies FinServAccountSelectorPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title' },
    { label: 'Selection mode', control: 'Segmented (single | multiple)', bind: 'mode' },
    {
      label: 'Accounts',
      control: 'Account list',
      bind: 'accounts[]',
      note: 'empty → test-mode sample data',
      children: [
        { label: 'Id', control: 'Text', bind: 'accounts[].id', note: 'sent back on selection' },
        { label: 'Name', control: 'Text', bind: 'accounts[].name' },
        { label: 'Type', control: 'Select (Checking | Savings | Credit Card | Loan | Investment)', bind: 'accounts[].type' },
        { label: 'Last 4', control: 'Text', bind: 'accounts[].mask' },
        { label: 'Balance', control: 'Number', bind: 'accounts[].balance' },
        { label: 'Currency', control: 'Text', bind: 'accounts[].currency', note: 'defaults to USD' },
        { label: 'Available', control: 'Number', bind: 'accounts[].available', note: 'optional' },
        { label: 'Badge', control: 'Text', bind: 'accounts[].badge', note: 'optional tag' },
      ],
    },
    { label: 'Submit', control: 'Button', bind: 'submitText', note: 'multiple mode only' },
  ],
  Preview: FinServAccountSelectorPreview,
};
