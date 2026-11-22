@isTest
private class EcwFieldDispatchTest {
    @isTest
    static void returnsPayload() {
        EcwFieldDispatch.Request req = new EcwFieldDispatch.Request();
        req.details = '';
        List<EcwFieldDispatch.Response> out = EcwFieldDispatch.getFieldDispatch(new List<EcwFieldDispatch.Request>{ req });
        System.assertEquals(1, out.size(), 'one response');
        String payload = out[0].json;
        System.assert(String.isNotBlank(payload), 'payload not blank');
        Map<String, Object> p = (Map<String, Object>) JSON.deserializeUntyped(payload);
        System.assert(p.containsKey('candidates'), 'has candidates');
        System.assert(((List<Object>) p.get('candidates')).size() > 0, 'candidates populated');
        System.assert(p.containsKey('appointment'), 'has appointment');
    }

    @isTest
    static void dataWrapperRoundTrips() {
        EcwFieldDispatchData d = new EcwFieldDispatchData('{"x":1}');
        System.assertEquals('{"x":1}', d.ecwFieldDispatchJSON);
        System.assertEquals('', new EcwFieldDispatchData().ecwFieldDispatchJSON);
    }
}