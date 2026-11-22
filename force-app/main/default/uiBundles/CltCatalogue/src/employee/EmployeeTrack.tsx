import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Hammer,
  MoreVertical,
  Sparkle,
  TreePine,
  Users,
} from 'lucide-react';
import df26SalesforceCloud from '@/assets/brand/df26/salesforce-cloud-3d.png';
import df26Agentforce3d from '@/assets/brand/df26/agentforce-3d.png';
import df26Openai from '@/assets/brand/df26/openai.png';
import df26OpenaiLight from '@/assets/brand/df26/openai-light.png';
import df26Claude from '@/assets/brand/df26/claude-color.png';
import df26Slack from '@/assets/brand/df26/slack.png';
import agentforceAvatar from '@/assets/brand/df26/agentforce-avatar.png';
import { StructurePane } from '@/components/playground/StructurePane';
import { CltCodeInspector } from '@/components/playground/CltCodeInspector';
import { DEPARTMENTS, DEFAULT_DEPARTMENT, type Department } from './departments';
import type { EmployeeFunction } from './functions';
import { EcwSalesPipelineCard } from './cards/EcwSalesPipelineCard';
import { EcwNeedsAttentionCard } from './cards/EcwNeedsAttentionCard';
import { EcwForecastCard } from './cards/EcwForecastCard';
import { EcwWhatChangedCard } from './cards/EcwWhatChangedCard';
import { EcwSystemStatusCard } from './cards/EcwSystemStatusCard';
import { EcwKnownIssuesCard } from './cards/EcwKnownIssuesCard';
import { EcwChangeCalendarCard } from './cards/EcwChangeCalendarCard';
import { EcwMyItRequestsCard } from './cards/EcwMyItRequestsCard';
import { EcwBudgetActualCard } from './cards/EcwBudgetActualCard';
import { EcwApApprovalsCard } from './cards/EcwApApprovalsCard';
import { EcwArAgingCard } from './cards/EcwArAgingCard';
import { EcwMonthEndCloseCard } from './cards/EcwMonthEndCloseCard';
import { EcwHeadcountCard } from './cards/EcwHeadcountCard';
import { EcwOpenRolesCard } from './cards/EcwOpenRolesCard';
import { EcwTimeOffCard } from './cards/EcwTimeOffCard';
import { EcwOnboardingCard } from './cards/EcwOnboardingCard';
import { EcwFieldDispatchCard } from './cards/EcwFieldDispatchCard';
import { EcwEscalationCard } from './cards/EcwEscalationCard';
import { EcwCase360Card } from './cards/EcwCase360Card';
import { EcwCsatPulseCard } from './cards/EcwCsatPulseCard';
import { EcwCampaignFunnelCard } from './cards/EcwCampaignFunnelCard';
import { EcwPerformanceMatrixCard } from './cards/EcwPerformanceMatrixCard';
import { EcwAbTestCard } from './cards/EcwAbTestCard';
import { EcwAudienceExplorerCard } from './cards/EcwAudienceExplorerCard';
import { employeeRecommendation, payloadForFunction, structureForFunction } from './cardData';

/** Which audience the catalogue is currently showing. Lives in CatalogueApp and
 *  persists as a lens across the results → preview → build journey. */
export type Audience = 'customer' | 'employee';

/**
 * The dual-track reveal. Framed as *who the agent serves* rather than a technical
 * fork, so the intake stays as simple as before.
 */
export function AudienceSwitch({ value, onChange }: { value: Audience; onChange: (a: Audience) => void }) {
  return (
    <div className="audience-switch" role="group" aria-label="Who is this agent for?">
      <span className="audience-switch-label">Who is this agent for?</span>
      <div className="audience-switch-track">
        <button
          type="button"
          className={value === 'customer' ? 'audience-tab is-active' : 'audience-tab'}
          aria-pressed={value === 'customer'}
          onClick={() => onChange('customer')}
        >
          <Users aria-hidden="true" /> For customers
        </button>
        <button
          type="button"
          className={value === 'employee' ? 'audience-tab is-active' : 'audience-tab'}
          aria-pressed={value === 'employee'}
          onClick={() => onChange('employee')}
        >
          <Building2 aria-hidden="true" /> For your team
        </button>
      </div>
    </div>
  );
}

/** A read-only labelled row inside the generic card. */
function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="emp-field">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/**
 * The generic card an employee agent renders — styled like a native Coworker
 * record card. Bespoke cards (e.g. Sales · My pipeline) bypass this via
 * {@link CardForFunction}.
 */
