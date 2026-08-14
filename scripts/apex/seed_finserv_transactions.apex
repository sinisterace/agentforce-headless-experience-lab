// Idempotent seed for the ASA Financial Services · Recent Transactions catalogue row.
// Places it at Display_Order 1 (right after Account Selector) and pushes the
// generic FS rows down so the four purpose-built FS CLTs lead the list.
String payload = '{"title":"Your recent transactions","accountLabel":"Everyday Checking ••1234","transactions":['
  + '{"id":"txn-1","merchant":"Whole Foods Market","date":"2026-08-09","amount":-84.23,"currency":"USD","category":"Groceries","status":"Posted"},'
  + '{"id":"txn-2","merchant":"Delta Air Lines","date":"2026-08-07","amount":-412.60,"currency":"USD","category":"Travel","status":"Posted"},'
  + '{"id":"txn-3","merchant":"Payroll Deposit","date":"2026-08-06","amount":2450.00,"currency":"USD","category":"Income","status":"Posted","disputable":false},'
  + '{"id":"txn-4","merchant":"Corner Bistro","date":"2026-08-05","amount":-56.80,"currency":"USD","category":"Dining","status":"Pending"}'
  + '],"disputeText":"Dispute this charge"}';

// Bump the generic rows down so Recent Transactions can take slot 1.
List<CLT_Catalog_Item__c> shiftable = [
  SELECT Id, Display_Order__c, Capability_Key__c
  FROM CLT_Catalog_Item__c
  WHERE Industry_Key__c = 'financial_services'
    AND Capability_Key__c IN ('record_selector','item_cart','appointment_picker')
];
for (CLT_Catalog_Item__c c : shiftable) {
  if (c.Display_Order__c != null && c.Display_Order__c < 4) {
    c.Display_Order__c = c.Display_Order__c + 1;
  }
}
if (!shiftable.isEmpty()) update shiftable;

// Upsert the Recent Transactions row (match on industry + capability).
List<CLT_Catalog_Item__c> existing = [
  SELECT Id FROM CLT_Catalog_Item__c
  WHERE Industry_Key__c = 'financial_services' AND Capability_Key__c = 'transaction_dispute'
];
CLT_Catalog_Item__c row = existing.isEmpty() ? new CLT_Catalog_Item__c() : existing[0];
row.Industry_Key__c = 'financial_services';
row.Capability_Key__c = 'transaction_dispute';
row.CLT_Api_Name__c = 'asaFinServTransactions';
row.DTO_Field_Name__c = 'finServTransactionsJSON';
row.Display_Order__c = 1;
row.Label__c = 'Recent Transactions';
row.Description__c = 'Show recent transactions and let customers tap one to start a dispute.';
row.Default_Payload_JSON__c = payload;
upsert row;

System.debug('Seeded row Id: ' + row.Id);
List<CLT_Catalog_Item__c> after = [
  SELECT Display_Order__c, Label__c FROM CLT_Catalog_Item__c
  WHERE Industry_Key__c = 'financial_services' ORDER BY Display_Order__c
];
for (CLT_Catalog_Item__c c : after) System.debug(c.Display_Order__c + ' | ' + c.Label__c);
