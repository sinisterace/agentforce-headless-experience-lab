// Idempotent seed for the four ASA Healthcare catalogue rows. Each row is matched
// on Industry_Key__c + Capability_Key__c, so re-running only updates in place.
// HIPAA-conscious payloads: administrative / wayfinding only — no patient health
// information is rendered in-channel.

// 1 — Appointment Scheduler
String apptPayload = '{"title":"Book a visit",'
  + '"provider":{"name":"Dr. Maya Chen","specialty":"Primary Care · Internal Medicine","initials":"MC","imageUrl":"/resource/asaHealthcareDrMayaChen"},'
  + '"location":{"name":"Yerba Buena Medical Group","address":"150 4th St, San Francisco"},'
  + '"days":['
  + '{"date":"2026-08-14","slots":[{"id":"s1","time":"09:00","visitType":"in-person"},{"id":"s2","time":"10:30","visitType":"video"},{"id":"s3","time":"13:15","visitType":"phone"}]},'
  + '{"date":"2026-08-15","slots":[{"id":"s4","time":"09:30","visitType":"video"},{"id":"s5","time":"11:45","visitType":"in-person"},{"id":"s6","time":"15:00","visitType":"in-person"}]}'
  + '],"submitText":"Confirm appointment"}';

// 2 — Find Care Near You (wayfinding, with Google Maps + tel redirect links)
String findCarePayload = '{"title":"Care near you","subtitle":"Near Moscone Center · SoMa, San Francisco","facilities":['
  + '{"id":"f1","name":"GoHealth Urgent Care – SoMa","type":"urgent_care","distance":"0.3 mi","openNow":true,"hours":"Open until 8:00 PM","waitTime":"15 min wait","address":"876 Folsom St, San Francisco","phone":"+14155550142","services":["X-ray","Labs","Stitches"],"mapsUrl":"https://www.google.com/maps/dir/?api=1&destination=876%20Folsom%20St%2C%20San%20Francisco%2C%20CA%2094107"},'
  + '{"id":"f2","name":"One Medical – Yerba Buena","type":"primary_care","distance":"0.2 mi","openNow":true,"hours":"Open until 6:00 PM","address":"631 Mission St, San Francisco","phone":"+14155550111","services":["Primary care","Vaccines","Labs"],"mapsUrl":"https://www.google.com/maps/dir/?api=1&destination=631%20Mission%20St%2C%20San%20Francisco%2C%20CA%2094105"},'
  + '{"id":"f3","name":"Saint Francis Memorial Hospital ER","type":"er","distance":"1.5 mi","openNow":true,"hours":"Open 24 hours","address":"900 Hyde St, San Francisco","phone":"+14155550190","mapsUrl":"https://www.google.com/maps/dir/?api=1&destination=900%20Hyde%20St%2C%20San%20Francisco%2C%20CA%2094109"},'
  + '{"id":"f4","name":"Walgreens Pharmacy – Powell St","type":"pharmacy","distance":"0.6 mi","openNow":false,"hours":"Opens 8:00 AM Mon","address":"135 Powell St, San Francisco","phone":"+14155550170","services":["Rx pickup","Vaccines"],"mapsUrl":"https://www.google.com/maps/dir/?api=1&destination=135%20Powell%20St%2C%20San%20Francisco%2C%20CA%2094102"}'
  + ']}';

// 3 — Care Options (care-channel router)
String careOptionsPayload = '{"title":"How would you like to get care?","subtitle":"Choose the option that fits your needs","options":['
  + '{"id":"o1","channel":"nurse_line","label":"24/7 Nurse Advice Line","description":"Talk to a registered nurse now","meta":"Avg wait 3 min","actionType":"call","actionValue":"+18005551234"},'
  + '{"id":"o2","channel":"video","label":"Video visit","description":"See a provider by video in about 15 minutes","meta":"$0 with your plan","actionType":"link","actionValue":"https://example.com/video-visit","recommended":true},'
  + '{"id":"o3","channel":"in_person","label":"Schedule an in-person visit","description":"Book a time at a clinic near you","actionType":"book","actionValue":"Schedule an in-person visit"},'
  + '{"id":"o4","channel":"er","label":"Emergency care","description":"For severe or life-threatening symptoms","actionType":"call","actionValue":"911"}'
  + '],"disclaimer":"If this is a medical emergency, call 911. This tool does not provide medical advice."}';

