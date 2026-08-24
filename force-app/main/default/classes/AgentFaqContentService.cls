/**
 * @description Phase 1 of the "deploy an FAQ Service Agent" flow. Turns a scanned
 * company Profile into a single, clean grounding DOCUMENT (an FAQ + company overview)
 * that gets uploaded into the agent's Agentforce Data Library and vector-indexed so the
 * Service Agent can answer general questions about the company.
 *
 * Same discipline as ConsultationProfileService: the model is NEVER trusted (every field
 * is clamped/sanitized), and the method NEVER dead-ends — a model failure collapses to a
 * deterministic document built from the Profile fields + industry-safe generic FAQs.
 *
 * This class only shapes CONTENT. Getting the document into the Data Library and
 * triggering (re)indexing is a separate concern (AgentDataLibraryService, Phase 2).
 */
public with sharing class AgentFaqContentService {

    private static final String MODELS_API_MODEL = 'sfdc_ai__DefaultOpenAIGPT4OmniMini';
    private static final Integer MAX_FAQS = 12;
    private static final Integer MAX_QUESTION_CHARS = 160;
    private static final Integer MAX_ANSWER_CHARS = 700;
    private static final Integer MAX_OVERVIEW_CHARS = 900;

    /** Injected by tests so no real Models API callout happens under Test.isRunningTest(). */
    @TestVisible
    private static String testCannedJson;

    /** The generated grounding document, ready to hand to the Data Library. */
    public class FaqDocument {
        public String fileName;   // e.g. "Acme-Customer-FAQ.txt"
        public String title;      // human title, first line of the body
        public String mimeType;   // 'text/plain'
        public String body;       // the full document text that grounds the agent
        public String faqsJson;   // structured [{q,a},...] for the site's Popular Questions section
        public Integer faqCount;  // how many Q&A pairs made it in
        public Boolean isFallback;// true when the model was not used / failed
    }

    /** One Q&A pair. */
    @TestVisible
    private class Faq {
        String question;
        String answer;
        Faq(String q, String a) { this.question = q; this.answer = a; }
    }

    /**
     * Build the grounding document for a company. Public entry point.
     * Never throws on model failure; falls back to a deterministic document.
     */
    public static FaqDocument generate(ConsultationProfileService.Profile p) {
        String company = companyName(p);
        String industry = industryLabel(p);

        // Tier 1: model-authored overview + FAQs.
        try {
            String raw = Test.isRunningTest() ? testCannedJson : callModelsApi(p);
            FaqDocument doc = assembleFromModel(raw, p);
            if (doc != null && doc.faqCount > 0) {
                return doc;
            }
        } catch (Exception e) {
            System.debug('AgentFaqContentService model tier failed: ' + e.getMessage());
        }

        // Tier 2: deterministic fallback — always produces a usable document.
        return fallbackDocument(p);
    }

    // ---------------------------------------------------------------------
    // Model tier
    // ---------------------------------------------------------------------
    private static String callModelsApi(ConsultationProfileService.Profile p) {
        String prompt = buildPrompt(p);
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
    private static String buildPrompt(ConsultationProfileService.Profile p) {
        String company = companyName(p);
        String industry = industryLabel(p);
        return
            'You are writing the customer-support knowledge base for a company so an AI '
            + 'service agent can answer general FAQ questions about it. '
            + 'Company: "' + safe(company) + '". '
            + 'Website: "' + safe(p != null ? p.website : null) + '". '
            + 'Industry: "' + safe(industry) + '". '
            + 'Known summary: "' + safe(p != null ? p.summary : null) + '". '
            + 'Known context: "' + safe(p != null ? p.planNarrative : null) + '". '
            + 'Return ONLY a single minified JSON object, no code fences, with keys: '
            + '"overview" (3-5 sentence plain-language description of what this company does '
            + 'and who it serves), and '
            + '"faqs" (an array of up to ' + MAX_FAQS + ' objects, each {"q": question, "a": answer}). '
            + 'Write realistic general customer FAQs for a company like this (hours/contact, '
            + 'getting started, account help, common service requests, how to reach a human). '
            + 'Ground every answer in the provided facts or in what is safely generic-true for '
            + 'this kind of company. '
            + 'CRITICAL — never state a specific fact you cannot verify from the provided facts. '
            + 'For anything that varies or that you were not given (business hours, fees, rates, '
            + 'phone numbers, addresses, dates, response times, or exact policy terms like refund '
            + 'windows), do NOT assert a concrete value. Instead answer conditionally and point the '
            + 'customer to the company website or support — e.g. "Hours can vary; please check ' + safe(company) + '\'s '
            + 'website for current details" or "Fees depend on your account — see the website or contact support". '
            + 'Do NOT invent numbers, times, "24/7", specific day/hour ranges, dollar amounts, or '
            + 'policy specifics. Only give a concrete detail if it appears in the provided facts. '
            + 'Keep each answer to a few sentences. Do not include any text outside the JSON object.';
    }

    /** Parse the model JSON and build a FaqDocument. Returns null if unusable. */
    @TestVisible
    private static FaqDocument assembleFromModel(String raw, ConsultationProfileService.Profile p) {
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
        String overview = clip(asString(m.get('overview')), MAX_OVERVIEW_CHARS);
        List<Faq> faqs = normalizeFaqs(m.get('faqs'));
        if (faqs.isEmpty()) {
            return null;
        }
        return build(p, overview, faqs, false);
    }

    @TestVisible
    private static List<Faq> normalizeFaqs(Object o) {
        List<Faq> out = new List<Faq>();
        if (!(o instanceof List<Object>)) {
            return out;
        }
        for (Object item : (List<Object>) o) {
            if (!(item instanceof Map<String, Object>)) {
                continue;
            }
            Map<String, Object> row = (Map<String, Object>) item;
            String q = clip(asString(row.get('q')), MAX_QUESTION_CHARS);
            String a = clip(asString(row.get('a')), MAX_ANSWER_CHARS);
            if (String.isNotBlank(q) && String.isNotBlank(a)) {
                out.add(new Faq(q.trim(), a.trim()));
            }
            if (out.size() >= MAX_FAQS) {
                break;
            }
        }
        return out;
    }

    // ---------------------------------------------------------------------
    // Deterministic fallback
    // ---------------------------------------------------------------------
    @TestVisible
    private static FaqDocument fallbackDocument(ConsultationProfileService.Profile p) {
        String company = companyName(p);
        String industry = industryLabel(p);
        String industryLower = industry.toLowerCase();

        String overview = (p != null && String.isNotBlank(p.summary))
            ? p.summary
            : company + ' provides ' + industryLower + ' products and services to its customers. '
              + 'This knowledge base helps the AI service agent answer common questions and route '
              + 'customers to the right help.';

        List<Faq> faqs = new List<Faq>{
            new Faq(
                'What does ' + company + ' do?',
                overview
            ),
            new Faq(
                'How can I get help or contact support?',
                'You can ask this agent your question directly. If you need a person, ask to speak '
                + 'with a human and the agent will connect you with the ' + company + ' support team.'
            ),
            new Faq(
                'How do I get started with ' + company + '?',
                'Tell the agent what you are trying to do and it will walk you through the next steps '
                + 'for your ' + industryLower + ' request.'
            ),
            new Faq(
                'Can the agent help with account or service questions?',
                'Yes. The agent can answer general questions about ' + company + ' and its '
                + industryLower + ' services, and hand off to a specialist when something needs one.'
            ),
            new Faq(
                'What kinds of requests can I make here?',
                'Common ' + industryLower + ' requests such as general information, getting started, '
                + 'and where to go next. Just describe what you need in your own words.'
            )
        };
        return build(p, overview, faqs, true);
    }

    // ---------------------------------------------------------------------
    // Document assembly
    // ---------------------------------------------------------------------
    private static FaqDocument build(
        ConsultationProfileService.Profile p, String overview, List<Faq> faqs, Boolean isFallback
    ) {
        String company = companyName(p);
        String industry = industryLabel(p);
        String website = (p != null) ? p.website : null;

        String title = company + ' — Customer FAQ & Company Overview';
        List<String> lines = new List<String>();
        lines.add(title);
        if (String.isNotBlank(website)) {
            lines.add('Source: ' + website);
        }
        lines.add('Industry: ' + industry);
        lines.add('');
        lines.add('== About ' + company + ' ==');
        lines.add(String.isBlank(overview) ? (company + ' overview.') : overview);
        lines.add('');
        lines.add('== Frequently Asked Questions ==');
        for (Faq f : faqs) {
            lines.add('');
            lines.add('Q: ' + f.question);
            lines.add('A: ' + f.answer);
        }

        List<Map<String, String>> faqPairs = new List<Map<String, String>>();
        for (Faq f : faqs) {
            faqPairs.add(new Map<String, String>{ 'q' => f.question, 'a' => f.answer });
        }

        FaqDocument doc = new FaqDocument();
        doc.title = title;
        doc.mimeType = 'text/plain';
        doc.fileName = fileName(company);
        doc.body = String.join(lines, '\n');
        doc.faqsJson = JSON.serialize(faqPairs);
        doc.faqCount = faqs.size();
        doc.isFallback = isFallback;
        return doc;
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------
    private static String companyName(ConsultationProfileService.Profile p) {
        return (p != null && String.isNotBlank(p.companyName)) ? p.companyName.trim() : 'Your company';
    }

    private static String industryLabel(ConsultationProfileService.Profile p) {
        return (p != null && String.isNotBlank(p.industryLabel)) ? p.industryLabel : 'Customer Service';
    }

    @TestVisible
    private static String fileName(String company) {
        String base = (company == null ? 'company' : company).replaceAll('[^a-zA-Z0-9]+', '-');
        base = base.replaceAll('^-+', '').replaceAll('-+$', '');
        if (String.isBlank(base)) {
            base = 'company';
        }
        return base + '-Customer-FAQ.txt';
    }

    private static String stripCodeFences(String s) {
        String t = s.trim();
        if (t.startsWith('```')) {
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

    private static String clip(String s, Integer max) {
        if (s == null) {
            return null;
        }
        return s.length() > max ? s.substring(0, max) : s;
    }

    private static String safe(String v) {
        return v == null ? '' : v.replace('"', '\'');
    }
}
