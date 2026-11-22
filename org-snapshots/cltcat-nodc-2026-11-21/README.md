# Org snapshot — `cltcat-nodc` source org (2026-11-21)

Full backup of the **source org** for the *Customize your agent for any channel* hands-on
lab — getting hands-on with a headless experience layer for AI agents (the same interactive
cards rendered in web chat, Slack, ChatGPT, Claude and the agent workspace) — taken in case
the org expires.

| | |
|---|---|
| Username | `admin@example.com` |
| Org ID | `00D000000000000AAA` |
| API version | 67.0 |
| Data Cloud | **OFF** (`CustomerDataPlatform.settings` → `enableCustomerDataPlatform=false`). Never enable it here — it's irreversible and breaks Trialforce cloning. |

**This folder is a reference backup, not a package directory.** The curated, deployable
blueprint is `force-app/` + `clt-library/` at the repo root, deployed with
`docs/deploy-to-new-org.md`. Use this snapshot to recover anything the blueprint lacks,
or to diff against later.

## Contents

- `package.xml` — the full manifest generated from the org (2,241 members, 98 types).
- `metadata/` — `sf project retrieve start -x package.xml`, source format (5,378 files),
  including standard and boilerplate metadata (profiles, settings, standard objects, reports).
  `applications/CltCatalogue.app-meta.xml` already has the new launcher label.
- `data/` — CSV export of runtime records (all createable fields + Id), made with
  `python3 scripts/export-org-data.py cltcat-nodc <dir>`:

| Object | Rows | Notes |
|---|---|---|
| `CLT_Catalog_Item__c` | 48 | catalogue cards (CLT API name, capability key, default payload JSON…) |
| `Company_Knowledge__c` | 5 | company profiles for the hub hero / FAQ grounding (one is Active) |
| `Onboarding_Profile__c` | 5 | intake-app profiles |
| `FAQ__kav` | 14 | Knowledge articles (Online, en_US) |
| `Account` / `Contact` / `Opportunity` / `Case` / `Lead` | 151 / 451 / 300 / 59 / 400 | CRM demo data read by the live-SOQL `ecw*` / `asa*` CLTs |

## Dependency inventory (what the build is made of)

- **App**: `CustomApplication:CltCatalogue` → `UIBundle:CltCatalogue` (React/Vite; the source
  `src/` only lives in the repo's `force-app/…/uiBundles/CltCatalogue/src` — the org holds `dist/` only).
  Logo `ContentAsset:Headless360_Icon`. Tabs: `CLT_Catalog_Item__c`, `Company_Knowledge__c`,
  `Onboarding_Profile__c`, `Getting_Started`.
- **Custom objects**: `CLT_Catalog_Item__c`, `Company_Knowledge__c`, `Onboarding_Profile__c`,
  `FAQ__kav` (Knowledge) + `Account.Partner_Tier__c`, `Account.Quarterly_Quota__c`, `Account.Partner_Account` record type.
- **CLTs**: 78 `LightningTypeBundle` + 75 LWCs (`asa*` industry cards for the Service Agent,
  `ecw*` Coworker/employee cards), each with a `GenAiFunction` + `Flow` (`*_Output_xxxx`) and Apex DTOs (194 Apex classes).
- **Agents**: `Bot`/`GenAiPlannerBundle`/`AiAuthoringBundle` for `Agentforce_Service_Agent` and
  `Employee_Agent` (both v1 here), `AnswerCompanyFaq` flow + action, 9 `AiAgentScorerDefinition`.
  Permsets: `Employee_Agent_Access`, `Agentforce_Service_Agent…_Permissions`.
- **MIAW / Enhanced Chat**: `MessagingChannel:Company_ASA`, `EmbeddedServiceConfig:Company_ASA`,
  2 `BrandingSet`s, `Queue:Company_ASA_Escalation_Queue`, `QueueRoutingConfig:Company_ASA_Routing_Config`,
  flows `Route_to_Company_Agentforce_Service_Agent` / `Escalation_Flow_Company_Agentforce_Service_Agent`,
  `ServiceChannel:sfdc_livemessage`, `PresenceUserConfig:default_presence_config`.
- **Sites**: LWR `AgentforceServiceAgent` (public hub, `DigitalExperienceBundle site/AgentforceServiceAgent1`),
  ESW host `ESW_Company_ASA_1788182577255`, legacy Aura `Company_Agentforce_Service_Agent`.
  Guest access: `Company_Knowledge_Guest_Read` permset + `SharingGuestRule` × 2 on `Company_Knowledge__c`.
- **Network/security**: 6 `CorsWhitelistOrigin`, 4 `CspTrustedSite` (Slack, logo.dev, Voice ×2),
  `CustomLabel:Logo_Dev_Publishable_Key`.
- **Access permsets**: `CltCatalogue_Access`, `Company_Knowledge_Access` (FLS — MDAPI fields are
  invisible until assigned).
- **Installed package**: `SK` v1.23.
- **Not present in this org** (checked 2026-11-21): External Client Apps, Connected Apps, Named/External
  Credentials, Remote Site Settings, Custom Metadata, GenAiPromptTemplates. The Data-Cloud prompt
  template `CLTCat_Company_Profile` is kept in `datacloud-optional/` and deployed post-provision.
- **Not capturable as metadata** (travels only via the Trialforce snapshot / recipe — see
  `docs/deploy-to-new-org.md`): Routing Configuration, queue → routing-config link, agent user
  queue membership + presence, MessagingChannel activation, permset assignments, Agentforce/agent activation.

## Known gaps

- `clt-library/…/staticresources/ecwLaurenBailey.resource-meta.xml` has no matching image file (also absent
  in the org), which breaks project-wide `sf project deploy start -m …` resolution. Deploy by path (`-d`) or
  add the image.
