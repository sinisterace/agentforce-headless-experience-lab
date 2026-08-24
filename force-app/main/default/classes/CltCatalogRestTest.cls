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

    /** Mocks the Tooling API branding calls SiteBrandingService makes during deploy. */
    private class BrandingMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            if (req.getMethod() == 'PATCH') {
                res.setStatusCode(204);
                res.setBody('');
                return res;
            }
            res.setStatusCode(200);
            if (req.getEndpoint().contains('BrandingSetProperty')) {
                res.setBody(JSON.serialize(new Map<String, Object>{
                    'records' => new List<Object>{
                        new Map<String, Object>{ 'Id' => 'p1', 'PropertyName' => 'chatButton', 'PropertyValue' => '#2E2E2E' }
                    }
                }));
            } else {
                res.setBody(JSON.serialize(new Map<String, Object>{
                    'records' => new List<Object>{ new Map<String, Object>{ 'Id' => '0LwX' } }
                }));
            }
            return res;
        }
    }

    @IsTest
    static void postDeployAgentGroundsAndBrands() {
        AgentFaqContentService.testCannedJson =
            '{"overview":"Chime is a fintech.","faqs":[{"q":"Hours?","a":"24/7"},{"q":"Reset?","a":"In app"}]}';
        Test.setMock(HttpCalloutMock.class, new BrandingMock());
        req('POST', '/services/apexrest/cltcat/deployagent',
            '{"companyName":"Chime","website":"https://chime.com","industryKey":"financial_services",'
            + '"summary":"Chime is a fintech.","accentColor":"#0B5CAB","logoUrl":"https://logo.clearbit.com/chime.com",'
            + '"signals":["No hidden fees","Early direct deposit"]}');
        Test.startTest();
        CltCatalogRest.doPost();
        Test.stopTest();

        System.assertEquals(200, RestContext.response.statusCode);
        Map<String, Object> out = (Map<String, Object>)
            JSON.deserializeUntyped(RestContext.response.responseBody.toString());
        System.assertEquals(false, out.get('faqIsFallback'), 'canned FAQ used');
        System.assertEquals(2, (Integer) out.get('faqCount'));
        // The grounding + brand record is written, active, and holds everything the page needs.
        Company_Knowledge__c k = [
            SELECT Company_Name__c, Faq_Content__c, Faq_Json__c, Summary__c, Signals_JSON__c, Is_Active__c
            FROM Company_Knowledge__c WHERE Is_Active__c = true LIMIT 1
        ];
        System.assertEquals('Chime', k.Company_Name__c);
        System.assert(k.Faq_Content__c.contains('24/7'), 'FAQ content persisted');
        System.assert(k.Faq_Json__c.contains('Hours?'), 'structured FAQ persisted');
        System.assertEquals('Chime is a fintech.', k.Summary__c, 'summary persisted');
        System.assert(k.Signals_JSON__c.contains('No hidden fees'), 'signals persisted');
    }

    @IsTest
    static void postDeployAgentWithNoIdentityIs400() {
        req('POST', '/services/apexrest/cltcat/deployagent', '{}');
        CltCatalogRest.doPost();
        System.assertEquals(400, RestContext.response.statusCode);
    }

    @IsTest
    static void postUnknownEndpointIs404() {
        req('POST', '/services/apexrest/cltcat/bogus', '{}');
        CltCatalogRest.doPost();
        System.assertEquals(404, RestContext.response.statusCode);
    }
}
