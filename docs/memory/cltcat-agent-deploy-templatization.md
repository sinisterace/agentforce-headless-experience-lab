---
name: cltcat-agent-deploy-templatization
description: "FINAL architecture + templatization for the website->FAQ-agent feature: what travels, per-clone steps, arm-source-org + OrgFarm test-clone checklists, and the leftover-cleanup keep/delete list"
metadata:
  node_type: memory
  type: project
---

# Templatization: "website → FAQ Service Agent + branded site" (FINAL)

How the agent-deploy feature survives becoming a Trialforce Template (TTID) that OrgFarm mass-produces. Companion to [[clt-catalogue-architecture]]; live-verified 2026-08-24.

## The model
- Template = the reusable machine (all code + config below). Each cloned org = one customer who opens the app and enters *their* website **once**, then opens the site fresh (so cacheable reads are never stale).
- Per-customer personalization is **data** (`Company_Knowledge__c` + brand fields), written at runtime — no per-customer deploy/publish.
- Trialforce is a full-org **snapshot**; org DATA + CONFIG travel. Risk is not "does code travel" (it does) but "does the *published/enabled* state travel" — validate via test-clone.

## Final working architecture (the ONE chain to keep)
- **Agent:** `Agentforce_Service_Agent` (Einstein Service Agent, the regular ASA — NOT the Quick agent). Its active planner has a **custom subagent topic "Answer Company FAQ"** (NOT the OOTB "General FAQ" — the OOTB one force-renders raw action output).
- **Grounding action:** `genAiFunctions/AnswerCompanyFaq` (flow target) → `flows/AnswerCompanyFaq` → Apex `AnswerCompanyFaqAction` → reads active `Company_Knowledge__c`. Output `faqContent` is `isDisplayable:false` + `isUsedByPlanner`/`useHydratedPrompt:true` (grounds without dumping the doc).
- **Runtime store:** `Company_Knowledge__c` (FAQ text, FAQ JSON, summary, signals, accent, logo, Is_Active__c) + `Company_Knowledge_Access` permset (assigned to the ASA bot user; admin-only site so no guest user).
- **Content gen:** `AgentFaqContentService` (Models API `sfdc_ai__DefaultOpenAIGPT4OmniMini`, deterministic fallback).
- **Orchestration:** `CltCatalogRest` `POST /cltcat/deployAgent` (generate FAQ → upsert Company_Knowledge__c; NO callout — branding callout removed).
- **Messaging:** `MessagingChannel:Company_ASA` (active) + `EmbeddedServiceConfig:Company_ASA` (active) + host site `ESW_Company_ASA_1787551133281`.
- **Routing (standard Omni-Channel, no Help Agent, no Agentforce Orchestrator):** channel Routing Type = **Omni-Flow** → flow **"Route to Company Agentforce Service Agent"** (Route Work → ASA, fallback = `Company ASA Escalation Queue`). Agent **Escalation Flow** = `Escalation Flow - Company Agentforce Service Agent` (Route Work → the queue). Queue `Company ASA Escalation Queue` + **RoutingConfiguration `Company ASA Routing Config`**.
- **Branded site:** Network **`Company Agentforce Service Agent`** (URL `companyagentforceserviceagent`) — LWR. Page has `companyBrandHero` LWC (masterLabel "Company Support Hub") + the native **Embedded Messaging** component (Deployment = `Company_ASA`). Site **CSP = Relaxed**; Trusted URL `https://orgfarm-<id>.my.salesforce-scrt.com` (+ `my.site.com`). CORS whitelists `my.site.com`.
- **React (UIBundle):** `/deployAgent` step + `AgentDeployPanel` + the hub component data via `CompanyBrandController.getActiveBrand()`.

## What travels as METADATA (in git, `force-app`)
Apex (`AgentFaqContentService`, `AnswerCompanyFaqAction`, `CompanyBrandController`, `CltCatalogRest`), `genAiFunctions/AnswerCompanyFaq`, `flows/AnswerCompanyFaq` + `flows/Escalation_Flow_Company_Agentforce_Service_Agent`, `objects/Company_Knowledge__c`, `permissionsets/Company_Knowledge_Access`, `queues/Company_ASA_Escalation_Queue`, `lwc/companyBrandHero`, `uiBundles/CltCatalogue`, `messagingChannels/Company_ASA`, `EmbeddedServiceConfig/Company_ASA`.

