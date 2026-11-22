import type { LegalPracticeAreasPayload } from '../payloads';
import { LegalPracticeAreasPreview } from '../LegalPracticeAreasEditor';
import type { WidgetDef } from './types';

/** asaLegalPracticeAreas — an expandable "How can we help?" practice-area guide for a law-firm site agent. */
export const legalPracticeAreasDef: WidgetDef = {
  kind: 'legalPracticeAreasJSON',
  dtoField: 'legalPracticeAreasJSON',
  label: 'ASA Legal · Practice-Area Selector',
  defaults: { title: 'How can we help?', areas: [] } satisfies LegalPracticeAreasPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Subtitle', control: 'Text', bind: 'subtitle', note: 'optional' },
    {
      label: 'Practice areas',
      control: 'Expandable list',
      bind: 'areas[]',
      note: 'empty → test-mode sample',
      children: [
        { label: 'Id', control: 'Text', bind: 'areas[].id', note: 'sent back on selection' },
        { label: 'Name', control: 'Text', bind: 'areas[].name' },
        { label: 'Blurb', control: 'Text', bind: 'areas[].blurb', note: 'optional one-liner' },
        { label: 'Icon', control: 'Text', bind: 'areas[].icon', note: 'injury|family|estate|business|immigration|criminal|employment|realestate|other' },
        { label: 'Description', control: 'Text', bind: 'areas[].description', note: 'shown when expanded' },
        { label: 'Services', control: 'Pill list', bind: 'areas[].services', note: 'common matter types' },
        { label: 'Stat', control: 'Text', bind: 'areas[].stat', note: 'trust signal, e.g. "$50M+ recovered"' },
        { label: 'Link', control: 'Text', bind: 'areas[].href', note: 'firm\'s page — shown as a display-only "Learn more" (not clickable)' },
      ],
    },
    { label: 'Link label', control: 'Text', bind: 'linkText', note: 'default "Learn more"' },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'use {name} to interpolate the area' },
  ],
  Preview: LegalPracticeAreasPreview,
};
