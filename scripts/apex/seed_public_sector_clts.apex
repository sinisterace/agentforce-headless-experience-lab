// Idempotent seed for the four ASA Public Sector & Education catalogue rows. Each
// row is matched on Industry_Key__c + Capability_Key__c, so re-running only updates
// in place. Payloads mirror each CLT's field contract (see the genAiFunction input
// schemas). NOTE: use a LITERAL & in these JSON strings (JSON, not XML).
//
// PREREQUISITE: 'public_sector' must exist on the CLT_Catalog_Item__c.Industry_Key__c
// restricted picklist before this runs (deploy the field change first). It is already
// in ConsultationCatalogService.INDUSTRY_KEYS (label "Public Sector & Education") +
// shared.tsx (Building2 icon + artwork).

// 1 — Application Status Tracker
String astPayload = '{"title":"Your application status","applicationType":"Building permit","referenceNumber":"APP-2026-1043","status":"review","statusLabel":"Under review","submittedText":"Submitted Sep 3","updatedText":"Updated 2 days ago","steps":['
  + '{"label":"Submitted","state":"done","timeText":"Sep 3"},'
  + '{"label":"Under review","state":"current"},'
  + '{"label":"Approved","state":"todo"},'
  + '{"label":"Issued","state":"todo"}'
  + '],"nextActionText":"We may request additional documents — no action needed right now.","submitText":"Message the office","submitValue":"I\'d like to message the office about my application"}';

// 2 — Programs & Benefits Finder
String pfPayload = '{"title":"Programs & benefits you may qualify for","subtitle":"Based on what you\'ve told us","programs":['
  + '{"id":"snap","name":"Food assistance (SNAP)","category":"assistance","detail":"Monthly grocery benefits","eligibility":"Likely eligible","badge":"Popular"},'
  + '{"id":"liheap","name":"Energy bill relief (LIHEAP)","category":"utility","detail":"Help with heating & cooling costs","eligibility":"May be eligible"},'
  + '{"id":"grant","name":"State tuition grant","category":"education","detail":"Up to $4,000/yr for residents","eligibility":"Likely eligible"},'
  + '{"id":"childcare","name":"Childcare subsidy","category":"assistance","detail":"Sliding-scale childcare help"}'
  + '],"submitText":"Apply for selected","submitValue":"I\'d like to apply for the selected program"}';

// 3 — Service Request
String srPayload = '{"title":"Report a problem","subtitle":"Choose what you\'d like to report","locationText":"Near 123 Main St","requestTypes":['
  + '{"id":"pothole","label":"Pothole / road","description":"Damaged road or pavement","icon":"road"},'
  + '{"id":"streetlight","label":"Streetlight out","description":"Broken or flickering light","icon":"light"},'
  + '{"id":"graffiti","label":"Graffiti","description":"Vandalism or tagging","icon":"graffiti"},'
  + '{"id":"trash","label":"Trash / dumping","description":"Missed pickup or illegal dumping","icon":"trash"},'
  + '{"id":"water","label":"Water / leak","description":"Leak, flooding, or hydrant","icon":"water"},'
  + '{"id":"facility","label":"Facilities","description":"Building or campus maintenance","icon":"building"}'
  + '],"submitText":"Start report","submitValue":"I\'d like to report a"}';

// 4 — Documents Checklist
String dcPayload = '{"title":"Documents you\'ll need","subtitle":"For your building permit application","documents":['
  + '{"id":"id","name":"Government-issued ID","detail":"Driver\'s license or passport","status":"received"},'
  + '{"id":"proof","name":"Proof of residency","detail":"Utility bill within 60 days","status":"required"},'
  + '{"id":"site","name":"Site plan","detail":"PDF, drawn to scale","status":"required"},'
  + '{"id":"insurance","name":"Contractor insurance","detail":"Only if using a contractor","status":"optional"}'
  + '],"submitText":"Upload selected","submitValue":"I\'d like to upload the selected documents"}';

Map<String, Map<String, String>> desired = new Map<String, Map<String, String>>{
  'application_status' => new Map<String, String>{
    'clt' => 'asaPseAppStatus', 'dto' => 'pseAppStatusJSON',
    'label' => 'Application Status Tracker',
    'desc' => 'Show the status of a resident or student application (permit, benefits, admission, or enrollment) as a progress tracker with the reference number, current stage, and next action.',
    'payload' => astPayload
  },
  'programs_finder' => new Map<String, String>{
    'clt' => 'asaPseProgramsFinder', 'dto' => 'pseProgramsFinderJSON',
    'label' => 'Programs & Benefits Finder',
    'desc' => 'Show government and campus programs, benefits, and scholarships the person may qualify for as selectable cards with eligibility, and let them apply for one.',
    'payload' => pfPayload
  },
  'service_request' => new Map<String, String>{
    'clt' => 'asaPseServiceRequest', 'dto' => 'pseServiceRequestJSON',
    'label' => 'Service Request',
    'desc' => 'Let the resident or student report a problem (pothole, streetlight, graffiti, trash, water, or campus facilities) by choosing a request type from a grid.',
    'payload' => srPayload
  },
  'documents_checklist' => new Map<String, String>{
    'clt' => 'asaPseDocsChecklist', 'dto' => 'pseDocsChecklistJSON',
    'label' => 'Documents Checklist',
    'desc' => 'Show the documents required for an application or enrollment as a checklist with their status (required, received, optional), and let the person select which to upload.',
    'payload' => dcPayload
  }
};
List<String> orderedCaps = new List<String>{ 'application_status', 'programs_finder', 'service_request', 'documents_checklist' };

Map<String, CLT_Catalog_Item__c> byCap = new Map<String, CLT_Catalog_Item__c>();
for (CLT_Catalog_Item__c c : [
  SELECT Id, Capability_Key__c FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'public_sector'
]) {
  byCap.put(c.Capability_Key__c, c);
}

List<CLT_Catalog_Item__c> toUpsert = new List<CLT_Catalog_Item__c>();
Integer order = 1;
for (String cap : orderedCaps) {
  Map<String, String> d = desired.get(cap);
  CLT_Catalog_Item__c row = byCap.containsKey(cap) ? byCap.get(cap) : new CLT_Catalog_Item__c();
  row.Industry_Key__c = 'public_sector';
  row.Capability_Key__c = cap;
  row.CLT_Api_Name__c = d.get('clt');
  row.DTO_Field_Name__c = d.get('dto');
  row.Display_Order__c = order;
  row.Label__c = d.get('label');
  row.Description__c = d.get('desc');
  row.Default_Payload_JSON__c = d.get('payload');
  toUpsert.add(row);
  order++;
}
upsert toUpsert;

System.debug('Seeded ' + toUpsert.size() + ' public sector & education catalogue rows.');
for (CLT_Catalog_Item__c c : [
  SELECT Display_Order__c, Label__c, CLT_Api_Name__c, DTO_Field_Name__c
  FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'public_sector' ORDER BY Display_Order__c
]) {
  System.debug(c.Display_Order__c + ' | ' + c.Label__c + ' | ' + c.CLT_Api_Name__c + ' | ' + c.DTO_Field_Name__c);
}