## What does NOT travel as metadata — rides the Trialforce SNAPSHOT (verify per clone)
- **`RoutingConfiguration`** (`Company ASA Routing Config`) — NOT in the sf CLI registry; UI-created; snapshot only.
- **The Omni-Channel Flow `Route to Company Agentforce Service Agent`** — UI-built; capturable but currently snapshot.
- **The agent** (`Agentforce_Service_Agent` Bot + planner versions + the custom topic wiring) — large/churny; rides snapshot.
- **The sites** — Network + ExperienceBundle + the `ESW_Company_ASA` host site + `SiteDotCom` (SiteDotCom is not MD-API-retrievable). Site **publish state, CSP level, and Trusted URLs** ride the snapshot.
- **MessagingChannel activation** and the **messaging (scrt2) endpoint** — provisioned per org; may need re-activation post-clone.

## Prerequisite enablement (confirm in each clone)
Agentforce Service Agents, Experience Cloud, Enhanced Messaging for Web, and the Models API. **Data Cloud is NOT required** (grounding is a native Apex action, not a Data Library/ADL — a deliberate simplification).

## Arm-the-source-org checklist (BEFORE creating the TTID)
1. Deploy all `force-app` metadata.
2. Assign `Company_Knowledge_Access` to the ASA bot user (`agentforce_service_agent@...ext`) — done.
3. In the ASA: ensure the **custom "Answer Company FAQ" topic** has the `AnswerCompanyFaq` action; set the **Escalation Flow**; **Activate** the agent version.
4. Omni-Channel (UI): create `Company ASA Routing Config`, attach to `Company ASA Escalation Queue` (supports MessagingSession); set the `Company_ASA` channel Routing Type = Omni-Flow → the routing flow.
5. Experience Builder on `companyagentforceserviceagent`: add `Company Support Hub` + native **Embedded Messaging** component (Embedded Web Deployment = `Company_ASA`); **Publish**. Then apply the **frame-ancestors fix** in the next section — the widget renders in Builder but stays blank on the live `/s/` URL without it.
6. Run `/deployAgent` once so a real branded example exists.

## Embedded Messaging on the Experience site — the frame-ancestors fix (live-verified 2026-08-25)
**Symptom:** the Embedded Messaging widget shows in Experience Builder but is blank on the live `…/s/` URL. Console shows `Framing 'https://<domain>.my.site.com/' violates … frame-ancestors <internal domains>` and a failed `ESW…/_/commcsp` load.

**Why:** the widget's iframe is served by the auto-provisioned **ESW host Salesforce Site** — for us `ESW_Company_ASA_17875511332811` (Site URL path `/ESWCompanyASA1787551133281`), the deployment's `<site>`. That ESW site is the *child*; its CSP `frame-ancestors` header only lists the internal `*.my.salesforce.com` / `vf.force.com` domains, so it refuses to be framed by the Experience site (`<domain>.my.site.com`, the *parent*). The **child** controls this — the parent site's own CSP / Trusted URLs (Experience Builder → Security) do NOT.

**Fix (Salesforce Setup, NOT Experience Builder):**
1. Setup → **Sites** (User Interface → Sites and Domains → Sites). If the list is hidden behind the "Register…" gate, click **Register My Salesforce Site Domain** once (safe) to reveal the Sites list.
2. Click the ESW host site **`ESW_Company_ASA_17875511332811`** (URL ends `/ESWCompanyASA1787551133281`).
3. **Trusted Domains for Inline Frames → Add Domain →** add the **wildcard `https://*.my.site.com`** (NOT the org-specific `https://<domain>.my.site.com` — the wildcard already covers it AND is the only value that survives cloning; a specific domain is dead weight in every clone). Add it to BOTH sibling ESW sites (`…1787551133281` and `…17875511332811`) to be safe. Save.
4. **Republish** the Experience site — a stale publish keeps loading the OLD ESW host (`ESWAgentforceServiceAge…`) and stays blocked; hard-refresh / incognito.
- Also required: the `Company_ASA` **messaging channel = Active** (Setup → Messaging Settings). Strict CSP on the parent is fine; only if the console later shows `connect-src` errors to `*.my.salesforce-scrt.com`, add `https://…my.salesforce-scrt.com` + `wss://…my.salesforce-scrt.com` under Experience Builder → Settings → Security & Privacy → **Trusted Sites for Scripts**.

