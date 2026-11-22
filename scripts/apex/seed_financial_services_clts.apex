// Idempotent seed for the 4 ASA Financial Services catalogue rows. Each row is
// matched on Industry_Key__c + Capability_Key__c, so re-running only updates in
// place. dto === the widget registry key / CltKind. Regenerated from the org's
// live rows so a fresh org gets the full, consistent Financial Services catalogue
// (replaces the older partial seed scripts).

Map<String, Map<String, Object>> desired = new Map<String, Map<String, Object>>{
  'account_selector' => new Map<String, Object>{ 'order' => 0, 'clt' => 'asaFinServAccountSelector', 'dto' => 'finServAccountSelectorJSON', 'label' => 'Account Selector', 'desc' => 'Let customers pick one of their accounts, with live balances and available credit.', 'payload' => '{"accounts":[{"badge":"Primary","currency":"USD","balance":4820.55,"mask":"1234","type":"Checking","name":"Everyday Checking","id":"chk-1234"},{"currency":"USD","balance":15230.00,"mask":"5678","type":"Savings","name":"High-Yield Savings","id":"sav-5678"},{"available":9257.82,"currency":"USD","balance":-742.18,"mask":"9012","type":"Credit Card","name":"Rewards Card","id":"crd-9012"}],"mode":"single","title":"Which account can I help you with?"}' },
  'transaction_dispute' => new Map<String, Object>{ 'order' => 1, 'clt' => 'asaFinServTransactions', 'dto' => 'finServTransactionsJSON', 'label' => 'Recent Transactions', 'desc' => 'Show recent transactions and let customers tap one to start a dispute.', 'payload' => '{"title":"Your recent transactions","accountLabel":"Everyday Checking ••1234","transactions":[{"id":"txn-1","merchant":"Whole Foods Market","date":"2026-08-09","amount":-84.23,"currency":"USD","category":"Groceries","status":"Posted"},{"id":"txn-2","merchant":"Delta Air Lines","date":"2026-08-07","amount":-412.60,"currency":"USD","category":"Travel","status":"Posted"},{"id":"txn-3","merchant":"Payroll Deposit","date":"2026-08-06","amount":2450.00,"currency":"USD","category":"Income","status":"Posted","disputable":false},{"id":"txn-4","merchant":"Corner Bistro","date":"2026-08-05","amount":-56.80,"currency":"USD","category":"Dining","status":"Pending"}],"disputeText":"Dispute this charge"}' },
  'advisor_appointment' => new Map<String, Object>{ 'order' => 2, 'clt' => 'asaFinServAdvisorMeeting', 'dto' => 'finServAdvisorMeetingJSON', 'label' => 'Advisor Appointment', 'desc' => 'Show a matched advisor and open time slots so customers can book an appointment.', 'payload' => '{"title":"Book time with your advisor","advisor":{"name":"Jordan Lee","title":"Senior Financial Advisor","specialty":"Retirement & investment planning","initials":"JL"},"days":[{"date":"2026-09-18","slots":[{"id":"slot-1","time":"09:00","meetingType":"video"},{"id":"slot-2","time":"10:30","meetingType":"phone"},{"id":"slot-3","time":"13:00","meetingType":"in-branch"}]},{"date":"2026-09-19","slots":[{"id":"slot-4","time":"11:00","meetingType":"video"},{"id":"slot-5","time":"14:30","meetingType":"phone"},{"id":"slot-6","time":"16:00","meetingType":"in-branch"}]}],"submitText":"Book appointment"}' },
  'money_movement' => new Map<String, Object>{ 'order' => 3, 'clt' => 'asaFinServMoneyMovement', 'dto' => 'finServMoneyMovementJSON', 'label' => 'Money Movement', 'desc' => 'Let customers pick a recipient and a preset amount to send money or pay a bill.', 'payload' => '{"title":"Send money","fromAccount":{"label":"Everyday Checking","mask":"1234"},"recipients":[{"id":"rcp-1","name":"Alex Rivera","type":"person","mask":"4821","detail":"Checking"},{"id":"rcp-2","name":"Rewards Card","type":"card","mask":"9012","detail":"Credit Card"},{"id":"rcp-3","name":"High-Yield Savings","type":"account","mask":"5678","detail":"Savings"}],"amountPresets":[{"id":"amt-1","label":"$50","amount":50},{"id":"amt-2","label":"$100","amount":100},{"id":"amt-3","label":"$250","amount":250},{"id":"amt-4","label":"Minimum","amount":35}],"currency":"USD","allowOther":true,"otherText":"Other amount","submitText":"Continue"}' }
};
List<String> orderedCaps = new List<String>{ 'account_selector', 'transaction_dispute', 'advisor_appointment', 'money_movement' };

Map<String, CLT_Catalog_Item__c> byCap = new Map<String, CLT_Catalog_Item__c>();
for (CLT_Catalog_Item__c c : [
  SELECT Id, Capability_Key__c FROM CLT_Catalog_Item__c WHERE Industry_Key__c = 'financial_services'
]) {
  byCap.put(c.Capability_Key__c, c);
}

List<CLT_Catalog_Item__c> toUpsert = new List<CLT_Catalog_Item__c>();
for (String cap : orderedCaps) {
  Map<String, Object> d = desired.get(cap);
  CLT_Catalog_Item__c row = byCap.containsKey(cap) ? byCap.get(cap) : new CLT_Catalog_Item__c();
  row.Industry_Key__c = 'financial_services';
  row.Capability_Key__c = cap;
  row.CLT_Api_Name__c = (String) d.get('clt');
  row.DTO_Field_Name__c = (String) d.get('dto');
  row.Display_Order__c = (Integer) d.get('order');
  row.Label__c = (String) d.get('label');
  row.Description__c = (String) d.get('desc');
  row.Default_Payload_JSON__c = (String) d.get('payload');
  toUpsert.add(row);
}
upsert toUpsert;
System.debug('Seeded ' + toUpsert.size() + ' financial_services catalogue rows.');
