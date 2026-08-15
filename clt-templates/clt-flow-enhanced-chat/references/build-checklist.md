# Build checklist — new Flow-backed CLT for Enhanced Chat v2

Follow in order. Every `<token>` is a decision you make in step 0 and reuse verbatim.

## Step 0 — Name and shape (decide once, reuse everywhere)

| Token | Meaning | Example |
|---|---|---|
| `<Human Readable Card Title>` | masterLabel shown in builder & picker | `Product Card` |
| `<lwcName>` | LWC folder + `c/<lwcName>` renderer ref (camelCase) | `productCard` |
| `<PascalName>` | JS class name | `ProductCard` |
| `<DtoClass>` | Apex DTO class (PascalCase) | `ProductCardData` |
| `<jsonField>` | the single `@AuraEnabled String` on the DTO | `productCardJSON` |
| `<FlowApiName>` | Flow file name (== `<invocationTarget>`) | `productCard_Output_ab12` |
| `<field1>`, `<field2>`, … | the payload fields the card reads | `title`, `products` |

Sketch the JSON payload the card needs. Those field names are the SINGLE source of
truth — they appear identically in the LWC parse logic AND the genAiFunction input schema.

> Naming convention observed in the proven bundles: action/Flow/genAiFunction use
> `<lwcName>_Output_<4hex>`; the LWC, CLT folder, and DTO share the base name.

## Step 1 — Author the 5 artifacts (copy from ../templates/)

Into an sfdx project (`force-app/main/default/`):

1. `classes/<DtoClass>.cls` + `.cls-meta.xml` — from `DtoClass.cls` / `DtoClass.cls-meta.xml`.
2. `lightningTypes/<lwcName>/` — ALL FOUR files:
   - `schema.json` (from `schema.json`)
   - `<lwcName>.lightningTypeBundle-meta.xml` (from `lightningTypeBundle-meta.xml`)
   - `enhancedWebChat/renderer.json` (from `enhancedWebChat-renderer.json`)
   - `lightningDesktopGenAi/renderer.json` (from `lightningDesktopGenAi-renderer.json`)
3. `lwc/<lwcName>/` — `<lwcName>.js`, `.html`, `.css`, `.js-meta.xml` (from `lwc.*`).
   Fill in the `TODO`s: read your fields, render your content, wire clicks to `sendMessage`.
4. `flows/<FlowApiName>.flow-meta.xml` — from `flow.flow-meta.xml`.
5. `genAiFunctions/<FlowApiName>/` — `<FlowApiName>.genAiFunction-meta.xml`,
   `input/schema.json`, `output/schema.json` (from the three `genAiFunction-*` templates).

## Step 1b — Make the card survive the narrow ECv2 column

ECv2 renders the card in a **~320px column** (much narrower than the desktop GenAi
panel or any React harness). A layout that looks fine while authoring will spill and
break there. Bake these guards into `<lwcName>.css` from the start — they are cheap
and prevent the classic failures (proven on the Account Selector: names broke
mid-word "Ever yday", a "PRIMARY" badge stacked one letter per line, rows spilled
past the card edge):

- **`box-sizing: border-box` on the card AND all descendants** — otherwise
  `width: 100%` + padding + border overflows the column. Scope it:
  ```css
  .card, .card *, .card *::before, .card *::after { box-sizing: border-box; }
  ```
- **Size to the card, not the viewport.** Put `container-type: inline-size` on the
  root and use `@container (max-width: 300px) { … }` to tighten gaps/padding/icon
  size for the tightest columns. The same CLT then reads well in wide desktop GenAi too.
- **Text wraps by word, never mid-word.** Any label that can be long (names, titles)
  goes in its own element with `overflow-wrap: break-word; word-break: normal;` and
  `min-width: 0`. Do NOT leave a bare text node inside an `inline-flex`/`flex` parent —
  the flex item gets crushed and breaks character-by-character.
- **Small inline chips never stack.** Badges/pills get `white-space: nowrap;
  flex-shrink: 0;`. Let them wrap to the next line (`flex-wrap: wrap` on the parent),
  not collapse to one glyph per line.
- **Numbers stay intact.** Currency/amounts get `white-space: nowrap` so `$15,230.00`
  never wraps; give the balance column `flex-shrink: 0`.
- **The flexible text column needs `min-width: 0; flex: 1`** so it yields space to
  fixed columns (icon, balance, check) instead of forcing horizontal overflow.

Verify in the ECv2 Live Test at real width, not just a wide preview.

## Step 2 — Wire the field contract

In `genAiFunctions/<FlowApiName>/input/schema.json`, the `Details.description` MUST:
- show an example JSON using your EXACT `<fieldN>` names, and
- state each field's type, required/optional, allowed values, defaults.

This is what the planner emits. The LWC must read those same names. Mismatch =
silent wrong behavior (proven: LWC read `mode`, prompt said `selectionMode` → always single).
The Flow variable description and the DTO comment are cosmetic — keep them in sync for humans, but they do NOT drive the LLM.

## Step 3 — Verify the render-critical bindings

- `schema.json` → `"lightning:type": "@apexClassType/c__<DtoClass>"`
- both `renderer.json` → `"definition": "c/<lwcName>"`
- `output/schema.json` → `"lightning:type": "c__<lwcName>"`, `copilotAction:isDisplayable: true`
- LWC `js-meta.xml` targets include `lightning__AgentforceOutput` + `sourceType name="c__<lwcName>"`
- Flow `Options` var is `dataType Apex`, `apexClass <DtoClass>`, `isOutput true`;
  assignment writes `Options.<jsonField>`

## Step 4 — Deploy

```
sf project deploy start \
  --source-dir force-app/main/default/classes/<DtoClass>.cls \
  --source-dir force-app/main/default/lightningTypes/<lwcName> \
  --source-dir force-app/main/default/lwc/<lwcName> \
  --source-dir force-app/main/default/flows/<FlowApiName>.flow-meta.xml \
  --source-dir force-app/main/default/genAiFunctions/<FlowApiName> \
  --target-org <alias>
```
(Or deploy the whole default folder.) Some orgs are non-source-tracked — that's fine,
`deploy start` still works; ignore `NonSourceTrackedOrgError` from `deploy preview`.

## Step 5 — Attach in Agent Builder & test

1. Open the Service Agent → a subagent/topic → **Add action** → search `<Human Readable Card Title>`.
   (A CLT can't be attached alone — it rides on this action's output.)
2. **Preview → Live Test → select Enhanced Chat v2.**
3. Prompt the agent to trigger the action.

## Step 6 — Verify PASS

- The styled card renders in the ECv2 preview (not plain text), AND
- the action's output JSON in the trace contains `"__supports_result_display__": true`.

If blank → confirm `enhancedWebChat/renderer.json` and `<lwcName>.lightningTypeBundle-meta.xml`
exist AND deployed. If `formatType=Text` → fix `output/schema.json` displayable binding.
If wrong values → fix the input-schema field names; republish the agent version / new session.

## Constraints to remember

- **Output only.** Input CLTs don't render on Service Agent + ECv2 (W-22250928). Collect
  user choices via the LWC's `sendTextMessage`, never an input form.
- **Planner scaling (soft):** ≤10 topics/agent, ≤~12–15 actions/topic. For a large CLT
  catalogue (~35), group actions across topics; don't pile all onto one subagent.
- **`lightningDesktopGenAi/renderer.json`** is the desktop/employee fallback — include it so
  the same CLT also renders outside ECv2.