**Scaling across OrgFarm clones (each org has a DIFFERENT domain):**
- A specific `orgfarm-<id>.my.site.com` value is org-specific; a snapshot carries the SOURCE org's literal value, which won't match a clone → block returns. So **use ONLY the wildcard `https://*.my.site.com`** (no specific domain needed — the wildcard covers `orgfarm-<any-id>.my.site.com`, including this org's). Set it in the SOURCE org **before creating the TTID (Trialforce snapshot)** so every clone inherits it. If scripts get blocked under Strict CSP, add wildcards there too: `https://*.my.salesforce-scrt.com` + `wss://*.my.salesforce-scrt.com` under Experience Builder → Trusted Sites for Scripts.
- **Still verify per clone:** the native Embedded Messaging component stores literal `scrtUrl` / `siteEndpoint` (`orgfarm-<id>.my.salesforce-scrt.com` / `…my.site.com/ESWCompanyASA…`) in the page config (ExperienceBundle `views/home.json`). Confirm on a test-clone whether Salesforce rewrites these to the clone's domain; if NOT, re-select `Company_ASA` in the component (regenerates the endpoints) and republish.
- Per-clone steps regardless of wildcard: (a) register the Salesforce Sites domain if the list is gated, (b) confirm the ESW site's Trusted Domains for Inline Frames holds the wildcard, (c) `Company_ASA` channel Active, (d) **republish** the Experience site.

## OrgFarm test-clone verification checklist
- [ ] ASA present + **published** with the custom FAQ topic firing (chat answers concisely, no raw dump).
- [ ] `companyagentforceserviceagent` site **published**, Relaxed CSP + Trusted URL present, chat launcher renders on the live `my.site.com` link (not just Builder preview).
- [ ] `Company_ASA` channel **Active**; `RoutingConfiguration` + queue + Omni-Flow present.
- [ ] **Embedded Messaging renders on the live `/s/` URL** (not just Builder): ESW host site `ESW_Company_ASA` has `https://*.my.site.com` in **Trusted Domains for Inline Frames**, and the console shows no `frame-ancestors` block. See the frame-ancestors section above.
- [ ] Agentforce / Experience Cloud / Messaging / Models API enabled (Data Cloud NOT needed).
- [ ] End-to-end: enter a website in the app → `/deployAgent` succeeds → hub re-brands → agent answers that company's FAQ.

## Cleanup — leftover keep/delete (do conservatively; leftover inactive config is harmless clutter that also travels)
**KEEP (the working chain):** ASA `Agentforce_Service_Agent` (+ its active planner version); `Company_ASA` channel + deployment; `ESW_Company_ASA_1787551133281` host site; site `Company Agentforce Service Agent` (`companyagentforceserviceagent`); flows `Route to Company Agentforce Service Agent` + `Escalation Flow - Company Agentforce Service Agent`; `Company ASA Escalation Queue` + `Company ASA Routing Config`; all the `force-app` code.

**DELETE (unused iteration leftovers) — verify not referenced, deactivate first, delete one at a time:**
- Agent `Quick_Agentforce_Service_Agent` + planners `Quick_Agentforce_Service_Agent_v1/v2/v3`.
- Channels `Help_Agent_1_G`, `Company_Agentforce_Service_Agent` (deactivated), `Agentforce_Service_Agent` (old — verify the ASA now uses `Company_ASA`).
- Deployments `Help_Agent_1_G`, `Company_Agentforce_Service_Agent`, `Agentforce_Service_Agent` (old WebV1).
- ESW host sites `ESW_Help_Agent_1_G`, `ESW_Agentforce_Service_Age_*` (both), `ESW_Service_Agent_Portal_*`.
- Experience sites `agentforceservice` (old hub attempt) and `HelpSite` (unused).
- Old genAiPlannerBundle versions of the ASA (`Agentforce_Service_Agent_v3/v4/v5`) once v6/v7 is confirmed active — these live ONLY in the org (not in git); delete via Setup, not a deploy.
- Repo: `remoteSiteSettings/OrgSelf` + `SiteBrandingService` (+ its test) — **removed from git 2026-08-24** (branding self-callout was dropped; Phase-2 widget branding not pursued). Still present (inert) in the org; can be destructively removed later if desired. `CltCatalogRestTest.BrandingMock` remains as now-dead but harmless test scaffolding.

**Rule:** if unsure whether something is referenced, DEACTIVATE instead of delete; an inactive leftover is harmless and still clones. Delete only what you've confirmed is unused.