function EmployeeCardPreview({ fn }: { fn: EmployeeFunction }) {
  function onSubmit(e: FormEvent) {
    e.preventDefault();
  }
  return (
    <form className="emp-card" onSubmit={onSubmit}>
      <header className="emp-card-head">
        <span className="emp-card-glyph" aria-hidden="true"><fn.icon /></span>
        <div>
          <span className="emp-card-fn">{fn.fn}</span>
          <strong>{fn.label}</strong>
        </div>
      </header>

      {fn.stat && (
        <div className="emp-stat">
          <span className="emp-stat-label">{fn.stat.label}</span>
          <strong className="emp-stat-value">{fn.stat.value}</strong>
        </div>
      )}

      {fn.fields.length > 0 && (
        <dl className="emp-fields">
          {fn.fields.map((f) => <FieldRow key={f.label} label={f.label} value={f.value} />)}
        </dl>
      )}

      {fn.inputs.length > 0 && (
        <div className="emp-inputs">
          {fn.inputs.map((input) => (
            <label className="emp-input" key={input.label}>
              <span className="emp-input-label">{input.label}</span>
              {input.kind === 'select' && (
                <select defaultValue={input.value}>
                  {input.options.map((opt) => <option key={opt}>{opt}</option>)}
                </select>
              )}
              {input.kind === 'text' && <input type="text" placeholder={input.placeholder} defaultValue={input.value} />}
              {input.kind === 'date' && <input type="date" defaultValue={input.value} />}
            </label>
          ))}
        </div>
      )}

      <div className={fn.secondaryAction ? 'emp-actions is-split' : 'emp-actions'}>
        {fn.secondaryAction && <button type="button" className="emp-action-secondary">{fn.secondaryAction}</button>}
        <button type="submit" className="emp-action-primary">{fn.action}</button>
      </div>
    </form>
  );
}

/** Route to the bespoke card when a function declares one, else the generic card. */
function CardForFunction({ fn }: { fn: EmployeeFunction }) {
  if (fn.customCard === 'salesPipeline') return <EcwSalesPipelineCard value={fn.pipeline} />;
  if (fn.customCard === 'needsAttention') return <EcwNeedsAttentionCard value={fn.cardPayload as never} />;
  if (fn.customCard === 'forecast') return <EcwForecastCard value={fn.cardPayload as never} />;
  if (fn.customCard === 'whatChanged') return <EcwWhatChangedCard value={fn.cardPayload as never} />;
  if (fn.customCard === 'systemStatus') return <EcwSystemStatusCard value={fn.cardPayload as never} />;
  if (fn.customCard === 'knownIssues') return <EcwKnownIssuesCard value={fn.cardPayload as never} />;
  if (fn.customCard === 'changeCalendar') return <EcwChangeCalendarCard value={fn.cardPayload as never} />;
  if (fn.customCard === 'myItRequests') return <EcwMyItRequestsCard value={fn.cardPayload as never} />;
  if (fn.customCard === 'budgetActual') return <EcwBudgetActualCard value={fn.cardPayload as never} />;
  if (fn.customCard === 'apApprovals') return <EcwApApprovalsCard value={fn.cardPayload as never} />;
  if (fn.customCard === 'arAging') return <EcwArAgingCard value={fn.cardPayload as never} />;
  if (fn.customCard === 'monthEndClose') return <EcwMonthEndCloseCard value={fn.cardPayload as never} />;
  if (fn.customCard === 'headcount') return <EcwHeadcountCard value={fn.cardPayload as never} />;
  if (fn.customCard === 'openRoles') return <EcwOpenRolesCard value={fn.cardPayload as never} />;
  if (fn.customCard === 'timeOff') return <EcwTimeOffCard value={fn.cardPayload as never} />;
  if (fn.customCard === 'onboarding') return <EcwOnboardingCard value={fn.cardPayload as never} />;
  if (fn.customCard === 'fieldDispatch') return <EcwFieldDispatchCard value={fn.cardPayload as never} />;
  if (fn.customCard === 'escalation') return <EcwEscalationCard value={fn.cardPayload as never} />;
  if (fn.customCard === 'case360') return <EcwCase360Card value={fn.cardPayload as never} />;
  if (fn.customCard === 'csatPulse') return <EcwCsatPulseCard value={fn.cardPayload as never} />;
  if (fn.customCard === 'campaignFunnel') return <EcwCampaignFunnelCard value={fn.cardPayload as never} />;
  if (fn.customCard === 'performanceMatrix') return <EcwPerformanceMatrixCard value={fn.cardPayload as never} />;
  if (fn.customCard === 'abTest') return <EcwAbTestCard value={fn.cardPayload as never} />;
  if (fn.customCard === 'audienceExplorer') return <EcwAudienceExplorerCard value={fn.cardPayload as never} />;
  return <EmployeeCardPreview fn={fn} />;
}

/* payloadForFunction / sourceForFunction / structureForFunction now live in
 * ./cardData so the preview channels can reuse them. */

type InspectorView = 'structure' | 'source';

