// Idempotent seed for the four ASA Travel & Hospitality catalogue rows. Each row
// is matched on Industry_Key__c + Capability_Key__c, so re-running only updates in
// place. dto === the widget registry key / CltKind. Payloads are built as Apex
// Maps and JSON.serialize'd (robust vs. hand-escaping the seat grid).
//
// PREREQUISITE: 'travel_hospitality' must exist on the CLT_Catalog_Item__c
// .Industry_Key__c restricted picklist (deploy the field change first).

// 1 — Seat Map (full narrow-body block, rows 12–18, A–F)
List<Object> seats = new List<Object>();
Set<String> taken = new Set<String>{ '12C','13A','13F','14D','15B','15E','16A','17F','18C','18D' };
for (Integer row = 12; row <= 18; row++) {
  String kind = row == 12 ? 'extra_legroom' : (row == 14 ? 'exit' : 'standard');
  Integer price = row == 12 ? 45 : (row == 14 ? 30 : 0);
  for (String col : new List<String>{ 'A','B','C','D','E','F' }) {
    String sid = String.valueOf(row) + col;
    seats.add(new Map<String, Object>{
      'id' => sid, 'row' => row, 'col' => col,
      'status' => taken.contains(sid) ? 'taken' : 'open',
      'kind' => kind, 'price' => price
    });
  }
}
String seatMapPayload = JSON.serialize(new Map<String, Object>{
  'title' => 'Choose your seat',
  'flight' => 'SFO to JFK · Flight AF128',
  'columns' => new List<String>{ 'A','B','C','D','E','F' },
  'aisleAfter' => 'C',
  'currency' => 'USD',
  'seats' => seats,
  'submitText' => 'Select seat',
  'submitValue' => 'I would like to select this seat'
});

// 2 — Flight Status Tracker
String flightStatusPayload = JSON.serialize(new Map<String, Object>{
  'title' => 'Flight AF128',
  'status' => 'in_air',
  'origin' => new Map<String, Object>{ 'code' => 'SFO', 'city' => 'San Francisco', 'time' => '10:35 AM', 'gate' => 'A12', 'terminal' => '2' },
  'dest' => new Map<String, Object>{ 'code' => 'JFK', 'city' => 'New York', 'time' => '7:05 PM', 'terminal' => '4', 'baggage' => 'Belt 6' },
  'progressPct' => 62,
  'aircraft' => 'Airbus A321neo',
  'durationText' => '5h 30m',
  'updatedText' => 'Live · updated just now',
  'submitText' => 'Get gate updates',
  'submitValue' => 'Send me gate and delay updates for flight AF128'
});

// 3 — Digital Boarding Pass
String boardingPassPayload = JSON.serialize(new Map<String, Object>{
  'title' => 'Boarding pass',
  'airline' => 'Aero Air',
  'passenger' => 'J. RIVERA',
  'from' => 'SFO', 'fromCity' => 'San Francisco',
  'to' => 'JFK', 'toCity' => 'New York',
  'flight' => 'AF128', 'date' => 'Sep 24',
  'boardingTime' => '10:05 AM', 'departTime' => '10:35 AM',
  'gate' => 'A12', 'terminal' => '2', 'seat' => '12A', 'group' => 'B',
  'status' => 'Boarding',
  'submitText' => 'Add to wallet',
  'submitValue' => 'Add my boarding pass to my wallet',
  'secondaryText' => 'Email pass'
});

