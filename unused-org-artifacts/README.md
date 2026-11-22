# Unused org-side artifacts — DO NOT DEPLOY

Everything under this folder is **leftover org scaffolding from experimentation** and is **not part of the "Customize your agent for any channel" app or its Agentforce backend**. It is kept here only for reference/traceability.

**Why it can't reach other orgs:** this directory is **outside `packageDirectories`** in `sfdx-project.json` (which lists only `force-app` and `clt-library`), and is also listed in `.forceignore` (`unused-org-artifacts/**`). So `sf project deploy start` and any repo-based provisioning will never include it.

## What's in here

### Help Agent 1 / "Help Portal" (a separate, unused Agentforce agent — not our app)
- `EmbeddedServiceConfig/Help_Agent_1_G` — its embedded (MIAW WebV2) deployment
- `messagingChannels/Help_Agent_1_G`
- `sites/` + `networks/` + `digitalExperiences/site/ESW_Help_Agent_1_G_*` — its Enhanced Web Chat host site
- `bots/Quick_Agentforce_Service_Agent` — the bot itself (masterLabel **"Help Agent 1"**)
- `genAiPlannerBundles/Quick_Agentforce_Service_Agent_v2` — its compiled planner
- `brandingSets/EmbeddedServiceConfig_BrandingSet_1a015bd09eb` — its branding set

### `agentforceservice` Experience site (unused duplicate scaffold)
- `sites/agentforceservice` + `networks/agentforceservice` + `siteDotComSites/agentforceservice1.*`
- Status `UnderConstruction`, never launched. The real, Live app site is **`Company_Agentforce_Service_Agent`** (URL prefix `companyagentforceserviceagent`).

## Related leftovers that live ONLY in the org (not committed here)
Left in the `cltcat` org intentionally for now — remove later if/when doing an org-side cleanup:
- The **`HelpSite`** Experience site (`helpsite274296`, `UnderConstruction`).
- Guest user profiles for the unused sites (`HelpSite`, `agentforceservice`, `ESW_*`).
- Orphaned `MessagingChannel`s left after deleting their embedded deployments in Setup: `Agentforce_Service_Agent`, `Company_Agentforce_Service_Agent`.

## The actual app + backend that DOES deploy (for contrast)
- **`force-app`** — `Company_ASA` embedded deployment + channel, `Company_Agentforce_Service_Agent` site + `ESW_Company_ASA` host, the `Agentforce_Service_Agent` agent (bot + `aiAuthoringBundles` + planner), `Company_Knowledge__c` + guest-read setup, the `/cltcat` REST + scan/deploy services, routing flow/queue.
- **`clt-library`** — the 48 Custom Lightning Types (Apex DTOs, flows, genAiFunctions, LWCs, lightningTypes).

## Caveat for the 500-org rollout
This fences off the **repo/source-deploy** path. If the rollout is a **Trialforce/OrgFarm snapshot** of this org rather than a repo deploy, these org-side leftovers would still be captured by the snapshot and should be deleted in the org before the snapshot is taken.
