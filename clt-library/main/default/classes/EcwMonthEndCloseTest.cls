@IsTest
private class EcwMonthEndCloseTest {
    @IsTest
    static void returnsPayload() {
        List<EcwMonthEndClose.Response> out = EcwMonthEndClose.getMonthEndClose(new List<EcwMonthEndClose.Request>{ new EcwMonthEndClose.Request() });
        System.assertEquals(1, out.size());
        System.assert(String.isNotBlank(out[0].json), 'payload should not be blank');
        System.assert(out[0].json.contains('"tasks"'), 'payload should carry "tasks"');
    }
}
