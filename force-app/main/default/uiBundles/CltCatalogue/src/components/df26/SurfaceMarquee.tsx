/**
 * The DF26 hero centerpiece: a big, auto-scrolling marquee of the surfaces a
 * Custom Lightning Type renders in — the real, full-color brand logos (large,
 * 3D) with a label under each, looping infinitely. Built on {@link LogoLoop}.
 * Presentation only.
 */
import salesforceCloud from '@/assets/brand/df26/salesforce-cloud-logo.png';
import openaiLogo from '@/assets/brand/df26/openai-3d.png';
import claudeLogo from '@/assets/brand/df26/claude-3d.png';
import slackLogo from '@/assets/brand/df26/slack.png';
import { LogoLoop, type LogoItem } from './LogoLoop';

function Item({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="df-chanmq-item">
      <span className="df-chanmq-logo">{children}</span>
      <span className="df-chanmq-label">{name}</span>
    </div>
  );
}

const mark = (src: string, variant: string) => (
  <img src={src} alt="" aria-hidden className={`df-chanmq-img df-chanmq-img--${variant}`} />
);

const item = (name: string, node: React.ReactNode): LogoItem => ({
  title: name,
  ariaLabel: name,
  node: <Item name={name}>{node}</Item>,
});

const logos: LogoItem[] = [
  item('Salesforce', mark(salesforceCloud, 'salesforce')),
  item('ChatGPT', mark(openaiLogo, 'chatgpt')),
  item('Claude', mark(claudeLogo, 'claude')),
  item('Slack', mark(slackLogo, 'slack')),
];

export function SurfaceMarquee() {
  return (
    <div className="df-chanmq">
      <LogoLoop
        logos={logos}
        speed={62}
        direction="left"
        logoHeight={170}
        gap={128}
        pauseOnHover
        hoverSpeed={12}
        scaleOnHover
        ariaLabel="Surfaces where custom Lightning types can appear"
        className="df-chanmq-loop"
      />
    </div>
  );
}

export default SurfaceMarquee;
