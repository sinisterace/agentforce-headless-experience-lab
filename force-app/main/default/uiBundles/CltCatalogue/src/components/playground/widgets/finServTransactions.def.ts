import type { FinServTransactionsPayload } from '../payloads';
import { FinServTransactionsEditor, FinServTransactionsPreview } from '../FinServTransactionsEditor';
import type { WidgetDef } from './types';

/** asaFinServTransactions — show recent transactions; pick one to dispute. */
export const finServTransactionsDef: WidgetDef = {
  kind: 'finServTransactionsJSON',
  dtoField: 'finServTransactionsJSON',
  label: 'ASA Financial Services · Recent Transactions',
  defaults: { title: 'Your recent transactions', accountLabel: '', transactions: [], disputeText: 'Dispute this charge' } satisfies FinServTransactionsPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title' },
    { label: 'Account label', control: 'Text', bind: 'accountLabel', note: 'optional' },
    {
      label: 'Transactions',
      control: 'Transaction list',
      bind: 'transactions[]',
      note: 'empty → test-mode sample data',
      children: [
        { label: 'Id', control: 'Text', bind: 'transactions[].id', note: 'sent back when disputed' },
        { label: 'Merchant', control: 'Text', bind: 'transactions[].merchant' },
        { label: 'Date', control: 'Date (yyyy-mm-dd)', bind: 'transactions[].date' },
        { label: 'Amount', control: 'Number', bind: 'transactions[].amount', note: 'negative = debit, positive = credit' },
        { label: 'Currency', control: 'Text', bind: 'transactions[].currency', note: 'defaults to USD' },
        { label: 'Category', control: 'Select (Groceries | Dining | Travel | Shopping | Bills | Transfer | Income | Other)', bind: 'transactions[].category' },
        { label: 'Status', control: 'Select (Posted | Pending)', bind: 'transactions[].status', note: 'Pending shows a pill' },
        { label: 'Disputable', control: 'Checkbox', bind: 'transactions[].disputable', note: 'false → row disabled' },
      ],
    },
    { label: 'Dispute', control: 'Button', bind: 'disputeText', note: 'appears once a row is selected' },
  ],
  Editor: FinServTransactionsEditor,
  Preview: FinServTransactionsPreview,
};
