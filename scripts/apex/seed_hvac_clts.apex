// Idempotent seed for the four ASA HVAC catalogue rows. Each row is matched on
// Industry_Key__c + Capability_Key__c, so re-running only updates in place.
// Payloads mirror each CLT's field contract (see the genAiFunction input schemas).
//
// NOTE: 'hvac' already exists on the CLT_Catalog_Item__c.Industry_Key__c restricted
// picklist and in ConsultationCatalogService — no field/Apex change needed.

// 1 — Smart Thermostat Control
String thPayload = '{"title":"Living room thermostat","currentTemp":71,"targetTemp":72,"mode":"cool","unit":"F","humidity":44,"statusText":"Cooling to 72°","minTemp":50,"maxTemp":90,"presets":['
  + '{"id":"eco","label":"Eco","targetTemp":78,"mode":"cool"},'
  + '{"id":"comfort","label":"Comfort","targetTemp":72,"mode":"cool"},'
  + '{"id":"away","label":"Away","targetTemp":82,"mode":"off"},'
  + '{"id":"sleep","label":"Sleep","targetTemp":68,"mode":"cool"}'
  + '],"submitText":"Set thermostat","submitValue":"Set my thermostat"}';

// 2 — Technician ETA Tracker
String ttPayload = '{"title":"Your technician is on the way","status":"enroute","headline":"Marcus is heading to your home","etaText":"Arriving in ~15 min","windowText":"Arrival window 1:00–3:00 PM","updatedText":"Updated 1 min ago","technician":{"name":"Marcus Reed","role":"Senior HVAC Technician","rating":4.9,"initials":"MR","skills":"AC repair · Heat pumps"},"job":{"number":"WO-48213","type":"AC not cooling","address":"128 Maple Ave"},"steps":['
  + '{"label":"Scheduled","state":"done","timeText":"9:00 AM"},'
  + '{"label":"Dispatched","state":"done","timeText":"12:40 PM"},'
  + '{"label":"En route","state":"current","timeText":"1:05 PM"},'
  + '{"label":"Arriving","state":"todo"},'
  + '{"label":"On site","state":"todo"}'
  + '],"submitText":"Message technician","submitValue":"I\'d like to message my technician","secondaryText":"Reschedule visit","secondaryValue":"I\'d like to reschedule my service visit"}';

// 3 — Comfort System Health Report
String shPayload = '{"title":"Your comfort system checkup","score":82,"scoreLabel":"Good","statusText":"One item needs attention soon","updatedText":"Checked today","systems":['
  + '{"label":"Furnace","status":"good","detail":"Operating normally","icon":"furnace"},'
  + '{"label":"AC condenser","status":"watch","detail":"Coil could use a cleaning","icon":"ac"},'
  + '{"label":"Thermostat","status":"good","detail":"Firmware up to date","icon":"thermostat"},'
  + '{"label":"Air filter","status":"due","detail":"Replace within a week","icon":"filter"}'
  + '],"filter":{"lifePct":18,"daysLeft":6,"label":"20×25×1 filter"},"nextServiceText":"Next maintenance due Nov 3","recommendationText":"Book a tune-up to clean the AC coil before summer.","submitText":"Book maintenance","submitValue":"I\'d like to book a maintenance visit"}';

// 4 — Service Plan Selector
String svpPayload = '{"title":"Choose a comfort plan","subtitle":"Annual maintenance memberships that keep your system running","currency":"USD","cadence":"yr","currentPlanId":"basic","plans":['
  + '{"id":"basic","name":"Comfort Basic","price":149,"tagline":"Seasonal peace of mind","features":["1 annual tune-up","Priority scheduling","10% off repairs"]},'
  + '{"id":"plus","name":"Comfort Plus","price":249,"tagline":"Most popular","badge":"Most popular","recommended":true,"features":["2 tune-ups (heating + cooling)","Priority scheduling","15% off repairs","No overtime fees","Filter delivery"]},'
  + '{"id":"total","name":"Comfort Total","price":399,"tagline":"Total protection","features":["2 tune-ups + mid-season check","24/7 priority dispatch","20% off repairs","Free diagnostics","Extended parts warranty"]}'
  + '],"submitText":"Enroll in plan"}';

Map<String, Map<String, String>> desired = new Map<String, Map<String, String>>{
  'thermostat_control' => new Map<String, String>{
    'clt' => 'asaHvacThermostat', 'dto' => 'hvacThermostatJSON',
    'label' => 'Smart Thermostat Control',
    'desc' => 'Show the customer\'s smart thermostat as an interactive climate dial — current temperature, target setpoint, mode (heat/cool/auto/off), and humidity — and let them set a temperature and mode.',
    'payload' => thPayload
  },
  'tech_tracker' => new Map<String, String>{
    'clt' => 'asaHvacTechTracker', 'dto' => 'hvacTechTrackerJSON',
    'label' => 'Technician ETA Tracker',
    'desc' => 'Show a live "on the way" tracker for the customer\'s HVAC service visit — technician, status, ETA and arrival window, a route progress track, and job details — with message and reschedule actions.',
    'payload' => ttPayload
  },
  'system_health' => new Map<String, String>{
    'clt' => 'asaHvacSystemHealth', 'dto' => 'hvacSystemHealthJSON',
    'label' => 'Comfort System Health Report',
    'desc' => 'Show a whole-home comfort system health report — an overall score gauge, per-system status (furnace, AC, thermostat, filter), filter life, next-service due, and a top recommendation — with a book-maintenance action.',
    'payload' => shPayload
  },
  'service_plan' => new Map<String, String>{
    'clt' => 'asaHvacServicePlan', 'dto' => 'hvacServicePlanJSON',
    'label' => 'Service Plan Selector',
    'desc' => 'Show HVAC annual maintenance membership plans as comparable tiers with pricing and included benefits, mark the customer\'s current plan, and let them enroll in one.',
    'payload' => svpPayload
  }
};
List<String> orderedCaps = new List<String>{ 'thermostat_control', 'tech_tracker', 'system_health', 'service_plan' };

Map<String, CLT_Catalog_Item__c> byCap = new Map<String, CLT_Catalog_Item__c>();
for (CLT_Catalog_Item__c c : [
  SELECT Id, Capability_Key__c FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'hvac'
]) {
  byCap.put(c.Capability_Key__c, c);
}

List<CLT_Catalog_Item__c> toUpsert = new List<CLT_Catalog_Item__c>();
Integer order = 1;
for (String cap : orderedCaps) {
  Map<String, String> d = desired.get(cap);
  CLT_Catalog_Item__c row = byCap.containsKey(cap) ? byCap.get(cap) : new CLT_Catalog_Item__c();
  row.Industry_Key__c = 'hvac';
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

System.debug('Seeded ' + toUpsert.size() + ' HVAC catalogue rows.');
for (CLT_Catalog_Item__c c : [
  SELECT Display_Order__c, Label__c, CLT_Api_Name__c, DTO_Field_Name__c
  FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'hvac' ORDER BY Display_Order__c
]) {
  System.debug(c.Display_Order__c + ' | ' + c.Label__c + ' | ' + c.CLT_Api_Name__c + ' | ' + c.DTO_Field_Name__c);
}
