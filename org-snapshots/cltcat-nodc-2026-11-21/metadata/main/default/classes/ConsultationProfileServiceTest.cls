@IsTest
private class ConsultationProfileServiceTest {

    @TestSetup
    static void setup() {
        insert new CLT_Catalog_Item__c(Name='Quick Options (hvac)',
            CLT_Api_Name__c='asaItemSelector', Industry_Key__c='hvac',
            Capability_Key__c='record_selector', Label__c='Quick Options',
            Display_Order__c=1, DTO_Field_Name__c='itemSelectorJSON',
            Default_Payload_JSON__c='{"title":"x","mode":"single","items":["a"]}');
    }

    @IsTest
    static void scanUsesCannedJsonAndNormalizes() {
        ConsultationProfileService.testCannedJson =
            '```json\n{"industryKey":"hvac","confidence":1.5,"summary":"S","planNarrative":"N",'
            + '"accentColor":"ABCDEF","signals":["one","two","three","four","five"],'
            + '"planEnrichment":{"what":"Acme could let customers book a repair right in chat.",'
            + '"adoption":"Most Acme calls are status checks that could self-serve.",'
            + '"bogus_key":"should be ignored"}}\n```';
        Test.startTest();
        ConsultationProfileService.Profile p =
            ConsultationProfileService.scan('Acme', 'acme.com', 'hvac');
        Test.stopTest();
        System.assertEquals('website', p.source);
        System.assertEquals('hvac', p.industryKey);
        System.assertEquals('HVAC', p.industryLabel);
        System.assertEquals(1, p.confidence, 'confidence clamped to 1');
        System.assertEquals('#ABCDEF', p.accentColor, 'hex # prepended');
        System.assertEquals(4, p.signals.size(), 'signals capped at 4');
        System.assertEquals('https://acme.com', p.website, 'scheme prepended');
        System.assert(p.logoUrl.contains('acme.com'), 'logo derived from host');
        // Curated spine is always the full 6 sections.
        System.assertEquals(6, p.plan.size(), 'curated spine has all sections');
        // Every section has a curated title + body regardless of enrichment.
        for (ConsultationProfileService.PlanSection s : p.plan) {
            System.assert(String.isNotBlank(s.title), 'section has a title');
            System.assert(String.isNotBlank(s.body), 'section has curated body');
        }
        // Enrichment merged onto the matching sections only.
        Map<String, ConsultationProfileService.PlanSection> byKey =
            new Map<String, ConsultationProfileService.PlanSection>();
        for (ConsultationProfileService.PlanSection s : p.plan) byKey.put(s.key, s);
        System.assert(byKey.get('what').personalized.contains('book a repair'), 'what enriched');
        System.assert(byKey.get('adoption').personalized.contains('status checks'), 'adoption enriched');
        System.assertEquals(null, byKey.get('vs_text').personalized, 'unprovided section not enriched');
    }

    @IsTest
    static void missingEnrichmentStillGivesFullCuratedSpine() {
        // Valid JSON with no planEnrichment -> full curated spine, no personalization.
        ConsultationProfileService.Profile p =
            ConsultationProfileService.parseAndNormalize(
                '{"industryKey":"healthcare","summary":"S"}', 'MedCo', 'medco.com');
        System.assertNotEquals(null, p.plan, 'plan is never null');
        System.assertEquals(6, p.plan.size(), 'full curated spine present');
        for (ConsultationProfileService.PlanSection s : p.plan) {
            System.assert(String.isNotBlank(s.body), 'curated body present');
            System.assertEquals(null, s.personalized, 'no enrichment without a planEnrichment object');
        }
    }

    @IsTest
    static void badJsonFallsBackAndNeverThrows() {
        ConsultationProfileService.testCannedJson = 'not json at all';
        Test.startTest();
        ConsultationProfileService.Profile p =
            ConsultationProfileService.scan('Local HVAC', 'localhvac.com', 'hvac');
        Test.stopTest();
        // Tier 1 parse fails, Tier 2 is skipped in tests, so we get Tier 3 fallback.
        System.assertEquals('fallback', p.source);
        System.assertEquals('hvac', p.industryKey);
        System.assertNotEquals(null, p.summary);
        System.assertEquals(6, p.plan.size(), 'fallback profile still has the full curated spine');
    }

    @IsTest
    static void invalidIndustryKeyResolvesToDefault() {
        ConsultationProfileService.testCannedJson =
            '{"industryKey":"banking","confidence":0.7,"summary":"S","planNarrative":"N"}';
        Test.startTest();
        ConsultationProfileService.Profile p =
            ConsultationProfileService.scan('X', 'x.com', null);
        Test.stopTest();
        System.assertEquals('financial_services', p.industryKey, 'unknown key -> default');
    }

    @IsTest
    static void helpersCoverKnowledgePromptAndWrap() {
        String prompt = ConsultationProfileService.buildKnowledgeOnlyPrompt('Acme "Co"', 'acme.com', 'hvac');
        System.assert(prompt.contains('Acme'), 'prompt includes company');
        System.assert(prompt.contains('hvac'), 'prompt includes hint');
        System.assert(!prompt.contains('"Co"'), 'double quotes sanitized');
        ConnectApi.WrappedValue w = ConsultationProfileService.wrap(null);
        System.assertEquals('', w.value, 'null wraps to empty string');
        ConnectApi.WrappedValue w2 = ConsultationProfileService.wrap('x');
        System.assertEquals('x', w2.value);
    }

    @IsTest
    static void parseNormalizeHandlesEmptyAndDefaults() {
        // null raw -> null profile
        System.assertEquals(null, ConsultationProfileService.parseAndNormalize(null, 'C', 'c.com'));
        // valid but sparse -> defaults applied
        ConsultationProfileService.Profile p =
            ConsultationProfileService.parseAndNormalize('{}', 'C', 'c.com');
        System.assertEquals('financial_services', p.industryKey, 'missing key -> default');
        System.assertEquals('#0B5CAB', p.accentColor, 'missing accent -> default');
        System.assertEquals(0.5, p.confidence, 'missing confidence -> 0.5');
    }

    @IsTest
    static void blankCannedGivesFallback() {
        ConsultationProfileService.testCannedJson = '';
        Test.startTest();
        ConsultationProfileService.Profile p =
            ConsultationProfileService.scan('', '', 'healthcare');
        Test.stopTest();
        System.assertEquals('fallback', p.source);
        System.assertEquals('healthcare', p.industryKey);
    }
}