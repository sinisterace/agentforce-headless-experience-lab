@isTest
private class EcwPerformanceMatrixTest {
    @isTest static void returnsPayload() {
        EcwPerformanceMatrix.Request req = new EcwPerformanceMatrix.Request(); req.details = '';
        List<EcwPerformanceMatrix.Response> out = EcwPerformanceMatrix.run(new List<EcwPerformanceMatrix.Request>{ req });
        System.assertEquals(1, out.size());
        String payload = out[0].json;
        System.assert(String.isNotBlank(payload));
        System.assertNotEquals(null, JSON.deserializeUntyped(payload));
    }
    @isTest static void wrapper() {
        System.assertEquals('x', new EcwPerformanceMatrixData('x').ecwPerformanceMatrixJSON);
        System.assertEquals('', new EcwPerformanceMatrixData().ecwPerformanceMatrixJSON);
    }
}