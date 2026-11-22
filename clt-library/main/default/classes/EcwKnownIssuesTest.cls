@IsTest
private class EcwKnownIssuesTest {
    @IsTest
    static void returnsIncidents() {
        List<EcwKnownIssues.Response> out = EcwKnownIssues.getKnownIssues(
            new List<EcwKnownIssues.Request>{ new EcwKnownIssues.Request() });
        System.assertEquals(1, out.size());
        String json = out[0].json;
        System.assert(String.isNotBlank(json), 'payload should not be blank');
        System.assert(json.contains('"incidents"'), 'payload should carry incidents');
    }
}
