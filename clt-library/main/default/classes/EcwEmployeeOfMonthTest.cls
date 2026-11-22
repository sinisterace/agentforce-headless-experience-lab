@IsTest
private class EcwEmployeeOfMonthTest {
    @IsTest
    static void returnsPayload() {
        EcwEmployeeOfMonth.Request req = new EcwEmployeeOfMonth.Request();
        req.details = '';
        List<EcwEmployeeOfMonth.Response> out = EcwEmployeeOfMonth.getEmployeeOfMonth(
            new List<EcwEmployeeOfMonth.Request>{ req }
        );
        System.assertEquals(1, out.size(), 'one response expected');
        String json = out[0].json;
        System.assert(String.isNotBlank(json), 'payload should not be blank');
        System.assert(json.contains('Lauren Bailey'), 'payload names Lauren Bailey');
        System.assert(json.contains('Chief Demo Officer'), 'title set');
        System.assert(json.contains('stats'), 'stats present');
        System.assert(json.contains('badges'), 'badges present');
        System.assert(json.contains('congratulated 4,000 times'), 'congratulate line present');

        // Exercise the DTO constructors.
        EcwEmployeeOfMonthData d = new EcwEmployeeOfMonthData(json);
        System.assertEquals(json, d.ecwEmployeeOfMonthJSON);
        System.assertEquals('', new EcwEmployeeOfMonthData().ecwEmployeeOfMonthJSON);
    }
}
