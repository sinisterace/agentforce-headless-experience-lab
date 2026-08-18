# CLT Catalogue (`cltcat-app`)

A Salesforce DX project with **two deliverables in one repo**:

1. **A deployable library of Custom Lightning Types (CLTs)** — interactive chat
   cards that an Agentforce **Service Agent** renders inside **Enhanced Chat v2
   (ECv2 / MIAW web)**. Fifteen production-ready cards across four industries,
   each a self-contained "5-artifact" bundle (Apex DTO + LightningTypeBundle +
   LWC + Flow + genAiFunction). → [`clt-library/`](clt-library/)

2. **A "CLT Catalogue" lab app** — a React 19 + Vite single-page app that runs
   natively on-platform as a Salesforce **UI Bundle**. A prospect enters a
   company, the app detects its industry via an LLM and recommends that
   industry's CLT set, showing each card live. → [`force-app/.../uiBundles/CltCatalogue/`](force-app/main/default/uiBundles/CltCatalogue/)

Everything targets **Salesforce API v67.0**. The working org is an orgfarm org
aliased **`cltcat`**.

---

## Start here (for AI agents and new contributors)

Read these in order — they hold the design decisions and gotchas that are *not*
obvious from the code:

| # | File | What it tells you |
|---|------|-------------------|
| 1 | [`docs/memory/clt-catalogue-architecture.md`](docs/memory/clt-catalogue-architecture.md) | The **deterministic-recommendations / AI-narrative** design. AI does *not* pick CLTs; it only detects industry + writes prose. |
| 2 | [`docs/memory/clt-enhancedwebchat-render-recipe.md`](docs/memory/clt-enhancedwebchat-render-recipe.md) | **Why a CLT renders (or stays blank) in ECv2** — the four bundle files that must all exist. Read before touching any CLT. |
| 3 | [`docs/memory/cltcat-fs-clt-build-plan.md`](docs/memory/cltcat-fs-clt-build-plan.md) | The per-CLT build workflow, the **Definition of Done**, and the running log of every CLT built so far. |
| 4 | [`clt-templates/clt-flow-enhanced-chat/SKILL.md`](clt-templates/clt-flow-enhanced-chat/SKILL.md) | The **authoritative recipe** for building a new CLT. Templates + build checklist. This skill takes priority over any older export. |
| 5 | [`docs/memory/`](docs/memory/) (rest) | Industry picklist rules, action-independence rule, and other project constraints. |

**Golden rules learned the hard way:**
- A CLT renders in ECv2 **only** if its `lightningTypes/<Type>/` folder has all four
  files: `schema.json`, `<Type>.lightningTypeBundle-meta.xml`,
  `enhancedWebChat/renderer.json`, and `lightningDesktopGenAi/renderer.json`.
  Missing the ECv2 renderer = works on Employee agent, blank on Service Agent.
- **Input CLTs do not render on Service Agent + ECv2 (platform limitation W-22250928).**
  Design every CLT as an action **output**.
- The LLM field-name contract lives in `genAiFunctions/<fn>/input/schema.json`,
  **not** the Flow variable description. The JSON field names there must match
  exactly what the LWC parses, or the card silently falls back.
- Every CLT has **two surfaces** and must be wired into both: the deployable
  ECv2 bundle in `clt-library/`, *and* the React catalogue app (a widget def +
  registry entry + a `CLT_Catalog_Item__c` seed row).

---

## Repository map

