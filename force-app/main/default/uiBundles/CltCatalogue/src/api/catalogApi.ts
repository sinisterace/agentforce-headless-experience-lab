/**
 * Client for the CltCatalogRest Apex REST facade. The bundle domain can only
 * reach custom server logic through sdk.fetch (CSRF handled automatically), so
 * every catalog/scan/save call funnels through here.
 */
import { createDataSDK } from '@salesforce/platform-sdk';
import type {
  CatalogResponse,
  DeployRequest,
  DeployResponse,
  SaveRequest,
  SaveResponse,
  ScanRequest,
  ScanResponse,
} from '@/types/catalog';

const BASE = '/services/apexrest/cltcat';

export async function fetchCatalog(): Promise<CatalogResponse> {
  return request<CatalogResponse>('/catalog', { method: 'GET' }, 'Unable to load the CLT catalogue.');
}

export async function scanCompany(body: ScanRequest): Promise<ScanResponse> {
  return request<ScanResponse>(
    '/scan',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
    'Unable to scan the company website.'
  );
}

export async function saveProfile(body: SaveRequest): Promise<SaveResponse> {
  return request<SaveResponse>(
    '/save',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
    'Unable to save the consultation profile.'
  );
}

export async function deployAgent(body: DeployRequest): Promise<DeployResponse> {
  return request<DeployResponse>(
    '/deployAgent',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
    'Unable to deploy the FAQ service agent.'
  );
}

async function request<T>(
  path: string,
  init: RequestInit,
  fallbackError: string
): Promise<T> {
  // The uiBundle talks to Apex via the platform SDK's session. On first paint the
  // session token can lag SDK readiness, so sdk.fetch intermittently returns
  // 401 INVALID_ACCESS_TOKEN ("Session expired or invalid token usage") — a race that
  // worsens as the bundle grows. Re-initialize the SDK and retry a few times with a
  // short backoff so the call recovers once the session attaches.
  const maxAttempts = 5;
  let lastError = fallbackError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const sdk = await createDataSDK();
    if (!sdk.fetch) {
      throw new Error('The Salesforce SDK fetch is unavailable in this runtime.');
    }
    const response = await sdk.fetch(`${BASE}${path}`, init);
    if (response.ok) {
      return (await response.json()) as T;
    }
    const body = await safeJson(response);
    lastError = messageFrom(body) ?? fallbackError;
    const isSessionNotReady =
      response.status === 401 || /INVALID_ACCESS_TOKEN|Session expired|invalid token/i.test(JSON.stringify(body ?? ''));
    if (!isSessionNotReady || attempt === maxAttempts) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 700));
  }
  throw new Error(lastError);
}

/** The Apex REST error body is either `{message}` or `[{errorCode, message}]`. */
function messageFrom(body: unknown): string | undefined {
  if (!body) return undefined;
  if (Array.isArray(body)) return (body[0] as { message?: string } | undefined)?.message;
  return (body as { message?: string }).message;
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
