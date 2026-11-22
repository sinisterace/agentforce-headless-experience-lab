# OrgFarm Templatization — Session Handoff

> **Purpose:** orient a fresh session to pick up the OrgFarm/Trialforce templatization of the Agentforce Interfaces app. Read this first, then use `docs/deploy-to-new-org.md` for the step-by-step execution detail. Source of truth for the OrgFarm rules: the user's *"OrgFarm Insights - V1"* doc + the OrgFarm recipe owner's advice on this exact build.

---

## Where we are (as of 2026-09-02)

- The app (**Agentforce Interfaces**) is fully built. **Stage A is COMPLETE** in the source org (`cltcat-src`): app scan/build → active `Company_Knowledge__c` → agent grounds to the industry → embedded chat renders interactive CLT cards on the live guest site.
- **★ The public hub was migrated from the Aura site to an LWR Experience site (`AgentforceServiceAgent`).** This is the key architectural fix: the Aura site + Aura Embedded Messaging load a cross-origin `bootstrap.min.js` (CSP-blockable, and the component baked the source org's domain and couldn't cleanly rebind on a clone). The **LWR native `experience_messaging:embeddedMessaging` component is same-origin — no cross-origin bootstrap, no CSP block** — and its per-org endpoints are rebindable via metadata. The old Aura site is deactivated.
- **★ Stage B recipe is BUILT + VALIDATED end-to-end on a fresh Trialforce clone (2026-09-02).** The org-polisher **"Agentforce Interfaces Setup"** recipe (7 steps, incl. the AgentforceDotCom-V2 rebind engine retargeted to our site) ran on an untouched clone with **zero manual steps** → public LWR hub + embedded agent both live, chat rebound to the clone's own domain. See "Stage B" below + the handoff package.
- **Next up:** hand the recipe to the OrgFarm recipe owner to register + run on the pool (handoff at `~/Downloads/AgentforceInterfaces-recipe-handoff/`), then bulk-provision for Dreamforce.

> The single-org test has PASSED. Per the OrgFarm team: the test was a **single prod request**; bulk follows.

---

## The orgs

| Alias | Username / org | My Domain | Role |
|---|---|---|---|
| `cltcat-src` | `admin@example.com` · `00D000000000000AAA` | `your-domain` | **The source org to Trialforce** (Stage A done here) |
| `cltcat` | `admin-user` · `00D000000000000` | `your-domain` | Original built org (reference; the committed SiteDotCom/flow IDs are its) |

---

## Pre-Trialforce checklist (verify in `cltcat-src` BEFORE snapshotting)

