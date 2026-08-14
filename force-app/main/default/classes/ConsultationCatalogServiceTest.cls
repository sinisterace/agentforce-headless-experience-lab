@IsTest
private class ConsultationCatalogServiceTest {

    @TestSetup
    static void setup() {
        List<CLT_Catalog_Item__c> rows = new List<CLT_Catalog_Item__c>();
        rows.add(new CLT_Catalog_Item__c(Name='Quick Options (financial_services)',
            CLT_Api_Name__c='asaItemSelector', Industry_Key__c='financial_services',
            Capability_Key__c='record_selector', Label__c='Quick Options',
            Display_Order__c=1, DTO_Field_Name__c='itemSelectorJSON',
            Default_Payload_JSON__c='{"title":"x","mode":"single","items":["a"]}'));
        rows.add(new CLT_Catalog_Item__c(Name='Cart (financial_services)',
            CLT_Api_Name__c='asaAddItem', Industry_Key__c='financial_services',
            Capability_Key__c='item_cart', Label__c='Cart',
            Display_Order__c=2, DTO_Field_Name__c='addItemJSON',
            Default_Payload_JSON__c='{"title":"x","type":"single","items":[]}'));
        rows.add(new CLT_Catalog_Item__c(Name='Appt (healthcare)',
            CLT_Api_Name__c='asaAppointmentSelector', Industry_Key__c='healthcare',
            Capability_Key__c='appointment_picker', Label__c='Appt',
            Display_Order__c=1, DTO_Field_Name__c='appointmentSelectorJSON',
            Default_Payload_JSON__c='{"title":"x"}'));
        insert rows;
    }

    @IsTest
    static void recommendationsAreDeterministicAndOrdered() {
        Test.startTest();
        List<ConsultationCatalogService.Recommendation> fs =
            ConsultationCatalogService.recommendationsFor('financial_services');
        Test.stopTest();
        System.assertEquals(2, fs.size(), 'two fin-svcs rows');
        System.assertEquals('asaItemSelector', fs[0].cltApiName, 'ordered by Display_Order__c');
        System.assertEquals('itemSelectorJSON', fs[0].dtoFieldName);
    }

    @IsTest
    static void resolveIndustryKeyFallsBackForUnknown() {
        System.assertEquals('financial_services', ConsultationCatalogService.resolveIndustryKey('nonsense'));
        System.assertEquals('financial_services', ConsultationCatalogService.resolveIndustryKey(null));
        System.assertEquals('healthcare', ConsultationCatalogService.resolveIndustryKey('HEALTHCARE'));
    }

    @IsTest
    static void optionsAndLabels() {
        System.assert(ConsultationCatalogService.industryKeyOptions().contains('hvac'));
        System.assertEquals(
            ConsultationCatalogService.INDUSTRY_KEYS.size(),
            ConsultationCatalogService.industriesWithLabels().size()
        );
        System.assertEquals('HVAC', ConsultationCatalogService.labelFor('hvac'));
        System.assertEquals('Retail', ConsultationCatalogService.labelFor('retail'));
        System.assertEquals('Travel & Hospitality', ConsultationCatalogService.labelFor('travel_hospitality'));
        System.assertEquals('Public Sector & Education', ConsultationCatalogService.labelFor('public_sector'));
    }
}
