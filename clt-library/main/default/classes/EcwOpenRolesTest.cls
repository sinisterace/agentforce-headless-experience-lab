@IsTest
private class EcwOpenRolesTest {
    @IsTest
    static void returnsPayload() {
        List<EcwOpenRoles.Response> out = EcwOpenRoles.getOpenRoles(new List<EcwOpenRoles.Request>{ new EcwOpenRoles.Request() });
        System.assertEquals(1, out.size());
        System.assert(String.isNotBlank(out[0].json), 'payload should not be blank');
        System.assert(out[0].json.contains('"roles"'), 'payload should carry "roles"');
    }
}
