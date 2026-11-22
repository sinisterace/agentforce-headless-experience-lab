@IsTest
private class EcwApApprovalsTest {
    @IsTest
    static void returnsPayload() {
        List<EcwApApprovals.Response> out = EcwApApprovals.getApApprovals(new List<EcwApApprovals.Request>{ new EcwApApprovals.Request() });
        System.assertEquals(1, out.size());
        System.assert(String.isNotBlank(out[0].json), 'payload should not be blank');
        System.assert(out[0].json.contains('"items"'), 'payload should carry "items"');
    }
}
