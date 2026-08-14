import { StrictMode, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import CatalogueApp from '@/pages/CatalogueApp';
import CltHarness from '@/pages/CltHarness';
import './styles/consultation.css';
import './styles/playground.css';
import './styles/channels.css';
import './styles/harness.css';

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
  return hash.startsWith('#preview') ? <CltHarness /> : <CatalogueApp />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
