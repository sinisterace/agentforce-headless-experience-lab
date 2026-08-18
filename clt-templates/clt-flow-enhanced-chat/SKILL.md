---
name: clt-flow-enhanced-chat
description: >
  Build a Flow-backed Custom Lightning Type (CLT) that is selectable in the
  Agentforce Builder action picker / Asset Library AND renders as an interactive
  card in the Enhanced Chat v2 (Service Agent / MIAW web) Live Test preview.
  Produces the full 5-artifact bundle — Apex DTO, LightningTypeBundle (schema +
  enhancedWebChat + lightningDesktopGenAi renderers), LWC, Flow action,
  genAiFunction — from one proven, verified pattern.

  TRIGGER when: user wants to build a new CLT / chat card (product card,
  appointment/seat picker, selection card, map, etc.) for a Service Agent;
  wants a card to render in Enhanced Chat v2; asks why their CLT is blank / plain
  text in ECv2 but works on desktop; wants a Flow-based (no-Apex-logic) action
  that returns a rendered card; needs a new CLT to be pickable in Agent Builder.

  DO NOT TRIGGER when: the action must run real Apex business logic and bind an
  @InvocableMethod Response field (use agentforce-custom-renderer-card — that skill
  is Apex-invocable-only); wiring channels/routing (agentforce-channel-deployment);
  authoring agent topics/.agent files (agentforce-generate).
license: Apache-2.0
compatibility: "sf CLI; Salesforce API v67.0 (LightningTypeBundle min 64.0); Agentforce Service Agent + Enhanced Chat v2"
metadata:
  version: "1.0.0"
  validation_status: "VERIFIED_LIVE_ECv2 — asaItemSelector, asaAddItem, asaAppointmentSelector rendered in Enhanced Chat v2 Live Test, org achisty@sdo-dreamforceconsultations.com, 2026-08-09"
---

# clt-flow-enhanced-chat

Build a Flow-backed Custom Lightning Type that renders in Enhanced Chat v2.

## Why this skill exists (the hard-won facts)

Verified live on 2026-08-09. Three CLTs went from **blank in ECv2** to **rendering** by
adding two files. The non-obvious truths:

1. **A CLT renders in Enhanced Chat v2 ONLY if its `lightningTypes/<Type>/` folder has
   ALL FOUR of:** `schema.json`, `<Type>.lightningTypeBundle-meta.xml`,
   `enhancedWebChat/renderer.json`, `lightningDesktopGenAi/renderer.json`.
   The two most-often-missing are **`enhancedWebChat/renderer.json`** (the ECv2
   renderer — without it ECv2 shows plain text) and the **`.lightningTypeBundle-meta.xml`**
   (without it the type may not register).
2. **Flow actions render CLTs.** Apex is NOT required. The renderer pipeline only cares
   about the CLT bundle + the output binding, not how the output was produced. Flow avoids
   Apex cold-start lag and is admin-editable — the right default for many-CLT catalogues.
3. **The LLM reads the field contract from `genAiFunctions/<fn>/input/schema.json`
   (the `description`), NOT the Flow variable description.** The example JSON + field
   names in that description MUST match exactly what the LWC parses. Mismatch = silent
   wrong behavior (e.g. LWC reads `mode`, prompt says `selectionMode` → always single).
4. **Healthy-render signal:** the action output JSON in the ECv2 trace contains
   `"__supports_result_display__": true`. If output is `formatType=Text`, the CLT is
   silently stripped — that's a failure even though the action "succeeded".
5. **Input CLTs do NOT render on Service Agent + ECv2 (W-22250928).** Build every CLT as
   an action **output**. User choices flow back via the LWC calling
   `embeddedservice_configuration.util.sendTextMessage(...)`, not an input form.
6. **Asset Library / picker:** deploying the genAiFunction as metadata makes the action
   appear in Agent Builder's "All Actions" picker (search by masterLabel). That is the
   org-local action list — no AgentExchange packaging needed to make it selectable.

## The bundle: 5 artifacts, always

