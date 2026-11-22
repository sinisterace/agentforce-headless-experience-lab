/**
 * Shared presentation helpers for the ASA Manufacturing cards (Equipment
 * Monitor, Part Reorder, Work Order Tracker, Quote Builder). Split out of the
 * component files so React Fast Refresh stays happy. These mirror the deployed
 * LWCs exactly (same normalization + sparkline geometry + price math).
 *
 * Bundled product photography: the two constants below hold the same images the
 * ECv2 LWCs load via /resource/<Name>. They are populated once the image files
 * are added under src/assets/manufacturing/ (see the imports); until then they
 * are empty strings and the previews fall back to a drawn placeholder — exactly
 * like the LWC's onerror fallback.
 */
import trailblazerCell from '@/assets/manufacturing/trailblazer-cell.jpg';
import ioController from '@/assets/manufacturing/io-controller.png';

export const MFG_MACHINE_IMG: string = trailblazerCell;
export const MFG_PART_IMG: string = ioController;

/** Use an explicit payload image when provided, else the bundled sample photo
 *  when the URL points at the matching /resource/<Name>. Unknown URLs pass
 *  through so arbitrary agent payloads still resolve. */
export function mfgImage(imageUrl: string | undefined, fallbackBundled: string): string {
  const explicit = String(imageUrl || '').trim();
  if (!explicit) return '';
  if (explicit.startsWith('/resource/')) return fallbackBundled || '';
  return explicit;
}

export function initialsOf(name?: string): string {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return ((parts[0] ? parts[0][0] : '') + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

export function money(amount: number, currency = 'USD', maxFractionDigits = 2): string {
  const n = Number(amount);
  if (!isFinite(n)) return '';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: maxFractionDigits }).format(n);
  } catch {
    return `${currency} ${n.toFixed(maxFractionDigits)}`;
  }
}

/* ── Equipment Monitor ───────────────────────────────────────────────────── */

export type MachineStatus = 'running' | 'idle' | 'fault' | 'maintenance' | 'offline';
export const MACHINE_STATUS_LABELS: Record<MachineStatus, string> = {
  running: 'Running',
  idle: 'Idle',
  fault: 'Fault',
  maintenance: 'Maintenance',
  offline: 'Offline',
};

export function normMachineStatus(s?: string): MachineStatus {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'fault' || raw === 'error' || raw === 'alarm' || raw === 'down' || raw === 'stopped') return 'fault';
  if (raw === 'maintenance' || raw === 'service' || raw === 'servicing') return 'maintenance';
  if (raw === 'offline' || raw === 'disconnected') return 'offline';
  if (raw === 'idle' || raw === 'standby' || raw === 'paused') return 'idle';
  return 'running';
}

export type MetricState = 'good' | 'warn' | 'bad';
export function normMetricState(s?: string): MetricState {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'bad' || raw === 'critical' || raw === 'alarm' || raw === 'high') return 'bad';
  if (raw === 'warn' || raw === 'warning' || raw === 'caution') return 'warn';
  return 'good';
}

/** Build an SVG polyline path + area from a numeric series, in a 100x32 viewBox. */
export function sparkline(points: number[] | undefined): { line: string; area: string; lastX: number; lastY: number } | null {
  const nums = (Array.isArray(points) ? points : []).map((n) => Number(n)).filter((n) => isFinite(n));
  if (nums.length < 2) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const w = 100;
  const h = 32;
  const pad = 3;
  const step = (w - pad * 2) / (nums.length - 1);
  const pts = nums.map((n, i) => {
    const x = pad + i * step;
    const y = pad + (h - pad * 2) * (1 - (n - min) / span);
    return [Math.round(x * 100) / 100, Math.round(y * 100) / 100] as [number, number];
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const last = pts[pts.length - 1];
  const area = `${line} L${last[0]},${h} L${pts[0][0]},${h} Z`;
  return { line, area, lastX: last[0], lastY: last[1] };
}

/* ── Work Order ──────────────────────────────────────────────────────────── */

export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export const PRIORITY_LABELS: Record<Priority, string> = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' };
export function normPriority(p?: string): Priority {
  const raw = String(p || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'urgent' || raw === 'critical' || raw === 'rush' || raw === 'expedite') return 'urgent';
  if (raw === 'high') return 'high';
  if (raw === 'low') return 'low';
  return 'normal';
}

export type MilestoneState = 'done' | 'current' | 'todo';
export function normMilestoneState(s?: string): MilestoneState {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'done' || raw === 'complete' || raw === 'completed') return 'done';
  if (raw === 'current' || raw === 'active' || raw === 'inprogress' || raw === 'progress') return 'current';
  return 'todo';
}
