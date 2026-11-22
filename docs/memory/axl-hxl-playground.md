---
name: axl-hxl-playground
description: AXL = HXL Headless Experience Layer; write-once Mosaic widgets render in Claude/ChatGPT/Slack/Agentforce via MCP
metadata: 
  node_type: memory
  type: reference
  originSessionId: ea0fdf89-8dcb-4c06-8cb3-de237cefff68
  modified: 2026-08-10T00:31:04.331Z
---

The internal AXL docs URL `docs.internal.salesforce.com/ai/agentic-experience-layer/get-started/axl-get-started/` redirects (Okta SSO) to `https://www.headlessexperiencelayer.com/` — the "HXL Playground | Salesforce" (© 2026, internal/pre-GA). **AXL (Agentic Experience Layer) = HXL (Headless Experience Layer)** — same thing, internal name vs product name.

Model: **Component** (primitive: text/button/table) → **Widget** (surface-agnostic composition) → written in **Mosaic** (declarative JSON; MVC: Type=Model, Widget=View, Action=Controller). Purpose (verbatim): "render them natively in Agentforce, Slack, ChatGPT, and any MCP host … no platform-specific code required." Interop mechanism is **MCP**. Mosaic example: `{"definition":"tile/text","attributes":{"text":"Hello","variant":"h1"}}`.

Playground surfaces: Widgets gallery (~17 templates incl. Health Score Card, Lead Dashboard, Flight Detail), Components catalog, 8 Tutorials (Hello World, Button Actions, Layout, Data Binding, forEach, Formulas, Conditional `if`). Each tutorial has per-client code tabs: Agentforce | Slackbot | ChatGPT | Claude | MS Teams.

Setup doc ("Accessing AI Capabilities in the HXL Playground", local .txt on Desktop): local server or Heroku app (`your-playground.herokuapp.com`, access code `salesforce1`). Auth = LLM Gateway key (needs Einstein org + tenant ID) OR paste an Anthropic `sk-` key. **CLT→widget mapping: put the custom Lightning type's runtime data under `$attrs`** in the widget's sample data. Repo lives under `salesforce-experience-platform-emu` GH org (hxl-setup plugin) — needs the [[github-emu-account]] `_sfemu` login to access.

STILL UNCAPTURED (browser plugin / AI Expert Suite app was down): verbatim per-client code tabs, the MCP endpoint/tool-schema/auth HXL itself uses, the "Open in new tab" render URL, full Mosaic JSON of a template. Related: [[clt-catalogue-architecture]] [[clt-enhancedwebchat-render-recipe]] [[mcp-apps-external-render]].
