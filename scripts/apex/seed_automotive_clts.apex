// Idempotent seed for the four ASA Automotive catalogue rows. Each row is matched
// on Industry_Key__c + Capability_Key__c, so re-running only updates in place.
// Payloads mirror each CLT's field contract (see the genAiFunction input schemas).
//
// PREREQUISITE: 'automotive' must exist on the CLT_Catalog_Item__c.Industry_Key__c
// restricted picklist before this runs (deploy the field change first). It is
// already in ConsultationCatalogService.INDUSTRY_KEYS/LABELS + shared.tsx.

// 1 — Vehicle Configurator
String cfgPayload = '{"title":"Build your electric SUV","model":"Electric SUV","currency":"USD","basePrice":41990,"colors":['
  + '{"id":"white","label":"Glacier White","hex":"#f3f4f6","priceDelta":0},'
  + '{"id":"black","label":"Midnight Black","hex":"#111827"},'
  + '{"id":"red","label":"Radiant Red","hex":"#dc2626","priceDelta":595,"selected":true}'
  + '],"optionGroups":['
  + '{"id":"trim","label":"Trim","selectedId":"rs","options":[{"id":"lt","label":"LT","priceDelta":0},{"id":"rs","label":"RS","priceDelta":3200,"detail":"Sport-tuned"}]},'
  + '{"id":"drive","label":"Drivetrain","selectedId":"awd","options":[{"id":"fwd","label":"FWD","priceDelta":0},{"id":"awd","label":"AWD","priceDelta":2500}]},'
  + '{"id":"pkg","label":"Packages","selectedId":"tech","options":[{"id":"none","label":"None","priceDelta":0},{"id":"tech","label":"Technology Package","priceDelta":1800,"detail":"Adaptive cruise, HUD"}]}'
  + '],"submitText":"Reserve this build","submitValue":"I\'d like to reserve this configuration"}';

// 2 — Test Drive Scheduler
String tdPayload = '{"title":"Book a test drive","vehicle":{"name":"Electric SUV","trim":"RS AWD · Radiant Red","initials":"EV"},"location":{"name":"Downtown Dealership","address":"500 Market St, San Francisco"},"days":['
  + '{"date":"2026-09-16","slots":[{"id":"a","time":"09:30","driveType":"showroom"},{"id":"b","time":"13:00","driveType":"at_home"}]},'
  + '{"date":"2026-09-17","slots":[{"id":"c","time":"10:00","driveType":"showroom"},{"id":"d","time":"15:30","driveType":"showroom"}]},'
  + '{"date":"2026-09-18","slots":[{"id":"e","time":"11:00","driveType":"at_home"},{"id":"f","time":"16:00","driveType":"showroom"}]},'
  + '{"date":"2026-09-21","slots":[{"id":"g","time":"09:00","driveType":"showroom"},{"id":"h","time":"14:00","driveType":"at_home"}]},'
  + '{"date":"2026-09-22","slots":[{"id":"i","time":"10:30","driveType":"showroom"},{"id":"j","time":"17:00","driveType":"showroom"}]}'
  + '],"submitText":"Book test drive"}';

// 3 — Connected Car Status
String vsPayload = '{"title":"Your vehicle","vehicle":{"name":"Electric SUV","trim":"RS AWD","initials":"EV"},"isElectric":true,"range":{"value":248,"total":312,"unit":"mi"},"battery":78,"odometer":18452,"odometerUnit":"mi","tires":['
  + '{"pos":"FL","psi":34,"status":"good"},{"pos":"FR","psi":33,"status":"good"},{"pos":"RL","psi":28,"status":"low"},{"pos":"RR","psi":35,"status":"good"}'
  + '],"items":['
  + '{"label":"Charge","value":"78%","status":"good"},{"label":"Next service","value":"in 1,200 mi","status":"good"},{"label":"Oil life","value":"N/A","status":"good"},{"label":"Tire pressure","value":"1 low","status":"watch"}'
  + '],"alerts":["Rear-left tire pressure is low (28 psi)"],"updatedText":"Updated 3 min ago","submitText":"Schedule service","submitValue":"I\'d like to schedule service for my vehicle"}';

