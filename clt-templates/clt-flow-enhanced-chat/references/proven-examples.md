# Proven examples & patterns for new card types

## The three verified bundles (rendered live in ECv2, 2026-08-09)

All in `~/cltcat-app/force-app/main/default/`. Study `asaItemSelector`
first — it's the fullest reference (single/multiple selection, submit button, test modes).

| CLT | masterLabel | DTO / JSON field | Payload fields | What it renders |
|---|---|---|---|---|
| `asaItemSelector` | ASA Item Selector | `AsaItemSelectorData` / `itemSelectorJSON` | `title`, `mode` (`single`\|`multiple`), `items[]` | Pill buttons; single = send on click, multiple = toggle + submit |
| `asaAppointmentSelector` | ASA Appointment Selector | (same pattern) | appointment slots | Selectable appointment times |
| `asaAddItem` | ASA Add Item | (same pattern) | item details | Add-to-cart style tile |

Common DNA (copy this, change only the card body):
- DTO = one `@AuraEnabled global String <jsonField>` blob, `@JsonAccess(...always...)`.
- Flow = one assignment `Details` (String in) → `Options.<jsonField>` (Apex DTO out). No logic.
- genAiFunction = `invocationTargetType flow`; input `Details` `lightning__textType`
  `copilotAction:isUserInput false`; output `Options` bound to `c__<lwcName>`,
  `isDisplayable true`, `isUsedByPlanner true`.
- LWC = `@api value` → `JSON.parse(value.<jsonField>)` → hydrate → render → clicks call
  `embeddedservice_configuration.util.sendTextMessage(...)`. Always a test/empty fallback.

## Design pattern for NEW card types

Every new card is the SAME 5-artifact skeleton. Only two things change:
1. the **JSON payload shape** (the `<fieldN>` set), documented in the input-schema description, and
2. the **LWC `.html`/`.css`/render logic** that draws it.

The DTO (one JSON string), Flow (one assignment), and genAiFunction bindings barely change —
just rename tokens. Below: suggested payloads to start from.

### Product card
```json
{"title":"Recommended for you","products":[
  {"name":"Trail Runner X","price":"$129","imageUrl":"https://...","sku":"TRX-01","badge":"Best seller"}
]}
```
LWC renders tiles (image, name, price, badge); click sends `sku` or `name`.

### Appointment / time picker
```json
{"title":"Pick a time","slots":[
  {"label":"Tue 10:00 AM","value":"2026-08-11T10:00","available":true}
]}
```
Click an available slot → send its `value`. (See `asaAppointmentSelector`.)

### Selection card (single/multiple) — already proven
Use `asaItemSelector` verbatim; it covers both modes + submit.

### Seat map
```json
{"title":"Choose seats","rows":[
  {"row":"A","seats":[{"id":"A1","status":"open"},{"id":"A2","status":"taken"}]}
],"maxSelect":2}
```
Render a grid; disable `taken`; enforce `maxSelect`; submit joins chosen `id`s.

### Map / location picker
```json
{"title":"Nearby stores","center":{"lat":37.79,"lng":-122.39},"pins":[
  {"label":"Union Square","lat":37.788,"lng":-122.407,"id":"store-12"}
]}
```
Render a static map + a list of pins (a full interactive map needs a mapping lib or
`lightning-map`); click a pin/list row → send its `id`. Keep a text list so it degrades gracefully.

## Field-contract discipline (the #1 source of silent bugs)

For each card, write the payload spec ONCE and mirror it in exactly two places:
1. `genAiFunctions/<Fn>/input/schema.json` → `Details.description` (drives the planner).
2. the LWC parse logic (consumes it).

Use identical field names. When you change one, change the other and republish the agent
version (the schema is cached per agent version; a stale Live Test session shows old behavior).

## PASS/FAIL signals (from real traces)

- PASS: card renders + output JSON has `"__supports_result_display__": true`.
- FAIL (blank/plain text): missing `enhancedWebChat/renderer.json` or the
  `.lightningTypeBundle-meta.xml`, or output came back `formatType=Text`.
- FAIL (wrong content): planner emitted field names the LWC doesn't read → fix input schema.
