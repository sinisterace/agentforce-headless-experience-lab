---
name: orgfarm-master-detail-query-bug
description: "On the epic orgfarm pc-rnd build org, master-detail child objects can't be queried by SOQL scans — use Lookup instead"
metadata: 
  node_type: memory
  type: project
  originSessionId: 9c32e486-7b75-4913-a5b4-f5d52cf3a6d6
  modified: 2026-08-07T06:20:45.292Z
---

In the `my-test-org` orgfarm org (`epic.out.081ac1caba9d@orgfarm.salesforce.com`, instance `orgfarm-426df70e66.test1.my.pc-rnd.salesforce.com`) — the template base org for the CLTS catalogue app — a **master-detail child object could not be queried via SOQL scans**. Records inserted fine and were retrievable by `WHERE Id=:x`, but `SELECT COUNT()`, `WHERE <field>=...`, and parent→child subqueries all returned 0 rows, even `without sharing` and in the same transaction as the insert. Recreating the object didn't fix it. **Converting the relationship from MasterDetail to Lookup (standalone object, sharingModel ReadWrite, required lookup + Cascade delete) fully resolved it.**

**Why:** this org has a systemic defect indexing master-detail children. Standard objects and lookup-based custom objects query normally.

**How to apply:** In this org and any templated clone of it, avoid master-detail relationships for objects you need to query by filter. Use Lookup with `<required>true</required>` and `<deleteConstraint>Cascade</deleteConstraint>` to approximate MD semantics.

Also in this org: outbound HTTP egress is fully blocked (deny-all proxy → 403 for every external host), so external website scraping via callout/Named Credential is impossible. Use the Salesforce-internal Models API (works) or the Data Cloud web retriever (`sfdc_ai__WebRetrievalAction` inside a Prompt Template) for AI, since those route through Salesforce infra. See [[models-api-apex-signature]].
