@IsTest
private class EcwSalesPipelineTest {

    @IsTest
    static void returnsPayloadForOpenPipeline() {
        insert new List<Opportunity>{
            new Opportunity(Name = 'Alpha', StageName = 'Prospecting', Amount = 100000, CloseDate = Date.today().addDays(20)),
            new Opportunity(Name = 'Beta', StageName = 'Qualification', Amount = 50000, CloseDate = Date.today().addDays(40))
        };

        Test.startTest();
        List<EcwSalesPipeline.Response> out = EcwSalesPipeline.getPipeline(
            new List<EcwSalesPipeline.Request>{ new EcwSalesPipeline.Request() });
        Test.stopTest();

        System.assertEquals(1, out.size(), 'one response expected');
        String json = out[0].json;
        System.assert(String.isNotBlank(json), 'payload should not be blank');
        System.assert(json.contains('"openTotal"'), 'payload should carry openTotal');
        System.assert(json.contains('"stages"'), 'payload should carry stages');
    }

    @IsTest
    static void emptyWhenNoPipeline() {
        System.assertEquals('', EcwSalesPipeline.buildPayloadJson(), 'no open opps → empty so the card uses its sample');
    }

    @IsTest
    static void compactFormats() {
        System.assertEquals('$1.42M', EcwSalesPipeline.compact(1420000));
        System.assertEquals('$320K', EcwSalesPipeline.compact(320000));
        System.assertEquals('$0', EcwSalesPipeline.compact(null));
    }
}