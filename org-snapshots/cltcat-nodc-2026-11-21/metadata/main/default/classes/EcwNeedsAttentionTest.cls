@IsTest
private class EcwNeedsAttentionTest {

    @IsTest
    static void returnsCuratedFeed() {
        Test.startTest();
        List<EcwNeedsAttention.Response> out = EcwNeedsAttention.getNeedsAttention(
            new List<EcwNeedsAttention.Request>{ new EcwNeedsAttention.Request() });
        Test.stopTest();

        System.assertEquals(1, out.size(), 'one response expected');
        String json = out[0].json;
        System.assert(String.isNotBlank(json), 'payload should not be blank');
        System.assert(json.contains('"atRiskTotal"'), 'payload should carry atRiskTotal');
        System.assert(json.contains('"items"'), 'payload should carry items');
        System.assert(json.contains('Overdue'), 'feed should include an overdue flag');
    }
}