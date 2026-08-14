/**
 * @description REST facade for the CLT Catalogue React app. The bundle domain
 * can only reach server logic through Apex REST + sdk.fetch (CSRF auto-handled),
 * so all custom read/write logic funnels through here.
 *
 * Routes (urlMapping '/cltcat/*'):
 *   GET  /cltcat/catalog            -> industries + per-industry CLT recommendations
 *   POST /cltcat/scan               -> AI company profile (never dead-ends)
 *   POST /cltcat/save               -> persist an Onboarding_Profile__c
 */
@RestResource(urlMapping='/cltcat/*')
global with sharing class CltCatalogRest {

    // ---- response envelopes ----
    global class CatalogResponse {
        public List<ConsultationCatalogService.IndustryOption> industries;
        public Map<String, List<ConsultationCatalogService.Recommendation>> recommendationsByIndustry;
    }

    global class ScanResponse {
        public ConsultationProfileService.Profile profile;
        public List<ConsultationCatalogService.Recommendation> recommendations;
    }

    global class SaveResponse {
        public String id;
        public String status;
    }

    global class ErrorResponse {
        public String message;
        public ErrorResponse(String m) { this.message = m; }
    }

    // ---- GET ----
    @HttpGet
    global static void doGet() {
        RestResponse res = RestContext.response;
        res.addHeader('Content-Type', 'application/json');
        String path = endpoint();
        try {
            if (path == 'catalog') {
                CatalogResponse out = new CatalogResponse();
                out.industries = ConsultationCatalogService.industriesWithLabels();
                out.recommendationsByIndustry = new Map<String, List<ConsultationCatalogService.Recommendation>>();
                for (ConsultationCatalogService.IndustryOption io : out.industries) {
                    out.recommendationsByIndustry.put(io.key, ConsultationCatalogService.recommendationsFor(io.key));
                }
                write(res, 200, out);
            } else {
                write(res, 404, new ErrorResponse('Unknown GET endpoint: ' + path));
            }
        } catch (Exception e) {
            write(res, 500, new ErrorResponse(e.getMessage()));
        }
    }

    // ---- POST ----
    @HttpPost
    global static void doPost() {
        RestResponse res = RestContext.response;
        res.addHeader('Content-Type', 'application/json');
        String path = endpoint();
        try {
            Map<String, Object> body = parseBody();
            if (path == 'scan') {
                handleScan(res, body);
            } else if (path == 'save') {
                handleSave(res, body);
            } else {
                write(res, 404, new ErrorResponse('Unknown POST endpoint: ' + path));
            }
        } catch (BadRequestException bre) {
            write(res, 400, new ErrorResponse(bre.getMessage()));
        } catch (Exception e) {
            write(res, 500, new ErrorResponse(e.getMessage()));
        }
    }

    // ---- handlers ----
    private static void handleScan(RestResponse res, Map<String, Object> body) {
        String companyName = str(body.get('companyName'));
        String website = str(body.get('website'));
        String industryHint = str(body.get('industry'));
        if (String.isBlank(companyName) && String.isBlank(website)) {
            throw new BadRequestException('Provide at least a company name or website.');
        }
        ConsultationProfileService.Profile profile =
            ConsultationProfileService.scan(companyName, website, industryHint);
        ScanResponse out = new ScanResponse();
        out.profile = profile;
        out.recommendations = ConsultationCatalogService.recommendationsFor(profile.industryKey);
        write(res, 200, out);
    }

    private static void handleSave(RestResponse res, Map<String, Object> body) {
        Onboarding_Profile__c rec = new Onboarding_Profile__c();
        rec.First_Name__c = clip(str(body.get('firstName')), 80);
        rec.Last_Name__c = clip(str(body.get('lastName')), 80);
        rec.Email__c = clip(str(body.get('email')), 255);
        rec.Company_Name__c = clip(str(body.get('companyName')), 255);
        rec.Website__c = str(body.get('website'));
        rec.Industry_Key__c = ConsultationCatalogService.resolveIndustryKey(str(body.get('industryKey')));
        rec.Company_Summary__c = str(body.get('summary'));
        rec.Plan_Narrative__c = str(body.get('planNarrative'));
        rec.Accent_Color__c = clip(str(body.get('accentColor')), 9);
        rec.Logo_Url__c = str(body.get('logoUrl'));
        rec.Source__c = normalizeSource(str(body.get('source')));
        rec.Status__c = 'saved';
        Object conf = body.get('confidence');
        if (conf != null) {
            try { rec.Industry_Confidence__c = Decimal.valueOf(String.valueOf(conf)); } catch (Exception e) {}
        }
        Object signals = body.get('signals');
        if (signals != null) {
            rec.Signals_JSON__c = clip(JSON.serialize(signals), 32768);
        }
        insert as user rec;
        SaveResponse out = new SaveResponse();
        out.id = rec.Id;
        out.status = rec.Status__c;
        write(res, 200, out);
    }

    // ---- helpers ----
    private static String endpoint() {
        String uri = RestContext.request.requestURI;
        if (String.isBlank(uri)) return '';
        List<String> parts = uri.split('/');
        return parts.isEmpty() ? '' : parts[parts.size() - 1].toLowerCase();
    }

    private static Map<String, Object> parseBody() {
        RestRequest req = RestContext.request;
        if (req.requestBody == null || req.requestBody.size() == 0) {
            return new Map<String, Object>();
        }
        try {
            return (Map<String, Object>) JSON.deserializeUntyped(req.requestBody.toString());
        } catch (Exception e) {
            throw new BadRequestException('Request body must be a JSON object.');
        }
    }

    private static String normalizeSource(String s) {
        return (s == 'fallback') ? 'fallback' : 'website';
    }

    private static String str(Object o) {
        return o == null ? null : String.valueOf(o);
    }

    private static String clip(String s, Integer max) {
        if (s == null) return null;
        return s.length() > max ? s.substring(0, max) : s;
    }

    private static void write(RestResponse res, Integer status, Object payload) {
        res.statusCode = status;
        res.responseBody = Blob.valueOf(JSON.serialize(payload));
    }

    global class BadRequestException extends Exception {}
}
