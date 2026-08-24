@IsTest
private class SiteBrandingServiceTest {

    /** Simulates the org's Tooling API: BrandingSet query, property query, and PATCHes. */
    private class ToolingMock implements HttpCalloutMock {
        Integer patchCount = 0;
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            String endpoint = req.getEndpoint();
            if (req.getMethod() == 'PATCH') {
                patchCount++;
                res.setStatusCode(204);
                res.setBody('');
                return res;
            }
            res.setStatusCode(200);
            if (endpoint.contains('BrandingSetProperty')) {
                res.setBody(JSON.serialize(new Map<String, Object>{
                    'records' => new List<Object>{
                        prop('p1', 'chatButton', '#2E2E2E'),
                        prop('p2', 'primaryButtonBackground', '#2E2E2E'),
                        prop('p3', 'inputFooterButton', '#2E2E2E'),
                        prop('p4', 'userMessageBackground', '#2E2E2E'),
                        prop('p5', 'agentMessageLink', '#0469C1'),
                        prop('p6', 'primaryButtonText', '#FFFFFF'),
                        prop('p7', 'userMessageText', '#FFFFFF'),
                        prop('p8', 'userMessageLink', '#FFFFFF'),
                        prop('p9', 'logoImage', ''),
                        prop('p10', 'fabImage', ''),
                        prop('p11', 'avatarImage', ''),
                        prop('p12', 'headerBackground', '#FFFFFF')
                    }
                }));
            } else {
                res.setBody(JSON.serialize(new Map<String, Object>{
                    'records' => new List<Object>{
                        new Map<String, Object>{ 'Id' => '0LwgL000001XMsPSAW' }
                    }
                }));
            }
            return res;
        }
        Map<String, Object> prop(String id, String name, String value) {
            return new Map<String, Object>{
                'Id' => id, 'PropertyName' => name, 'PropertyValue' => value
            };
        }
    }

    @IsTest
    static void appliesAccentAndLogoToWidget() {
        Test.setMock(HttpCalloutMock.class, new ToolingMock());
        Test.startTest();
        SiteBrandingService.BrandingResult r =
            SiteBrandingService.applyBranding('#0f766e', 'https://logo.clearbit.com/acme.com');
        Test.stopTest();

        System.assertEquals('0LwgL000001XMsPSAW', r.brandingSetId);
        System.assertEquals('#0F766E', r.accentColor, 'normalized to uppercase #hex');
        System.assertEquals(true, r.logoApplied);
        // 5 accent + 3 logo changed; the 3 on-accent text tokens are already #FFFFFF (dark
        // accent -> white text) so they're skipped as already-correct. headerBackground untouched.
        System.assertEquals(8, r.propertiesUpdated);
    }

    @IsTest
    static void skipsLogoTokensWhenNoLogo() {
        Test.setMock(HttpCalloutMock.class, new ToolingMock());
        Test.startTest();
        SiteBrandingService.BrandingResult r = SiteBrandingService.applyBranding('#4f46e5', null);
        Test.stopTest();
        // 5 accent changed; on-accent text already #FFFFFF (skipped); no logo tokens.
        System.assertEquals(5, r.propertiesUpdated);
        System.assertEquals(false, r.logoApplied);
    }

    /** Returns an empty record set for any query -> BrandingSet not found. */
    private class EmptyMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody(JSON.serialize(new Map<String, Object>{ 'records' => new List<Object>() }));
            return res;
        }
    }

    @IsTest
    static void missingBrandingSetThrows() {
        Test.setMock(HttpCalloutMock.class, new EmptyMock());
        Test.startTest();
        try {
            SiteBrandingService.applyBranding('#123456', null);
            System.assert(false, 'expected BrandingException');
        } catch (SiteBrandingService.BrandingException e) {
            System.assert(e.getMessage().contains('BrandingSet not found'));
        }
        Test.stopTest();
    }

    @IsTest
    static void buildBrandingValuesMapsTokens() {
        Map<String, String> v = SiteBrandingService.buildBrandingValues('0f766e', 'https://x/logo.png');
        System.assertEquals('#0F766E', v.get('chatButton'), 'accent applied + normalized');
        System.assertEquals('#0F766E', v.get('userMessageBackground'));
        System.assertEquals('#FFFFFF', v.get('userMessageText'), 'white text on dark teal');
        System.assertEquals('https://x/logo.png', v.get('logoImage'));
        System.assert(!v.containsKey('headerBackground'), 'header not touched');

        Map<String, String> noLogo = SiteBrandingService.buildBrandingValues('#ffffff', '');
        System.assert(!noLogo.containsKey('logoImage'), 'no logo -> no logo tokens');
        System.assertEquals('#181818', noLogo.get('userMessageText'), 'dark text on white accent');
    }

    @IsTest
    static void colorHelpers() {
        System.assertEquals('#0B5CAB', SiteBrandingService.normalizeHex(''), 'blank -> default');
        System.assertEquals('#0B5CAB', SiteBrandingService.normalizeHex('not-a-color'));
        System.assertEquals('#ABCDEF', SiteBrandingService.normalizeHex('abcdef'), '# prepended + upper');
        System.assertEquals('#FFFFFF', SiteBrandingService.contrastText('#0B5CAB'), 'dark bg -> white');
        System.assertEquals('#181818', SiteBrandingService.contrastText('#FFDD00'), 'bright bg -> dark');
    }
}
