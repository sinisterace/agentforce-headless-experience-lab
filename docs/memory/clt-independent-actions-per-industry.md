---
name: clt-independent-actions-per-industry
description: "CLT design rule — keep an industry's CLTs conceptually independent so the agent doesn't chain them during ECv2 testing"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 52d2fe38-d8ea-4e70-a35a-4e816a5e0e97
  modified: 2026-08-13T01:39:57.766Z
---

For future CLTs, keep the set of CLTs within one industry conceptually **independent** — they should not appear to depend on each other's output.

**Why:** In ECv2/Agent Builder testing of the Insurance set, "File a Claim" would not fire directly — the agent redirected to "Policy Selector" and asked which policy to file against first, because all three insurance CLTs revolve around "a policy." The agent's own reasoning chained the actions. The File a Claim CLT itself was fine (the `asaInsuranceFileClaim_Output_b2d4` action fired with `__action_execution_status__: success`, `insuranceFileClaimJSON` populated, `__supports_result_display__: true`) — the routing was the problem, not the render. It only fired cleanly when the user explicitly named the action ("show asaInsuranceFileClaim_Output_b2d4").

**How to apply:** When designing an industry's 3–4 CLTs, pick capabilities that don't imply a prerequisite selection from a sibling CLT. Write each genAiFunction/action description as self-contained (fire directly on the user's intent; don't imply "first pick an X"). Existing Insurance set is left as-is per the user — this rule is for future industries only.

Related: [[cltcat-fs-clt-build-plan]], [[check-before-overbuilding]]
