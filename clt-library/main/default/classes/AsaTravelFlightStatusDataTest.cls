/**
 * @description Coverage for AsaTravelFlightStatusData (the CLT DTO for the
 * ASA Travel · Flight Status Tracker renderer).
 */
@isTest
private class AsaTravelFlightStatusDataTest {
    @isTest
    static void constructsWithPayload() {
        String json = '{"title":"Flight AF128","status":"in_air","origin":{"code":"SFO"},"dest":{"code":"JFK"}}';
        AsaTravelFlightStatusData dto = new AsaTravelFlightStatusData(json);
        System.assertEquals(json, dto.travelFlightStatusJSON, 'payload should round-trip');
    }

    @isTest
    static void constructsEmpty() {
        AsaTravelFlightStatusData dto = new AsaTravelFlightStatusData();
        System.assertEquals('', dto.travelFlightStatusJSON, 'no-arg ctor defaults to empty string');
    }
}
