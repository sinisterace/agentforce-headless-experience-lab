// One-off cleanup of custom-object test/bloat data. Keeps CLT_Catalog_Item__c
// (seed) untouched. Keeps the single newest Company_Knowledge__c; deletes all
// Onboarding_Profile__c. (Messaging objects handled separately.)

// 1 — Company_Knowledge__c: keep newest, delete rest
List<Company_Knowledge__c> ckAll = [SELECT Id FROM Company_Knowledge__c ORDER BY CreatedDate DESC];
List<Company_Knowledge__c> ckDel = new List<Company_Knowledge__c>();
for (Integer i = 1; i < ckAll.size(); i++) ckDel.add(ckAll[i]);
delete ckDel;
System.debug('Company_Knowledge__c deleted=' + ckDel.size() + ' kept=' + (ckAll.isEmpty() ? 0 : 1));

// 2 — Onboarding_Profile__c: delete all
List<Onboarding_Profile__c> opAll = [SELECT Id FROM Onboarding_Profile__c];
delete opAll;
System.debug('Onboarding_Profile__c deleted=' + opAll.size());
