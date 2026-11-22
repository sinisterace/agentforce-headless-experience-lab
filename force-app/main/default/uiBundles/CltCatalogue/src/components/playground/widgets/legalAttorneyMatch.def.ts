import type { LegalAttorneyMatchPayload } from '../payloads';
import { LegalAttorneyMatchPreview } from '../LegalAttorneyMatchEditor';
import type { WidgetDef } from './types';

/** asaLegalAttorneyMatch — attorney cards matched to the matter, building trust and handing off to booking. */
export const legalAttorneyMatchDef: WidgetDef = {
  kind: 'legalAttorneyMatchJSON',
  dtoField: 'legalAttorneyMatchJSON',
  label: 'ASA Legal · Meet Your Attorney',
  defaults: { title: 'Meet your attorney', attorneys: [] } satisfies LegalAttorneyMatchPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Subtitle', control: 'Text', bind: 'subtitle', note: 'optional' },
    {
      label: 'Attorneys',
      control: 'Card list',
      bind: 'attorneys[]',
      note: 'empty → test-mode sample',
      children: [
        { label: 'Id', control: 'Text', bind: 'attorneys[].id', note: 'sent back on selection' },
        { label: 'Name', control: 'Text', bind: 'attorneys[].name' },
        { label: 'Title', control: 'Text', bind: 'attorneys[].title', note: 'e.g. Managing Partner' },
        { label: 'Focus', control: 'Text', bind: 'attorneys[].focus', note: 'practice focus' },
        { label: 'Photo', control: 'Text (URL)', bind: 'attorneys[].photo', note: 'falls back to initials' },
        { label: 'Years', control: 'Number', bind: 'attorneys[].years' },
        { label: 'Rating', control: 'Number (0–5)', bind: 'attorneys[].rating' },
        { label: 'Cases', control: 'Text', bind: 'attorneys[].casesWon', note: 'e.g. 500+ cases' },
        { label: 'Bar', control: 'Text', bind: 'attorneys[].bar', note: 'e.g. CA #148203' },
        { label: 'Blurb', control: 'Text', bind: 'attorneys[].blurb', note: 'optional' },
      ],
    },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'optional' },
  ],
  Preview: LegalAttorneyMatchPreview,
};
