@IsTest
private class EcwChangeCalendarTest {
    @IsTest
    static void returnsChanges() {
        List<EcwChangeCalendar.Response> out = EcwChangeCalendar.getChangeCalendar(
            new List<EcwChangeCalendar.Request>{ new EcwChangeCalendar.Request() });
        System.assertEquals(1, out.size());
        System.assert(out[0].json.contains('"changes"'), 'payload should carry changes');
    }
}
