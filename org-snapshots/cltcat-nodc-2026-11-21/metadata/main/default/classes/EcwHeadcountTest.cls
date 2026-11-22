@IsTest
private class EcwHeadcountTest {
    @IsTest
    static void returnsPayload() {
        List<EcwHeadcount.Response> out = EcwHeadcount.getHeadcount(new List<EcwHeadcount.Request>{ new EcwHeadcount.Request() });
        System.assertEquals(1, out.size());
        System.assert(String.isNotBlank(out[0].json), 'payload should not be blank');
        System.assert(out[0].json.contains('"depts"'), 'payload should carry "depts"');
    }
}