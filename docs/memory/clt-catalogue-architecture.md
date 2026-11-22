---
name: clt-catalogue-architecture
description: "CLT catalogue app: deterministic per-industry recommendations + AI narrative; web-retriever needs Data Cloud+Einstein GenAI enablement (both currently OFF)"
metadata: 
  node_type: memory
  type: project
  originSessionId: 9c32e486-7b75-4913-a5b4-f5d52cf3a6d6
  modified: 2026-08-07T15:31:43.938Z
---

The Agentforce CLT catalogue app (in `my-test-org`, the template base org) uses a **deterministic-recommendations / AI-narrative** design, decided 2026-08-07:

- **AI does NOT pick CLTs.** The `RecommendationService.detectIndustryAndSummary()` method (the single LLM seam) returns only `{industry, confidence, summary, planNarrative}`. Recommendations are a deterministic lookup: all `CLT_Catalog_Item__c` WHERE `Industry__c = detectedIndustry`, ordered by `Display_Order__c`. Two companies in the same industry get the identical CLT set (verified: Chime = Ally Bank), but unique AI summaries/narratives. "Templatized per industry."
- **Fallback profile pattern:** any research/model failure collapses to a deterministic fallback (industry=Retail default, generic summary/narrative, `isFallback=true`, note → `Error_Message__c`, Status still 'Recommended'). `analyzeProfile` throws ONLY on invalid input (missing profile / empty catalogue), never on research failure. A consultation must never dead-end.
- Fields added: `Onboarding_Profile__c.Plan_Summary__c` (AI narrative), `CLT_Catalog_Item__c.Display_Order__c` (deterministic order 1-4 per industry).

**Web-retriever enablement status (probed 2026-08-07, this org = Enterprise Edition, trial exp 2026-09-01):**
- `GenAiPromptTemplate` metadata type = **`Cannot use in this organization`** → Einstein Generative AI NOT enabled (Setup → Einstein Setup).
- Data Cloud NOT provisioned: zero `__dlm`/`__dll` objects, `MktDataLakeObject`/`DataSource` absent. BUT **Data Cloud IS licensed** (`GenieDataPlatformStarterPsl` Active, 200k) — needs Setup → Data Cloud Setup → "Turn On Data Cloud" (UI-only, does NOT travel in metadata/packages).
- Running user has `AISearchAdminPsl` + `CdpSegmentsActivationsCardPsl` but NOT `GenieDataPlatformStarterPsl`.
- So `sfdc_ai__WebRetrievalAction` retriever doesn't exist yet. Until all three are enabled by the user/admin, the pipeline runs knowledge-only via Models API (works well: Chime/Ally→FinServ 90%).

**Retriever swap (when enabled):** replace the `callModel()` body inside `detectIndustryAndSummary()` with a `GenAiPromptTemplate` invocation using `sfdc_ai__WebRetrievalAction` as a `templateDataProvider`. Critical wiring (from user's prior project): provider `definition` MUST be `invocable://getEinsteinRetrieverResults/sfdc_ai__WebRetrievalAction` (bare `invocable://sfdc_ai__WebRetrievalAction` deploys but fails at runtime "not accessible"); must declare `templateDataProviders` or deploy fails "must specify a provider for the merge fields"; `referenceName` must match the body merge-field prefix exactly. Prereqs per user doc: retriever Active v1, Einstein GenAI on, template published with activeVersionIdentifier, permsets Prompt Template Manager + Data Cloud Architect. Every templated clone will need these three manual enablement steps.

See [[orgfarm-master-detail-query-bug]] (egress block + MD bug) and [[models-api-apex-signature]].
