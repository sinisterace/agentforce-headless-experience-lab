@IsTest
private class EcwCsatPulseTest {

    @IsTest
    static void returnsCuratedPulse() {
        Test.startTest();
        List<EcwCsatPulse.Response> out = EcwCsatPulse.getCsatPulse(
            new List<EcwCsatPulse.Request>{ new EcwCsatPulse.Request() });
        Test.stopTest();

        System.assertEquals(1, out.size(), 'one response expected');
        String json = out[0].json;
        System.assert(String.isNotBlank(json), 'payload should not be blank');
        System.assert(json.contains('"trend"'), 'payload should carry a trend');
        System.assert(json.contains('"comments"'), 'payload should carry comments');
    }
}