// 4 — Trade-In Estimator
String tiPayload = '{"title":"Your trade-in estimate","vehicle":{"name":"2021 Midsize SUV","detail":"42,300 mi · Good condition","initials":"SV"},"currency":"USD","estimate":18400,"low":16900,"high":19800,"offerText":"Instant offer good for 7 days","factors":['
  + '{"label":"Mileage","detail":"42,300 mi — below average","impact":"positive"},'
  + '{"label":"Condition","detail":"Good","impact":"neutral"},'
  + '{"label":"Market demand","detail":"High for this trim","impact":"positive"}'
  + '],"submitText":"Apply to a purchase","submitValue":"I\'d like to apply my trade-in toward a purchase","secondaryText":"Book an appraisal","secondaryValue":"I\'d like to book an in-person appraisal"}';

Map<String, Map<String, String>> desired = new Map<String, Map<String, String>>{
  'vehicle_configurator' => new Map<String, String>{
    'clt' => 'asaAutoConfigurator', 'dto' => 'autoConfiguratorJSON',
    'label' => 'Vehicle Configurator',
    'desc' => 'Let the customer build and price a vehicle — choose paint color and option packages (trim, drivetrain, add-ons) with live price deltas and a running estimated total — then reserve the configuration.',
    'payload' => cfgPayload
  },
  'test_drive' => new Map<String, String>{
    'clt' => 'asaAutoTestDrive', 'dto' => 'autoTestDriveJSON',
    'label' => 'Test Drive Scheduler',
    'desc' => 'Let the customer book a test drive — choose a vehicle, dealership, day, and time slot (in-showroom or at-home) — and confirm the booking.',
    'payload' => tdPayload
  },
  'vehicle_status' => new Map<String, String>{
    'clt' => 'asaAutoVehicleStatus', 'dto' => 'autoVehicleStatusJSON',
    'label' => 'Connected Car Status',
    'desc' => 'Show a connected-car status dashboard — driving range/charge, odometer, a 4-corner tire-pressure diagram, maintenance items, and active alerts — with a schedule-service action.',
    'payload' => vsPayload
  },
  'trade_in' => new Map<String, String>{
    'clt' => 'asaAutoTradeIn', 'dto' => 'autoTradeInJSON',
    'label' => 'Trade-In Estimator',
    'desc' => 'Show a trade-in valuation — an estimated value with a low-to-high range, the factors driving it (mileage, condition, demand), and an instant offer — with apply-to-purchase and book-appraisal actions.',
    'payload' => tiPayload
  }
};
List<String> orderedCaps = new List<String>{ 'vehicle_configurator', 'test_drive', 'vehicle_status', 'trade_in' };

Map<String, CLT_Catalog_Item__c> byCap = new Map<String, CLT_Catalog_Item__c>();
for (CLT_Catalog_Item__c c : [
  SELECT Id, Capability_Key__c FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'automotive'
]) {
  byCap.put(c.Capability_Key__c, c);
}

List<CLT_Catalog_Item__c> toUpsert = new List<CLT_Catalog_Item__c>();
Integer order = 1;
for (String cap : orderedCaps) {
  Map<String, String> d = desired.get(cap);
  CLT_Catalog_Item__c row = byCap.containsKey(cap) ? byCap.get(cap) : new CLT_Catalog_Item__c();
  row.Industry_Key__c = 'automotive';
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

System.debug('Seeded ' + toUpsert.size() + ' automotive catalogue rows.');
for (CLT_Catalog_Item__c c : [
  SELECT Display_Order__c, Label__c, CLT_Api_Name__c, DTO_Field_Name__c
  FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'automotive' ORDER BY Display_Order__c
]) {
  System.debug(c.Display_Order__c + ' | ' + c.Label__c + ' | ' + c.CLT_Api_Name__c + ' | ' + c.DTO_Field_Name__c);
}
