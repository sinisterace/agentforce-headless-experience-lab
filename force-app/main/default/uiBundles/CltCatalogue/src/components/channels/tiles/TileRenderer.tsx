import type { ReactNode } from 'react';
import {
  ArrowRight,
  Banknote,
  Building2,
  Calendar,
  Check,
  CircleDot,
  Clock,
  CreditCard,
  Landmark,
  Phone,
  Receipt,
  Send,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Video,
  Wallet,
} from 'lucide-react';

/**
 * A faithful-enough renderer for Slack's BuilderKit "tiles" — the declarative
 * tile tree Salesforce Custom Lightning Types compile to when they render in
 * Slack (as opposed to the LWC used in Enhanced Chat v2). It walks a node tree
 *   { definition: "tile/…", attributes?, children? }
 * and renders each primitive with Slack styling. Data is resolved into the tree
 * by the per-CLT tile builders (financialServicesTiles.ts) rather than left as
 * "{!$attrs.…}" bindings, since we render client-side with the payload in hand.
 *
 * Supported primitives: tile/mosaic, tile/container, tile/column, tile/row,
 * tile/text, tile/icon, tile/badge, tile/progress, tile/table, tile/button,
 * tile/divider.
 */

export type TileNode = {
  type?: string;
  definition: string;
  attributes?: Record<string, any>;
  children?: TileNode[];
};

const GAP: Record<string, string> = { none: '0', xs: '0.25rem', sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.5rem' };
const ALIGN: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch', baseline: 'baseline' };
const JUSTIFY: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between', around: 'space-around' };

const ICONS: Record<string, typeof Users> = {
  users: Users,
  user: User,
  check: Check,
  clock: Clock,
  'credit-card': CreditCard,
  card: CreditCard,
  wallet: Wallet,
  landmark: Landmark,
  bank: Landmark,
  building: Building2,
  business: Building2,
  calendar: Calendar,
  send: Send,
  arrow: ArrowRight,
  receipt: Receipt,
  cash: Banknote,
  account: Banknote,
  phone: Phone,
  video: Video,
  up: TrendingUp,
  down: TrendingDown,
};

const ICON_COLOR: Record<string, string> = {
  primary: '#611f69',
  success: '#2eb67d',
  warning: '#e8912d',
  info: '#1264a3',
  danger: '#e01e5a',
  muted: '#616061',
  default: '#1d1c1d',
};

const ICON_PX: Record<string, string> = { xs: '0.8rem', sm: '0.95rem', md: '1.15rem', lg: '1.45rem' };

function spacingStyle(a: Record<string, any> = {}): React.CSSProperties {
  const s: React.CSSProperties = {};
  if (a.gap != null) s.gap = GAP[a.gap] ?? a.gap;
  if (a.padding != null) s.padding = GAP[a.padding] ?? a.padding;
  if (a.align) s.alignItems = ALIGN[a.align] ?? a.align;
  if (a.justify) s.justifyContent = JUSTIFY[a.justify] ?? a.justify;
  if (a.wrap) s.flexWrap = 'wrap';
  return s;
}

function kids(node: TileNode): ReactNode {
  return (node.children ?? []).map((c, i) => <Tile key={i} node={c} />);
}

export function Tile({ node }: { node: TileNode }): ReactNode {
  const a = node.attributes ?? {};
  switch (node.definition) {
    case 'tile/mosaic':
      return <div className="slk-tile-mosaic">{kids(node)}</div>;

    case 'tile/container':
      return <div className="slk-tile-container" style={spacingStyle(a)}>{kids(node)}</div>;

    case 'tile/column':
      return <div className="slk-tile-col" style={spacingStyle(a)}>{kids(node)}</div>;

    case 'tile/row':
      return <div className="slk-tile-row" style={spacingStyle(a)}>{kids(node)}</div>;

    case 'tile/text': {
      const cls = `slk-tile-text slk-text-${a.variant ?? 'body'}${a.weight ? ` slk-weight-${a.weight}` : ''}${a.color ? ` slk-color-${a.color}` : ''}`;
      return <span className={cls}>{a.text}</span>;
    }

    case 'tile/icon': {
      const Ico = ICONS[a.name] ?? CircleDot;
      const size = ICON_PX[a.size ?? 'sm'] ?? ICON_PX.sm;
      return <Ico aria-hidden="true" style={{ width: size, height: size, color: ICON_COLOR[a.color ?? 'default'], flexShrink: 0 }} />;
    }

    case 'tile/badge':
      return <span className={`slk-tile-badge slk-badge-${a.variant ?? 'secondary'}`}>{a.label}</span>;

    case 'tile/progress': {
      const pct = Math.max(0, Math.min(100, (Number(a.value) / (Number(a.max) || 100)) * 100));
      return (
        <div className="slk-tile-progress">
          <div className="slk-tile-progress-track">
            <div className={`slk-tile-progress-fill slk-fill-${a.variant ?? 'primary'}`} style={{ width: `${pct}%` }} />
          </div>
          {a.showValue && <span className="slk-tile-progress-val">{Math.round(pct)}%</span>}
        </div>
      );
    }

    case 'tile/table': {
      const cols: { key: string; header: string }[] = a.columns ?? [];
      const rows: Record<string, any>[] = Array.isArray(a.rows) ? a.rows : [];
      return (
        <div className="slk-tile-table-wrap">
          <table className={`slk-tile-table${a.variant === 'striped' ? ' is-striped' : ''}${a.hoverable ? ' is-hover' : ''}`} aria-label={a.ariaLabel}>
            <thead>
              <tr>{cols.map((c) => <th key={c.key}>{c.header}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>{cols.map((c) => <td key={c.key} className={r[`${c.key}Class`] ? `slk-cell-${r[`${c.key}Class`]}` : undefined}>{r[c.key]}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'tile/button':
      return <button type="button" className={`slk-tile-btn slk-btn-${a.variant ?? 'default'}`}>{a.label}</button>;

    case 'tile/divider':
      return <hr className="slk-tile-divider" />;

    default:
      return kids(node);
  }
}

/** Root entry: render a mosaic node (or any node) as Slack tiles. */
export function TileCard({ node }: { node: TileNode }) {
  return <Tile node={node} />;
}
