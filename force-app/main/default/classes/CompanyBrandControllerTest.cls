@IsTest
private class CompanyBrandControllerTest {

    @IsTest
    static void returnsFullBrandFeed() {
        insert new Company_Knowledge__c(
            Name = 'K', Company_Name__c = 'Acme Co', Accent_Color__c = '#0F766E',
            Logo_Url__c = 'https://logo.clearbit.com/acme.com', Website__c = 'https://acme.com',
            Summary__c = 'Acme sells outdoor gear.',
            Signals_JSON__c = '["Eco-friendly","Repairs","Store pickup"]',
            Faq_Json__c = '[{"q":"Hours?","a":"24/7"},{"q":"Returns?","a":"60 days"},{"q":"","a":"drop me"}]',
            Faq_Content__c = 'x', Is_Active__c = true);
        Test.startTest();
        CompanyBrandController.Brand b = CompanyBrandController.getActiveBrand();
        Test.stopTest();

        System.assertEquals(true, b.found);
        System.assertEquals('Acme Co', b.companyName);
        System.assertEquals('#0F766E', b.accentColor);
        System.assertEquals('https://acme.com', b.website);
        System.assertEquals('Acme sells outdoor gear.', b.summary);
        System.assertEquals(3, b.signals.size(), 'signals parsed');
        System.assertEquals('Eco-friendly', b.signals[0]);
        System.assertEquals(2, b.faqs.size(), 'blank FAQ pair dropped');
        System.assertEquals('Hours?', b.faqs[0].question);
        System.assertEquals('24/7', b.faqs[0].answer);
    }

    @IsTest
    static void safeDefaultsWhenNone() {
        Test.startTest();
        CompanyBrandController.Brand b = CompanyBrandController.getActiveBrand();
        Test.stopTest();
        System.assertEquals(false, b.found);
        System.assertEquals('Your Company', b.companyName);
        System.assertEquals('#0B5CAB', b.accentColor);
        System.assertEquals(0, b.signals.size());
        System.assertEquals(0, b.faqs.size());
    }

    @IsTest
    static void toleratesMalformedJson() {
        insert new Company_Knowledge__c(
            Name = 'K', Company_Name__c = 'Bad JSON Co',
            Signals_JSON__c = 'not-json', Faq_Json__c = '{{{', Is_Active__c = true);
        Test.startTest();
        CompanyBrandController.Brand b = CompanyBrandController.getActiveBrand();
        Test.stopTest();
        System.assertEquals('Bad JSON Co', b.companyName);
        System.assertEquals(0, b.signals.size(), 'malformed signals -> empty, no error');
        System.assertEquals(0, b.faqs.size(), 'malformed faqs -> empty, no error');
    }
}
