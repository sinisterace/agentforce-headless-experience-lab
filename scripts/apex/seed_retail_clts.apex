// Idempotent seed for the four ASA Retail catalogue rows. Each row is matched
// on Industry_Key__c + Capability_Key__c, so re-running only updates in place.
// Payloads mirror each CLT's field contract (see the genAiFunction input schemas).

// 1 — Product Carousel
String carouselPayload = '{"title":"Picked for you","subtitle":"Based on your recent views","currency":"USD","products":['
  + '{"id":"p1","name":"Trailblazer Running Shoe","sku":"TR3-BLK-10","category":"shoes","price":128,"compareAtPrice":160,"rating":4.7,"reviewCount":2140,"badge":"-20%","availability":"in_stock"},'
  + '{"id":"p3","name":"Everyday Merino Crew","sku":"EMC-NVY-M","category":"apparel","price":68,"rating":4.8,"reviewCount":512,"badge":"New","availability":"in_stock"}'
  + ']}';

// 2 — Order Tracking (live delivery map + courier + ETA + timeline)
String trackingPayload = '{"title":"Track order #4821","live":true,"status":"out_for_delivery","etaText":"Arriving 2:15–2:30 PM",'
  + '"courier":{"name":"Alex Rivera","vehicle":"bike","initials":"AR","rating":"4.9 ★"},'
  + '"destination":{"label":"Home","address":"150 4th St, San Francisco"},'
  + '"steps":['
  + '{"label":"Order placed","state":"done","time":"11:02 AM"},'
  + '{"label":"Packed & ready","state":"done","time":"12:20 PM"},'
  + '{"label":"Out for delivery","state":"current","time":"1:48 PM"},'
  + '{"label":"Delivered","state":"todo"}'
  + '],"submitText":"Message courier","submitValue":"Message the courier about my order"}';

// 3 — Returns & Exchange
String returnsPayload = '{"title":"Start a return","subtitle":"Choose what you\'d like to send back","orderLabel":"Order #4821 · Mar 2","items":['
  + '{"id":"i1","name":"Trailblazer Running Shoe","sku":"TR3-BLK-10","variant":"Size 10 · Black","price":128,"category":"shoes"},'
  + '{"id":"i2","name":"Everyday Merino Crew","sku":"EMC-NVY-M","variant":"Medium · Navy","price":68,"category":"apparel"}'
  + '],"reasons":['
  + '{"id":"too_small","label":"Too small"},'
  + '{"id":"too_large","label":"Too large"},'
  + '{"id":"changed_mind","label":"Changed my mind"},'
  + '{"id":"defective","label":"Arrived damaged"},'
  + '{"id":"wrong_item","label":"Wrong item"}'
  + '],"resolutions":['
  + '{"id":"refund","kind":"refund","label":"Refund","description":"Back to original payment"},'
  + '{"id":"exchange","kind":"exchange","label":"Exchange","description":"Swap for another size"},'
  + '{"id":"credit","kind":"credit","label":"Store credit","description":"Instant, +5% bonus"}'
  + '],"submitText":"Continue return"}';

// 4 — Store Pickup (nearby stores with stock + pickup ETA)
String pickupPayload = '{"title":"Pick up in store","subtitle":"Ready today at a store near you",'
  + '"product":{"name":"Trailblazer Running Shoe","variant":"Size 10 · Black","category":"shoes"},'
  + '"stores":['
  + '{"id":"s1","name":"Union Square","distance":"0.4 mi","availability":"in_stock","pickupEta":"Ready in 2 hours","address":"333 Post St, San Francisco","hours":"Open until 9:00 PM","phone":"+14155550142","mapsUrl":"https://www.google.com/maps/dir/?api=1&destination=333%20Post%20St%2C%20San%20Francisco%2C%20CA%2094108"},'
  + '{"id":"s2","name":"Marina District","distance":"2.1 mi","availability":"low","pickupEta":"Ready tomorrow 10 AM","address":"2190 Chestnut St, San Francisco","hours":"Open until 8:00 PM","phone":"+14155550171","mapsUrl":"https://www.google.com/maps/dir/?api=1&destination=2190%20Chestnut%20St%2C%20San%20Francisco%2C%20CA%2094123"},'
  + '{"id":"s3","name":"Stonestown Galleria","distance":"5.6 mi","availability":"out","address":"3251 20th Ave, San Francisco","hours":"Open until 9:00 PM"}'
  + '],"submitText":"Reserve for pickup"}';

// Desired state per capability. Order defines Display_Order__c (1-based).
Map<String, Map<String, String>> desired = new Map<String, Map<String, String>>{
  'product_carousel' => new Map<String, String>{
    'clt' => 'asaRetailProductCarousel', 'dto' => 'retailProductCarouselJSON',
    'label' => 'Product Carousel',
    'desc' => 'Show a scrollable rail of recommended products with price, rating, and Add to cart.',
    'payload' => carouselPayload
  },
  'order_tracking' => new Map<String, String>{
    'clt' => 'asaRetailOrderTracking', 'dto' => 'retailOrderTrackingJSON',
    'label' => 'Order Tracking',
    'desc' => 'Track a delivery on a live map with courier position, ETA, and a status timeline.',
    'payload' => trackingPayload
  },
  'returns' => new Map<String, String>{
    'clt' => 'asaRetailReturns', 'dto' => 'retailReturnsJSON',
    'label' => 'Returns & Exchange',
    'desc' => 'Let customers pick items to return, a reason, and a refund/exchange/credit resolution.',
    'payload' => returnsPayload
  },
  'store_pickup' => new Map<String, String>{
    'clt' => 'asaRetailStorePickup', 'dto' => 'retailStorePickupJSON',
    'label' => 'Store Pickup',
    'desc' => 'Show nearby stores with stock, pickup ETA, and Directions/Call links; reserve for pickup.',
    'payload' => pickupPayload
  }
};
List<String> orderedCaps = new List<String>{ 'product_carousel', 'order_tracking', 'returns', 'store_pickup' };

// Load any existing retail rows so the seed is idempotent (match on capability).
Map<String, CLT_Catalog_Item__c> byCap = new Map<String, CLT_Catalog_Item__c>();
for (CLT_Catalog_Item__c c : [
  SELECT Id, Capability_Key__c FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'retail'
]) {
  byCap.put(c.Capability_Key__c, c);
}

List<CLT_Catalog_Item__c> toUpsert = new List<CLT_Catalog_Item__c>();
Integer order = 1;
for (String cap : orderedCaps) {
  Map<String, String> d = desired.get(cap);
  CLT_Catalog_Item__c row = byCap.containsKey(cap) ? byCap.get(cap) : new CLT_Catalog_Item__c();
  row.Industry_Key__c = 'retail';
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

System.debug('Seeded ' + toUpsert.size() + ' retail catalogue rows.');
for (CLT_Catalog_Item__c c : [
  SELECT Display_Order__c, Label__c, CLT_Api_Name__c, DTO_Field_Name__c
  FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'retail' ORDER BY Display_Order__c
]) {
  System.debug(c.Display_Order__c + ' | ' + c.Label__c + ' | ' + c.CLT_Api_Name__c + ' | ' + c.DTO_Field_Name__c);
}
