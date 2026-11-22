// Idempotent seed for the four ASA Technology, Media & Communications catalogue
// rows. Each row is matched on Industry_Key__c + Capability_Key__c, so re-running
// only updates in place. Payloads mirror each CLT's field contract (see the
// genAiFunction input schemas).
//
// NOTE: 'technology_comms' must exist on the CLT_Catalog_Item__c.Industry_Key__c
// restricted picklist before this runs (deploy the field first).

// 1 — Plan Comparison
String planPayload = '{"title":"Compare plans","subtitle":"Pick the plan that fits how you use your phone","currency":"USD","cadence":"mo","currentPlanId":"essential","plans":['
  + '{"id":"essential","name":"Essential","price":45,"tagline":"For light users","features":["10 GB premium data","5G nationwide","SD streaming"]},'
  + '{"id":"unlimited","name":"Unlimited Plus","price":70,"tagline":"Our most popular plan","badge":"Most popular","recommended":true,"features":["Unlimited premium data","HD streaming","50 GB hotspot","5G Ultra Capacity"]},'
  + '{"id":"premium","name":"Premium 5G","price":90,"tagline":"Everything, maxed out","features":["Unlimited premium data","4K UHD streaming","100 GB hotspot","Global roaming"]}'
  + '],"submitText":"Switch plan"}';

// 2 — Data Usage Meter
String usagePayload = '{"title":"Your data this cycle","cycleText":"12 days left · resets Sep 30","used":42.1,"total":50,"unit":"GB","categories":['
  + '{"label":"Streaming","amount":24.6},'
  + '{"label":"Social","amount":9.8},'
  + '{"label":"Other","amount":7.7}'
  + '],"note":"You\'re on track to stay under your limit.","submitText":"Add a data pass","submitValue":"I\'d like to add a data pass to my plan"}';

// 3 — Service / Network Status
String statusPayload = '{"title":"Service status","overall":"degraded","headline":"We\'re aware of an issue affecting your area","area":"SoMa, San Francisco 94103","etaText":"Est. restore by 4:30 PM","updatedText":"Updated 2 min ago","services":['
  + '{"id":"internet","name":"Internet","status":"down","detail":"Fiber node offline","icon":"internet"},'
  + '{"id":"tv","name":"TV","status":"degraded","detail":"Some channels affected","icon":"tv"},'
  + '{"id":"mobile","name":"Mobile","status":"operational","icon":"mobile"},'
  + '{"id":"voice","name":"Home phone","status":"operational","icon":"voice"}'
  + '],"submitText":"Notify me when it\'s fixed","submitValue":"Please text me when service is restored"}';

// 4 — Bill Explainer
String billPayload = '{"title":"Your September bill","currency":"USD","total":118.4,"dueDateText":"Due Sep 28","periodText":"Sep 1 – Sep 30","items":['
  + '{"id":"plan","label":"Unlimited Plus plan","amount":70,"category":"plan"},'
  + '{"id":"device","label":"iPhone installment","amount":27.08,"category":"device"},'
  + '{"id":"stream","label":"Streaming add-on","amount":9.99,"category":"streaming"},'
  + '{"id":"taxes","label":"Taxes & fees","amount":11.33,"category":"taxes"}'
  + '],"deltaAmount":12.4,"deltaText":"You added the Streaming add-on this cycle.","note":"Autopay is on. This amount will be charged automatically.","submitText":"Pay now","submitValue":"I\'d like to pay my bill now","secondaryText":"Set up autopay","secondaryValue":"Help me set up autopay"}';

// Desired state per capability. Order defines Display_Order__c (1-based).
Map<String, Map<String, String>> desired = new Map<String, Map<String, String>>{
  'plan_compare' => new Map<String, String>{
    'clt' => 'asaTmcPlanCompare', 'dto' => 'tmcPlanCompareJSON',
    'label' => 'Plan Comparison',
    'desc' => 'Compare plans side by side with pricing, features, and a recommended pick; the customer switches with one tap.',
    'payload' => planPayload
  },
  'data_usage' => new Map<String, String>{
    'clt' => 'asaTmcDataUsage', 'dto' => 'tmcDataUsageJSON',
    'label' => 'Data Usage Meter',
    'desc' => 'Show data/minutes used vs. allowance on a radial gauge with cycle status and a per-category breakdown.',
    'payload' => usagePayload
  },
  'service_status' => new Map<String, String>{
    'clt' => 'asaTmcServiceStatus', 'dto' => 'tmcServiceStatusJSON',
    'label' => 'Service Status',
    'desc' => 'Report a live outage/health board across services with affected area, restore ETA, and a notify-me action.',
    'payload' => statusPayload
  },
  'bill_explainer' => new Map<String, String>{
    'clt' => 'asaTmcBillExplainer', 'dto' => 'tmcBillExplainerJSON',
    'label' => 'Bill Explainer',
    'desc' => 'Break down a bill with a category chart, itemized charges, a month-over-month delta, and pay/autopay actions.',
    'payload' => billPayload
  }
};
List<String> orderedCaps = new List<String>{ 'plan_compare', 'data_usage', 'service_status', 'bill_explainer' };

// Load any existing rows so the seed is idempotent (match on capability).
Map<String, CLT_Catalog_Item__c> byCap = new Map<String, CLT_Catalog_Item__c>();
for (CLT_Catalog_Item__c c : [
  SELECT Id, Capability_Key__c FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'technology_comms'
]) {
  byCap.put(c.Capability_Key__c, c);
}

List<CLT_Catalog_Item__c> toUpsert = new List<CLT_Catalog_Item__c>();
Integer order = 1;
for (String cap : orderedCaps) {
  Map<String, String> d = desired.get(cap);
  CLT_Catalog_Item__c row = byCap.containsKey(cap) ? byCap.get(cap) : new CLT_Catalog_Item__c();
  row.Industry_Key__c = 'technology_comms';
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

System.debug('Seeded ' + toUpsert.size() + ' technology_comms catalogue rows.');
for (CLT_Catalog_Item__c c : [
  SELECT Display_Order__c, Label__c, CLT_Api_Name__c, DTO_Field_Name__c
  FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'technology_comms' ORDER BY Display_Order__c
]) {
  System.debug(c.Display_Order__c + ' | ' + c.Label__c + ' | ' + c.CLT_Api_Name__c + ' | ' + c.DTO_Field_Name__c);
}
