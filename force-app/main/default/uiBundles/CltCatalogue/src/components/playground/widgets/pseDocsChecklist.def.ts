import type { PseDocsChecklistPayload } from '../payloads';
import { PseDocsChecklistPreview } from '../PseDocsChecklistEditor';
import type { WidgetDef } from './types';

/** asaPseDocsChecklist — multi-select the documents needed for an application/enrollment. */
export const pseDocsChecklistDef: WidgetDef = {
  kind: 'pseDocsChecklistJSON',
  dtoField: 'pseDocsChecklistJSON',
  label: 'ASA Public Sector & Education · Documents Checklist',
  defaults: { title: "Documents you'll need", documents: [] } satisfies PseDocsChecklistPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title' },
    { label: 'Subtitle', control: 'Text', bind: 'subtitle', note: 'optional' },
    {
      label: 'Documents',
      control: 'Checklist',
      bind: 'documents[]',
      note: 'empty → test-mode sample data',
      children: [
        { label: 'Id', control: 'Text', bind: 'documents[].id', note: 'sent back on selection' },
        { label: 'Name', control: 'Text', bind: 'documents[].name' },
        { label: 'Detail', control: 'Text', bind: 'documents[].detail', note: 'optional' },
        { label: 'Status', control: 'Select (required | received | optional)', bind: 'documents[].status', note: "'received' → checked, not selectable" },
      ],
    },
    { label: 'Submit', control: 'Button', bind: 'submitText' },
  ],
  Preview: PseDocsChecklistPreview,
};
