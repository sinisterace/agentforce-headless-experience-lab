import type { HvacThermostatPayload } from '../payloads';
import { HvacThermostatPreview } from '../HvacThermostatEditor';
import type { WidgetDef } from './types';

/** asaHvacThermostat — a smart thermostat rendered as a circular climate dial. */
export const hvacThermostatDef: WidgetDef = {
  kind: 'hvacThermostatJSON',
  dtoField: 'hvacThermostatJSON',
  label: 'ASA HVAC · Smart Thermostat Control',
  // Structural empty only — do NOT seed currentTemp/presets or the empty→test-mode
  // fallback is suppressed (the playground merges {...defaults, ...payload}).
  defaults: { title: 'Thermostat' } satisfies HvacThermostatPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional — zone name' },
    { label: 'Current temp', control: 'Number', bind: 'currentTemp', note: 'required — empty → test-mode sample' },
    { label: 'Target temp', control: 'Number', bind: 'targetTemp', note: 'defaults to current' },
    { label: 'Mode', control: 'Text', bind: 'mode', note: 'heat|cool|auto|off|fan' },
    { label: 'Unit', control: 'Text', bind: 'unit', note: 'F|C' },
    { label: 'Humidity', control: 'Number', bind: 'humidity', note: 'optional %' },
    { label: 'Status', control: 'Text', bind: 'statusText', note: 'optional' },
    { label: 'Min / Max', control: 'Number', bind: 'minTemp / maxTemp', note: 'dial bounds' },
    {
      label: 'Presets',
      control: 'List',
      bind: 'presets[]',
      note: 'quick-set chips',
      children: [
        { label: 'Id', control: 'Text', bind: 'id' },
        { label: 'Label', control: 'Text', bind: 'label' },
        { label: 'Target', control: 'Number', bind: 'targetTemp' },
        { label: 'Mode', control: 'Text', bind: 'mode', note: 'optional' },
      ],
    },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'optional' },
  ],
  Preview: HvacThermostatPreview,
};
