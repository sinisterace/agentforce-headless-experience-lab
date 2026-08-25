import type { PseProgramsFinderPayload } from '../payloads';
import { PseProgramsFinderPreview } from '../PseProgramsFinderEditor';
import type { WidgetDef } from './types';

/** asaPseProgramsFinder — selectable cards of programs/benefits/scholarships the person may qualify for. */
export const pseProgramsFinderDef: WidgetDef = {
  kind: 'pseProgramsFinderJSON',
  dtoField: 'pseProgramsFinderJSON',
  label: 'ASA Public Sector & Education · Programs & Benefits Finder',
  defaults: { title: 'Programs & benefits you may qualify for', programs: [] } satisfies PseProgramsFinderPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Subtitle', control: 'Text', bind: 'subtitle', note: 'optional' },
    { label: 'Programs', control: 'List', bind: 'programs', note: 'empty → test-mode sample' },
    { label: 'Program', control: 'Object', bind: 'programs[]', note: 'id, name, category?, detail?, eligibility?, badge?' },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'default "Apply for selected"' },
  ],
  Preview: PseProgramsFinderPreview,
};
