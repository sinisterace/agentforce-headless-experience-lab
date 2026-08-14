import type { ComponentType } from 'react';
import type { CltKind } from '../payloads';

/**
 * One node in a CLT's authored structure descriptor (Option B — hand-authored,
 * not derived from the live JSON). Each node maps a human-facing field to the
 * control that edits it and the payload path it binds to, so the Structure pane
 * can render an HXL-style breakdown of "what makes up this widget."
 */
export type StructureNode = {
  /** Human label, e.g. "Title", "Selection mode", "Options". */
  label: string;
  /** Control kind shown in the tree, e.g. "Text", "Segmented (single|multiple)", "Pill list". */
  control: string;
  /** Payload path this node binds to, e.g. "title", "mode", "items[]". Use "—" when unbound. */
  bind: string;
  /** Optional caveat, e.g. "multiple mode only", "empty → test-mode sample data". */
  note?: string;
  /** Nested nodes, e.g. the fields inside each item of a list. */
  children?: StructureNode[];
};

/** Props every CLT editor accepts (all current editors already match this). */
export type EditorProps = {
  value: any;
  onChange: (next: any) => void;
  accentColor: string;
};

/** Props every CLT preview accepts. */
export type PreviewProps = {
  value: any;
  accentColor: string;
};

/**
 * Everything the playground needs to render one CLT. Adding a new CLT means
 * adding one WidgetDef file and one registry line — CltPlayground never changes.
 */
export type WidgetDef = {
  kind: CltKind;
  /** LWC-true DTO field name, e.g. "itemSelectorJSON". */
  dtoField: string;
  /** Fallback display label if the catalogue row has none. */
  label: string;
  /** Seed payload merged under the catalogue row's Default_Payload_JSON__c. */
  defaults: unknown;
  /** Authored structure breakdown shown in the middle pane. */
  structure: StructureNode[];
  Editor: ComponentType<EditorProps>;
  Preview: ComponentType<PreviewProps>;
};
