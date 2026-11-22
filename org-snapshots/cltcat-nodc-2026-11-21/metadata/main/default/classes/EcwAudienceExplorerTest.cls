@isTest
private class EcwAudienceExplorerTest {
    @isTest static void returnsPayload() {
        EcwAudienceExplorer.Request req = new EcwAudienceExplorer.Request(); req.details = '';
        List<EcwAudienceExplorer.Response> out = EcwAudienceExplorer.run(new List<EcwAudienceExplorer.Request>{ req });
        System.assertEquals(1, out.size());
        String payload = out[0].json;
        System.assert(String.isNotBlank(payload));
        System.assertNotEquals(null, JSON.deserializeUntyped(payload));
    }
    @isTest static void wrapper() {
        System.assertEquals('x', new EcwAudienceExplorerData('x').ecwAudienceExplorerJSON);
        System.assertEquals('', new EcwAudienceExplorerData().ecwAudienceExplorerJSON);
    }
}