For a CLT named `<Name>` (LWC `<lwcName>`, DTO `<DtoClass>`, one JSON field `<jsonField>`):

```
classes/<DtoClass>.cls(+meta)                       # global DTO, one @AuraEnabled String <jsonField>
lightningTypes/<lwcName>/
  <lwcName>.lightningTypeBundle-meta.xml            # REQUIRED — registers the type
  schema.json                                       # "lightning:type": "@apexClassType/c__<DtoClass>"
  enhancedWebChat/renderer.json                     # REQUIRED for ECv2 → "definition":"c/<lwcName>"
  lightningDesktopGenAi/renderer.json               # desktop fallback → same body
lwc/<lwcName>/ (js, html, css, js-meta.xml)         # @api value; parse value.<jsonField>; test-mode fallback
flows/<Name>_Output_xxxx.flow-meta.xml              # AutoLaunchedFlow: String Details in → assign → Apex Options out
genAiFunctions/<Name>_Output_xxxx/
  <Name>_Output_xxxx.genAiFunction-meta.xml         # invocationTargetType=flow
  input/schema.json                                 # description = the LLM field contract (MUST match LWC)
  output/schema.json                                # Options bound to c__<lwcName>, copilotAction:isDisplayable=true
```

Copy the skeletons in `templates/` and replace the `<...>` tokens. Read
`references/build-checklist.md` and follow it step by step. Read
`references/proven-examples.md` for the three real, verified bundles to pattern-match
new card types (product card, seat map, appointment, selection, map) against.

## Build procedure (summary — full steps in references/build-checklist.md)

1. Decide `<Name>`, `<lwcName>`, `<DtoClass>`, `<jsonField>`, and the JSON payload shape
   the card needs. Keep the field names you invent here as the SINGLE source of truth.
2. Author the 5 artifacts from `templates/`. The LWC parses `value.<jsonField>` and MUST
   read the exact field names you chose; include a test-mode fallback so it renders even
   with an empty/absent payload.
3. Make the `genAiFunction input/schema.json` description show an example JSON using those
   EXACT field names + rules for each. This is what the planner emits.
4. Deploy: CLT bundle + LWC + DTO + Flow + genAiFunction (all five). Use `sf project deploy start`.
5. In Agent Builder: add the action to a subagent (search its masterLabel), open
   Preview → Live Test → Enhanced Chat v2, prompt to trigger it.
6. **Verify:** the styled card renders AND the output JSON shows
   `"__supports_result_display__": true`. If blank → check the two required files exist
   and were deployed. If wrong content → check field names match between input schema and LWC.

## Common failure modes → fix

| Symptom | Cause | Fix |
|---|---|---|
| Blank / plain text in ECv2, fine on desktop | missing `enhancedWebChat/renderer.json` | add it (points to `c/<lwcName>`), redeploy |
| Type not resolving / action won't attach | missing `.lightningTypeBundle-meta.xml` | add it, redeploy |
| Card renders but wrong mode/values | prompt field names ≠ LWC field names | fix `genAiFunction input/schema.json` description; republish agent / fresh session |
| Output shows `formatType=Text`, no card | output not bound as displayable CLT | output/schema.json: `lightning:type: c__<lwcName>`, `copilotAction:isDisplayable: true` |
| Input form never appears on Service Agent | input CLTs unsupported (W-22250928) | redesign as output card; collect choices via sendTextMessage |
| Schema edit didn't take effect | agent caches action schema per version | republish the agent version / start a fresh Live Test session |
| Card narrow / cream gaps / wrong sizing in a React catalogue but fine in ECv2 | class-name collision in the shared (global) preview stylesheet — another CLT owns your `asa-<code>-` prefix | give each CLT a UNIQUE `asa-<code>-` prefix; grep the shared stylesheet for it before shipping (LWC CSS is scoped, so the collision only bites the catalogue) |
| Text breaks mid-word / rows spill / chips stack in ECv2 | spacing verified only in a wide preview | verify spacing on BOTH surfaces at ~320px — deployed LWC in ECv2 Live Test AND the React catalogue preview (see build-checklist Step 1c) |
