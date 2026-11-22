@IsTest
private class EcwArAgingTest {
    @IsTest
    static void returnsPayload() {
        List<EcwArAging.Response> out = EcwArAging.getArAging(new List<EcwArAging.Request>{ new EcwArAging.Request() });
        System.assertEquals(1, out.size());
        System.assert(String.isNotBlank(out[0].json), 'payload should not be blank');
        System.assert(out[0].json.contains('"buckets"'), 'payload should carry "buckets"');
    }
}