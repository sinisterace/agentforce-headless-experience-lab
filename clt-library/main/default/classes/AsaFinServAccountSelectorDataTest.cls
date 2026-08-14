/**
 * @description Coverage for AsaFinServAccountSelectorData — verifies the default
 * constructor yields an empty JSON string and the JSON constructor round-trips
 * its value unchanged.
 */
@IsTest
private class AsaFinServAccountSelectorDataTest {

    @IsTest
    static void defaultConstructorYieldsEmptyJson() {
        AsaFinServAccountSelectorData dto = new AsaFinServAccountSelectorData();
        System.assertEquals('', dto.finServAccountSelectorJSON, 'Default constructor should yield empty string');
    }

    @IsTest
    static void jsonConstructorRoundTripsValue() {
        String payload = '{"mode":"single","accounts":[{"id":"chk-1","name":"Everyday Checking","type":"Checking","mask":"1234","balance":100.50}]}';
        AsaFinServAccountSelectorData dto = new AsaFinServAccountSelectorData(payload);
        System.assertEquals(payload, dto.finServAccountSelectorJSON, 'JSON constructor should round-trip the value');
    }
}
