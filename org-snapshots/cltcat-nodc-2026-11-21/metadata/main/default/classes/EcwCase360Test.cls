@IsTest
private class EcwCase360Test {

    @IsTest
    static void returnsFocusCase() {
        insert new Case(Subject = 'Badge reader failure', Priority = 'High', Status = 'New');

        Test.startTest();
        List<EcwCase360.Response> out = EcwCase360.getCase360(
            new List<EcwCase360.Request>{ new EcwCase360.Request() });
        Test.stopTest();

        System.assertEquals(1, out.size(), 'one response expected');
        String json = out[0].json;
        System.assert(String.isNotBlank(json), 'payload should not be blank');
        System.assert(json.contains('"facts"'), 'payload should carry facts');
        System.assert(json.contains('Badge reader failure'), 'payload should carry the subject');
    }

    @IsTest
    static void emptyWhenNoCases() {
        System.assertEquals('', EcwCase360.buildPayloadJson(), 'no cases → empty so the card uses its sample');
    }
}