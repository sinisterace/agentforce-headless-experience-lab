import type { AutoConfiguratorPayload } from '../payloads';
import { AutoConfiguratorPreview } from '../AutoConfiguratorEditor';
import type { WidgetDef } from './types';

/** asaAutoConfigurator — build-and-price vehicle configurator (color swatches + option groups + live total). */
export const autoConfiguratorDef: WidgetDef = {
  kind: 'autoConfiguratorJSON',
  dtoField: 'autoConfiguratorJSON',
  label: 'ASA Automotive · Vehicle Configurator',
  defaults: { title: 'Build your vehicle', optionGroups: [] } satisfies AutoConfiguratorPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    { label: 'Model', control: 'Text', bind: 'model', note: 'optional' },
    { label: 'Base price', control: 'Number', bind: 'basePrice', note: 'estimate builds up from here' },
    { label: 'Colors', control: 'Swatch list', bind: 'colors[]', note: 'single-select paint swatches; empty + no groups → test-mode sample' },
    { label: 'Option groups', control: 'Chip groups', bind: 'optionGroups[]', note: 'each single-select, price deltas' },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'optional' },
  ],
  Preview: AutoConfiguratorPreview,
};
