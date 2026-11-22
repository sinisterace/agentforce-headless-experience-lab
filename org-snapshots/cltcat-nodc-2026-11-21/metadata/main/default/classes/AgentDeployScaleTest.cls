/**
 * @description Robustness / scale test for the runtime re-personalization loop that the whole
 * experience depends on:
 *   POST /cltcat/deployAgent  ->  Company_Knowledge__c write  ->  CompanyBrandController.getActiveBrand
 *   (the site hub)            ->  AnswerCompanyFaqAction (the agent grounding).
 *
 * Guarantees that matter for scale: every deploy leaves EXACTLY ONE active record, the hub + the
 * agent always read THAT company's data, the model-failure path still produces a usable record,
 * and edge inputs (long/blank/special-char/malformed) never throw. No callouts happen (FAQ uses
 * the canned seam under test; branding callout was removed), so this exercises the real path.
 */
@IsTest
private class AgentDeployScaleTest {

    private static final String GOOD_FAQ =
        '{"overview":"O","faqs":[{"q":"What are your hours?","a":"24/7"},{"q":"Reset password?","a":"Use the app"}]}';

    /** Run the real /deployAgent endpoint for one company; return the parsed response (+ __status). */
    private static Map<String, Object> deploy(
        String company, String website, String industry, String accent,
        List<String> signals, String cannedFaq
    ) {
        AgentFaqContentService.testCannedJson = cannedFaq;
        Map<String, Object> body = new Map<String, Object>{
            'companyName' => company,
            'website' => website,
            'industryKey' => industry,
            'summary' => (company == null ? '' : company) + ' is a company.',
            'planNarrative' => 'A plan.',
            'accentColor' => accent,
            'logoUrl' => 'https://logo.clearbit.com/example.com',
            'signals' => signals
        };
        RestRequest r = new RestRequest();
        r.httpMethod = 'POST';
        r.requestURI = '/services/apexrest/cltcat/deployagent';
        r.requestBody = Blob.valueOf(JSON.serialize(body));
        RestContext.request = r;
        RestContext.response = new RestResponse();
        CltCatalogRest.doPost();
        Map<String, Object> out = new Map<String, Object>{ '__status' => RestContext.response.statusCode };
        if (RestContext.response.statusCode == 200) {
            out.putAll((Map<String, Object>) JSON.deserializeUntyped(RestContext.response.responseBody.toString()));
        }
        return out;
    }

    private static Integer activeCount() {
        return [SELECT COUNT() FROM Company_Knowledge__c WHERE Is_Active__c = true];
    }

    @IsTest
    static void sequentialUpdatesAlwaysLeaveExactlyOneActiveAndReadCorrectly() {
        List<String> companies = new List<String>{ 'TD Bank', 'Walmart', 'Patagonia', 'Chime', 'Northern Trail Outfitters' };
        List<String> accents = new List<String>{ '#00843D', '#0071CE', '#3D5A40', '#1EC677', '#4F46E5' };

        Test.startTest();
        for (Integer i = 0; i < companies.size(); i++) {
            Map<String, Object> resp = deploy(
                companies[i], 'https://example' + i + '.com', 'retail', accents[i],
                new List<String>{ 'signal a', 'signal b' }, GOOD_FAQ);

            System.assertEquals(200, resp.get('__status'), 'deploy ok for ' + companies[i]);
            System.assertEquals(false, resp.get('faqIsFallback'), 'model path used');
            // 1) exactly one active record after every update
            System.assertEquals(1, activeCount(), 'exactly one active record after ' + companies[i]);
            // 2) the hub (getActiveBrand) reads THIS company
            CompanyBrandController.Brand b = CompanyBrandController.getActiveBrand();
            System.assertEquals(companies[i], b.companyName, 'hub shows current company');
            System.assertEquals(accents[i].toUpperCase(), b.accentColor.toUpperCase(), 'hub accent matches');
            System.assertEquals(2, b.faqs.size(), 'hub FAQ parsed');
            // 3) the agent action grounds on THIS company
            List<AnswerCompanyFaqAction.Response> a =
                AnswerCompanyFaqAction.run(new List<AnswerCompanyFaqAction.Request>{ new AnswerCompanyFaqAction.Request() });
            System.assertEquals(true, a[0].found);
            System.assertEquals(companies[i], a[0].companyName, 'agent grounds on current company');
            System.assert(a[0].faqContent.contains('24/7'), 'agent has the FAQ content');
        }
        Test.stopTest();
        System.assertEquals(1, activeCount(), 'still exactly one active at the end');
        System.assertEquals(5, [SELECT COUNT() FROM Company_Knowledge__c], 'all five records exist');
    }

