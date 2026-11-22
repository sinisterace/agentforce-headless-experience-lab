---
name: mcp-apps-external-render
description: "How to render UI cards for real in ChatGPT/Claude/Slack — MCP Apps (mcp-ui) contract, verified against live docs Aug 2026"
metadata: 
  node_type: memory
  type: reference
  originSessionId: ea0fdf89-8dcb-4c06-8cb3-de237cefff68
  modified: 2026-08-10T01:18:59.647Z
---

To render rich UI in external LLM clients (not port a React app — those clients can't load our page), expose a **remote MCP server** (Streamable HTTP + OAuth) whose tool results carry a **UI resource**. MCP-UI standardized into **"MCP Apps" — the official standard for interactive UI in MCP**. Packages: `@mcp-ui/server` + `@mcp-ui/client` (also py `mcp-ui-server`, ruby gem); ext `@modelcontextprotocol/ext-apps/server` with `registerAppTool`/`registerAppResource`.

Contract: server builds `createUIResource({uri:'ui://…', content:{type:'rawHtml',htmlString:…}, encoding:'text'})`, registers it, and the tool links via `_meta.ui.resourceUri`. Client renders the HTML in a **sandboxed iframe**.

**ChatGPT (Apps SDK = MCP), verified from openai/openai-apps-sdk-examples README:** tool returns `structuredContent` + `_meta.ui.resourceUri`; ChatGPT renders inline. `window.openai` bridge: reads `toolInput/toolOutput/displayMode/theme/widgetState`; writes `setWidgetState`; acts `callTool`, `sendFollowUpMessage`, `requestDisplayMode`, `openExternal`. State across turns via `_meta.widgetSessionId`. **Enable: ChatGPT developer mode → Settings › Connectors → add MCP server URL `https://…/mcp`.** Local dev: `ngrok http`; set `MCP_ALLOWED_HOSTS`/`MCP_ALLOWED_ORIGINS`. Caveat: custom connector = dev-mode/self-serve (real end-to-end demo on your own account), NOT a published app all users get; public distribution is more gated.

Per-client reality: **ChatGPT** = HTML widget inline (strongest). **Claude** = remote MCP custom connector over OAuth is solid; inline rich-UI rendering depends on current MCP-Apps support (verify live). **Slack** = does NOT render HTML — needs a Slack app translating to **Block Kit** JSON (a second renderer). One hosted MCP server serves many orgs (each user OAuths to their own Salesforce).

Project decision (cltcat-app, Aug 2026): pursue **ChatGPT Apps SDK first**; fallback = Option C (same widget bundle in a simulated ChatGPT tab inside our React app with a stubbed `window.openai`). First widget = **Item Selector**. Server lives in a **new sibling folder** `~/cltcat-mcp` (git repo, self-contained — delete folder = full rollback), Heroku-deployable. Our Apex REST `/cltcat/*` is the data source. Porting gotcha: GenAiFunction input schema ≠ LWC-true field names (e.g. quantity vs defaultQuantity, 12h availableSlots vs 24h availability) — reconcile in the server.

**✅ PROVEN REAL (Aug 9 2026):** `cltcat-mcp` Item Selector rendered inline as a card in live ChatGPT (personal Plus account, developer mode) — pill buttons "Select your age range", clicked 30-39, `submitSelection` round-tripped ("Selected: 30–39"). Confirms: `openai/widgetAccessible:true` lets the widget callTool back; ChatGPT reaches an ngrok tunnel server-side (bypasses the Salesforce corp-net block on *.ngrok-free.dev that blocks local curl — TLS reset by SNI). Tier reality: ChatGPT Apps need dev mode = Plus/Pro/Business/Enterprise (NOT free). Claude Desktop connects to MCP free (no tier) but inline HTML-widget rendering unconfirmed. Data still STUBBED in src/dataSource.ts. Next: wire real org data + Option C simulated tabs. Related: [[axl-hxl-playground]] [[clt-catalogue-architecture]].