```
cltcat-app/
├── clt-library/                      # DEPLOYABLE CLT bundles (package dir #2, non-default)
│   └── main/default/
│       ├── lightningTypes/           # 15 CLT bundles — the renderer contract
│       ├── lwc/                       # 15 LWCs — the actual card UI
│       ├── flows/                     # 15 AutoLaunched "Output" flows
│       ├── genAiFunctions/            # 15 agent actions (input + output schema)
│       ├── classes/                   # Apex DTOs (+ tests) that back the flows
│       └── staticresources/           # sample images used by cards
│
├── force-app/                        # DEFAULT package dir — the catalogue lab app + backend
│   └── main/default/
│       ├── uiBundles/CltCatalogue/   # React 19 + Vite UI Bundle (the app users see)
│       │   ├── src/                   # app.tsx, pages/, components/, widgets/, api/
│       │   └── dist/                  # built output that actually deploys
│       ├── classes/                   # CltCatalogRest, ConsultationCatalogService,
│       │                              #   ConsultationProfileService (+ tests)
│       ├── objects/
│       │   ├── CLT_Catalog_Item__c/   # one row per CLT per industry (the recommendations table)
│       │   └── Onboarding_Profile__c/ # a saved consultation
│       ├── genAiPromptTemplates/      # CLTCat_Company_Profile (industry + narrative)
│       ├── applications/ tabs/ flexipages/ permissionsets/   # CltCatalogue app shell + access
│       └── ...
│
├── clt-templates/                    # The build recipe (Claude Code skill) for authoring new CLTs
│   └── clt-flow-enhanced-chat/       # SKILL.md + templates/ + references/
│
├── docs/memory/                      # ⭐ Project decisions & gotchas — read these first
├── scripts/apex/                     # Idempotent seed scripts for CLT_Catalog_Item__c rows
├── config/                           # Scratch org definition
└── sfdx-project.json                 # Two package dirs: force-app (default) + clt-library
```

---

## The CLT library (what's built)

Fifteen CLTs across four industries. Each industry is **gated** — the catalogue
shows only that industry's set. CLTs within an industry are kept conceptually
independent so the agent doesn't chain them (see
[`clt-independent-actions-per-industry.md`](docs/memory/clt-independent-actions-per-industry.md)).

| Industry (`Industry_Key__c`) | Accent | CLTs |
|---|---|---|
| Financial Services (`financial_services`) | `#0b5cab` | Account Selector · Recent Transactions + Dispute · Advisor Appointment · Money Movement |
| Insurance (`insurance`) | per-type | Policy Selector · File a Claim · Claim Status Tracker |
| Healthcare (`healthcare`) | `#0f766e` | Appointment Scheduler · Find Care Near You · Care Options · Prescription Refill |
| Retail (`retail`) | `#4f46e5` | Product Carousel · Order Tracking · Returns & Exchange · Store Pickup |

**Naming convention:** every CLT is `ASA [Industry] · [Name]`. The LWC,
LightningType, DTO, and `<name>_Output_<4hex>` flow/genAiFunction all share a
base name (e.g. `asaFinServAccountSelector` / `AsaFinServAccountSelectorData` /
`asaFinServAccountSelector_Output_acc7`).

### Anatomy of one CLT (the "5 artifacts", all @ API 67)

| Artifact | Location | Role |
|---|---|---|
| **Apex DTO** | `classes/<Dto>.cls` | `global`, one `@AuraEnabled global String <jsonField>` carrying the card payload as JSON |
| **LightningTypeBundle** | `lightningTypes/<Type>/` | The render contract — `schema.json`, `.lightningTypeBundle-meta.xml`, `enhancedWebChat/renderer.json`, `lightningDesktopGenAi/renderer.json` |
| **LWC** | `lwc/<name>/` | The card UI; `JSON.parse(this.value.<jsonField>)`, returns choices via `sendTextMessage` |
| **Flow** | `flows/<name>_Output_<hex>.flow-meta.xml` | AutoLaunched; assigns the input JSON into the DTO output. No Apex logic required |
| **genAiFunction** | `genAiFunctions/<name>_Output_<hex>/` | The agent action + input/output schema (the LLM field contract) |

---

## The catalogue lab app

A React SPA served on-platform as the `CltCatalogue` UI Bundle. Flow:

1. User enters a company → `POST /services/apexrest/cltcat/scan`.
2. `ConsultationProfileService` calls the LLM (Models API today; a web-retriever
   prompt template when Data Cloud + Einstein GenAI are enabled) to detect
   **industry + a written summary/plan narrative**. It **never dead-ends** —
   any failure collapses to a deterministic fallback.
3. Recommendations are a **deterministic lookup**: all `CLT_Catalog_Item__c`
   rows for the detected industry, ordered by `Display_Order__c`. Two companies
   in the same industry get the identical CLT set but unique AI prose.