/**
 * The Coworker "agent action" playground — the team-track analogue of the
 * customer CltPlayground, reusing the exact `.clt-stage` frame so it matches
 * the service side. The canvas is an Agentforce Coworker conversation: the
 * employee's (copyable) prompt, then Agentforce answering inline with the CLT.
 * The inspector toggles the authored Structure tree and the DTO Source.
 */
function CoworkerPlayground({ fn, companyName }: { fn: EmployeeFunction; companyName: string }) {
  const [view, setView] = useState<InspectorView>('structure');
  const [copied, setCopied] = useState(false);
  const payload = useMemo(() => payloadForFunction(fn), [fn]);
  const rec = useMemo(() => employeeRecommendation(fn), [fn]);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(fn.ask);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable (e.g. insecure context) — no-op */
    }
  }

  return (
    <section className="clt-stage" style={{ '--customer-accent': '#1b96ff' } as React.CSSProperties} aria-label={`${fn.label} playground`}>
      <header className="clt-stage-bar">
        <div className="clt-action-id">
          <span className="clt-action-glyph" aria-hidden="true"><img src={agentforceAvatar} alt="" /></span>
          <div>
            <span className="clt-action-kicker">Coworker action</span>
            <strong>{fn.label}</strong>
            <code>c/{fn.cltApiName}</code>
          </div>
        </div>
        <div className="clt-stage-tabs" role="tablist" aria-label="Inspector view">
          <button type="button" role="tab" aria-selected={view === 'structure'} className={view === 'structure' ? 'active' : ''} onClick={() => setView('structure')}>
            <TreePine aria-hidden="true" /> Structure
          </button>
          <button type="button" role="tab" aria-selected={view === 'source'} className={view === 'source' ? 'is-source active' : 'is-source'} onClick={() => setView('source')}>
            <Code2 aria-hidden="true" /> Source
          </button>
        </div>
      </header>

      <div className="clt-stage-body">
        <div className="clt-canvas">
          {/* Coworker is a full desktop conversation (ChatGPT-style), not the
              narrow service phone frame — it fills the canvas width. */}
          <div className="ecw-desk">
            <header className="ecw-desk-bar">
              <span className="ecw-desk-title">{companyName} · Agentforce Coworker</span>
              <span className="ecw-desk-actions" aria-hidden="true"><MoreVertical /><ChevronDown /></span>
            </header>
            <div className="ecw-desk-body">
              <div className="ecw-thread">
                {/* the employee's ask — copyable so you can paste it into real Coworker */}
                <div className="ecw-userturn">
                  <p className="ecw-userbubble">{fn.ask}</p>
                  <button type="button" className="ecw-copy" onClick={copyPrompt}>
                    {copied ? <><Check aria-hidden="true" /> Copied</> : <><Copy aria-hidden="true" /> Copy prompt</>}
                  </button>
                </div>
                {/* Agentforce answers inline with the CLT */}
                <div className="ecw-agentturn">
                  <img className="ecw-agent-avatar" src={agentforceAvatar} alt="" aria-hidden="true" />
                  <div className="ecw-agent-copy">
                    <p className="ecw-agent-bubble">{fn.lead}</p>
                    <span className="ecw-agent-label">Agentforce Coworker · via {fn.subagent}</span>
                  </div>
                </div>
                <div className="ecw-cardwrap">
                  <CardForFunction fn={fn} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="clt-inspector" aria-label="Component inspector">
          {view !== 'source' && (
            <div className="clt-inspector-sub">
              <code>c/{fn.cltApiName}</code>
              <button type="button" className="clt-reset" onClick={copyPrompt}>
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />} {copied ? 'Copied' : 'Copy prompt'}
              </button>
            </div>
          )}
          <div className={view === 'source' ? 'clt-inspector-body is-source' : 'clt-inspector-body'}>
            {view === 'structure' && <StructurePane nodes={structureForFunction(fn)} payload={payload} />}
            {view === 'source' && <CltCodeInspector recommendation={rec} embedded />}
          </div>
        </aside>
      </div>
    </section>
  );
}

/**
 * The department selector — the Coworker analogue of the customer track's
 * industry tiles, reusing the exact `.industry-option` scroller so the spacing
 * and feel match. Each tile carries its own `--ind` accent (placeholder glyph
 * for now). Ghost ("coming soon") lanes are dimmed and non-selectable.
 */
