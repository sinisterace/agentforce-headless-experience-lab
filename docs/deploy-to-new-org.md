# Deploying the Agentforce Interfaces app — two stages

This app reaches learner orgs in **two stages**:

- **Stage A — Blueprint into a fresh no-Data-Cloud SOURCE org** (metadata + a few manual steps). This is what makes the source org that Trialforce will snapshot. ← *you are here*
- **Stage B — Trialforce → OrgFarm pool + recipes/Execution Runner** (post-provision automation for the pieces that don't survive templating).

The key OrgFarm rule: **Data Cloud and Agentforce must NOT be "on" in the snapshot.** You build/test with them on, then Data Cloud stays **off** in the source and Agentforce is toggled **off** right before snapshotting; both are turned back on/activated per-org after provisioning.

---

# Stage A — Blueprint into the new source org (no Data Cloud)

> **STATUS — VERIFIED END-TO-END (2026-08-31)** in `admin@example.com` (alias `cltcat-src`, `your-domain`). Full flow proven with an **Air Canada** intake: app scan/build → active `Company_Knowledge__c` (`Industry_Key__c`) → agent grounds to the industry → the native Embedded Messaging (Enhanced Chat v2) widget renders on the live guest site and the Agentforce Service Agent responds with interactive CLT cards.
>
> **Non-obvious steps that were required (details in the numbered steps):** assign `CltCatalogue_Access` + `Company_Knowledge_Access` to the builder user (MDAPI fields have no FLS → "No such column" until then); the ESW site + ESC can't be metadata-deployed → **create the embedded deployment via the UI wizard**; activate the MessagingChannel via Apex; repoint the routing flow's hardcoded `queueId`; link queue → routing config; make the **agent user Omni-routable** (queue member + `PresenceUserConfigUser`); add **CORS** origins **and** allow the widget in **CSP** (Relaxed, or Strict + CSP Trusted Sites). All of these are runtime/per-org → Stage-B recipe steps.

> **★ UPDATE (2026-09-02) — the embedded-messaging approach changed; some steps below are superseded.** The public hub was **migrated from the Aura site to an LWR Experience site (`AgentforceServiceAgent`)**. Reason: Aura + Aura Embedded Messaging load a cross-origin `bootstrap.min.js` (CSP-blockable, and the component baked the source domain and couldn't rebind on a clone). The **LWR native `experience_messaging:embeddedMessaging` component is same-origin → no cross-origin bootstrap, no CSP block**, and its per-org endpoints rebind via metadata. Practical effects on the steps below:
> - **§3 (site):** build an **LWR** "Build Your Own / Lightning Out (LWR)" site named `AgentforceServiceAgent`, drop the `companyBrandHero` hub LWC on the page **and** the **Embedded Messaging** component (bound to `Company ASA`) in the footer. It serves at `/<prefix>` (no Aura `/s`).
> - **§5 (embedded/CSP/CORS):** CORS + CSP Trusted Sites are **no longer required** on LWR (kept in the recipe only as a harmless safety net). The ESW host site + `EmbeddedServiceConfig` still come from the UI wizard in Stage A.
> - **Stage B:** the per-org site rebind is handled by the **"Agentforce Interfaces Setup" recipe** (see the Stage B section) — validated end-to-end on a fresh clone (2026-09-02).

### 0. Enable in the target source org (Setup)
- My Domain (deployed + activated)
- **Digital Experiences** (so "All Sites" appears)
- **Einstein Generative AI** (Models API — the scan fallback + FAQ generation; also required for the genAiFunctions/agent to deploy)
- **Agentforce** (Service Agent) — ON for building; toggled OFF before Stage B snapshot
- Messaging for In-App and Web (Enhanced Chat v2) + Omni-Channel (for the embedded chat + routing; can be done at the embedded step)
- **Data Cloud: leave OFF** (Setup → Data Cloud Setup Home not toggled). Enabling it is irreversible and breaks Trialforce cloning.

### 1. Authorize + deploy the portable core
```
sf org login web --alias <newOrgAlias>
sf project deploy start -d force-app -d clt-library -o <newOrgAlias>
```
Deploys: 3 objects + fields, all Apex + tests, `companyBrandHero`, the 48 CLTs (DTO + lightningType + LWC + flow + genAiFunction), the agent (bot + `genAiPlannerBundle v13` + aiAuthoringBundle), `Company_ASA` embedded config + channel + `BrandingSet …1a03259eb72`, the ESW digitalExperiences host, escalation/route flows, queue + routing config, 3 permsets, tabs/app, custom labels, static resources, layouts, CSP.
- **Held out on purpose:** `datacloud-optional/` (the Data-Cloud prompt template — see Stage B) and `post-site-setup/` (the guest sharing rule — step 4).

### 1b. Assign field-level security to the running user — DO THIS RIGHT AFTER THE DEPLOY
```
sf org assign permset --name CltCatalogue_Access --name Company_Knowledge_Access -o <newOrgAlias>
```
**Metadata-API field deploys do NOT auto-grant FLS to the System Administrator profile** (unlike creating a field in the UI). The FLS lives only in these permission sets. Until the running/builder user is assigned them, **every custom field on `CLT_Catalog_Item__c` / `Company_Knowledge__c` / `Onboarding_Profile__c` reads back as "No such column"** in SOQL — and anonymous Apex (the seeds) fails to compile with `Variable does not exist`, because Apex compilation respects the running user's FLS. The fields *are* there (Object Manager + Tooling API show them); they're just invisible without FLS. This looks exactly like a broken org — it isn't. Assign the permsets, and everything resolves. (The Agentforce bot user and the site guest user get FLS in steps 6 and 4 respectively.)

### 2. Publish + (temporarily) activate the agent for testing
`sf agent publish authoring-bundle --api-name Agentforce_Service_Agent -o <newOrgAlias>`, then activate the new version in Agent Builder to test. **(In Stage B the agent must be OFF at snapshot; it's re-activated per-org.)**

### 3. The public Experience site + hub page
The branded site `Company_Agentforce_Service_Agent` (Build-your-own / Aura, prefix `companyagentforceserviceagent`) is committed as a **binary SiteDotCom snapshot of the cltcat org** — it hard-codes that org's admin/guest-owner, so a metadata push may not land cleanly. Expect to **recreate the Aura site** in the new org, add the **`companyBrandHero` LWC ("Company Support Hub")** to its page, remap admin/guest-record owner, then **Publish + Activate**. (This site DOES survive Trialforce once it exists in the source — the binary-deploy limitation is only here in Stage A.)

### 4. Guest / public access (after the site + guest user exist)
```
sf project deploy start -d post-site-setup -o <newOrgAlias>      # guest sharing rule
```
Then assign **`Company_Knowledge_Guest_Read`** to the site's guest user.

### 5. Messaging-for-Web (Enhanced Chat v2) embedded deployment
The `Company_ASA` **channel + branding set deploy as metadata** (they have no site dependency); activate the channel via Apex (`IsActive` is read-only in Metadata API). But the **ESW host site + the EmbeddedServiceConfig CANNOT be deployed from metadata** — a fresh org rejects the committed snapshot ("You can't create the experience space … a corresponding site doesn't exist" + a missing `SNA_…_sf_default_cdn_…` StaticResource). **Create the deployment in the UI wizard instead** (Setup → Embedded Service Deployments → New → Messaging for Web); it auto-creates a valid ESW host site (its own `ESW_Company_ASA_<newid>` + a new branding set) and the channel junction. Enter the **public site host domain** (`<mydomain>.my.site.com`) in the Domain field, select the **Company ASA** channel, **switch to Enhanced (WebV2)**, then **Publish**.

**CORS is REQUIRED (the Domain field is NOT sufficient — verified 2026-08-31).** Without it the widget renders nothing on the live site: the browser console shows `blocked by CORS policy: No 'Access-Control-Allow-Origin' header` on the widget's `…my.salesforce-scrt.com/embeddedservice/v1/embedded-service-config` fetch from the `…my.site.com` origin. Add the site origins to **Setup → CORS → Allowed Origins List** (or deploy as `CorsWhitelistOrigin` metadata — the portable path). cltcat has exactly two: `https://<mydomain>.my.site.com` **and** `https://<mydomain>.my.salesforce.com`. Verify the fix with `curl -sI -H "Origin: https://<mydomain>.my.site.com" "https://<mydomain>.my.salesforce-scrt.com/embeddedservice/v1/embedded-service-config?orgId=<15charOrgId>&esConfigName=Company_ASA&language=en-US"` → it must echo `access-control-allow-origin: https://<mydomain>.my.site.com`.

**CORS is necessary but NOT sufficient — the site's CSP must ALSO permit the widget (verified 2026-08-31).** These are two independent browser gates on the same scrt2 call: CORS = the scrt2 server allows your origin; CSP = your Experience site's own policy allows the widget's scripts/connections. The browser reports only the *first* failure, so after CORS is fixed a CSP block surfaces next. Two valid CSP configs: **(a) Relaxed CSP** (Experience Builder → Settings → Security & Privacy → set Security Level to Relaxed) — simplest, what unblocked cltcat-src; or **(b) Strict CSP + CSP Trusted Sites** for `https://<mydomain>.my.salesforce-scrt.com` (+ `wss://`) and `https://<mydomain>.my.site.com` — cltcat's more-locked-down way. Frame-ancestors is NOT applicable here (the ESW iframe is same-origin `*.my.site.com`). Republish the site after any CSP change; hard-refresh in incognito.

Proven-working sequence (this is what actually got the agent to answer on Enhanced Web Chat):
```
# a. channel + branding (metadata), then activate channel
sf project deploy start --metadata "MessagingChannel:Company_ASA" --metadata "BrandingSet:EmbeddedServiceConfig_BrandingSet_1a03259eb72" -o <org>
sf apex run --file - <<'EOF'  # IsActive is read-only via Metadata API
MessagingChannel c=[SELECT Id,IsActive FROM MessagingChannel WHERE DeveloperName='Company_ASA' LIMIT 1];
if(!c.IsActive){c.IsActive=true;update c;}
EOF
# b. UI wizard: create the "Messaging for Web" deployment (auto-creates ESW site) → Enhanced v2
# c. link the queue to its routing config (NOT in queue metadata — must be set manually/by API):
#    Setup → Queues → Company_ASA_Escalation_Queue → Routing Configuration = Company_ASA_Routing_Config
```
Then complete the **agent-user routability** below (§6) BEFORE clicking Publish — a userless/unroutable agent makes Publish **Gack** and the test chat say **"no agents available."**

**Re-Publish whenever CLTs/agent change** — this regenerates the client snapshot that renders the interactive cards. Publishing has **no API** (headless Playwright is the only automation — see Skywave `scripts/publishEmbeddedServiceDeployment.mjs`); for a single source org, click Publish in Setup.

### 6. Omni routing + agent-user routability (the "no agents available" fix)
All **runtime data records** (NOT metadata — they don't survive Trialforce; recreate per-org):
1. **Repoint the routing flow's queue.** `flows/Route_to_Company_Agentforce_Service_Agent` has a hardcoded `routeWork` `queueId` (cltcat's `00GgL…`). It must be this org's `Company_ASA_Escalation_Queue` Id — the platform rejects a `setupReference` for `queueId` (must be a raw ID). Query the new Id, substitute, redeploy the flow.
2. **Link queue → routing config:** `Company_ASA_Escalation_Queue.QueueRoutingConfigId = Company_ASA_Routing_Config` (set via Setup → Queues UI or API; the queue metadata does NOT carry this link).
3. **Agent user (`agentforce_service_agent@<orgid>.ext`) must be Omni-routable** — else "no agents available":
   - add it to the queue: `sf data create record -s GroupMember -v "GroupId=<queueId> UserOrGroupId=<agentUserId>"`
   - give it presence: `sf data create record -s PresenceUserConfigUser -v "PresenceUserConfigId=<default_presence_config Id> UserId=<agentUserId>"`
   - assign `Company_Knowledge_Access` (FAQ read). (`sf agent publish` sets `BotDefinition.BotUserId` correctly on v67 — verify it's non-null; the recipe's §1.6 step patches it on releases where it's null.)

### 7. Seed + create the active company
```
sf apex run --file scripts/apex/seed_<industry>_clts.apex -o <newOrgAlias>   # all 12 industries
```
Then run the app (intake a website → build) to write the single active `Company_Knowledge__c` row the hub + agent read. Verify guest hub + embedded chat.

### Org-specific values to expect / fix
- `Route_to_Company_Agentforce_Service_Agent` routes to cltcat's queue → repoint.
- SiteDotCom snapshot admin/owner = cltcat's admin → remap.
- ESW host bakes cltcat's `*.my.salesforce.com` / `*.salesforce-scrt.com` URLs → regenerated on Publish.
- Guest profiles + the guest user are auto-created with the site (not in repo, by design).

---

# Stage B — Trialforce → OrgFarm pool

Once the source org is fully built + verified:

### Before snapshotting the source (TTID)
- **Data Cloud OFF** (never activated in the source — irreversible).
- **Agentforce agents toggled OFF** (build+test on, then off right before snapshot).
- Template config requirements: password policy **"Allow use of setPassword() API for self-resets" = ON**; org setting **`CdpInternalOrgStatus = 1`**; the **Org Template Edition must match** at request.

### At request time (OrgFarm Event Management)
- Check the **Data Cloud** box → OrgFarm enables Data Cloud per provisioned org (do NOT bake it into the template).
- Confirm the TTID you provide does **not** have Data Cloud enabled.

### Post-provision — the "Agentforce Interfaces Setup" recipe (BUILT + validated 2026-09-02)
The org-polisher recipe (`external_recipes/AgentforceInterfaces/`; handoff at `~/Downloads/AgentforceInterfaces-recipe-handoff/`) scripts back everything that doesn't survive templating, in 7 steps — validated end-to-end on a fresh clone with zero manual steps:
1. **Turn on Agentforce (API)** — the clone keeps its Active BotVersion, so the toggle alone restores the agent (no separate activation).
2. **Publish the `Company_ASA` embedded deployment** (Enhanced Chat v2) — headless Playwright (no publish API).
3. **Deploy CSP Trusted Sites + CORS** — portable wildcards, **safety net only** (LWR is same-origin — no `script-src` block; candidate to drop).
4. **Configure and Publish the LWR site (rebind)** — reconciles the LWR `DigitalExperienceBundle`, rebinds `scrtUrl` + `siteEndpoint` to the child org, deploys via metadata, publishes via Connect API, forces the Network Live. This is the retargeted AgentforceDotCom-V2 rebind engine (`AgentforceInterfacesDigitalExperienceSite.ts`). **This is what makes the chat connect to the clone, not the template.**
5. **Grant guest access** — `Company_Knowledge_Guest_Read` to the LWR site's guest (the sharing rule metadata itself carries via Trialforce).
6. **Re-Publish the LWR site** — 2nd publish (CDN settle).
7. **Deploy the DC prompt template** `CLTCat_Company_Profile` — self-gates on `Dataspace` (base64-embedded).

**Carries automatically — NO recipe step:** the 48 CLTs, both sites incl. the ESW host, MessagingChannel `Company_ASA` (active), all flows/Apex/permsets + the guest permset assignment + the guest sharing rule, logo.dev trusted URL, field FLS, and **all Omni routing** (agent user + queue membership + presence + queue→routing-config link — the agent answers with nothing repointed). DC is auto-enabled by the CDP request checkbox.
- **Optional per-org (Execution Runner across the pool):** seed the catalog (`scripts/apex/seed_*_clts.apex`) and/or create an active company — but learners normally do this themselves via the intake app, so the template ships blank.

### Pointers
- **Execution Runner** (Org Studio) fans SF CLI / anonymous Apex across up to 20 orgs in parallel — use it for the seeds, active-company creation, agent activation, and the prompt-template deploy.
- **the OrgFarm recipe owner** already built + tested a recipe for this exact build (template ID `0TT000000000000`) — clone that recipe from the **org-polisher** repo (`the internal org-polisher repo`) as a starting point.
- Validate any recipe PR with the **`orgfarm-pr-precheck`** skill.
