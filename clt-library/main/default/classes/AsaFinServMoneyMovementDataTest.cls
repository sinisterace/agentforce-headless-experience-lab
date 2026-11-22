/**
 * @description Coverage for AsaFinServMoneyMovementData — verifies the default
 * constructor yields an empty JSON string and the JSON constructor round-trips
 * its value unchanged.
 */
@IsTest
private class AsaFinServMoneyMovementDataTest {

    @IsTest
    static void defaultConstructorYieldsEmptyJson() {
        AsaFinServMoneyMovementData dto = new AsaFinServMoneyMovementData();
        System.assertEquals('', dto.finServMoneyMovementJSON, 'Default constructor should yield empty string');
    }

    @IsTest
    static void jsonConstructorRoundTripsValue() {
        String payload = '{"title":"Send money","fromAccount":{"label":"Everyday Checking","mask":"1234"},"recipients":[{"id":"rcp-1","name":"Alex Rivera","type":"person","mask":"4821"}],"amountPresets":[{"id":"amt-1","label":"$50","amount":50}]}';
        AsaFinServMoneyMovementData dto = new AsaFinServMoneyMovementData(payload);
        System.assertEquals(payload, dto.finServMoneyMovementJSON, 'JSON constructor should round-trip the value');
    }
}
