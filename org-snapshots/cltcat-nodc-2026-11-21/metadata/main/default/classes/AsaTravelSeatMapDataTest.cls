/**
 * @description Coverage for AsaTravelSeatMapData (the CLT DTO for the
 * ASA Travel · Seat Map renderer).
 */
@isTest
private class AsaTravelSeatMapDataTest {
    @isTest
    static void constructsWithPayload() {
        String json = '{"seats":[{"id":"14A","row":14,"col":"A"}],"submitValue":"I would like to select this seat"}';
        AsaTravelSeatMapData dto = new AsaTravelSeatMapData(json);
        System.assertEquals(json, dto.travelSeatMapJSON, 'payload should round-trip');
    }

    @isTest
    static void constructsEmpty() {
        AsaTravelSeatMapData dto = new AsaTravelSeatMapData();
        System.assertEquals('', dto.travelSeatMapJSON, 'no-arg ctor defaults to empty string');
    }
}