// 4 — Room Selector
List<Object> rooms = new List<Object>{
  new Map<String, Object>{ 'id' => 'r1', 'name' => 'Ocean View King', 'bed' => '1 King bed', 'size' => '420 sq ft', 'sleeps' => 2, 'amenities' => new List<String>{ 'Ocean view','Balcony','Free WiFi' }, 'price' => 389, 'cadence' => 'night', 'badge' => 'Best value' },
  new Map<String, Object>{ 'id' => 'r2', 'name' => 'Garden Double Queen', 'bed' => '2 Queen beds', 'size' => '480 sq ft', 'sleeps' => 4, 'amenities' => new List<String>{ 'Garden view','Free WiFi','Mini bar' }, 'price' => 329, 'cadence' => 'night' },
  new Map<String, Object>{ 'id' => 'r3', 'name' => 'Beachfront Suite', 'bed' => '1 King + sofa bed', 'size' => '720 sq ft', 'sleeps' => 3, 'amenities' => new List<String>{ 'Beachfront','Living room','Soaking tub' }, 'price' => 612, 'cadence' => 'night', 'badge' => 'Only 2 left' }
};
String roomSelectorPayload = JSON.serialize(new Map<String, Object>{
  'title' => 'Choose your room',
  'subtitle' => 'The Shoreline Resort · Sep 24–26 · 2 guests',
  'currency' => 'USD',
  'rooms' => rooms,
  'submitText' => 'Reserve',
  'submitValue' => 'I would like to reserve this room'
});

Map<String, Map<String, String>> desired = new Map<String, Map<String, String>>{
  'seat_map' => new Map<String, String>{
    'clt' => 'asaTravelSeatMap', 'dto' => 'travelSeatMapJSON', 'label' => 'Seat Map',
    'desc' => 'Let a traveler pick a seat on an interactive cabin map (open / taken / extra-legroom / exit / premium seats colour-coded), with a live seat detail and price.',
    'payload' => seatMapPayload
  },
  'flight_status' => new Map<String, String>{
    'clt' => 'asaTravelFlightStatus', 'dto' => 'travelFlightStatusJSON', 'label' => 'Flight Status Tracker',
    'desc' => 'Show a live flight status card - a plane along the route arc between origin and destination, a status pill, gates, terminals and baggage claim, with a get-updates action.',
    'payload' => flightStatusPayload
  },
  'boarding_pass' => new Map<String, String>{
    'clt' => 'asaTravelBoardingPass', 'dto' => 'travelBoardingPassJSON', 'label' => 'Digital Boarding Pass',
    'desc' => 'Show a wallet-style digital boarding pass (route, flight, gate, seat, boarding group and a barcode) with add-to-wallet and email actions.',
    'payload' => boardingPassPayload
  },
  'room_selector' => new Map<String, String>{
    'clt' => 'asaTravelRoomSelector', 'dto' => 'travelRoomSelectorJSON', 'label' => 'Room Selector',
    'desc' => 'Let a guest choose a hotel room from cards (bed, size, occupancy, amenities and nightly rate) and reserve it.',
    'payload' => roomSelectorPayload
  }
};
List<String> orderedCaps = new List<String>{ 'boarding_pass', 'seat_map', 'flight_status', 'room_selector' };

Map<String, CLT_Catalog_Item__c> byCap = new Map<String, CLT_Catalog_Item__c>();
for (CLT_Catalog_Item__c c : [
  SELECT Id, Capability_Key__c FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'travel_hospitality'
]) {
  byCap.put(c.Capability_Key__c, c);
}

List<CLT_Catalog_Item__c> toUpsert = new List<CLT_Catalog_Item__c>();
Integer order = 1;
for (String cap : orderedCaps) {
  Map<String, String> d = desired.get(cap);
  CLT_Catalog_Item__c row = byCap.containsKey(cap) ? byCap.get(cap) : new CLT_Catalog_Item__c();
  row.Industry_Key__c = 'travel_hospitality';
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

System.debug('Seeded ' + toUpsert.size() + ' travel & hospitality catalogue rows.');
for (CLT_Catalog_Item__c c : [
  SELECT Display_Order__c, Label__c, CLT_Api_Name__c, DTO_Field_Name__c
  FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'travel_hospitality' ORDER BY Display_Order__c
]) {
  System.debug(c.Display_Order__c + ' | ' + c.Label__c + ' | ' + c.CLT_Api_Name__c + ' | ' + c.DTO_Field_Name__c);
}
