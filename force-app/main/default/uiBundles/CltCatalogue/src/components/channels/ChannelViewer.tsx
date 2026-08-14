import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { CompanyProfile, Recommendation } from '@/types/catalog';
import { AgentforceSurface } from '@/components/AgentforceSurface';
import { CHANNELS, ChannelMark, type ChannelId } from './channels';
import { ChatGptFrame } from './ChatGptFrame';
import { ClaudeFrame } from './ClaudeFrame';

/**
 * The multi-client viewer: one selected CLT rendered inside a chosen client's
 * chrome. A tab strip switches channels; the same CLT re-renders in each frame
 * so the demo shows "the same experience, everywhere." ChatGPT, Agentforce, and
 * Claude are live; Slack is scaffolded until its frame lands.
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
      {channel === 'slack' && <ChannelSoon channel={channel} />}
    </div>
  );
}

function ChannelSoon({ channel }: { channel: 'slack' }) {
  const label = 'Slack';
  const note = 'Slack renders the CLT as Block Kit blocks via a Slack app. This frame is next.';
  return (
    <section className="channel-surface channel-soon" aria-label={`${label} preview coming soon`}>
      <div className="channel-soon-body">
        <span className="channel-soon-mark"><ChannelMark id={channel} /></span>
        <h3>{label} preview coming soon</h3>
        <p>{note}</p>
        <span className="channel-soon-tag"><ExternalLink aria-hidden="true" /> Same CLT, different client</span>
      </div>
    </section>
  );
}
