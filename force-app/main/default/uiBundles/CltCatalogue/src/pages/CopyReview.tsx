/**
 * Internal COPY REVIEW page — not part of the customer flow. Lives behind the
 * URL hash `#copy` (like the `#preview` harness) so the team can quickly scan
 * candidate homepage headline + lede pairs and pick a favorite. Deliberately
 * plain: no hero art, no animation — just the words, big, the way they'd read
 * on the homepage.
 *
 * Voice target (from workshop titles the team liked): plain verb + specific task
 * + named product. Clear over clever. No "headless / interfaces / CLT" jargon.
 */
type Lane = 'Whole experience' | 'Build & deploy' | 'The cards' | 'Customers' | 'Your team' | 'In Claude / ChatGPT';

type Option = { id: number; lane: Lane; headline: string; lede: string };

const OPTIONS: Option[] = [
  {
    id: 1,
    lane: 'Whole experience',
    headline: 'Build AI Agents and Use Them in Claude, ChatGPT, and Agentforce Coworker',
    lede: 'Design the buttons, forms, and cards your agent shows right in the chat — then watch the same agent work across Claude, ChatGPT, and Agentforce Coworker.',
  },
  {
    id: 2,
    lane: 'Whole experience',
    headline: 'Build AI Agents Once and Use Them in Claude, ChatGPT, and Agentforce Coworker',
    lede: 'One agent, ready for the assistants your customers and your team already use — with real buttons and forms, not just text.',
  },
  {
    id: 3,
    lane: 'Whole experience',
    headline: 'Build AI Agents for Your Customers and Your Team in Minutes',
    lede: 'Deploy a service agent that resolves customer issues, or an AI coworker that handles everyday requests — working in Claude, ChatGPT, and Agentforce Coworker.',
  },
  {
    id: 4,
    lane: 'Build & deploy',
    headline: 'Build Interactive Cards and Deploy Them Into Claude, ChatGPT, and Agentforce Coworker',
    lede: 'Design cards people can click and fill out, then drop them straight into the assistants your customers and team already use.',
  },
  {
    id: 5,
    lane: 'Build & deploy',
    headline: 'Build Agent Visuals and Deploy Them Into Claude, ChatGPT, and Agentforce Coworker',
    lede: 'Design what your agent shows in the chat — buttons, forms, live cards — and deploy it across Claude, ChatGPT, and Agentforce Coworker.',
  },
  {
    id: 6,
    lane: 'Build & deploy',
    headline: 'Build Rich Cards and Deploy Them Into Claude, ChatGPT, and Agentforce Coworker',
    lede: 'Go beyond plain text — build cards your agent shows in the chat and deploy them everywhere your users already work.',
  },
  {
    id: 7,
    lane: 'Build & deploy',
    headline: 'Build Buttons and Forms and Deploy Them Into Claude, ChatGPT, and Agentforce Coworker',
    lede: 'Turn your agent’s answers into things people can click and fill out — then deploy them into Claude, ChatGPT, and Agentforce Coworker.',
  },
  {
    id: 8,
    lane: 'The cards',
    headline: 'Give Your AI Agent Buttons, Forms, and Cards',
    lede: 'Turn plain chat answers into things people can tap, fill out, and send — and use them in Claude, ChatGPT, and Agentforce Coworker.',
  },
  {
    id: 9,
    lane: 'The cards',
    headline: 'Make Your AI Agent Do More Than Talk',
    lede: 'Add clickable cards and forms so people can book, approve, pay, and track — right inside the conversation, in any assistant.',
  },
  {
    id: 10,
    lane: 'Customers',
    headline: 'Deploy a Service Agent That Resolves Customer Issues on Its Own',
    lede: 'Build a customer agent with rich, interactive cards — then put it to work in Claude, ChatGPT, and Agentforce.',
  },
  {
    id: 11,
    lane: 'Your team',
    headline: 'Get Started with Agentforce Coworker in Minutes',
    lede: 'Give your team an AI coworker that handles IT, HR, sales, and finance requests — with forms and approvals right in the chat.',
  },
  {
    id: 12,
    lane: 'Your team',
    headline: 'Give Your Team an AI Coworker Inside Salesforce',
    lede: 'Build interactive cards for the requests your employees make every day, and deploy them straight into Agentforce Coworker.',
  },
  {
    id: 13,
    lane: 'In Claude / ChatGPT',
    headline: 'Manage Your Salesforce Workflow Directly in Claude and ChatGPT',
    lede: 'Build an Agentforce agent with real buttons and forms, and use it without leaving Claude, ChatGPT, or Slack.',
  },
];

export default function CopyReview() {
  return (
    <div className="activation-app theme-light">
      <div className="copyrev">
        <header className="copyrev-head">
          <div>
            <span className="copyrev-eyebrow">Internal · Homepage copy review</span>
            <h1>Homepage headline &amp; lede options</h1>
            <p>Scan the options and pick a favorite. Reply with the number(s) you like, or the words worth keeping.</p>
          </div>
        </header>

        <ol className="copyrev-list">
          {OPTIONS.map((o) => (
            <li className="copyrev-card" key={o.id}>
              <div className="copyrev-card-top">
                <span className="copyrev-num">{o.id}</span>
                <span className="copyrev-lane">{o.lane}</span>
              </div>
              <h2 className="copyrev-headline">{o.headline}</h2>
              <p className="copyrev-lede">{o.lede}</p>
            </li>
          ))}
        </ol>

        <footer className="copyrev-foot">
          {OPTIONS.length} options · edit them in <code>src/pages/CopyReview.tsx</code>
        </footer>
      </div>
    </div>
  );
}
