import { CornerDownRight } from 'lucide-react';
import type { StructureNode } from './widgets/types';

/**
 * Middle pane: an HXL-style breakdown of the CLT's structure. Renders the
 * authored descriptor as a nested tree — each row is a field with its control
 * type and the payload path it binds to. A row is marked "live" when its bound
 * data is currently populated, so the tree reflects the actual payload.
 */

/**
 * Resolve a bind path against the live payload for the "live" indicator.
 * Handles dotted paths ("buttonText.next") and a trailing "[]" ("items[]" →
 * populated when the array is non-empty). Paths with "[]" in the middle
 * ("items[].name") describe per-row fields and aren't resolved to a value.
 */
function isPopulated(payload: unknown, bind: string): boolean | null {
  if (!bind || bind === '—') return null;
  const wantsArray = bind.endsWith('[]');
  const path = wantsArray ? bind.slice(0, -2) : bind;
  if (path.includes('[]')) return null; // per-row field — informational only

  let current: unknown = payload;
  for (const key of path.split('.')) {
    if (current == null || typeof current !== 'object') return false;
    current = (current as Record<string, unknown>)[key];
  }

  if (wantsArray) return Array.isArray(current) && current.length > 0;
  if (Array.isArray(current)) return current.length > 0;
  if (typeof current === 'string') return current.trim().length > 0;
  return current != null && current !== '';
}

function StructureRow({
  node,
  payload,
  depth,
}: {
  node: StructureNode;
  payload: unknown;
  depth: number;
}) {
  const live = isPopulated(payload, node.bind);
  return (
    <>
      <div
        className={`clt-structure-node${live === true ? ' is-live' : ''}`}
        style={{ '--depth': depth } as React.CSSProperties}
      >
        {depth > 0 && <CornerDownRight className="clt-structure-branch" aria-hidden="true" />}
        <span className="clt-structure-label">{node.label}</span>
        <span className="clt-structure-control">{node.control}</span>
        <code className="clt-structure-bind">{node.bind}</code>
        {node.note && <em className="clt-structure-note">{node.note}</em>}
      </div>
      {node.children?.map((child, index) => (
        <StructureRow key={`${child.label}-${index}`} node={child} payload={payload} depth={depth + 1} />
      ))}
    </>
  );
}

export function StructurePane({ nodes, payload }: { nodes: StructureNode[]; payload: unknown }) {
  return (
    <div className="clt-structure-tree" role="tree" aria-label="Widget structure">
      {nodes.map((node, index) => (
        <StructureRow key={`${node.label}-${index}`} node={node} payload={payload} depth={0} />
      ))}
    </div>
  );
}
