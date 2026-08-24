/**
 * @description Phase 3 of the "deploy an FAQ Service Agent" flow. Re-skins the embedded
 * Agentforce messaging widget (Messaging for Web) to the customer's brand at RUNTIME.
 *
 * Verified in this org (2026-08-20): the widget's colors live in a `BrandingSet` of type
 * `es-messaging` (DeveloperName `EmbeddedServiceConfig_BrandingSet_1a015bd09eb`, referenced by
 * EmbeddedServiceConfig `Help_Agent_1_G`). Editing its `BrandingSetProperty` rows via the
 * Tooling API takes effect immediately — NO site publish required. `ConnectApi` has no
 * branding writer, so this is a Tooling REST self-callout via a Named Credential.
 *
 * The color→token mapping is pure and unit-tested; the callout is isolated so tests mock it.
 */
public with sharing class SiteBrandingService {

    /** DeveloperName of the es-messaging BrandingSet backing the Help_Agent_1_G widget. */
    @TestVisible
    private static final String BRANDING_SET_DEVELOPER_NAME =
        'EmbeddedServiceConfig_BrandingSet_1a015bd09eb';

    private static final String API_VERSION = 'v67.0';

    /**
     * Same-org callout auth. Verified 2026-08-20: a synchronous Apex self-callout using the
     * running user's session (`UserInfo.getSessionId()`) reaches the Tooling API (GET 200,
     * PATCH 204) with only a RemoteSiteSetting for the org's My Domain — NO Named Credential,
     * so nothing secret to clone. Requires "API Enabled" + "Customize Application" (admin
     * default) and a synchronous context (async getSessionId lacks API scope).
     */
    private static String baseUrl() {
        return URL.getOrgDomainUrl().toExternalForm();
    }

    private static void authorize(HttpRequest req) {
        req.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionId());
    }

    /** Brand tokens that should take the accent color. */
    private static final Set<String> ACCENT_TOKENS = new Set<String>{
        'chatButton', 'primaryButtonBackground', 'inputFooterButton',
        'userMessageBackground', 'agentMessageLink'
    };
    /** Tokens that must contrast against the accent (text/links that sit on accent). */
    private static final Set<String> ON_ACCENT_TOKENS = new Set<String>{
        'primaryButtonText', 'userMessageText', 'userMessageLink'
    };
    /** Image tokens set to the customer's logo when one is available. */
    private static final Set<String> LOGO_TOKENS = new Set<String>{
        'logoImage', 'fabImage', 'avatarImage'
    };

    public class BrandingResult {
        public String brandingSetId;
        public Integer propertiesUpdated;
        public String accentColor;
        public Boolean logoApplied;
    }

    public class BrandingException extends Exception {}

    /**
     * Compute the target {propertyName -> value} map for the given brand. Pure — no callouts.
     * @param accentColor #RRGGBB (falls back to a safe default if blank/invalid)
     * @param logoUrl     absolute image URL, or blank to leave logos untouched
     */
    @TestVisible
    private static Map<String, String> buildBrandingValues(String accentColor, String logoUrl) {
        String accent = normalizeHex(accentColor);
        String onAccent = contrastText(accent);
        Map<String, String> values = new Map<String, String>();
        for (String t : ACCENT_TOKENS) {
            values.put(t, accent);
        }
        for (String t : ON_ACCENT_TOKENS) {
            values.put(t, onAccent);
        }
        if (String.isNotBlank(logoUrl)) {
            for (String t : LOGO_TOKENS) {
                values.put(t, logoUrl.trim());
            }
        }
        return values;
    }

    /**
     * Apply the customer's brand to the widget. Resolves the BrandingSet + its properties via
     * Tooling API, then PATCHes each changed property. Returns a summary.
     */
    public static BrandingResult applyBranding(String accentColor, String logoUrl) {
        Map<String, String> target = buildBrandingValues(accentColor, logoUrl);

        String brandingSetId = queryBrandingSetId();
        if (String.isBlank(brandingSetId)) {
            throw new BrandingException('BrandingSet not found: ' + BRANDING_SET_DEVELOPER_NAME);
        }
        Map<String, Property> current = queryProperties(brandingSetId);

        Integer updated = 0;
        for (String name : target.keySet()) {
            Property p = current.get(name);
            String desired = target.get(name);
            if (p == null || p.value == desired) {
                continue; // property not present on this set, or already correct
            }
            patchProperty(p.id, desired);
            updated++;
        }

        BrandingResult res = new BrandingResult();
        res.brandingSetId = brandingSetId;
        res.propertiesUpdated = updated;
        res.accentColor = normalizeHex(accentColor);
        res.logoApplied = String.isNotBlank(logoUrl);
        return res;
    }

    // ---------------------------------------------------------------------
    // Tooling API calls (isolated for mocking)
    // ---------------------------------------------------------------------
    @TestVisible
    private class Property {
        String id;
        String name;
        String value;
    }

    private static String queryBrandingSetId() {
        String soql = 'SELECT Id FROM BrandingSet WHERE DeveloperName = \''
            + String.escapeSingleQuotes(BRANDING_SET_DEVELOPER_NAME) + '\'';
        Map<String, Object> body = toolingQuery(soql);
        List<Object> records = (List<Object>) body.get('records');
        if (records == null || records.isEmpty()) {
            return null;
        }
        return (String) ((Map<String, Object>) records[0]).get('Id');
    }

    private static Map<String, Property> queryProperties(String brandingSetId) {
        String soql = 'SELECT Id, PropertyName, PropertyValue FROM BrandingSetProperty '
            + 'WHERE BrandingSetId = \'' + String.escapeSingleQuotes(brandingSetId) + '\'';
        Map<String, Object> body = toolingQuery(soql);
        Map<String, Property> out = new Map<String, Property>();
        List<Object> records = (List<Object>) body.get('records');
        if (records == null) {
            return out;
        }
        for (Object o : records) {
            Map<String, Object> r = (Map<String, Object>) o;
            Property p = new Property();
            p.id = (String) r.get('Id');
            p.name = (String) r.get('PropertyName');
            p.value = r.get('PropertyValue') == null ? null : String.valueOf(r.get('PropertyValue'));
            if (p.name != null) {
                out.put(p.name, p);
            }
        }
        return out;
    }

    private static Map<String, Object> toolingQuery(String soql) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(baseUrl() + '/services/data/' + API_VERSION
            + '/tooling/query/?q=' + EncodingUtil.urlEncode(soql, 'UTF-8'));
        req.setMethod('GET');
        authorize(req);
        HttpResponse resp = new Http().send(req);
        if (resp.getStatusCode() != 200) {
            throw new BrandingException('Tooling query failed (' + resp.getStatusCode()
                + '): ' + resp.getBody());
        }
        return (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
    }

    private static void patchProperty(String propertyId, String value) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(baseUrl() + '/services/data/' + API_VERSION
            + '/tooling/sobjects/BrandingSetProperty/' + propertyId);
        req.setMethod('PATCH');
        authorize(req);
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(new Map<String, Object>{ 'PropertyValue' => value }));
        HttpResponse resp = new Http().send(req);
        // Tooling PATCH returns 204 on success.
        if (resp.getStatusCode() != 204 && resp.getStatusCode() != 200) {
            throw new BrandingException('Tooling PATCH failed (' + resp.getStatusCode()
                + ') for ' + propertyId + ': ' + resp.getBody());
        }
    }

    // ---------------------------------------------------------------------
    // Color helpers (pure)
    // ---------------------------------------------------------------------
    @TestVisible
    private static String normalizeHex(String s) {
        if (String.isBlank(s)) {
            return '#0B5CAB';
        }
        String t = s.trim();
        if (!t.startsWith('#')) {
            t = '#' + t;
        }
        if (Pattern.matches('^#[0-9a-fA-F]{6}$', t)) {
            return t.toUpperCase();
        }
        return '#0B5CAB';
    }

    /** Return #FFFFFF or #181818 for readable text on the given background hex. */
    @TestVisible
    private static String contrastText(String hex) {
        String h = normalizeHex(hex).substring(1);
        Integer r = parseHex(h.substring(0, 2));
        Integer g = parseHex(h.substring(2, 4));
        Integer b = parseHex(h.substring(4, 6));
        // Perceived luminance (0-255). Bright backgrounds get dark text.
        Decimal lum = (0.299 * r) + (0.587 * g) + (0.114 * b);
        return lum > 150 ? '#181818' : '#FFFFFF';
    }

    private static Integer parseHex(String pair) {
        Integer val = 0;
        for (Integer i = 0; i < pair.length(); i++) {
            String c = pair.substring(i, i + 1).toLowerCase();
            Integer d = '0123456789abcdef'.indexOf(c);
            val = (val * 16) + (d < 0 ? 0 : d);
        }
        return val;
    }
}
