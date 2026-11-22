import type { LegalCaseEvaluationPayload } from '../payloads';
import { LegalCaseEvaluationPreview } from '../LegalCaseEvaluationEditor';
import type { WidgetDef } from './types';

/** asaLegalCaseEvaluation — a guided "free case review" intake with an accurate no-attorney–client-relationship disclaimer. */
export const legalCaseEvaluationDef: WidgetDef = {
  kind: 'legalCaseEvaluationJSON',
  dtoField: 'legalCaseEvaluationJSON',
  label: 'ASA Legal · Free Case Evaluation',
  defaults: { title: 'Free case review', questions: [] } satisfies LegalCaseEvaluationPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Subtitle', control: 'Text', bind: 'subtitle', note: 'optional' },
    { label: 'Matter', control: 'Text', bind: 'matter', note: 'practice-area banner' },
    {
      label: 'Questions',
      control: 'List',
      bind: 'questions[]',
      note: 'empty → test-mode sample',
      children: [
        { label: 'Id', control: 'Text', bind: 'questions[].id' },
        { label: 'Label', control: 'Text', bind: 'questions[].label' },
        { label: 'Type', control: 'Select (choice | date)', bind: 'questions[].type', note: 'defaults to choice' },
        { label: 'Options', control: 'Pill list', bind: 'questions[].options', note: 'choice type only' },
      ],
    },
    { label: 'Describe label', control: 'Text', bind: 'describeLabel', note: 'optional' },
    { label: 'Describe placeholder', control: 'Text', bind: 'describePlaceholder', note: 'optional' },
    { label: 'Consent text', control: 'Text', bind: 'consentText', note: 'checkbox label (Privacy / Terms)' },
    { label: 'Disclaimer', control: 'Text', bind: 'disclaimer', note: 'no attorney–client relationship note' },
    { label: 'Footer note', control: 'Text', bind: 'footerNote', note: 'e.g. response time' },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'optional' },
  ],
  Preview: LegalCaseEvaluationPreview,
};