// 4 — Prescription Refill
String rxPayload = '{"title":"Refill prescriptions","subtitle":"Select the medications to refill","medications":['
  + '{"id":"m1","name":"Atorvastatin","dosage":"20 mg tablet","supplyText":"3 days left","status":"low","refillsLeft":2},'
  + '{"id":"m2","name":"Lisinopril","dosage":"10 mg tablet","supplyText":"In stock","status":"ok","refillsLeft":5},'
  + '{"id":"m3","name":"Metformin","dosage":"500 mg tablet","supplyText":"No refills left","status":"out","refillsLeft":0}'
  + '],"pharmacy":{"name":"Walgreens · Market St","address":"700 Market St","hours":"Open until 10 PM"},"submitText":"Request refill"}';

// Desired state per capability. Order defines Display_Order__c (1-based).
Map<String, Map<String, String>> desired = new Map<String, Map<String, String>>{
  'appointment_scheduler' => new Map<String, String>{
    'clt' => 'asaHealthcareApptScheduler', 'dto' => 'healthcareApptSchedulerJSON',
    'label' => 'Appointment Scheduler',
    'desc' => 'Let customers pick a provider day and time slot and confirm the visit in one tap.',
    'payload' => apptPayload
  },
  'find_care' => new Map<String, String>{
    'clt' => 'asaHealthcareFindCare', 'dto' => 'healthcareFindCareJSON',
    'label' => 'Find Care Near You',
    'desc' => 'Show nearby care facilities with open-now status and Directions + Call links (no health info).',
    'payload' => findCarePayload
  },
  'care_options' => new Map<String, String>{
    'clt' => 'asaHealthcareCareOptions', 'dto' => 'healthcareCareOptionsJSON',
    'label' => 'Care Options',
    'desc' => 'Route the customer to the right care channel — nurse line, video, in-person, or ER.',
    'payload' => careOptionsPayload
  },
  'rx_refill' => new Map<String, String>{
    'clt' => 'asaHealthcareRxRefill', 'dto' => 'healthcareRxRefillJSON',
    'label' => 'Prescription Refill',
    'desc' => 'Let customers pick which prescriptions to refill and confirm a pickup pharmacy.',
    'payload' => rxPayload
  }
};
List<String> orderedCaps = new List<String>{ 'appointment_scheduler', 'find_care', 'care_options', 'rx_refill' };

// Load any existing healthcare rows so the seed is idempotent (match on capability).
Map<String, CLT_Catalog_Item__c> byCap = new Map<String, CLT_Catalog_Item__c>();
for (CLT_Catalog_Item__c c : [
  SELECT Id, Capability_Key__c FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'healthcare'
]) {
  byCap.put(c.Capability_Key__c, c);
}

List<CLT_Catalog_Item__c> toUpsert = new List<CLT_Catalog_Item__c>();
Integer order = 1;
for (String cap : orderedCaps) {
  Map<String, String> d = desired.get(cap);
  CLT_Catalog_Item__c row = byCap.containsKey(cap) ? byCap.get(cap) : new CLT_Catalog_Item__c();
  row.Industry_Key__c = 'healthcare';
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

System.debug('Seeded ' + toUpsert.size() + ' healthcare catalogue rows.');
for (CLT_Catalog_Item__c c : [
  SELECT Display_Order__c, Label__c, CLT_Api_Name__c, DTO_Field_Name__c
  FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'healthcare' ORDER BY Display_Order__c
]) {
  System.debug(c.Display_Order__c + ' | ' + c.Label__c + ' | ' + c.CLT_Api_Name__c + ' | ' + c.DTO_Field_Name__c);
}
