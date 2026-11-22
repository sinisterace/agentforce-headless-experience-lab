/**
 * @description Coverage for AsaTravelRoomSelectorData (the CLT DTO for the
 * ASA Travel · Room Selector renderer).
 */
@isTest
private class AsaTravelRoomSelectorDataTest {
    @isTest
    static void constructsWithPayload() {
        String json = '{"title":"Choose your room","rooms":[{"id":"r1","name":"Ocean View King","price":389}]}';
        AsaTravelRoomSelectorData dto = new AsaTravelRoomSelectorData(json);
        System.assertEquals(json, dto.travelRoomSelectorJSON, 'payload should round-trip');
    }

    @isTest
    static void constructsEmpty() {
        AsaTravelRoomSelectorData dto = new AsaTravelRoomSelectorData();
        System.assertEquals('', dto.travelRoomSelectorJSON, 'no-arg ctor defaults to empty string');
    }
}