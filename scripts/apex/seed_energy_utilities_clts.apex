// Idempotent seed for the four ASA Energy & Utilities catalogue rows. Each row is
// matched on Industry_Key__c + Capability_Key__c, so re-running only updates in
// place. Payloads mirror each CLT's field contract (see the genAiFunction input
// schemas).
//
// NOTE: 'energy_utilities' must exist on the CLT_Catalog_Item__c.Industry_Key__c
// restricted picklist before this runs (deploy the field first).

// 1 — Outage Tracker
String otPayload = '{"title":"Outage status","status":"restoring","headline":"Crews are on site restoring power","area":"Maple Grove · ZIP 55311","cause":"Storm — downed line","affectedText":"1,240 customers affected","etaText":"Est. restore by 6:45 PM","updatedText":"Updated 4 min ago","crew":"Crew #17 on site","steps":['
  + '{"label":"Outage detected","state":"done","timeText":"3:02 PM"},'
  + '{"label":"Crew dispatched","state":"done","timeText":"3:40 PM"},'
  + '{"label":"On site — repairing","state":"current","timeText":"5:15 PM"},'
  + '{"label":"Power restored","state":"todo"}'
  + '],"submitText":"Text me when power is back","submitValue":"Please text me when power is restored"}';

// 2 — Usage & Cost
String ucPayload = '{"title":"Your energy this cycle","cycleText":"Sep 1–30 · 8 days left","projectedCost":142.50,"currency":"USD","projectedText":"Projected bill","usedUnits":612,"unit":"kWh","deltaPct":-8,"deltaText":"less than last month","bars":['
  + '{"label":"Wk1","value":158},{"label":"Wk2","value":171},{"label":"Wk3","value":149},{"label":"Wk4","value":134}'
  + '],"breakdown":['
  + '{"label":"Heating & cooling","amount":74.20,"color":"#d97706"},'
  + '{"label":"Water heating","amount":31.00},'
  + '{"label":"Always-on","amount":22.40},'
  + '{"label":"Other","amount":14.90}'
  + '],"submitText":"See ways to save","submitValue":"Show me ways to lower my energy bill"}';

// 3 — Budget Billing
String bbPayload = '{"title":"Smooth out your bill","subtitle":"Budget Billing keeps your payment the same every month","currency":"USD","monthlyAmount":118,"currentAvgText":"Your bills now swing $64–$210","termText":"Recalculated every 12 months","series":{"actual":[96,120,168,210,150,88,64,72,110,175,190,140],"budget":118},"bullets":["No surprises in peak season","Cancel anytime","Settles up once a year"],"submitText":"Enroll in Budget Billing","submitValue":"Enroll me in Budget Billing","secondaryText":"Maybe later","secondaryValue":"I\'d like to think about Budget Billing"}';

// 4 — Rebate Offers
String roPayload = '{"title":"Rebates you qualify for","subtitle":"Save on energy-efficient upgrades","currency":"USD","offers":['
  + '{"id":"thermostat","name":"Smart thermostat","category":"thermostat","rebateAmount":75,"detail":"ENERGY STAR models","badge":"Popular"},'
  + '{"id":"heatpump","name":"Heat pump HVAC","category":"heat_pump","rebateAmount":1200,"detail":"Whole-home system"},'
  + '{"id":"evcharger","name":"Level 2 EV charger","category":"ev_charger","rebateAmount":500,"detail":"Install included"},'
  + '{"id":"insulation","name":"Attic insulation","category":"insulation","rebateAmount":350,"detail":"Up to R-49"}'
  + '],"submitText":"Apply for rebate","submitValue":"Apply for the rebate"}';

Map<String, Map<String, String>> desired = new Map<String, Map<String, String>>{
  'outage_tracker' => new Map<String, String>{
    'clt' => 'asaEnergyOutageTracker', 'dto' => 'energyOutageTrackerJSON',
    'label' => 'Outage Tracker',
    'desc' => 'Show an active power outage with cause, customers affected, crew status, a restoration progress track, and an estimated restore time.',
    'payload' => otPayload
  },
  'usage_cost' => new Map<String, String>{
    'clt' => 'asaEnergyUsageCost', 'dto' => 'energyUsageCostJSON',
    'label' => 'Usage & Cost',
    'desc' => 'Show this cycle\'s energy usage as a column chart, a projected bill, the change vs last month, and a cost breakdown by category.',
    'payload' => ucPayload
  },
  'budget_billing' => new Map<String, String>{
    'clt' => 'asaEnergyBudgetBilling', 'dto' => 'energyBudgetBillingJSON',
    'label' => 'Budget Billing',
    'desc' => 'Offer a levelized Budget Billing plan that smooths seasonal bill swings, with an actual-vs-budget chart, the flat monthly amount, terms, and an enroll action.',
    'payload' => bbPayload
  },
  'rebate_offers' => new Map<String, String>{
    'clt' => 'asaEnergyRebateOffers', 'dto' => 'energyRebateOffersJSON',
    'label' => 'Rebate Offers',
    'desc' => 'Show energy-efficiency rebates the customer qualifies for as voucher tiles, each with its rebate amount, and let them apply for one.',
    'payload' => roPayload
  }
};
List<String> orderedCaps = new List<String>{ 'outage_tracker', 'usage_cost', 'budget_billing', 'rebate_offers' };

Map<String, CLT_Catalog_Item__c> byCap = new Map<String, CLT_Catalog_Item__c>();
for (CLT_Catalog_Item__c c : [
  SELECT Id, Capability_Key__c FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'energy_utilities'
]) {
  byCap.put(c.Capability_Key__c, c);
}

List<CLT_Catalog_Item__c> toUpsert = new List<CLT_Catalog_Item__c>();
Integer order = 1;
for (String cap : orderedCaps) {
  Map<String, String> d = desired.get(cap);
  CLT_Catalog_Item__c row = byCap.containsKey(cap) ? byCap.get(cap) : new CLT_Catalog_Item__c();
  row.Industry_Key__c = 'energy_utilities';
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

System.debug('Seeded ' + toUpsert.size() + ' energy & utilities catalogue rows.');
for (CLT_Catalog_Item__c c : [
  SELECT Display_Order__c, Label__c, CLT_Api_Name__c, DTO_Field_Name__c
  FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'energy_utilities' ORDER BY Display_Order__c
]) {
  System.debug(c.Display_Order__c + ' | ' + c.Label__c + ' | ' + c.CLT_Api_Name__c + ' | ' + c.DTO_Field_Name__c);
}
