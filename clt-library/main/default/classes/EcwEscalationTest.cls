@isTest
private class EcwEscalationTest {
    @isTest
    static void returnsPayload() {
        EcwEscalation.Request req = new EcwEscalation.Request();
        req.details = '';
        List<EcwEscalation.Response> out = EcwEscalation.getEscalation(new List<EcwEscalation.Request>{ req });
        System.assertEquals(1, out.size(), 'one response');
        String payload = out[0].json;
        System.assert(String.isNotBlank(payload), 'payload not blank');
        Map<String, Object> p = (Map<String, Object>) JSON.deserializeUntyped(payload);
        System.assert(p.containsKey('lines'), 'has lines');
        System.assert(((List<Object>) p.get('lines')).size() > 0, 'lines populated');
        System.assert(p.containsKey('caseInfo'), 'has caseInfo');
    }

    @isTest
    static void dataWrapperRoundTrips() {
        EcwEscalationData d = new EcwEscalationData('{"x":1}');
        System.assertEquals('{"x":1}', d.ecwEscalationJSON);
        System.assertEquals('', new EcwEscalationData().ecwEscalationJSON);
    }
}
