import { StrictMode, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import CatalogueApp from '@/pages/CatalogueApp';
import CltHarness from '@/pages/CltHarness';
import CopyReview from '@/pages/CopyReview';
import CoworkerPreview from '@/pages/CoworkerPreview';
import './styles/consultation.css';
import './styles/playground.css';
import './styles/channels.css';
import './styles/harness.css';
import './styles/agentic-glass.css';
import './styles/service-agent.css';
import './styles/df26.css';
import './styles/employee.css';
import './styles/copy-review.css';

/** Subscribe to hash changes so the root swaps between the app and the harness. */
function subscribeHash(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

/**
 * The dev harness lives behind `#preview` so it never touches the production
 * intake flow; everything else renders the real catalogue app.
 */
function Root() {
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash);
  if (hash.startsWith('#preview')) return <CltHarness />;
  if (hash.startsWith('#copy')) return <CopyReview />;
  if (hash.startsWith('#coworker')) return <CoworkerPreview />;
  return <CatalogueApp />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
