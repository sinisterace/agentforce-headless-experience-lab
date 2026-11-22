/**
 * @description Agent action that grounds the Agentforce Service Agent's "General FAQ" topic
 * on the company's AI-generated FAQ — WITHOUT a Data Library. It returns the FAQ document
 * (written at runtime to Company_Knowledge__c by the deploy step) so the agent's LLM answers
 * general questions from it. This is the genAiFunction+Apex pattern the CLT library uses.
 *
 * Grounding via context injection (not vector RAG) is the right fit for a bounded FAQ:
 * fully programmatic, instant (no ingestion/indexing), and templatizable — the action ships
 * once in the template; only the Company_Knowledge__c data changes per customer.
 */
public with sharing class AnswerCompanyFaqAction {

    public class Request {
        @InvocableVariable(
            label='Customer Question'
            description='The customer\'s question. Currently informational; the whole FAQ is returned for the agent to answer from.'
            required=false)
        public String query;
    }

    public class Response {
        @InvocableVariable(label='FAQ Knowledge'
            description='The company FAQ and overview the agent should answer from.')
        public String faqContent;

        @InvocableVariable(label='Company Name')
        public String companyName;

        @InvocableVariable(label='Found'
            description='True when company FAQ knowledge is available.')
        public Boolean found;

        @InvocableVariable(label='Industry Key'
            description='The active company\'s industry key (e.g. retail, manufacturing) so the agent can focus on that industry\'s topic.')
        public String industryKey;
    }

    @InvocableMethod(
        label='Answer Company FAQ'
        description='Returns the company\'s FAQ and overview so the agent can answer general questions about the company, its products, services, and policies.'
        category='Agentforce')
    public static List<Response> run(List<Request> requests) {
        Integer count = (requests == null || requests.isEmpty()) ? 1 : requests.size();
        Response shared = buildResponse();
        List<Response> out = new List<Response>();
        for (Integer i = 0; i < count; i++) {
            out.add(shared);
        }
        return out;
    }

    /** Load the active (else most-recent) Company_Knowledge__c and shape a response. */
    @TestVisible
    private static Response buildResponse() {
        Response r = new Response();
        Company_Knowledge__c rec = activeRecord();
        if (rec == null || String.isBlank(rec.Faq_Content__c)) {
            r.found = false;
            r.companyName = null;
            r.faqContent =
                'No company FAQ knowledge is available yet. Let the customer know you can still '
                + 'help with general questions, and offer to connect them to a human if needed.';
            return r;
        }
        r.found = true;
        r.companyName = rec.Company_Name__c;
        r.faqContent = rec.Faq_Content__c;
        r.industryKey = rec.Industry_Key__c;
        return r;
    }

    /** Prefer the flagged-active record; fall back to the most recently updated one. */
    private static Company_Knowledge__c activeRecord() {
        List<Company_Knowledge__c> active = [
            SELECT Company_Name__c, Faq_Content__c, Industry_Key__c
            FROM Company_Knowledge__c
            WHERE Is_Active__c = true
            WITH USER_MODE
            ORDER BY LastModifiedDate DESC
            LIMIT 1
        ];
        if (!active.isEmpty()) {
            return active[0];
        }
        List<Company_Knowledge__c> latest = [
            SELECT Company_Name__c, Faq_Content__c, Industry_Key__c
            FROM Company_Knowledge__c
            WITH USER_MODE
            ORDER BY LastModifiedDate DESC
            LIMIT 1
        ];
        return latest.isEmpty() ? null : latest[0];
    }
}
