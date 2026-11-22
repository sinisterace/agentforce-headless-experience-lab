// Idempotent seed for the four ASA Manufacturing catalogue rows. Each row is
// matched on Industry_Key__c + Capability_Key__c, so re-running only updates in
// place. Payloads mirror each CLT's field contract (see the genAiFunction input
// schemas).
//
// NOTE: 'manufacturing' must exist on the CLT_Catalog_Item__c.Industry_Key__c
// restricted picklist before this runs (deploy the field first).

// 1 — Equipment Monitor
String eqPayload = '{"title":"Assembly Cell","asset":{"name":"Assembly Cell","model":"TB-9000","assetId":"LINE-3","location":"Plant 2 · Bay 4","imageUrl":"/resource/asaMfgTrailblazerCell"},"status":"running","statusLabel":"Running","updatedText":"Live · updated 12s ago","metrics":['
  + '{"label":"OEE","value":"87","unit":"%","state":"good"},'
  + '{"label":"Spindle temp","value":"62","unit":"°C","state":"warn"},'
  + '{"label":"Throughput","value":"142","unit":"/hr","state":"good"},'
  + '{"label":"Uptime","value":"6d 4h","state":"good"}'
  + '],"trend":{"label":"OEE · last 12h","points":[72,78,74,80,83,81,85,84,86,88,87,87]},"submitText":"Create work order","submitValue":"Open a work order for the Assembly Cell (LINE-3)"}';

// 2 — Part Reorder (single part)
String prPayload = '{"title":"Reorder part","part":{"name":"Industrial I/O Controller","sku":"IOC-4820-DIN","category":"controller","imageUrl":"/resource/asaMfgIoController","unitPrice":486,"currency":"USD","leadTime":"Ships in 3–5 business days","inStock":142,"minOrder":1,"incrementStep":1},"quantity":2,"submitText":"Reorder"}';

// 3 — Work Order Tracker
String woPayload = '{"title":"Work order WO-4821","orderNumber":"WO-4821","product":"Assembly Cell · 2 units","priority":"high","etaText":"Est. ship Oct 2","updatedText":"Updated 1h ago","milestones":['
  + '{"label":"Order received","state":"done","timeText":"Sep 10","owner":"Intake"},'
  + '{"label":"Machining","state":"done","timeText":"Sep 14","owner":"Cell A"},'
  + '{"label":"Assembly","state":"current","timeText":"In progress","owner":"Bay 4"},'
  + '{"label":"Quality check","state":"todo"},'
  + '{"label":"Ready to ship","state":"todo"}'
  + '],"submitText":"Message production team","submitValue":"I have a question about work order WO-4821"}';

// 4 — Quote Builder (cart-style: line items + order details)
String qbPayload = '{"title":"Quote","cartId":"QT-00042","statusLabel":"Draft quote","shipTo":"Rivera Robotics · Plant 2","shipToId":"#PL-2-0192","billTo":"Rivera Manufacturing, Inc.","currency":"USD","lineItems":['
  + '{"id":"frame","itemNumber":"TB-9000-FRM","description":"Assembly cell frame, powder-coated steel","uom":"EA","unitPrice":4800,"quantity":2},'
  + '{"id":"plc","itemNumber":"PLC-ADV-24","description":"Advanced PLC + HMI control package","uom":"EA","unitPrice":5400,"quantity":1},'
  + '{"id":"conv","itemNumber":"CONV-3M","description":"Conveyor belt module, 3 m span","uom":"EA","unitPrice":1260,"quantity":3},'
  + '{"id":"safety","itemNumber":"SAF-LC-KIT","description":"Light-curtain safety kit","uom":"KIT","unitPrice":980,"quantity":1}'
  + '],"poLabel":"Purchase Order #","poPlaceholder":"Enter PO number...","acknowledgeText":"I acknowledge that pricing is an estimate pending a formal quote and confirm the configuration is correct.","secondaryText":"Save & close","submitText":"Request quote","submitValue":"Request a formal quote for this configured order"}';

Map<String, Map<String, String>> desired = new Map<String, Map<String, String>>{
  'equipment_monitor' => new Map<String, String>{
    'clt' => 'asaMfgEquipmentMonitor', 'dto' => 'mfgEquipmentMonitorJSON',
    'label' => 'Equipment Monitor',
    'desc' => 'Show a machine\'s live status with metric tiles (OEE, temp, throughput, uptime), a trend sparkline, and a create-work-order action.',
    'payload' => eqPayload
  },
  'part_reorder' => new Map<String, String>{
    'clt' => 'asaMfgPartReorder', 'dto' => 'mfgPartReorderJSON',
    'label' => 'Part Reorder',
    'desc' => 'Show a single spare part with stock, lead time, price, a quantity stepper, and a live subtotal to reorder it.',
    'payload' => prPayload
  },
  'work_order' => new Map<String, String>{
    'clt' => 'asaMfgWorkOrder', 'dto' => 'mfgWorkOrderJSON',
    'label' => 'Work Order Tracker',
    'desc' => 'Track a production or repair work order through a vertical milestone timeline with priority and estimated ship date.',
    'payload' => woPayload
  },
  'quote_builder' => new Map<String, String>{
    'clt' => 'asaMfgQuoteBuilder', 'dto' => 'mfgQuoteBuilderJSON',
    'label' => 'Quote Builder',
    'desc' => 'Build a cart-style quote: line items with live quantity steppers and an add-item action, a PO field, subtotal with an on-demand shipping estimate, and a request-quote action.',
    'payload' => qbPayload
  }
};
List<String> orderedCaps = new List<String>{ 'quote_builder', 'equipment_monitor', 'part_reorder', 'work_order' };

Map<String, CLT_Catalog_Item__c> byCap = new Map<String, CLT_Catalog_Item__c>();
for (CLT_Catalog_Item__c c : [
  SELECT Id, Capability_Key__c FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'manufacturing'
]) {
  byCap.put(c.Capability_Key__c, c);
}

List<CLT_Catalog_Item__c> toUpsert = new List<CLT_Catalog_Item__c>();
Integer order = 1;
for (String cap : orderedCaps) {
  Map<String, String> d = desired.get(cap);
  CLT_Catalog_Item__c row = byCap.containsKey(cap) ? byCap.get(cap) : new CLT_Catalog_Item__c();
  row.Industry_Key__c = 'manufacturing';
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

System.debug('Seeded ' + toUpsert.size() + ' manufacturing catalogue rows.');
for (CLT_Catalog_Item__c c : [
  SELECT Display_Order__c, Label__c, CLT_Api_Name__c, DTO_Field_Name__c
  FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'manufacturing' ORDER BY Display_Order__c
]) {
  System.debug(c.Display_Order__c + ' | ' + c.Label__c + ' | ' + c.CLT_Api_Name__c + ' | ' + c.DTO_Field_Name__c);
}
