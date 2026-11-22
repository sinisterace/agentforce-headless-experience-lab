import { useState } from 'react';
import { FileStack } from 'lucide-react';
import type { MfgEquipmentMonitorPayload } from './payloads';
import {
  MACHINE_STATUS_LABELS,
  MFG_MACHINE_IMG,
  initialsOf,
  mfgImage,
  normMachineStatus,
  normMetricState,
  sparkline,
} from './mfgFormat';

/**
 * Live preview for the ASA Manufacturing · Equipment Monitor CLT (DTO field
 * mfgEquipmentMonitorJSON). An empty asset + metrics drops the preview into a
 * test-mode fallback so it renders with no payload — mirroring the LWC.
 */

const TEST: MfgEquipmentMonitorPayload = {
  title: 'Machine health',
  asset: { name: 'Assembly Cell', model: 'TB-9000', assetId: 'LINE-3', location: 'Plant 2 · Bay 4', imageUrl: '/resource/asaMfgTrailblazerCell' },
  status: 'running',
  statusLabel: 'Running',
  updatedText: 'Live · updated 12s ago',
  metrics: [
    { label: 'OEE', value: '87', unit: '%', state: 'good' },
    { label: 'Spindle temp', value: '62', unit: '°C', state: 'warn' },
    { label: 'Throughput', value: '142', unit: '/hr', state: 'good' },
    { label: 'Uptime', value: '6d 4h', state: 'good' },
  ],
  trend: { label: 'OEE · last 12h', points: [72, 78, 74, 80, 83, 81, 85, 84, 86, 88, 87, 87] },
  submitText: 'Create work order',
};

/** Faithful preview: mirrors the Equipment Monitor LWC, including test-mode fallback + sparkline. */
export function MfgEquipmentMonitorPreview({ value, accentColor }: { value: MfgEquipmentMonitorPayload; accentColor: string }) {
  const hasAsset = !!(value.asset && value.asset.name);
  const hasMetrics = Array.isArray(value.metrics) && value.metrics.length > 0;
  const isTestMode = !hasAsset && !hasMetrics;
  const src = isTestMode ? TEST : value;

  const title = (src.title && src.title.trim()) || 'Machine health';
  const asset = src.asset || { name: 'Asset' };
  const status = normMachineStatus(src.status);
  const statusLabel = (src.statusLabel && src.statusLabel.trim()) || MACHINE_STATUS_LABELS[status];
  const img = mfgImage(asset.imageUrl, MFG_MACHINE_IMG);
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = !!img && !imgFailed;
  const meta = [asset.model, asset.assetId, asset.location].filter(Boolean).join(' · ');
  const metrics = (src.metrics ?? []).filter((m) => m && m.label).slice(0, 4);
  const spark = sparkline(src.trend?.points);

  return (
    <div className="clt-live-preview equipment-monitor-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      <div className="asa-eq-head">
        <h3 className="selector-title">{title}</h3>
        {src.updatedText && <span className="asa-eq-updated"><span className="asa-eq-live-dot" aria-hidden="true" />{src.updatedText}</span>}
      </div>

      <div className="asa-eq-asset">
        <span className="asa-eq-media">
          {showImg ? <img src={img} alt={asset.name} onError={() => setImgFailed(true)} /> : <span className="asa-eq-media-fallback" aria-hidden="true">{initialsOf(asset.name)}</span>}
        </span>
        <div className="asa-eq-asset-body">
          <span className="asa-eq-asset-text">
            <span className="asa-eq-asset-name">{asset.name}</span>
            {meta && <span className="asa-eq-asset-meta">{meta}</span>}
          </span>
          <span className={`asa-eq-status is-${status}`}><span className="asa-eq-status-dot" aria-hidden="true" />{statusLabel}</span>
        </div>
      </div>

      <div className="asa-eq-metrics">
        {metrics.map((m, i) => (
          <div key={i} className={`asa-eq-tile is-${normMetricState(m.state)}`}>
            <span className="asa-eq-tile-label">{m.label}</span>
            <span className="asa-eq-tile-value">{m.value}{m.unit && <span className="asa-eq-tile-unit">{m.unit}</span>}</span>
          </div>
        ))}
      </div>

      {spark && (
        <div className="asa-eq-trend">
          {src.trend?.label && <span className="asa-eq-trend-label">{src.trend.label}</span>}
          <svg className="asa-eq-spark" viewBox="0 0 100 32" preserveAspectRatio="none" role="img" aria-label="Trend">
            <path className="asa-eq-spark-area" d={spark.area} />
            <path className="asa-eq-spark-line" d={spark.line} />
            <circle className="asa-eq-spark-dot" cx={spark.lastX} cy={spark.lastY} r="2.4" />
          </svg>
        </div>
      )}

      {src.submitText && (
        <button type="button" className="asa-eq-cta"><FileStack aria-hidden="true" /> {src.submitText}</button>
      )}
    </div>
  );
}
