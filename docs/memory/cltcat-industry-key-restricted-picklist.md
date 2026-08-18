---
name: cltcat-industry-key-restricted-picklist
description: CLT catalogue — Industry_Key__c is a restricted picklist; add the value + deploy before seeding a new industry
metadata: 
  node_type: memory
  type: project
  originSessionId: 52d2fe38-d8ea-4e70-a35a-4e816a5e0e97
  modified: 2026-08-13T14:44:16.316Z
---

In the CLT Catalogue app (`cltcat` org), `Industry_Key__c` is a **restricted picklist** on **TWO objects that must both be kept in sync** — miss either and you get `INVALID_OR_NULL_FOR_RESTRICTED_PICKLIST`:
1. `CLT_Catalog_Item__c.Industry_Key__c` — rejects the SEED apex (catalogue rows) if missing the value.
2. `Onboarding_Profile__c.Industry_Key__c` — rejects the **"Build the experience"** action at runtime (it inserts an Onboarding_Profile__c with the industry key). This one was missed for retail/technology_comms/manufacturing/energy_utilities and fixed 2026-08-17 (deployed all 8 values) after the user hit the error clicking Build the experience on those cards.

**Before adding a new industry:** add the `<value>` to BOTH field XMLs (`objects/CLT_Catalog_Item__c/fields/Industry_Key__c.field-meta.xml` AND `objects/Onboarding_Profile__c/fields/Industry_Key__c.field-meta.xml`) and deploy both, THEN run the seed apex. Escape `&`→`&amp;` in labels. (`Capability_Key__c`, `DTO_Field_Name__c` are free Text — no such constraint. `Onboarding_Profile__c` also has restricted `Source__c`/`Status__c` but those are unrelated enums.)

Values as of 2026-08-17: financial_services, insurance, healthcare, retail, technology_comms, manufacturing, energy_utilities, hvac. (`energy_utilities` label "Energy & Utilities" added + deployed 2026-08-17 — escape `&`→`&amp;` in the field XML label; was already in `ConsultationCatalogService` keys/labels + `shared.tsx` Zap icon.) (`manufacturing` added + deployed 2026-08-17; was already in `ConsultationCatalogService` keys/labels + `shared.tsx` Factory icon.) (`technology_comms` label "Technology, Media & Communications" — was already in `ConsultationCatalogService.INDUSTRY_KEYS`/`INDUSTRY_LABELS` but NOT the picklist; added + deployed 2026-08-16 before seeding.) Industry icons live in `uiBundles/CltCatalogue/src/components/shared.tsx` (INDUSTRY_ICONS / CAPABILITY_ICONS) — missing keys fall back to a neutral icon, so the app tolerates a new capability key without a code change.

Retail set (deployed 2026-08-13): 4 CLTs — Product Carousel (`asaRetailProductCarousel`/`retailProductCarouselJSON`, `_Output_a3f1`), Order Tracking (`asaRetailOrderTracking`/`retailOrderTrackingJSON`, `_Output_b7c2`), Returns & Exchange (`asaRetailReturns`/`retailReturnsJSON`, `_Output_c4d8`), Store Pickup (`asaRetailStorePickup`/`retailStorePickupJSON`, `_Output_d9e3`); shared accent indigo `#4f46e5`. See [[cltcat-fs-clt-build-plan]] and [[clt-enhancedwebchat-render-recipe]].
