// Idempotent seed for the 4 ASA Insurance catalogue rows. Each row is
// matched on Industry_Key__c + Capability_Key__c, so re-running only updates in
// place. dto === the widget registry key / CltKind. Regenerated from the org's
// live rows so a fresh org gets the full, consistent Insurance catalogue
// (replaces the older partial seed scripts).

Map<String, Map<String, Object>> desired = new Map<String, Map<String, Object>>{
  'policy_selector' => new Map<String, Object>{ 'order' => 1, 'clt' => 'asaInsurancePolicySelector', 'dto' => 'insurancePolicySelectorJSON', 'label' => 'Policy Selector', 'desc' => 'Let customers pick one of their insurance policies, with coverage and renewal details.', 'payload' => '{"title":"Which policy can I help you with?","mode":"single","policies":[{"id":"pol-8842","name":"Auto — 2022 Tesla Model 3","type":"Auto","policyNumber":"8842","premium":142.50,"cadence":"monthly","currency":"USD","renewalDate":"2026-11-01","status":"Active","coverage":"Collision + Comprehensive · $500 deductible","badge":"Primary"},{"id":"pol-3391","name":"Homeowners — 14 Elm St","type":"Home","policyNumber":"3391","premium":1820.00,"cadence":"annual","currency":"USD","renewalDate":"2027-02-15","status":"Active","coverage":"Dwelling $420k · $1,000 deductible"},{"id":"pol-5567","name":"Term Life — 20yr","type":"Life","policyNumber":"5567","premium":48.00,"cadence":"monthly","currency":"USD","renewalDate":"2038-06-01","status":"Active","coverage":"$500,000 benefit"}],"submitText":"Continue"}' },
  'file_a_claim' => new Map<String, Object>{ 'order' => 0, 'clt' => 'asaInsuranceFileClaim', 'dto' => 'insuranceFileClaimJSON', 'label' => 'File a Claim', 'desc' => 'Let customers start a claim by choosing the type of incident for a policy.', 'payload' => '{"policy":{"label":"Auto — 2022 Tesla Model 3","policyNumber":"8842","imageUrl":"/resource/asaInsuranceTeslaModel3"},"incidentTypes":[{"id":"collision","label":"Collision","description":"Accident with another vehicle or object","icon":"collision"},{"id":"theft","label":"Theft or break-in","description":"Vehicle or contents stolen","icon":"theft"},{"id":"weather","label":"Weather or storm","description":"Hail, wind, flood, or fallen tree","icon":"weather"},{"id":"glass","label":"Glass or windshield","description":"Cracked or shattered glass","icon":"glass"}],"submitText":"Start claim"}' },
  'status_tracker' => new Map<String, Object>{ 'order' => 2, 'clt' => 'asaInsuranceClaimStatus', 'dto' => 'insuranceClaimStatusJSON', 'label' => 'Claim Status Tracker', 'desc' => 'Show customers where each of their claims stands with a step-by-step progress tracker.', 'payload' => '{"title":"Your claims","claims":[{"id":"clm-4471","claimNumber":"CLM-4471","type":"Collision","policyLabel":"Auto — 2022 Tesla Model 3","filedDate":"2026-07-28","amount":3200.00,"currency":"USD","status":"Review","statusLabel":"In review","updatedDate":"2026-08-05","nextActionText":"Upload the repair estimate"},{"id":"clm-3120","claimNumber":"CLM-3120","type":"Water damage","policyLabel":"Homeowners — 14 Elm St","filedDate":"2026-06-10","amount":8750.00,"currency":"USD","status":"Paid","statusLabel":"Paid","updatedDate":"2026-07-02"}],"submitText":"Ask about a claim"}' },
  'id_card' => new Map<String, Object>{ 'order' => 3, 'clt' => 'asaInsuranceIdCard', 'dto' => 'insuranceIdCardJSON', 'label' => 'Digital ID Card', 'desc' => 'Show the visitor a wallet-style proof-of-insurance ID card (carrier, policy number, vehicle, coverage dates and coverages) with email-a-copy and add-to-wallet actions.', 'payload' => '{"title":"Proof of insurance","carrier":"Meridian Mutual","policyType":"Auto","policyholder":"Jordan Rivera","policyNumber":"AUTO-8842-XY","vehicle":"2022 Tesla Model 3","plate":"8ABC123","effectiveDate":"Jan 1, 2026","expirationDate":"Jul 1, 2028","status":"Active","coverages":[{"label":"Liability"},{"label":"Collision","detail":"$500 ded."},{"label":"Comprehensive","detail":"$500 ded."},{"label":"Uninsured motorist"}],"submitText":"Email me a copy","submitValue":"Email me a copy of my insurance ID card","secondaryText":"Add to wallet"}' }
};
List<String> orderedCaps = new List<String>{ 'policy_selector', 'file_a_claim', 'status_tracker', 'id_card' };

Map<String, CLT_Catalog_Item__c> byCap = new Map<String, CLT_Catalog_Item__c>();
for (CLT_Catalog_Item__c c : [
  SELECT Id, Capability_Key__c FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'insurance'
]) {
  byCap.put(c.Capability_Key__c, c);
}

List<CLT_Catalog_Item__c> toUpsert = new List<CLT_Catalog_Item__c>();
for (String cap : orderedCaps) {
  Map<String, Object> d = desired.get(cap);
  CLT_Catalog_Item__c row = byCap.containsKey(cap) ? byCap.get(cap) : new CLT_Catalog_Item__c();
  row.Industry_Key__c = 'insurance';
  row.Capability_Key__c = cap;
  row.CLT_Api_Name__c = (String) d.get('clt');
  row.DTO_Field_Name__c = (String) d.get('dto');
  row.Display_Order__c = (Integer) d.get('order');
  row.Label__c = (String) d.get('label');
  row.Description__c = (String) d.get('desc');
  row.Default_Payload_JSON__c = (String) d.get('payload');
  toUpsert.add(row);
}
upsert toUpsert;
System.debug('Seeded ' + toUpsert.size() + ' insurance catalogue rows.');
