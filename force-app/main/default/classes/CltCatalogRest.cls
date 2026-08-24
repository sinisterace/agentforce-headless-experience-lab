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

    global class DeployResponse {
        public String knowledgeId;      // the Company_Knowledge__c record grounding the agent
        public String companyName;
        public Integer faqCount;        // number of Q&A pairs in the generated FAQ
        public Boolean faqIsFallback;   // true if the model was unavailable and we used the deterministic FAQ
        public Boolean brandingUpdated; // true if the widget was re-skinned
        public String brandingNote;     // populated when branding could not be applied (non-fatal)
        public String siteUrl;          // the personalized Experience site to open (once published)
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
            } else if (path == 'deployagent') {
                handleDeployAgent(res, body);
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

    /**
     * Deploy the FAQ Service Agent for this company: generate the grounding FAQ, re-skin the
     * chat widget, and write the record the agent answers from. All callouts (FAQ model +
     * branding Tooling PATCH) run BEFORE any DML, or Apex throws "uncommitted work pending".
     * Branding failure is non-fatal — grounding is the critical part.
     */
    private static void handleDeployAgent(RestResponse res, Map<String, Object> body) {
        String companyName = str(body.get('companyName'));
        String website = str(body.get('website'));
        String industryKey = ConsultationCatalogService.resolveIndustryKey(str(body.get('industryKey')));
        if (String.isBlank(companyName) && String.isBlank(website)) {
            throw new BadRequestException('Provide at least a company name or website.');
        }

        // Reconstruct the profile from the prior scan (the client already has these fields).
        ConsultationProfileService.Profile p = new ConsultationProfileService.Profile();
        p.companyName = companyName;
        p.website = website;
        p.industryKey = industryKey;
        p.industryLabel = ConsultationCatalogService.labelFor(industryKey);
        p.summary = str(body.get('summary'));
        p.planNarrative = str(body.get('planNarrative'));
        p.accentColor = str(body.get('accentColor'));
        p.logoUrl = str(body.get('logoUrl'));

        // --- 1. Generate the FAQ (Models API callout) ---
        AgentFaqContentService.FaqDocument doc = AgentFaqContentService.generate(p);

        // Page branding is data-driven: the accent/logo are stored on the record below and the
        // Experience site's companyBrandHero LWC reads them at render time (no callout, no
        // Named Credential). The chat widget keeps its default colors inside the branded page.

        // --- 2. Persist the grounding + brand record (DML AFTER all callouts) ---
        List<Company_Knowledge__c> current = [
            SELECT Id FROM Company_Knowledge__c WHERE Is_Active__c = true WITH USER_MODE
        ];
        for (Company_Knowledge__c k : current) {
            k.Is_Active__c = false;
        }
        if (!current.isEmpty()) {
            update as user current;
        }
        Object signalsObj = body.get('signals');
        String signalsJson = (signalsObj != null) ? clip(JSON.serialize(signalsObj), 2000) : null;

        Company_Knowledge__c rec = new Company_Knowledge__c(
            Name = clip(String.isBlank(companyName) ? 'Company FAQ' : companyName, 80),
            Company_Name__c = clip(companyName, 255),
            Website__c = website,
            Accent_Color__c = clip(p.accentColor, 9),
            Logo_Url__c = p.logoUrl,
            Summary__c = clip(p.summary, 2000),
            Signals_JSON__c = signalsJson,
            Faq_Content__c = clip(doc.body, 131072),
            Faq_Json__c = clip(doc.faqsJson, 131072),
            Is_Active__c = true
        );
        insert as user rec;

        DeployResponse out = new DeployResponse();
        out.knowledgeId = rec.Id;
        out.companyName = doc.title;
        out.faqCount = doc.faqCount;
        out.faqIsFallback = doc.isFallback;
        out.brandingUpdated = true;   // page branding is data-driven (companyBrandHero reads the record)
        out.brandingNote = null;
        out.siteUrl = personalizedSiteUrl();
        write(res, 200, out);
    }

    /** URL prefix of the personalized Experience site (Option B) hosting the branded page + chat. */
    private static final String PERSONALIZED_SITE_PREFIX = 'agentforceservice';

    /**
     * Best-effort public URL of the personalized Experience site. Enhanced-domain orgs serve
     * Experience sites at <mydomain>.my.site.com/<prefix>. Returns null if it can't be derived;
     * the site must be published (one-time) before the URL resolves.
     */
    private static String personalizedSiteUrl() {
        try {
            String host = new Url(URL.getOrgDomainUrl().toExternalForm()).getHost();
            String base = host.replace('.my.salesforce.com', '.my.site.com');
            return 'https://' + base + '/' + PERSONALIZED_SITE_PREFIX;
        } catch (Exception e) {
            return null;
        }
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
