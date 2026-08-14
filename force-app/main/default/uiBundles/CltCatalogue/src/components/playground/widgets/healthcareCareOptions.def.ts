import type { HealthcareCareOptionsPayload } from '../payloads';
import { HealthcareCareOptionsEditor, HealthcareCareOptionsPreview } from '../HealthcareCareOptionsEditor';
import type { WidgetDef } from './types';

/** asaHealthcareCareOptions — route the customer to the right care channel (nurse line, video, in-person, ER). */
export const healthcareCareOptionsDef: WidgetDef = {
  kind: 'healthcareCareOptionsJSON',
  dtoField: 'healthcareCareOptionsJSON',
  label: 'ASA Healthcare · Care Options',
  defaults: { title: 'How would you like to get care?', subtitle: '', options: [] } satisfies HealthcareCareOptionsPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title' },
    { label: 'Subtitle', control: 'Text', bind: 'subtitle', note: 'optional' },
    {
      label: 'Options',
      control: 'Channel rows',
      bind: 'options[]',
      note: 'empty → test-mode sample data',
      children: [
        { label: 'Id', control: 'Text', bind: 'options[].id', note: 'sent back on a book action' },
        { label: 'Channel', control: 'Select (nurse_line | video | in_person | urgent | er | pharmacy | message)', bind: 'options[].channel' },
        { label: 'Label', control: 'Text', bind: 'options[].label' },
        { label: 'Description', control: 'Text', bind: 'options[].description', note: 'optional' },
        { label: 'Meta tag', control: 'Text', bind: 'options[].meta', note: 'optional' },
        { label: 'Recommended', control: 'Boolean', bind: 'options[].recommended', note: 'ribbon' },
        { label: 'Action type', control: 'Select (call | link | book)', bind: 'options[].actionType' },
        { label: 'Action value', control: 'Text', bind: 'options[].actionValue', note: 'phone / URL / message' },
      ],
    },
    { label: 'Disclaimer', control: 'Text', bind: 'disclaimer', note: 'optional footnote' },
  ],
  Editor: HealthcareCareOptionsEditor,
  Preview: HealthcareCareOptionsPreview,
};
