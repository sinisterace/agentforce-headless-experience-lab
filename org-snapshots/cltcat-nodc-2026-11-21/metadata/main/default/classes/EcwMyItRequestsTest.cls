@IsTest
private class EcwMyItRequestsTest {
    @IsTest
    static void returnsRequests() {
        List<EcwMyItRequests.Response> out = EcwMyItRequests.getMyItRequests(
            new List<EcwMyItRequests.Request>{ new EcwMyItRequests.Request() });
        System.assertEquals(1, out.size());
        System.assert(out[0].json.contains('"requests"'), 'payload should carry requests');
    }
}