4. Each recommended card renders live in the app's playground/channel frames.

The REST facade is [`CltCatalogRest`](force-app/main/default/classes/CltCatalogRest.cls)
(`urlMapping='/cltcat/*'`): `GET /catalog`, `POST /scan`, `POST /save`. The
React client wraps it in [`src/api/catalogApi.ts`](force-app/main/default/uiBundles/CltCatalogue/src/api/catalogApi.ts).

There's also a **dev harness** behind the URL hash `#preview`
([`src/pages/CltHarness.tsx`](force-app/main/default/uiBundles/CltCatalogue/src/pages/CltHarness.tsx)):
pick any registered widget, edit its payload JSON, and preview it with no org or
Apex needed (`npm run dev` → `localhost:5173/#preview`).

---

## Getting started

### Prerequisites
- **Salesforce CLI** (`sf`), **Node.js ≥ 22**, and an authorized org.
- The org needs an active Agentforce **Service Agent** on **Enhanced Chat v2**
  to test CLT rendering end-to-end.

### Install & authorize
```bash
npm install
sf org login web --alias cltcat --set-default
```

### Deploy the CLT library
```bash
sf project deploy start --source-dir clt-library --target-org cltcat
```
After deploy, the genAiFunctions appear in the Agent Builder "Add Action"
library. You still have to **attach each action to a topic and republish** the
agent version before it will fire.

### Build & deploy the catalogue app
```bash
# 1. Build the React bundle (produces dist/, which is what deploys)
cd force-app/main/default/uiBundles/CltCatalogue
npm install && npm run build

# 2. Deploy the UI Bundle
cd -
sf project deploy start --metadata UIBundle:CltCatalogue --target-org cltcat

# 3. Deploy backend + config (first time)
sf project deploy start --source-dir force-app --target-org cltcat
```

### Seed the recommendations table
`CLT_Catalog_Item__c.Industry_Key__c` is a **restricted picklist** — add the
value + deploy the field *before* seeding a new industry
([details](docs/memory/cltcat-industry-key-restricted-picklist.md)). Seed rows
via the idempotent scripts:
```bash
sf apex run --file scripts/apex/seed_healthcare_clts.apex --target-org cltcat
sf apex run --file scripts/apex/seed_retail_clts.apex --target-org cltcat
```

### Tests & quality gates
```bash
npm test                 # LWC Jest tests (root)
npm run prettier         # format
# In the UI bundle: npm run test (vitest) + tsc -b (via npm run build)
```

---

## Adding a new CLT (short version)

The full checklist and templates live in the
[`clt-flow-enhanced-chat` skill](clt-templates/clt-flow-enhanced-chat/). In brief:

1. **Build the 5 artifacts** in `clt-library/` from the skill's `templates/`,
   sharing one base name. Meet the **Definition of Done** in
   [`cltcat-fs-clt-build-plan.md`](docs/memory/cltcat-fs-clt-build-plan.md)
   (all four renderer files, output-only, narrow-column CSS guards, matching
   field names on both sides of the schema).
2. **Wire the React surface**: add the widget def + registry entry, capability
   icon in `shared.tsx`, sample in `CltHarness.tsx`, and channel copy; rebuild.
3. **Seed a `CLT_Catalog_Item__c` row** for the industry (add the picklist value
   first if new).
4. **Deploy** `clt-library` + the rebuilt `UIBundle:CltCatalogue`.
5. **Attach the genAiFunction action** to a topic in Agent Builder + republish,
   then self-test in ECv2 (a healthy render shows `"__supports_result_display__": true`).

Deleting an already-attached CLT is a guarded multi-step teardown — see the
build-plan memory before attempting it.

---

## Common `sf` commands

| Command | Purpose |
|---|---|
| `sf org open --target-org cltcat` | Open the org |
| `sf project deploy start --source-dir clt-library` | Deploy the CLT bundles |
| `sf project deploy start --metadata UIBundle:CltCatalogue` | Deploy the app after `npm run build` |
| `sf apex run --file scripts/apex/<seed>.apex` | Seed catalogue rows |
| `sf project retrieve start --metadata <type>` | Pull metadata down |
