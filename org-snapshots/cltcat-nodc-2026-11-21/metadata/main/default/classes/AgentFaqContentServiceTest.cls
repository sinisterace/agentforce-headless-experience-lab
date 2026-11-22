@IsTest
private class AgentFaqContentServiceTest {

    private static ConsultationProfileService.Profile profile() {
        ConsultationProfileService.Profile p = new ConsultationProfileService.Profile();
        p.companyName = 'Acme Co';
        p.website = 'https://acme.com';
        p.industryKey = 'retail';
        p.industryLabel = 'Retail';
        p.summary = 'Acme Co sells outdoor gear online and in stores.';
        p.planNarrative = 'An agent could handle order and returns questions.';
        p.signals = new List<String>{ 'ecommerce', 'stores' };
        return p;
    }

    @IsTest
    static void modelPathBuildsDocumentFromCannedJson() {
        AgentFaqContentService.testCannedJson =
            '```json\n{"overview":"Acme Co sells outdoor gear.",'
            + '"faqs":[{"q":"What are your hours?","a":"We are online 24/7."},'
            + '{"q":"How do I return something?","a":"Ask the agent to start a return."},'
            + '{"q":"","a":"dropped: blank question"},'
            + '{"q":"no answer","a":""}]}\n```';
        Test.startTest();
        AgentFaqContentService.FaqDocument doc = AgentFaqContentService.generate(profile());
        Test.stopTest();

        System.assertEquals(false, doc.isFallback, 'model path used');
        System.assertEquals(2, doc.faqCount, 'blank Q and blank A rows are dropped');
        System.assertEquals('text/plain', doc.mimeType);
        System.assertEquals('Acme-Co-Customer-FAQ.txt', doc.fileName, 'filename sanitized from company');
        System.assert(doc.body.contains('== About Acme Co =='), 'has overview section');
        System.assert(doc.body.contains('Q: What are your hours?'), 'has a Q line');
        System.assert(doc.body.contains('A: We are online 24/7.'), 'has an A line');
        System.assert(doc.title.startsWith('Acme Co'), 'title from company');
        // Structured JSON for the site's Popular Questions section mirrors the kept pairs.
        System.assert(doc.faqsJson.contains('What are your hours?'), 'faqsJson has the question');
        List<Object> pairs = (List<Object>) JSON.deserializeUntyped(doc.faqsJson);
        System.assertEquals(2, pairs.size(), 'faqsJson has the 2 valid pairs');
    }

    @IsTest
    static void malformedJsonFallsBackDeterministically() {
        AgentFaqContentService.testCannedJson = 'not json at all {{{';
        Test.startTest();
        AgentFaqContentService.FaqDocument doc = AgentFaqContentService.generate(profile());
        Test.stopTest();

        System.assertEquals(true, doc.isFallback, 'unparseable model output -> fallback');
        System.assert(doc.faqCount >= 4, 'fallback always ships several FAQs');
        System.assert(doc.body.contains('What does Acme Co do?'), 'fallback FAQ present');
        System.assert(!doc.body.contains('acme.com'), 'website URL must NOT be embedded in the grounding doc (prevents Trust Layer url_redacted)');
    }

    @IsTest
    static void emptyFaqsFallsBack() {
        AgentFaqContentService.testCannedJson = '{"overview":"x","faqs":[]}';
        Test.startTest();
        AgentFaqContentService.FaqDocument doc = AgentFaqContentService.generate(profile());
        Test.stopTest();
        System.assertEquals(true, doc.isFallback, 'no usable FAQs -> fallback');
    }

    @IsTest
    static void nullProfileNeverThrows() {
        AgentFaqContentService.testCannedJson = null;
        Test.startTest();
        AgentFaqContentService.FaqDocument doc = AgentFaqContentService.generate(null);
        Test.stopTest();
        System.assertNotEquals(null, doc, 'always returns a document');
        System.assertEquals(true, doc.isFallback);
        System.assertEquals('Your-company-Customer-FAQ.txt', doc.fileName, 'safe default company name');
        System.assert(doc.faqCount > 0, 'fallback has FAQs even with no profile');
    }

    @IsTest
    static void fileNameSanitizesOddCharacters() {
        System.assertEquals('A-B-Co-Customer-FAQ.txt', AgentFaqContentService.fileName('A&B  Co!!'));
        System.assertEquals('company-Customer-FAQ.txt', AgentFaqContentService.fileName('***'));
        System.assertEquals('company-Customer-FAQ.txt', AgentFaqContentService.fileName(null));
    }
}