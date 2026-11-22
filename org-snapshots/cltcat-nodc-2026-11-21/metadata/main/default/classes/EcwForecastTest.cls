@IsTest
private class EcwForecastTest {

    @IsTest
    static void buildsTieredForecast() {
        insert new List<Opportunity>{
            new Opportunity(Name = 'Early', StageName = 'Prospecting', Amount = 100000, CloseDate = Date.today().addDays(120)),
            new Opportunity(Name = 'Late', StageName = 'Negotiation/Review', Amount = 300000, CloseDate = Date.today().addDays(20)),
            new Opportunity(Name = 'Won', StageName = 'Closed Won', Amount = 200000, CloseDate = Date.today())
        };

        Test.startTest();
        List<EcwForecast.Response> out = EcwForecast.getForecast(
            new List<EcwForecast.Request>{ new EcwForecast.Request() });
        Test.stopTest();

        System.assertEquals(1, out.size(), 'one response expected');
        String json = out[0].json;
        System.assert(String.isNotBlank(json), 'payload should not be blank');
        System.assert(json.contains('"committed"'), 'payload should carry committed');
        System.assert(json.contains('Commit'), 'payload should carry tiers');
    }

    @IsTest
    static void emptyWhenNoForecast() {
        System.assertEquals('', EcwForecast.buildPayloadJson(), 'no opps → empty so the card uses its sample');
    }
}