function DepartmentTiles({ selected, onSelect }: { selected: string; onSelect: (key: string) => void }) {
  return (
    <fieldset className="industry-fieldset ecw-dept-fieldset">
      <legend className="sr-only">Choose a team</legend>
      <div className="industry-options">
        {DEPARTMENTS.map((d) => {
          const isSelected = d.key === selected;
          return (
            <button
              type="button"
              key={d.key}
              className={`industry-option ecw-dept-option${isSelected ? ' selected' : ''}`}
              style={{ '--ind': d.ind } as React.CSSProperties}
              aria-pressed={isSelected}
              onClick={() => onSelect(d.key)}
            >
              <span className="industry-art" aria-hidden="true"><img src={d.art} alt="" /></span>
              <span className="industry-card-copy">
                <strong>{d.label}</strong>
              </span>
              <span className="industry-card-state" aria-hidden="true">
                {isSelected ? <Check /> : <ArrowRight />}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * The employee-track configurator: an Agentforce-branded Coworker hero, the
 * department tiles, the selected team's CLT cards, and a live Coworker
 * playground of the selected one.
 */
export function EmployeeTrack({ companyName, onSelectFunction }: { companyName: string; onSelectFunction?: (fn: EmployeeFunction) => void }) {
  const [deptKey, setDeptKey] = useState<string>(DEFAULT_DEPARTMENT.key);
  const dept: Department = DEPARTMENTS.find((d) => d.key === deptKey) ?? DEFAULT_DEPARTMENT;
  const [selectedKey, setSelectedKey] = useState<string>(dept.functions[0]?.key ?? '');

  const selected = useMemo(
    () => dept.functions.find((f) => f.key === selectedKey) ?? dept.functions[0],
    [dept, selectedKey]
  );

  // Report the chosen function up so the Deploy → build → preview flow can
  // render it across the Coworker / ChatGPT / Claude / Slack surfaces.
  useEffect(() => {
    if (selected) onSelectFunction?.(selected);
  }, [selected, onSelectFunction]);

  function pickDept(key: string) {
    setDeptKey(key);
    const next = DEPARTMENTS.find((d) => d.key === key);
    setSelectedKey(next?.functions[0]?.key ?? '');
  }

  return (
    <section className="experience-configurator emp-configurator" aria-label="Team experiences">
      <div className="emp-hero">
        <img src={df26Agentforce3d} alt="" aria-hidden="true" className="emp-hero-mark" />
        <div className="emp-hero-grid">
          <div className="emp-hero-inner">
            <span className="emp-hero-eyebrow"><Sparkle aria-hidden="true" /> Agentforce for your employees</span>
            <h2 className="emp-hero-title">{companyName}&rsquo;s AI teammate, on every surface</h2>
            <p className="emp-hero-lede">
              Agentforce Coworker is an always-on AI teammate, built on Data 360, that answers questions across your
              Salesforce and connected data and routes tasks to the right specialized Employee Agent, whether
              you&rsquo;re in Salesforce, Claude, or ChatGPT.
            </p>
            <div className="emp-hero-chips">
              <span className="emp-chip emp-chip-logos">
                <img src={df26SalesforceCloud} alt="Agentforce Coworker" /><img src={df26OpenaiLight} alt="ChatGPT" /><img src={df26Claude} alt="Claude" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <DepartmentTiles selected={deptKey} onSelect={pickDept} />

      <div className="template-picker">
        <div className="template-options">
          {dept.functions.map((fn, index) => {
            const isSelected = fn.key === selectedKey;
            return (
              <button
                type="button"
                className={isSelected ? 'template-option selected' : 'template-option'}
                onClick={() => setSelectedKey(fn.key)}
                aria-pressed={isSelected}
                key={fn.key}
              >
                <span className="template-option-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <span className="template-option-copy">
                  <strong>{fn.label}</strong>
                  <small>{fn.blurb}</small>
                </span>
                <span className="template-option-state" aria-hidden="true">{isSelected ? <Check /> : <ArrowRight />}</span>
              </button>
            );
          })}
        </div>

        {selected && <CoworkerPlayground key={selected.key} fn={selected} companyName={companyName} />}
      </div>
    </section>
  );
}

/** Employee-mode footer — mirrors the service build bar (experience name + the
 *  surface logo stack + "every surface" lede), with a blue Deploy to Coworker CTA. */
export function EmployeeFooter({ fn, onContinue }: { fn: EmployeeFunction | null; onContinue: () => void }) {
  return (
    <div className="configurator-footer">
      <span className="build-bar-icon" aria-hidden="true"><img src={agentforceAvatar} alt="" /></span>
      <span className="build-bar-copy">
        <strong>{fn?.label ?? 'Coworker experience'}</strong>
        <span className="build-bar-surfaces">
          <span className="build-surface-stack" aria-hidden="true">
            <img src={df26SalesforceCloud} alt="" />
            <img src={df26Openai} alt="" />
            <img src={df26Claude} alt="" />
            <img src={df26Slack} alt="" />
          </span>
          <span className="build-bar-surfaces-note">Want to see it on every surface? Start building.</span>
        </span>
      </span>
      <button className="primary-action" type="button" onClick={onContinue}>
        <Hammer aria-hidden="true" /> Deploy to Coworker <ArrowRight aria-hidden="true" />
      </button>
    </div>
  );
}
