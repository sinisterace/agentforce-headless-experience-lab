---
name: github-emu-account
description: "User's GitHub accounts — sinisterace (personal) vs separate _sfemu for GHEC/internal repos"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 8c939397-1ee6-4a38-8ef7-13fb24c50c92
  modified: 2026-08-10T00:00:20.323Z
---

`gh` on this machine is authenticated as **`sinisterace`** (personal, keyring). This account does NOT have access to GHEC org `salesforce-experience-platform-emu` (404 on its repos).

The user has a **separate `_sfemu` GitHub login** for internal/GHEC repos. Access to `salesforce-experience-platform-emu` requires the EIP entitlement `GHEC_salesforce-experience-platform-emu_users` (request at securityhub.internal.salesforce.com, justification `https://github.com/salesforce-experience-platform-emu/ai-skill-repo`).

**How to apply:** For any clone/install from `salesforce-experience-platform-emu` (e.g. the `hxl-setup` Claude plugin) or other internal GHEC repos, use the `_sfemu` account, not `sinisterace`. Run `gh auth login` as the EMU account first.
