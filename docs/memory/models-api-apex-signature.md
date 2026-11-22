---
name: models-api-apex-signature
description: Correct aiplatform.ModelsAPI Apex call signature (skill docs are wrong)
metadata: 
  node_type: memory
  type: reference
  originSessionId: 16e26814-073f-46b4-9c8f-466a1dabd7cb
  modified: 2026-07-20T04:17:47.338Z
---

The `aiplatform.ModelsAPI` skill-doc pattern (agentforce-generate / sf-ai-agentforce `models-api.md`) is WRONG for real orgs (verified 2026-07-20 on buildBetterNow, API 67). Two corrections needed or Apex won't compile:

1. `createGenerations` is an **instance** method, not static:
   `aiplatform.ModelsAPI api = new aiplatform.ModelsAPI(); ... api.createGenerations(request);`
2. Result text is `response.Code200.generation.generatedText` (SINGULAR `generation`, field `generatedText`) — there is NO `generations` list and no `.text`.

Full working call:
```apex
aiplatform.ModelsAPI api = new aiplatform.ModelsAPI();
aiplatform.ModelsAPI.createGenerations_Request request = new aiplatform.ModelsAPI.createGenerations_Request();
request.modelName = 'sfdc_ai__DefaultOpenAIGPT4OmniMini';
aiplatform.ModelsAPI_GenerationRequest g = new aiplatform.ModelsAPI_GenerationRequest();
g.prompt = prompt;
request.body = g;
aiplatform.ModelsAPI.createGenerations_Response resp = api.createGenerations(request);
if (resp != null && resp.Code200 != null && resp.Code200.generation != null) return resp.Code200.generation.generatedText;
```
Verify per-org by serializing `resp.Code200` in anon apex before writing classes. Also: `date` is a reserved Apex identifier — can't be a field name.
