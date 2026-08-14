---
name: cltcat-industry-key-restricted-picklist
description: CLT catalogue — Industry_Key__c is a restricted picklist; add the value + deploy before seeding a new industry
metadata: 
  node_type: memory
  type: project
  originSessionId: 52d2fe38-d8ea-4e70-a35a-4e816a5e0e97
  modified: 2026-08-13T14:44:16.316Z
---

In the CLT Catalogue app (`cltcat` org), `CLT_Catalog_Item__c.Industry_Key__c` is a **restricted picklist**, so seeding a new industry's catalogue rows fails with `INVALID_OR_NULL_FOR_RESTRICTED_PICKLIST` until the value exists.

**Before seeding a new industry:** add the `<value>` to `force-app/main/default/objects/CLT_Catalog_Item__c/fields/Industry_Key__c.field-meta.xml` and deploy that field, THEN run the seed apex. (`Capability_Key__c` is free Text — no such constraint.)

Values as of 2026-08-13: financial_services, insurance, healthcare, retail, hvac. Industry icons live in `uiBundles/CltCatalogue/src/components/shared.tsx` (INDUSTRY_ICONS / CAPABILITY_ICONS) — missing keys fall back to a neutral icon, so the app tolerates a new capability key without a code change.

Retail set (deployed 2026-08-13): 4 CLTs — Product Carousel (`asaRetailProductCarousel`/`retailProductCarouselJSON`, `_Output_a3f1`), Order Tracking (`asaRetailOrderTracking`/`retailOrderTrackingJSON`, `_Output_b7c2`), Returns & Exchange (`asaRetailReturns`/`retailReturnsJSON`, `_Output_c4d8`), Store Pickup (`asaRetailStorePickup`/`retailStorePickupJSON`, `_Output_d9e3`); shared accent indigo `#4f46e5`. See [[cltcat-fs-clt-build-plan]] and [[clt-enhancedwebchat-render-recipe]].
