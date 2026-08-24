@IsTest
private class AnswerCompanyFaqActionTest {

    @IsTest
    static void returnsActiveRecordFaq() {
        insert new Company_Knowledge__c(
            Name = 'Old', Company_Name__c = 'Old Co',
            Faq_Content__c = 'stale', Is_Active__c = false);
        insert new Company_Knowledge__c(
            Name = 'Current', Company_Name__c = 'Acme Co',
            Faq_Content__c = 'Q: hours? A: 24/7', Is_Active__c = true);

        AnswerCompanyFaqAction.Request req = new AnswerCompanyFaqAction.Request();
        req.query = 'what are your hours';
        Test.startTest();
        List<AnswerCompanyFaqAction.Response> out =
            AnswerCompanyFaqAction.run(new List<AnswerCompanyFaqAction.Request>{ req });
        Test.stopTest();

        System.assertEquals(1, out.size(), 'one response per request');
        System.assertEquals(true, out[0].found);
        System.assertEquals('Acme Co', out[0].companyName, 'active record wins');
        System.assert(out[0].faqContent.contains('24/7'));
    }

    @IsTest
    static void fallsBackToLatestWhenNoneActive() {
        insert new Company_Knowledge__c(
            Name = 'Only', Company_Name__c = 'Solo Co',
            Faq_Content__c = 'Q: x? A: y', Is_Active__c = false);
        Test.startTest();
        List<AnswerCompanyFaqAction.Response> out =
            AnswerCompanyFaqAction.run(new List<AnswerCompanyFaqAction.Request>());
        Test.stopTest();
        System.assertEquals(1, out.size(), 'empty input still yields one response');
        System.assertEquals(true, out[0].found);
        System.assertEquals('Solo Co', out[0].companyName);
    }

    @IsTest
    static void gracefulWhenNoKnowledge() {
        Test.startTest();
        List<AnswerCompanyFaqAction.Response> out =
            AnswerCompanyFaqAction.run(new List<AnswerCompanyFaqAction.Request>{
                new AnswerCompanyFaqAction.Request()
            });
        Test.stopTest();
        System.assertEquals(false, out[0].found, 'no records -> not found');
        System.assert(out[0].faqContent.contains('No company FAQ knowledge'),
            'returns a safe fallback message, never null');
        System.assertEquals(null, out[0].companyName);
    }

    @IsTest
    static void bulkRequestsGetMatchingResponses() {
        insert new Company_Knowledge__c(
            Name = 'K', Company_Name__c = 'Bulk Co',
            Faq_Content__c = 'content', Is_Active__c = true);
        List<AnswerCompanyFaqAction.Request> reqs = new List<AnswerCompanyFaqAction.Request>{
            new AnswerCompanyFaqAction.Request(),
            new AnswerCompanyFaqAction.Request(),
            new AnswerCompanyFaqAction.Request()
        };
        Test.startTest();
        List<AnswerCompanyFaqAction.Response> out = AnswerCompanyFaqAction.run(reqs);
        Test.stopTest();
        System.assertEquals(3, out.size(), 'response count matches request count');
    }
}
