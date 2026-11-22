@IsTest
private class EcwTimeOffTest {
    @IsTest
    static void returnsPayload() {
        List<EcwTimeOff.Response> out = EcwTimeOff.getTimeOff(new List<EcwTimeOff.Request>{ new EcwTimeOff.Request() });
        System.assertEquals(1, out.size());
        System.assert(String.isNotBlank(out[0].json), 'payload should not be blank');
        System.assert(out[0].json.contains('"people"'), 'payload should carry "people"');
    }
}