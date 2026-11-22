@isTest
private class EcwAbTestTest {
    @isTest static void returnsPayload() {
        EcwAbTest.Request req = new EcwAbTest.Request(); req.details = '';
        List<EcwAbTest.Response> out = EcwAbTest.run(new List<EcwAbTest.Request>{ req });
        System.assertEquals(1, out.size());
        String payload = out[0].json;
        System.assert(String.isNotBlank(payload));
        System.assertNotEquals(null, JSON.deserializeUntyped(payload));
    }
    @isTest static void wrapper() {
        System.assertEquals('x', new EcwAbTestData('x').ecwAbTestJSON);
        System.assertEquals('', new EcwAbTestData().ecwAbTestJSON);
    }
}