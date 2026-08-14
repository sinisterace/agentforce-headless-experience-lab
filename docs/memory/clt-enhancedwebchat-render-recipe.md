---
name: clt-enhancedwebchat-render-recipe
description: "Why a Custom Lightning Type renders (or stays blank) in Agentforce Enhanced Chat v2 / MIAW — the required bundle files, Flow-vs-Apex, and where the LLM field contract lives"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 6f75b2a1-bde8-4984-9429-e5c4a4034be1
  modified: 2026-08-12T00:04:58.943Z
---

Proven end-to-end on 2026-08-09 in org `achisty@sdo-dreamforceconsultations.com` (asaItemSelector rendered pill card in ECv2 Live Test). Also deployed to `cltcat` org (orgfarm-dc4809d077). Part of the [[clt-catalogue-architecture]] CLT catalogue app.

**A CLT renders in Enhanced Chat v2 (Service Agent / MIAW web) ONLY if its `lightningTypes/<Type>/` bundle contains ALL of:**
1. `schema.json` → `"lightning:type": "@apexClassType/c__<DtoClass>"`
2. `<Type>.lightningTypeBundle-meta.xml` (LightningTypeBundle; apiVersion, isExposed=true, masterLabel) — **easy to omit**
3. `enhancedWebChat/renderer.json` → `{ "renderer": { "componentOverrides": { "$": { "definition": "c/<lwc>" } } } }` — **the file most often missing; this is the ECv2 renderer**
4. `lightningDesktopGenAi/renderer.json` (same body) — desktop/employee fallback

Missing #2/#3 = renders on desktop/Employee agent but shows **blank / plain text** in ECv2. That asymmetry (works on Employee, blank on Service Agent) is the tell.

**Caveat:** the `~/Desktop/CLT Templates/asaAddItem-*` export is a desktop-only snapshot — it has ONLY `lightningDesktopGenAi/renderer.json` (no #2, no #3), API 65. Do NOT copy it verbatim for ECv2. Build from the `clt-flow-enhanced-chat` skill's `templates/` folder instead (has all four, API 67) — user ruled 2026-08-11 that **the skill takes priority**. See [[cltcat-fs-clt-build-plan]].

**Flow vs Apex:** Flow actions render CLTs fine — Apex is NOT required. The renderer pipeline only cares about the CLT bundle + output binding, not how the output was produced. Choose Flow for admin-editable/scalable, no Apex cold-start lag. (Working Apex reference bundle: WS_AppointmentCard / WS_BookAdvisorCall in `~/dreamforceConsultationsReactV1`.)

**Healthy-render signals in the ECv2 trace output JSON:** `__supports_result_display__: true` (platform is shipping the Lightning Type, not `formatType=Text`). If output comes back as `formatType=Text`, the CLT is silently stripped.

**Output binding best practice** (genAiFunction output/schema.json): card param `copilotAction:isDisplayable=true`, `isUsedByPlanner=false`; PLUS a separate plain-text field `isDisplayable=false, isUsedByPlanner=true` for the LLM to narrate alongside the card.

**The LLM field-name contract lives in `genAiFunctions/<fn>/input/schema.json` (the `description`), NOT the Flow variable description.** Editing the Flow description alone does nothing. The prompt's JSON field names MUST match what the LWC reads (e.g. LWC reads `mode`, prompt must say `mode` not `selectionMode`). Mismatch = silent fallback (multiple→single). Live schema redeploys may need the agent republished / a fresh session to take effect (schema is cached per agent version).

**HARD LIMITATION (W-22250928):** input CLTs do NOT render on Service Agent + ECv2 — outputs only. Employee agents render input forms; Service Agents don't. Design all CLTs as action OUTPUTS. (Consequence: the React app's CLT "playground" edits are throwaway preview only — the edited payload never reaches the live agent, which renders the action's own output. User accepted this.)

**Planner scaling (from Salesforce context-engineering blog, Aug 2025):** ≤10 topics/agent, ≤12–15 actions/topic for routing accuracy (soft, not enforced). For ~35 CLTs, group into ~4-7 topics; the React app names the exact action in a suggested prompt so routing is near-deterministic. One action output binds to exactly ONE Lightning Type (no conditional renderer).
