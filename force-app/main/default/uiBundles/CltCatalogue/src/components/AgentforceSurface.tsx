import { useMemo } from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { AgentforceConversationClient } from '@salesforce/ui-bundle-template-feature-react-agentforce-conversation-client';
import type { CompanyProfile } from '@/types/catalog';

/**
 * The live Agentforce surface (UI spec §9). When an employee agent id is
 * available it embeds the Agentforce Conversation Client — an LWC Interface on
 * Lightning Out 2.0 — so the card that appears is the deployed Custom Lightning
 * Type rendered by the real agent, not a simulation. When no agent is available
 * it shows the acc-embed-fallback: a deep-link into Agentforce, so the app never
 * dead-ends. The employee agent id is resolved server-side (Task 6 wiring).
 *
 * The client only brands through styleTokens (className/style are ignored inside
 * the iframe), so the accent is passed as a token.
 */
export function AgentforceSurface({
  profile,
  agentId,
  onReady,
}: {
  profile: CompanyProfile;
  agentId?: string | null;
  onReady?: () => void;
}) {
  const styleTokens = useMemo(() => ({ '--sds-c-chat-accent': profile.accentColor }), [profile.accentColor]);

  return (
    <section className="conversation-panel channel-surface agentforce-surface" aria-label="Agentforce conversation">
      <div className="enhanced-chat-shell">
        {agentId ? (
          <div className="acc-embed">
            <AgentforceConversationClient
              agentId={agentId}
              agentLabel={`${profile.companyName} Service`}
              inline
              headerEnabled
              showHeaderIcon
              height="100%"
              width="100%"
              styleTokens={styleTokens}
              onReady={onReady}
            />
          </div>
        ) : (
          <div className="acc-embed-fallback">
            <h3>Open this experience in Agentforce</h3>
            <p>
              This org has no active employee agent to embed here yet, so the conversation opens in
              Agentforce instead. The prepared experience is already active — the agent renders the
              deployed Custom Lightning Type on the next request.
            </p>
            <a className="secondary-action" href="/lightning/setup/EinsteinCopilot/home" target="_blank" rel="noreferrer">
              Open Agentforce <ExternalLink aria-hidden="true" />
            </a>
          </div>
        )}
        <div className="enhanced-chat-footer"><ShieldCheck aria-hidden="true" /> Powered by Agentforce</div>
      </div>
    </section>
  );
}
