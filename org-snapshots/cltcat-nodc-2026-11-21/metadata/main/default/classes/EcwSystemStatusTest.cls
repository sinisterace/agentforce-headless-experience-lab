@IsTest
private class EcwSystemStatusTest {
    @IsTest
    static void returnsStatus() {
        List<EcwSystemStatus.Response> out = EcwSystemStatus.getSystemStatus(
            new List<EcwSystemStatus.Request>{ new EcwSystemStatus.Request() });
        System.assertEquals(1, out.size());
        String json = out[0].json;
        System.assert(String.isNotBlank(json), 'payload should not be blank');
        System.assert(json.contains('"services"'), 'payload should carry services');
        System.assert(json.contains('"overall"'), 'payload should carry overall');
    }
}