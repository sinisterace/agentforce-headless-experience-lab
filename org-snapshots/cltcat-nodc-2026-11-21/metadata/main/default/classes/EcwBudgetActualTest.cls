@IsTest
private class EcwBudgetActualTest {
    @IsTest
    static void returnsPayload() {
        List<EcwBudgetActual.Response> out = EcwBudgetActual.getBudgetActual(new List<EcwBudgetActual.Request>{ new EcwBudgetActual.Request() });
        System.assertEquals(1, out.size());
        System.assert(String.isNotBlank(out[0].json), 'payload should not be blank');
        System.assert(out[0].json.contains('"lines"'), 'payload should carry "lines"');
    }
}