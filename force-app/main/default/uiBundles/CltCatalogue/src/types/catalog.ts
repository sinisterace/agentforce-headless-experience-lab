/**
 * TypeScript mirrors of the Apex DTOs returned by CltCatalogRest. Field names
 * match the Apex classes exactly (ConsultationCatalogService.Recommendation /
 * IndustryOption and ConsultationProfileService.Profile), so the JSON crosses
 * the wire without translation.
 */

export type Stage = 'welcome' | 'intake' | 'confirm' | 'building' | 'preview';

/** ConsultationCatalogService.IndustryOption */
export type IndustryOption = {
  key: string;
  label: string;
};

/** ConsultationCatalogService.Recommendation — one CLT recommended for an industry. */
export type Recommendation = {
  cltApiName: string;
  industryKey: string;
  capabilityKey: string;
  label: string;
  description: string;
  displayOrder: number;
  defaultPayloadJson: string;
  dtoFieldName: string;
};

/**
 * ConsultationProfileService.PlanSection — one section of the guided consultation plan.
 * `body` is curated (always present); `personalized` is AI enrichment layered on only
 * when the website scan produced company-specific context.
 */
export type PlanSection = {
  key: string;
  title: string;
  body: string;
  personalized: string | null;
};

/** ConsultationProfileService.Profile — the AI-derived company profile. */
export type CompanyProfile = {
  companyName: string;
  website: string;
  industryKey: string;
  industryLabel: string;
  /** Retained server-side for prompt tuning. Never displayed. */
  confidence?: number | null;
  summary: string;
  planNarrative: string;
  accentColor: string;
  logoUrl: string | null;
  signals: string[];
  /** Guided consultation plan — curated spine + optional AI enrichment. Always non-empty. */
  plan: PlanSection[];
  source: 'website' | 'fallback';
};

/** GET /cltcat/catalog */
export type CatalogResponse = {
  industries: IndustryOption[];
  recommendationsByIndustry: Record<string, Recommendation[]>;
};

/** POST /cltcat/scan */
export type ScanRequest = {
  companyName: string;
  website: string;
  industry?: string;
};

export type ScanResponse = {
  profile: CompanyProfile;
  recommendations: Recommendation[];
};

/** POST /cltcat/save */
export type SaveRequest = {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  website: string;
  industryKey: string;
  summary: string;
  planNarrative: string;
  accentColor: string;
  logoUrl: string | null;
  source: 'website' | 'fallback';
  confidence?: number | null;
  signals: string[];
};

export type SaveResponse = {
  id: string;
  status: string;
};

/** POST /cltcat/deployAgent — ground the FAQ agent on this company + re-skin the widget. */
export type DeployRequest = {
  companyName: string;
  website: string;
  industryKey: string;
  summary: string;
  planNarrative: string;
  accentColor: string;
  logoUrl: string | null;
  signals: string[];
};

export type DeployResponse = {
  knowledgeId: string;
  companyName: string;
  faqCount: number;
  faqIsFallback: boolean;
  brandingUpdated: boolean;
  brandingNote: string | null;
  siteUrl: string | null;
};
