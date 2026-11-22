---
name: orgfarm-new-field-fls-off
description: "Newly deployed custom fields have FLS off even for sysadmin; misleading \"Field does not exist\" in anon apex"
metadata: 
  node_type: memory
  type: reference
  originSessionId: d7759f57-9f77-4672-a4dc-a2c9a62397ac
  modified: 2026-08-07T17:20:51.769Z
---

On orgfarm orgs, custom fields deployed via Metadata API start with **field-level security OFF for every profile, including System Administrator**. The failure symptoms are misleading and cost time to diagnose:

- Apex **Metadata compiler DOES see the fields** — a class with SOQL referencing them deploys successfully.
- **Anon apex** (`sf apex run`) reports `Field does not exist: X__c` (separate stale compile cache).
- **Data API / `sf data import tree`** throws `FlsError: you don't have access to X__c`.
- `FieldDefinition` / `sf sobject describe` only list the fields the running user has FLS on.

**Fix:** deploy + assign a permission set granting `<fieldPermissions>` on all fields BEFORE seeding data. **Required fields cannot appear in `<fieldPermissions>`** (deploy fails "cannot deploy to a required field") — they're always visible, so just omit them.

Also on API 67: `WITH SECURITY_ENFORCED` is rejected — use `WITH USER_MODE`. Related: [[clt-catalogue-architecture]], [[orgfarm-master-detail-query-bug]].
