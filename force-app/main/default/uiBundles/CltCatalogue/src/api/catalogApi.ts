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
  const sdk = await createDataSDK();
  if (!sdk.fetch) {
    throw new Error('The Salesforce SDK fetch is unavailable in this runtime.');
  }
  const response = await sdk.fetch(`${BASE}${path}`, init);
  if (!response.ok) {
    const body = await safeJson(response);
    throw new Error(body?.message ?? fallbackError);
  }
  return (await response.json()) as T;
}

async function safeJson(response: Response): Promise<{ message?: string } | null> {
  try {
    return (await response.json()) as { message?: string };
  } catch {
    return null;
  }
}