### A. Built content — VERIFIED present (2026-09-01, via CLI)
- ✅ **48 catalog rows** (`CLT_Catalog_Item__c`) — 12 industries × 4 (`SELECT Industry_Key__c, COUNT(Id) FROM CLT_Catalog_Item__c GROUP BY Industry_Key__c`).
- ✅ **3 permission sets** — `CltCatalogue_Access`, `Company_Knowledge_Access`, `Company_Knowledge_Guest_Read`.
- ✅ **Agentforce agent** — `Agentforce_Service_Agent` (Bot + `genAiPlannerBundle` v13).
- ✅ **Active `Company_Knowledge__c`** — 1 row present (currently "Polytainers"/manufacturing; it's just demo content — decide if the snapshot should ship with a default active company or none).
- ✅ **Embedded deployment (`Company_ASA`, Enhanced Chat v2)** + MessagingChannel `Company_ASA` active.
- ✅ **Public Experience site migrated to LWR** — `AgentforceServiceAgent` (Network templateName `Lightning Out (LWR)`, Picasso site `AgentforceServiceAgent1`), Active/Live, with the `companyBrandHero` hub LWC + the native Embedded Messaging component in the footer. The old Aura site `Company_Agentforce_Service_Agent` is **deactivated**.

### B. Org settings / template requirements — MANUAL (confirm/set in Setup)
These are **UI settings**, not queryable metadata. All four must be right before requesting orgs:
1. **Data Cloud = OFF** — *Setup → Data Cloud Setup Home* must show it **never activated**. (OFF by design in `cltcat-src` — the whole project premise; do a final visual confirm. Enabling it is **irreversible** and breaks Trialforce cloning.)
2. **Agentforce = OFF at snapshot** — currently **ON** (needed for building/testing). **Toggle it OFF right before Trialforcing**, then it's re-activated per-org post-provision. *Setup → Agentforce → turn agents off.*
3. **Password policy** — *"Allow use of `setPassword()` API for self-resets"* = **ON**. (*Setup → Password Policies.*)
4. **`CdpInternalOrgStatus = 1`** — org setting required by the template form.

### C. At request time (OrgFarm Event Management / Org Template request form)
- Provide the **Org Template ID (TTID)** created from `cltcat-src` (or search the template store).
- Pick the **Org Template Edition** — **must match** the source template's edition or the request fails.
- Check the feature boxes: **Data Cloud** (so OrgFarm enables DC per provisioned org — do NOT bake into template), **Prompt Builder**, Copilot as needed.
- Confirm the **TTID does NOT have Data Cloud enabled** (the form asks this — it must be true).

---

## Stage B — the "Agentforce Interfaces Setup" recipe (BUILT + validated)

The org-polisher recipe now scripts back everything that doesn't survive Trialforce. It lives in the user's clone at `external_recipes/AgentforceInterfaces/` (`agentforceInterfacesConfig.ts`, `AgentforceInterfaces.ts`, `AgentforceInterfacesDigitalExperienceSite.ts`) and is registered in `services/AutomationConfigRegistry.ts`. **The handoff package for Tom is `~/Downloads/AgentforceInterfaces-recipe-handoff/`** (git-am patch + HANDOFF.md + raw copies).

**7 steps, all validated on a fresh clone (2026-09-02):**
1. **Turn on Agentforce (API)** — `enableEinsteinGptViaApi` + `enableAgentPlatformViaApi`. The clone keeps its Active BotVersion, so the toggle alone restores the agent (no separate activation step needed — confirmed: bot `Agentforce_Service_Agent` Active v1 after this).
2. **Publish the `Company_ASA` embedded deployment** (Enhanced Chat v2) — headless Playwright UI (no publish API).
3. **Deploy CSP Trusted Sites + CORS** — portable wildcards, kept as a *safety net only*. On the LWR site the native messaging component is same-origin, so there is **no `script-src`/bootstrap block** to fix (candidate to drop).
4. **★ Configure and Publish the LWR site (rebind)** — the AgentforceDotCom-V2 `AgentforceDigitalExperienceSite` engine, copied + retargeted (only 3 constants: `SITE_NAME=AgentforceServiceAgent`, `LWR_TEMPLATE_NAME=Lightning Out (LWR)`, `DEPLOYMENT_LABEL=Company ASA`). Reconciles the LWR `DigitalExperienceBundle`, **rebinds `scrtUrl` + `siteEndpoint` to the child org**, deploys via metadata, publishes via Connect API, forces the Network Live. This is what makes the chat connect to the clone, not the template.
5. **Grant guest access** — `Company_Knowledge_Guest_Read` to the LWR site's guest (idempotent; the sharing rule metadata carries via Trialforce).
6. **Re-Publish the LWR site** — 2nd publish (CDN settle), mirrors V2.
7. **Deploy the DC prompt template** `CLTCat_Company_Profile` — self-gates on `Dataspace` (deploys when OrgFarm turned DC on; soft-skips otherwise). Restores the web-grounded scan; base64-embedded so it's self-contained.

**Carries automatically (verified — NO recipe step needed):** the 48 CLTs, both sites incl. the ESW host, MessagingChannel `Company_ASA` (active), all flows, all Apex, permsets + the guest permset assignment, the guest sharing rule, logo.dev trusted URL, custom-field FLS, and **all Omni routing** (the clone's own agent user, its queue membership, presence, and the queue→routing-config link — the agent answers without repointing anything). DC is auto-enabled by the CDP request checkbox.

> **Validated 2026-09-02** on fresh clone `admin@example.com` (`your-domain`): all 7 steps pass in ~3.4 min, public LWR hub + embedded agent live in incognito, chat rebound to the clone domain. Run locally via the throwaway harness `cltcat_local_test.ts` (`@salesforce/core` refreshAuth override + frontdoor login — see HANDOFF.md). Seeding the catalog + creating an active company are optional per-org (learners run the intake app themselves; or use Execution Runner across the pool).

---

## Key facts / corrections (don't re-learn these)

- **Agent ACTIONS auto-update on the ACTIVE agent version — NO agent re-publish/re-activation needed** (user-confirmed 2026-09-01). The CLTs are agent *actions* (genAiFunctions); deploying an updated action (its input schema/output contract) propagates to the running agent immediately — the agent stays on **version 1**. Same mechanism updates the Company FAQ. *Distinct* from: (a) the **Embedded Service Deployment publish** (needed only so the site client registers a **new CLT type** renderer, not for schema changes to an existing type); (b) a card still showing its **sample fallback** after an action deploy = agent grounding/output (LLM didn't populate the payload), NOT a publish gap.
- **MDAPI field deploys grant NO FLS** — assign `CltCatalogue_Access` + `Company_Knowledge_Access` to the builder user right after deploy, or every custom field reads "No such column" and seeds fail to compile. (Not a broken org.)
- **The embedded ESW host site + EmbeddedServiceConfig can't be metadata-deployed to a fresh org** — create the deployment via the **UI wizard**. (Stage A only; once it exists in the source, Trialforce carries it.)
- **Data Cloud is NOT required for the app to function** — the scan degrades ModelsAPI→deterministic; DC only enriches the web-grounded Tier-1 scan.

---

## Pointers

- **Detailed runbook:** `docs/deploy-to-new-org.md` (Stage A steps 0–7 + Stage B).
- **★ Recipe handoff for Tom:** `~/Downloads/AgentforceInterfaces-recipe-handoff/` (git-am patch + HANDOFF.md + raw copies). Recipe source: `org-polisher` clone `external_recipes/AgentforceInterfaces/`.
- **Memories:** `[[orgfarm-templatization]]` (the plan + the LWR/rebind validation), `[[cltcat-org-ops-gotchas]]` (every hard-won per-org gotcha), `[[cltcat-agent-deploy-feature]]`, `[[cltcat-redesign]]`.
- **Repos:** org-polisher `the internal org-polisher repo` (recipes; access required). The **rebind engine is a retargeted copy of AgentforceDotCom V2's `AgentforceDigitalExperienceSite`** — that's the reference for LWR embedded messaging (supersedes the earlier "clone Skywave" plan).
- **Recipe PR validation:** the `orgfarm-pr-precheck` skill.
- **Contacts:** the OrgFarm team, the OrgFarm recipe owner (owns org-polisher; applies + runs the recipe on the pool).

---

## Open decisions — mostly resolved

- ~~Commit org-specific edits vs keep org-agnostic~~ → **keep org-agnostic**; the recipe rebinds per-clone and Omni routing carries automatically (no per-org flow/queue edits needed — verified).
- ~~Default active company vs clean slate~~ → **clean slate**: the source ships with no active `Company_Knowledge__c`; learners create their own via the intake app.
- ~~Recipe vs Execution Runner split~~ → the **recipe does the core** (Agentforce on, ESD publish, LWR rebind + publish, guest, DC template); seeding the catalog + creating an active company are optional and can run via Execution Runner across the pool.