    @IsTest
    static void modelFailureStillProducesUsableRecord() {
        Test.startTest();
        Map<String, Object> resp = deploy('Acme', 'https://acme.com', 'retail', '#123456', null, 'not-json-garbage {{{');
        Test.stopTest();
        System.assertEquals(200, resp.get('__status'), 'never dead-ends on model failure');
        System.assertEquals(true, resp.get('faqIsFallback'), 'fell back deterministically');
        System.assertEquals(1, activeCount());
        // Hub + agent still work off the fallback record.
        CompanyBrandController.Brand b = CompanyBrandController.getActiveBrand();
        System.assertEquals('Acme', b.companyName);
        System.assert(b.faqs.size() > 0, 'fallback still yields FAQ cards');
        List<AnswerCompanyFaqAction.Response> a =
            AnswerCompanyFaqAction.run(new List<AnswerCompanyFaqAction.Request>{ new AnswerCompanyFaqAction.Request() });
        System.assertEquals(true, a[0].found, 'agent still grounded on fallback');
    }

    @IsTest
    static void edgeInputsNeverThrow() {
        String longName = 'X'.repeat(500);           // exceeds field lengths -> must clip, not throw
        String weird = 'Café & Cø. <script> "\'\\ 日本';

        Test.startTest();
        // long name + malformed signals payload (a string, not a list) + odd accent
        Map<String, Object> r1 = deploy(longName, 'https://a.com', 'retail', 'not-a-hex', new List<String>{ 'ok' }, GOOD_FAQ);
        System.assertEquals(200, r1.get('__status'), 'long name clipped, no error');
        System.assertEquals(1, activeCount());

        // special characters everywhere
        Map<String, Object> r2 = deploy(weird, 'https://b.com', 'healthcare', '#0F766E', new List<String>{ weird }, GOOD_FAQ);
        System.assertEquals(200, r2.get('__status'), 'special chars handled');
        System.assertEquals(1, activeCount());
        CompanyBrandController.Brand b = CompanyBrandController.getActiveBrand();
        System.assertEquals(weird.left(255), b.companyName, 'special-char name persisted (clipped to field length)');
        Test.stopTest();
    }

    @IsTest
    static void blankIdentityIsRejected() {
        Test.startTest();
        Map<String, Object> resp = deploy('', '', 'retail', '#000000', null, GOOD_FAQ);
        Test.stopTest();
        System.assertEquals(400, resp.get('__status'), 'blank name AND website -> 400');
        System.assertEquals(0, activeCount(), 'nothing written on bad request');
    }

    @IsTest
    static void manyRapidUpdatesStayConsistent() {
        Test.startTest();
        for (Integer i = 0; i < 20; i++) {
            Map<String, Object> resp = deploy('Co ' + i, 'https://c' + i + '.com', 'retail', '#0B5CAB', null, GOOD_FAQ);
            System.assertEquals(200, resp.get('__status'));
            System.assertEquals(1, activeCount(), 'exactly one active on iteration ' + i);
        }
        Test.stopTest();
        // The last write wins; hub + agent reflect it.
        CompanyBrandController.Brand b = CompanyBrandController.getActiveBrand();
        System.assertEquals('Co 19', b.companyName, 'latest company is the active one');
        System.assertEquals(1, activeCount());
        System.assertEquals(20, [SELECT COUNT() FROM Company_Knowledge__c]);
    }
}