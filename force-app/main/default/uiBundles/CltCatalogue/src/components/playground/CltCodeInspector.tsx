import { useEffect, useMemo, useState } from 'react';
import { Check, Code2, Copy, Sparkles } from 'lucide-react';
import type { Recommendation } from '@/types/catalog';
import { generateCltArtifacts } from './cltArtifacts';
import { highlightLine, type Lang } from './highlight';

const LANG_LABEL: Record<Lang, string> = { json: 'JSON', xml: 'XML', apex: 'Apex', js: 'JS', css: 'CSS', plain: 'Text' };

/**
 * The full Custom Lightning Type "package" inspector — the artifact set a real
 * Agentforce Lightning Type compiles to: Input · LT · Renderer · Apex · HTML · JS
 * · CSS · XML tabs plus the GenAiFunction action wrapper. Synthesized from the
 * catalogue row via {@link generateCltArtifacts}. Syntax-highlighted, line-wrapped,
 * stacked layout. Used on the Preview screen (full) and inside the Playground
 * panel (`embedded`, which drops the outer title header).
 */
export function CltCodeInspector({ recommendation, embedded = false }: { recommendation: Recommendation; embedded?: boolean }) {
  const artifacts = useMemo(() => generateCltArtifacts(recommendation), [recommendation]);
  const [activeKey, setActiveKey] = useState(artifacts.files[0].key);
  const [copied, setCopied] = useState(false);
  useEffect(() => { setActiveKey(artifacts.files[0].key); }, [artifacts]);
  const current = artifacts.files.find((f) => f.key === activeKey) ?? artifacts.files[0];
  // The CLT-package metadata (factbar + GenAiFunction action wrapper) is only
  // meaningful on the "Input" tab — the agent-input/action view. On the code
  // tabs (Renderer/Apex/HTML/JS/CSS/XML) it's noise and steals the vertical
  // space the code should fill, so scope it to the first tab.
  const isInputTab = activeKey === artifacts.files[0].key;

  async function copyCode() {
    await navigator.clipboard.writeText(current.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  const lines = current.content.replace(/\n$/, '').split('\n');

  return (
    <section className={embedded ? 'clt-code-inspector is-embedded' : 'clt-code-inspector'} aria-label="Custom Lightning Type package">
      {!embedded && (
        <div className="code-inspector-header">
          <div className="code-inspector-id"><span className="code-inspector-glyph" aria-hidden="true"><Code2 /></span><span><strong>Custom Lightning Type package</strong><small>{recommendation.cltApiName} · {recommendation.capabilityKey}</small></span></div>
        </div>
      )}

      <div className="code-tabbar" role="tablist" aria-label="Package files">
        <div className="code-tabs">
          {artifacts.files.map((f) => (
            <button type="button" role="tab" aria-selected={activeKey === f.key} className={activeKey === f.key ? 'active' : ''} onClick={() => setActiveKey(f.key)} key={f.key}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="code-editor">
        <div className="code-editor-tab">
          <span className="code-path">{current.path}</span>
          <span className="code-toolbar">
            <span className="code-lang">{LANG_LABEL[current.lang]}</span>
            <button type="button" className="code-copy" onClick={copyCode}>{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />} {copied ? 'Copied' : 'Copy'}</button>
          </span>
        </div>
        <pre className="code-pre">
          {lines.map((line, index) => {
            const toks = highlightLine(line, current.lang);
            return (
              <code key={`${activeKey}-${index}`}>
                <span className="ln" aria-hidden="true">{index + 1}</span>
                <span className="code-line">{toks.length ? toks.map((tok, j) => (tok.c ? <span key={j} className={tok.c}>{tok.t}</span> : <span key={j}>{tok.t}</span>)) : ' '}</span>
              </code>
            );
          })}
        </pre>
      </div>

      {isInputTab && (
        <>
          <div className="code-factbar">
            <span>Renderer <b>c/{artifacts.cltApiName}</b></span>
            <span>Apex DTO <b>{artifacts.apexClass}</b></span>
            <span>DTO field <b>{artifacts.dtoField}</b></span>
          </div>
          {/* isDeployed retained on artifacts for future use; badge intentionally removed. */}

          <div className="clt-action-wrapper">
            <div className="clt-aw-head"><Sparkles aria-hidden="true" /> Action wrapper <small>GenAiFunction</small></div>
            <dl className="clt-aw-grid">
              <div><dt>Master label</dt><dd>{artifacts.actionWrapper.masterLabel}</dd></div>
              <div><dt>Action description</dt><dd>{artifacts.actionWrapper.actionDescription}</dd></div>
              <div className="clt-aw-input"><dt>Input</dt><dd><pre>{artifacts.actionWrapper.inputDescription}</pre></dd></div>
            </dl>
          </div>
        </>
      )}
    </section>
  );
}
