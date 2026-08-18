import type { MfgEquipmentMonitorPayload } from '../payloads';
import { MfgEquipmentMonitorPreview } from '../MfgEquipmentMonitorEditor';
import type { WidgetDef } from './types';

/** asaMfgEquipmentMonitor — asset health tiles + trend sparkline. */
export const mfgEquipmentMonitorDef: WidgetDef = {
  kind: 'mfgEquipmentMonitorJSON',
  dtoField: 'mfgEquipmentMonitorJSON',
  label: 'ASA Manufacturing · Equipment Monitor',
  defaults: { title: 'Machine health', asset: { name: '' }, metrics: [] } satisfies MfgEquipmentMonitorPayload,
  structure: [
    { label: 'Title', control: 'Text', bind: 'title', note: 'optional' },
    {
      label: 'Asset',
      control: 'Group',
      bind: 'asset',
      note: 'empty → test-mode sample data',
      children: [
        { label: 'Name', control: 'Text', bind: 'asset.name' },
        { label: 'Model', control: 'Text', bind: 'asset.model', note: 'optional' },
        { label: 'Asset ID', control: 'Text', bind: 'asset.assetId', note: 'optional' },
        { label: 'Location', control: 'Text', bind: 'asset.location', note: 'optional' },
        { label: 'Image URL', control: 'Text', bind: 'asset.imageUrl', note: 'blank → initials' },
      ],
    },
    { label: 'Status', control: 'Select (running | idle | fault | maintenance | offline)', bind: 'status' },
    { label: 'Updated', control: 'Text', bind: 'updatedText', note: 'freshness line' },
    {
      label: 'Metrics',
      control: 'Metric tiles (up to 4)',
      bind: 'metrics[]',
      children: [
        { label: 'Label', control: 'Text', bind: 'metrics[].label' },
        { label: 'Value', control: 'Text/Number', bind: 'metrics[].value' },
        { label: 'Unit', control: 'Text', bind: 'metrics[].unit', note: 'optional' },
        { label: 'State', control: 'Select (good | warn | bad)', bind: 'metrics[].state' },
      ],
    },
    { label: 'Trend', control: 'Sparkline', bind: 'trend.points', note: '2+ numbers' },
    { label: 'Submit label', control: 'Text', bind: 'submitText', note: 'optional' },
  ],
  Preview: MfgEquipmentMonitorPreview,
};
