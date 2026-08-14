# Memory Index

- [Models API Apex signature](models-api-apex-signature.md) — instance method + Code200.generation.generatedText; skill docs are wrong
- [Orgfarm master-detail query bug](orgfarm-master-detail-query-bug.md) — epic orgfarm build org: MD children unqueryable (use Lookup); egress blocked (use Models API)
- [CLT catalogue architecture](clt-catalogue-architecture.md) — deterministic per-industry recs + AI narrative; web-retriever needs Data Cloud + Einstein GenAI (both off, must enable in Setup per clone)
- [Check before overbuilding](check-before-overbuilding.md) — CLT project: ask at ambiguous decision points, build the leanest thing that meets the plan
- [Orgfarm new-field FLS off](orgfarm-new-field-fls-off.md) — deployed custom fields have FLS off even for sysadmin; grant via permset before seeding; API 67 needs WITH USER_MODE not SECURITY_ENFORCED
- [CLT Enhanced Chat v2 render recipe](clt-enhancedwebchat-render-recipe.md) — CLT renders in ECv2 only with enhancedWebChat/renderer.json + lightningTypeBundle-meta.xml; Flow works (no Apex); LLM field contract lives in genAiFunction input schema; input CLTs blocked on Service Agent (W-22250928)
- [GitHub EMU account](github-emu-account.md) — gh is sinisterace (no GHEC access); use separate _sfemu login for salesforce-experience-platform-emu repos (hxl-setup plugin etc.)
- [AXL = HXL playground](axl-hxl-playground.md) — AXL/HXL: write-once Mosaic widgets render in Claude/ChatGPT/Slack/Agentforce via MCP; CLT data goes under $attrs
- [MCP Apps external render](mcp-apps-external-render.md) — render CLT cards for real in ChatGPT/Claude/Slack via MCP Apps (mcp-ui); ChatGPT-first, Item Selector, sibling MCP server
- [CLT Catalogue FS build plan](cltcat-fs-clt-build-plan.md) — 4 CLTs/industry, FS first; ASA [industry] naming (FinServ code); harness at #preview; deployable bundle in clt-library/; design sign-off gate before bundling
- [CLT independent actions per industry](clt-independent-actions-per-industry.md) — keep an industry's CLTs conceptually independent so the agent doesn't chain them in ECv2 (Insurance set left as-is; rule for future)
- [CLTcat Industry_Key restricted picklist](cltcat-industry-key-restricted-picklist.md) — add+deploy the Industry_Key__c picklist value before seeding a new industry; Retail set (4 CLTs, indigo) deployed
