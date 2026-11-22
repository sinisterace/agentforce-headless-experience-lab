import type { HvacSystemHealthPayload } from '../payloads';
import { HvacSystemHealthPreview } from '../HvacSystemHealthEditor';
import type { WidgetDef } from './types';

/** asaHvacSystemHealth — whole-home comfort system health report with a score gauge. */
export const hvacSystemHealthDef: WidgetDef = {
  kind: 'hvacSystemHealthJSON',
  dtoField: 'hvacSystemHealthJSON',
  label: 'ASA HVAC · Comfort System Health Report',
  // Structural empties only — never seed `score` here, or the empty→test-mode
  // fallback is suppressed and the dispatch test breaks.
  defaults: { title: 'Your comfort system checkup', systems: [] } satisfies HvacSystemHealthPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Score', control: 'Number', bind: 'score', note: '0–100; empty → test-mode sample' },
    { label: 'Score label', control: 'Text', bind: 'scoreLabel', note: 'optional; derived from score' },
    { label: 'Status line', control: 'Text', bind: 'statusText', note: 'optional' },
    { label: 'Updated', control: 'Text', bind: 'updatedText', note: 'optional' },
    { label: 'Systems', control: 'List', bind: 'systems[]', note: 'label + status(good|watch|due|fault) + detail? + icon?' },
    { label: 'Filter life', control: 'Object', bind: 'filter', note: 'lifePct 0–100 + daysLeft? + label?' },
    { label: 'Next service', control: 'Text', bind: 'nextServiceText', note: 'optional' },
    { label: 'Recommendation', control: 'Text', bind: 'recommendationText', note: 'optional' },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'optional' },
  ],
  Preview: HvacSystemHealthPreview,
};
