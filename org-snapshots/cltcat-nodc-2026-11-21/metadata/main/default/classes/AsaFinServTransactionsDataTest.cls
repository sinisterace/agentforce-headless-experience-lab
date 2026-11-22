/**
 * @description Coverage for AsaFinServTransactionsData — verifies the default
 * constructor yields an empty JSON string and the JSON constructor round-trips
 * its value unchanged.
 */
@IsTest
private class AsaFinServTransactionsDataTest {

    @IsTest
    static void defaultConstructorYieldsEmptyJson() {
        AsaFinServTransactionsData dto = new AsaFinServTransactionsData();
        System.assertEquals('', dto.finServTransactionsJSON, 'Default constructor should yield empty string');
    }

    @IsTest
    static void jsonConstructorRoundTripsValue() {
        String payload = '{"title":"Your recent transactions","transactions":[{"id":"txn-1","merchant":"Whole Foods Market","date":"2026-08-09","amount":-84.23,"category":"Groceries","status":"Posted"}]}';
        AsaFinServTransactionsData dto = new AsaFinServTransactionsData(payload);
        System.assertEquals(payload, dto.finServTransactionsJSON, 'JSON constructor should round-trip the value');
    }
}