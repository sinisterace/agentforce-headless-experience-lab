// Remove the standalone "What happened?" heading from the Insurance · File a Claim
// catalogue payload — the card now leads with the policy context, no title.
// Idempotent: re-running is a no-op once the title key is gone.
// NOTE: Default_Payload_JSON__c is a Long Text Area — it cannot be filtered in the
// WHERE clause, so null-check it in the loop instead.
List<CLT_Catalog_Item__c> rows = [
  SELECT Id, Default_Payload_JSON__c
  FROM CLT_Catalog_Item__c
  WHERE DTO_Field_Name__c = 'insuranceFileClaimJSON'
];
for (CLT_Catalog_Item__c c : rows) {
  if (c.Default_Payload_JSON__c == null) continue;
  String p = c.Default_Payload_JSON__c;
  p = p.replace('"title":"What happened?",', '');
  p = p.replace('"title":"What happened?"', '');
  c.Default_Payload_JSON__c = p;
}
update rows;
System.debug('Cleared File-a-Claim title on ' + rows.size() + ' row(s).');
