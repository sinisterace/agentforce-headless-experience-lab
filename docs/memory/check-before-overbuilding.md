---
name: check-before-overbuilding
description: User wants to be consulted at uncertain decision points instead of over-engineering
metadata: 
  node_type: memory
  type: feedback
  originSessionId: d7759f57-9f77-4672-a4dc-a2c9a62397ac
  modified: 2026-08-07T16:51:30.858Z
---

On the CLT catalogue project the user approved the plan with: "anywhere you are unsure check with the user (me) to confirm things before overbuilding."

**Why:** They want a lean build that matches actual intent, not a maximal one built on my assumptions.

**How to apply:** When a decision is genuinely ambiguous (scope, an extra abstraction, an optional feature, a design fork not settled in the plan), pause and ask via AskUserQuestion rather than picking the bigger/more-general option. Default to the smallest thing that satisfies the plan. Related: [[clt-catalogue-architecture]].
