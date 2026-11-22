# datacloud-optional — NOT deployed by default

This folder is **outside `packageDirectories`** (see `sfdx-project.json`), so `sf project deploy start -d force-app -d clt-library` does **not** include it.

## Why
`genAiPromptTemplates/CLTCat_Company_Profile` is the **only** Data-Cloud dependency in the whole project. It uses the web-retriever action `sfdc_ai__WebRetrievalAction` (`invocable://getEinsteinRetrieverResults/...`) and merge field `{!$EinsteinSearch:...}`. **Deploying it to an org that does not have Data Cloud + the web retriever enabled fails.**

## Do you need it?
No, for a normal deploy. The company scan (`ConsultationProfileService.scan()`) is a 3-tier fallback:
1. this prompt template (web-grounded profile) — Data Cloud →
2. **Models API** (`sfdc_ai__DefaultOpenAIGPT4OmniMini`, knowledge-only) — portable →
3. deterministic industry starter (never throws).

Without this template, tier-1 throws, is caught, and the scan uses the Models API. Accent color, summary, signals, and plan enrichment are all still produced — it just isn't web-grounded. `ConsultationProfileService` references the template by string name only (no compile dependency), so all Apex deploys and runs fine without it.

## To enable web-grounded profiles later
In the target org: enable Einstein Generative AI + Data Cloud, publish the `sfdc_ai__WebRetrievalAction` web retriever, then deploy this template:
`sf project deploy start -d datacloud-optional -o <org>`
