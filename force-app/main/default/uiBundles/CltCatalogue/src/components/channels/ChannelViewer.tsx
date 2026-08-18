import { useState } from 'react';
import type { CompanyProfile, Recommendation } from '@/types/catalog';
import { AgentforceSurface } from '@/components/AgentforceSurface';
import { CHANNELS, ChannelMark, type ChannelId } from './channels';
import { ChatGptFrame } from './ChatGptFrame';
import { ClaudeFrame } from './ClaudeFrame';
import { SlackFrame } from './SlackFrame';

/**
 * The multi-client viewer: one selected CLT rendered inside a chosen client's
 * chrome. A tab strip switches channels; the same CLT re-renders in each frame
 * so the demo shows "the same experience, everywhere." ChatGPT, Agentforce, and
 * Claude render the LWC-faithful preview; Slack renders the CLT as BuilderKit
 * tiles — its authentic Slack form.
 */
export function ChannelViewer({
  recommendation,
  profile,
  agentId,
}: {
  recommendation: Recommendation;
  profile: CompanyProfile;
  agentId?: string | null;
}) {
  const [channel, setChannel] = useState<ChannelId>('chatgpt');

  return (
    <div className="channel-viewer">
      <div className="channel-tabs" role="tablist" aria-label="Preview channel">
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={channel === c.id}
            className={`channel-tab${channel === c.id ? ' active' : ''}`}
            onClick={() => setChannel(c.id)}
          >
            <ChannelMark id={c.id} />
            <span>{c.label}</span>
            {c.status === 'soon' && <i className="channel-tab-soon">Soon</i>}
          </button>
        ))}
      </div>

      {channel === 'chatgpt' && <ChatGptFrame recommendation={recommendation} profile={profile} />}
      {channel === 'agentforce' && <AgentforceSurface profile={profile} agentId={agentId} />}
      {channel === 'claude' && <ClaudeFrame recommendation={recommendation} profile={profile} />}
      {channel === 'slack' && <SlackFrame recommendation={recommendation} profile={profile} />}
    </div>
  );
}
