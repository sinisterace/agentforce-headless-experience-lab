@IsTest
private class EcwWhatChangedTest {

    @IsTest
    static void returnsMotionFeed() {
        Test.startTest();
        List<EcwWhatChanged.Response> out = EcwWhatChanged.getWhatChanged(
            new List<EcwWhatChanged.Request>{ new EcwWhatChanged.Request() });
        Test.stopTest();

        System.assertEquals(1, out.size(), 'one response expected');
        String json = out[0].json;
        System.assert(String.isNotBlank(json), 'payload should not be blank');
        System.assert(json.contains('"items"'), 'payload should carry items');
        System.assert(json.contains('Won'), 'feed should include a won event');
    }
}