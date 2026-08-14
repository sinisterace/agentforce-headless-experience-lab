@IsTest
private class CltCatalogRestTest {

    @TestSetup
    static void setup() {
        insert new CLT_Catalog_Item__c(Name='Quick Options (financial_services)',
            CLT_Api_Name__c='asaItemSelector', Industry_Key__c='financial_services',
            Capability_Key__c='record_selector', Label__c='Quick Options',
            Display_Order__c=1, DTO_Field_Name__c='itemSelectorJSON',
            Default_Payload_JSON__c='{"title":"x","mode":"single","items":["a"]}');
    }

    private static RestRequest req(String method, String uri, String body) {
        RestRequest r = new RestRequest();
        r.httpMethod = method;
        r.requestURI = uri;
        if (body != null) r.requestBody = Blob.valueOf(body);
        RestContext.request = r;
        RestContext.response = new RestResponse();
        return r;
    }

    @IsTest
    static void getCatalogReturnsIndustriesAndRecs() {
        req('GET', '/services/apexrest/cltcat/catalog', null);
        Test.startTest();
        CltCatalogRest.doGet();
        Test.stopTest();
        System.assertEquals(200, RestContext.response.statusCode);
        Map<String, Object> out = (Map<String, Object>)
            JSON.deserializeUntyped(RestContext.response.responseBody.toString());
        System.assert(out.containsKey('industries'));
        System.assert(out.containsKey('recommendationsByIndustry'));
    }

    @IsTest
    static void getUnknownEndpointIs404() {
        req('GET', '/services/apexrest/cltcat/bogus', null);
        CltCatalogRest.doGet();
        System.assertEquals(404, RestContext.response.statusCode);
    }

    @IsTest
    static void postScanReturnsProfileAndRecs() {
        ConsultationProfileService.testCannedJson =
            '{"industryKey":"financial_services","confidence":0.9,"summary":"S","planNarrative":"N"}';
        req('POST', '/services/apexrest/cltcat/scan', '{"companyName":"Chime","website":"chime.com"}');
        Test.startTest();
        CltCatalogRest.doPost();
        Test.stopTest();
        System.assertEquals(200, RestContext.response.statusCode);
        Map<String, Object> out = (Map<String, Object>)
            JSON.deserializeUntyped(RestContext.response.responseBody.toString());
        System.assert(out.containsKey('profile'));
        System.assert(out.containsKey('recommendations'));
    }

    @IsTest
    static void postScanWithNoIdentityIs400() {
        req('POST', '/services/apexrest/cltcat/scan', '{}');
        CltCatalogRest.doPost();
        System.assertEquals(400, RestContext.response.statusCode);
    }

    @IsTest
    static void postScanWithBadJsonIs400() {
        req('POST', '/services/apexrest/cltcat/scan', 'not-json');
        CltCatalogRest.doPost();
        System.assertEquals(400, RestContext.response.statusCode);
    }

    @IsTest
    static void postSavePersistsProfile() {
        req('POST', '/services/apexrest/cltcat/save',
            '{"firstName":"Alex","lastName":"Rivera","email":"alex@chime.com",'
            + '"companyName":"Chime","website":"https://chime.com","industryKey":"financial_services",'
            + '"summary":"S","planNarrative":"N","accentColor":"#0B5CAB","source":"website",'
            + '"confidence":0.9,"signals":["a","b"]}');
        Test.startTest();
        CltCatalogRest.doPost();
        Test.stopTest();
        System.assertEquals(200, RestContext.response.statusCode);
        Onboarding_Profile__c saved = [
            SELECT First_Name__c, Last_Name__c, Email__c, Company_Name__c
            FROM Onboarding_Profile__c WHERE Status__c='saved' LIMIT 1
        ];
        System.assertEquals('Alex', saved.First_Name__c);
        System.assertEquals('Rivera', saved.Last_Name__c);
        System.assertEquals('alex@chime.com', saved.Email__c);
    }

    @IsTest
    static void postUnknownEndpointIs404() {
        req('POST', '/services/apexrest/cltcat/bogus', '{}');
        CltCatalogRest.doPost();
        System.assertEquals(404, RestContext.response.statusCode);
    }
}
