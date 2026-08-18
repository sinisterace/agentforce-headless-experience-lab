/**
 * @description Single LLM seam for the CLT Catalogue app. Produces a company Profile
 * (industry + narrative) from a company name + website. Three tiers, tried in order,
 * so the caller NEVER dead-ends:
 *   1. Prompt template "CLTCat_Company_Profile" + web retriever  (primary)
 *   2. aiplatform.ModelsAPI knowledge-only generation            (fallback A)
 *   3. Deterministic fallback profile                            (fallback B)
 *
 * The model is NEVER trusted: every field is re-validated/clamped, the industry key is
 * resolved against the canonical vocabulary, and retrieved web content is treated as
 * untrusted. AI does not pick CLTs — that is a deterministic lookup elsewhere.
 */
public with sharing class ConsultationProfileService {

    private static final String PROMPT_TEMPLATE_API_NAME = 'CLTCat_Company_Profile';
    private static final String MODELS_API_MODEL = 'sfdc_ai__DefaultOpenAIGPT4OmniMini';

    /** Result DTO. Confidence is stored but never rendered by the UI. */
    public class Profile {
        public String companyName;
        public String website;
        public String industryKey;
        public String industryLabel;
        public Decimal confidence;
        public String summary;
        public String planNarrative;
        public String accentColor;
        public String logoUrl;
        public List<String> signals;
        public List<PlanSection> plan;
        public String source; // 'website' | 'fallback'
    }

    /**
     * One section of the guided consultation plan. Two layers:
     *   - CURATED (title, body): expert-authored CLT/adoption content that is ALWAYS
     *     present and always accurate — the spine a Salesforce employee walks the
     *     customer through. Never AI-generated, never blank.
     *   - ENRICHED (personalized): a company-specific paragraph the model layers on top
     *     when the website scan succeeds. Optional; null when there's no site context.
     */
    public class PlanSection {
        public String key;
        public String title;
        public String body;          // curated
        public String personalized;  // AI enrichment, nullable
        public PlanSection() {}
        public PlanSection(String key, String title, String body) {
            this.key = key;
            this.title = title;
            this.body = body;
            this.personalized = null;
        }
    }

    /** Section keys — MUST match the enrichment keys requested in the prompts. */
    private static final List<String> SECTION_KEYS = new List<String>{
        'what', 'adoption', 'vs_text', 'recommended', 'how_fits', 'getting_started'
    };
    private static final Integer MAX_ENRICHMENT_CHARS = 400;

    @TestVisible
    private static String testCannedJson;

    /**
     * Produce a Profile for the given company. Public entry point.
     * @param companyName required-ish; blank tolerated
     * @param website     company website (used by the retriever + logo/accent derivation)
     * @param industryHint optional user-provided industry key
     */
    public static Profile scan(String companyName, String website, String industryHint) {
        Profile p;
        // Tier 1: prompt template + retriever
        try {
            String raw = (Test.isRunningTest())
                ? testCannedJson
                : callPromptTemplate(companyName, website, industryHint);
            p = parseAndNormalize(raw, companyName, website);
            if (p != null) {
                p.source = 'website';
                return p;
            }
        } catch (Exception e) {
            System.debug('Tier1 (prompt template) failed: ' + e.getMessage());
        }

        // Tier 2: Models API knowledge-only
        if (!Test.isRunningTest()) {
            try {
                String raw = callModelsApi(companyName, website, industryHint);
                p = parseAndNormalize(raw, companyName, website);
                if (p != null) {
                    p.source = 'website';
                    return p;
                }
            } catch (Exception e) {
                System.debug('Tier2 (Models API) failed: ' + e.getMessage());
            }
        }

        // Tier 3: deterministic fallback — never throws
        return fallbackProfile(companyName, website, industryHint);
    }

    // ---------------------------------------------------------------------
    // Tier 1: Prompt template + web retriever
    // ---------------------------------------------------------------------
    private static String callPromptTemplate(String companyName, String website, String industryHint) {
        ConnectApi.EinsteinPromptTemplateGenerationsInput input =
            new ConnectApi.EinsteinPromptTemplateGenerationsInput();
        input.isPreview = false;
        input.additionalConfig = new ConnectApi.EinsteinLlmAdditionalConfigInput();
        input.additionalConfig.applicationName = 'PromptBuilderPreview';

        Map<String, ConnectApi.WrappedValue> params = new Map<String, ConnectApi.WrappedValue>();
        params.put('Input:CompanyName', wrap(companyName));
        params.put('Input:Website', wrap(website));
        params.put('Input:IndustryHint', wrap(String.isBlank(industryHint) ? '' : industryHint));
        params.put('Input:IndustryOptions', wrap(ConsultationCatalogService.industryKeyOptions()));
        input.inputParams = params;

        ConnectApi.EinsteinPromptTemplateGenerationsRepresentation resp =
            ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate(PROMPT_TEMPLATE_API_NAME, input);

        if (resp != null && resp.generations != null && !resp.generations.isEmpty()) {
            return resp.generations[0].text;
        }
        return null;
    }

    @TestVisible
    private static ConnectApi.WrappedValue wrap(String v) {
        ConnectApi.WrappedValue w = new ConnectApi.WrappedValue();
        w.value = v == null ? '' : v;
        return w;
    }

    // ---------------------------------------------------------------------
    // Tier 2: Models API (knowledge-only, no retrieval)
    // ---------------------------------------------------------------------
    private static String callModelsApi(String companyName, String website, String industryHint) {
        String prompt = buildKnowledgeOnlyPrompt(companyName, website, industryHint);
        aiplatform.ModelsAPI api = new aiplatform.ModelsAPI();
        aiplatform.ModelsAPI.createGenerations_Request request =
            new aiplatform.ModelsAPI.createGenerations_Request();
        request.modelName = MODELS_API_MODEL;
        aiplatform.ModelsAPI_GenerationRequest g = new aiplatform.ModelsAPI_GenerationRequest();
        g.prompt = prompt;
        request.body = g;
        aiplatform.ModelsAPI.createGenerations_Response resp = api.createGenerations(request);
        if (resp != null && resp.Code200 != null && resp.Code200.generation != null) {
            return resp.Code200.generation.generatedText;
        }
        return null;
    }

    @TestVisible
    private static String buildKnowledgeOnlyPrompt(String companyName, String website, String industryHint) {
        String options = ConsultationCatalogService.industryKeyOptions();
        return
            'You are classifying a company for a customer-service catalogue. '
            + 'Company name: "' + safe(companyName) + '". Website: "' + safe(website) + '". '
            + (String.isBlank(industryHint) ? '' : ('User industry hint: "' + safe(industryHint) + '". '))
            + 'Choose EXACTLY ONE industryKey from this list: [' + options + ']. '
            + 'Return ONLY a single minified JSON object, no code fences, with keys: '
            + 'industryKey (one of the list), confidence (0-1 number), '
            + 'summary (2-3 sentence company summary), '
            + 'planNarrative (2-3 sentences on how AI service agents help this company), '
            + 'accentColor (this specific brand\'s ACTUAL primary color as a #RRGGBB hex. '
            + 'Infer it from the brand itself — its name, logo, and industry (for example a '
            + 'firm named "Sapling" or with a nature/eco identity skews green; a health brand '
            + 'may skew teal/green; a bank is blue ONLY if blue is truly its brand). Never '
            + 'default to a generic blue or house color; pick the color this brand really uses), '
            + 'signals (array of up to 4 short strings), '
            + 'planEnrichment (an object whose keys are section identifiers and whose values are '
            + 'ONE company-specific sentence each, grounded in what this company actually does. '
            + 'Use these keys: "what" (make the idea of an interactive service agent concrete for this company), '
            + '"adoption" (a self-service or drop-off angle specific to their customers), '
            + '"vs_text" (why a reusable governed UI helps them specifically), '
            + '"recommended" (tie the recommended experiences to their real services), '
            + '"how_fits" (a realistic example request their agent would handle), '
            + '"getting_started" (a concrete first experience to launch for them). '
            + 'Omit any key you cannot ground in real evidence — do NOT invent facts). '
            + 'Do not invent facts you are unsure of.';
    }

    private static String safe(String v) {
        return v == null ? '' : v.replace('"', '\'');
    }

    // ---------------------------------------------------------------------
    // Normalization — never trust the model
    // ---------------------------------------------------------------------
    @TestVisible
    private static Profile parseAndNormalize(String raw, String companyName, String website) {
        if (String.isBlank(raw)) {
            return null;
        }
        String cleaned = stripCodeFences(raw);
        Map<String, Object> m;
        try {
            m = (Map<String, Object>) JSON.deserializeUntyped(cleaned);
        } catch (Exception e) {
            return null;
        }
        if (m == null) {
            return null;
        }

        Profile p = new Profile();
        p.companyName = String.isBlank(companyName) ? asString(m.get('companyName')) : companyName;
        p.website = normalizeWebsite(website);
        p.industryKey = ConsultationCatalogService.resolveIndustryKey(asString(m.get('industryKey')));
        p.industryLabel = ConsultationCatalogService.labelFor(p.industryKey);
        p.confidence = clampConfidence(m.get('confidence'));
        p.summary = clip(asString(m.get('summary')), 1000);
        p.planNarrative = clip(asString(m.get('planNarrative')), 1000);
        p.accentColor = normalizeHex(asString(m.get('accentColor')));
        p.logoUrl = deriveLogoUrl(p.website);
        p.signals = normalizeSignals(m.get('signals'));
        p.plan = buildPlan(m.get('planEnrichment'), p);
        return p;
    }

    private static String stripCodeFences(String s) {
        String t = s.trim();
        if (t.startsWith('```')) {
            // remove leading ```json or ``` and trailing ```
            t = t.replaceFirst('^```[a-zA-Z]*\\s*', '');
            if (t.endsWith('```')) {
                t = t.substring(0, t.length() - 3);
            }
        }
        return t.trim();
    }

    private static String asString(Object o) {
        return o == null ? null : String.valueOf(o);
    }

    private static Decimal clampConfidence(Object o) {
        if (o == null) return 0.5;
        try {
            Decimal d = Decimal.valueOf(String.valueOf(o));
            if (d < 0) return 0;
            if (d > 1) return 1;
            return d.setScale(2, System.RoundingMode.HALF_UP);
        } catch (Exception e) {
            return 0.5;
        }
    }

    private static String clip(String s, Integer max) {
        if (s == null) return null;
        return s.length() > max ? s.substring(0, max) : s;
    }

    private static String normalizeHex(String s) {
        if (String.isBlank(s)) return '#0B5CAB';
        String t = s.trim();
        if (!t.startsWith('#')) t = '#' + t;
        if (Pattern.matches('^#[0-9a-fA-F]{6}$', t)) return t;
        return '#0B5CAB';
    }

    private static String normalizeWebsite(String website) {
        if (String.isBlank(website)) return null;
        String w = website.trim();
        if (!w.startsWith('http://') && !w.startsWith('https://')) {
            w = 'https://' + w;
        }
        return w;
    }

    private static String deriveLogoUrl(String website) {
        if (String.isBlank(website)) return null;
        try {
            String host = website.replaceFirst('^https?://', '').replaceFirst('/.*$', '');
            if (String.isBlank(host)) return null;
            return 'https://logo.clearbit.com/' + host;
        } catch (Exception e) {
            return null;
        }
    }

    @SuppressWarnings('PMD.ApexDoc')
    private static List<String> normalizeSignals(Object o) {
        List<String> out = new List<String>();
        if (o instanceof List<Object>) {
            for (Object item : (List<Object>) o) {
                if (item != null) {
                    String s = clip(String.valueOf(item), 120);
                    if (String.isNotBlank(s)) out.add(s);
                }
                if (out.size() >= 4) break;
            }
        }
        return out;
    }

    /**
     * Build the guided consultation plan: the curated CLT/adoption spine (always
     * present) merged with the model's per-section enrichment (when the site scan
     * gave us something). The spine is NEVER blank and never AI-generated, so a
     * Salesforce employee always has accurate material to walk through.
     *
     * @param enrichmentObj the model's "planEnrichment" value — expected to be a
     *   Map of sectionKey -> paragraph. Anything malformed is ignored.
     */
    @TestVisible
    private static List<PlanSection> buildPlan(Object enrichmentObj, Profile p) {
        Map<String, String> enrichment = normalizeEnrichment(enrichmentObj);
        List<PlanSection> plan = curatedPlan(p);
        for (PlanSection s : plan) {
            String extra = enrichment.get(s.key);
            if (String.isNotBlank(extra)) {
                s.personalized = extra;
            }
        }
        return plan;
    }

    /** Coerce the model's enrichment into a clean {sectionKey -> clamped paragraph} map. */
    @TestVisible
    private static Map<String, String> normalizeEnrichment(Object o) {
        Map<String, String> out = new Map<String, String>();
        if (o instanceof Map<String, Object>) {
            Map<String, Object> m = (Map<String, Object>) o;
            for (String key : SECTION_KEYS) {
                String v = clip(asString(m.get(key)), MAX_ENRICHMENT_CHARS);
                if (String.isNotBlank(v)) {
                    out.put(key, v.trim());
                }
            }
        }
        return out;
    }

    /**
     * The curated educational spine — expert-authored CLT / AI-adoption content.
     * Company/industry names are interpolated so it reads as "about you" even with
     * zero website context, but the substance is fixed and always accurate.
     */
    @TestVisible
    private static List<PlanSection> curatedPlan(Profile p) {
        String company = (p != null && String.isNotBlank(p.companyName)) ? p.companyName.trim() : 'your company';
        String industry = (p != null && String.isNotBlank(p.industryLabel)) ? p.industryLabel : 'customer service';
        String industryLower = industry.toLowerCase();

        List<PlanSection> plan = new List<PlanSection>();

        plan.add(new PlanSection(
            'what',
            'What we’re building together',
            'We’re turning ' + company + '’s AI service agent into an interactive experience — not a wall of chat text. '
            + 'Instead of describing an answer in a paragraph, the agent renders a tappable card the customer can act on directly: '
            + 'pick an option, confirm a time, choose an account, or select a product, right inside the conversation. '
            + 'Same agent, richer replies — and today we’ll pick one experience to start with.'
        ));

        plan.add(new PlanSection(
            'adoption',
            'Why this drives real adoption',
            'Adoption of AI agents lives or dies on the front-end experience. When customers can tap, select, and confirm, '
            + 'they self-serve far more than when they have to read and retype. Interactive cards reduce back-and-forth, cut '
            + 'drop-off mid-conversation, and make the agent feel like a capable part of ' + company + '’s brand rather than a chatbot. '
            + 'The easier the interface, the more of ' + industryLower + ' volume the agent can actually deflect.'
        ));

        plan.add(new PlanSection(
            'vs_text',
            'Why Custom Lightning Types, not plain text',
            'A Custom Lightning Type (CLT) is a reusable, governed UI component the agent can return as a structured response. '
            + 'Unlike free-text answers, a CLT renders natively in Enhanced Chat with no channel-specific front-end code, is '
            + 'consistent every time, and is centrally managed so the experience stays on-brand and on-policy. You build the '
            + 'experience once and the agent can reuse it across every relevant conversation.'
        ));

        plan.add(new PlanSection(
            'recommended',
            'The experiences we recommend for ' + industry,
            'Based on ' + industryLower + ', we’ve pre-selected a small set of proven CLT experiences below. These aren’t '
            + 'AI guesses — they’re curated for this industry so ' + company + ' starts from patterns that already work. '
            + 'You’ll choose one to preview live, and you can adjust the service lens if a different set fits better.'
        ));

        plan.add(new PlanSection(
            'how_fits',
            'How it fits into your service agent',
            'The flow is simple: the customer asks something, the agent decides an action is needed, and instead of replying in '
            + 'text it returns the CLT — which renders as an interactive card. The customer acts on the card, and their choice '
            + 'flows straight back into the conversation so the agent can continue. Routine requests get resolved end-to-end, and '
            + 'the agent still hands off cleanly to a human when something needs a specialist.'
        ));

        plan.add(new PlanSection(
            'getting_started',
            'Getting started',
            'Today we’ll confirm the industry lens, choose one CLT experience, and preview it live so ' + company + ' can see '
            + 'exactly how it behaves in the agent. From there the experience is saved and ready to point the published agent at. '
            + 'The recommended first move is to launch with the single highest-volume request and expand once it’s proven.'
        ));

        return plan;
    }

    // ---------------------------------------------------------------------
    // Tier 3: deterministic fallback
    // ---------------------------------------------------------------------
    @TestVisible
    private static Profile fallbackProfile(String companyName, String website, String industryHint) {
        Profile p = new Profile();
        p.companyName = String.isBlank(companyName) ? 'Your company' : companyName.trim();
        p.website = normalizeWebsite(website);
        p.industryKey = ConsultationCatalogService.resolveIndustryKey(industryHint);
        p.industryLabel = ConsultationCatalogService.labelFor(p.industryKey);
        p.confidence = 0;
        p.summary = p.companyName + ' will use Agentforce service agents to handle common '
            + p.industryLabel.toLowerCase() + ' customer requests.';
        p.planNarrative = 'Start with a curated set of ' + p.industryLabel
            + ' actions your service agents can use to resolve requests faster.';
        p.accentColor = '#0B5CAB';
        p.logoUrl = deriveLogoUrl(p.website);
        p.signals = new List<String>();
        p.plan = curatedPlan(p); // curated spine only — no site context to enrich with
        p.source = 'fallback';
        return p;
    }
}
