/**
 * @description Deterministic catalogue lookup for the CLT Catalogue app.
 * AI never picks CLTs; recommendations are a straight SOQL lookup by industry key.
 * Two companies in the same industry get an identical CLT set.
 */
public with sharing class ConsultationCatalogService {

    /** Canonical industry keys. Order is the display order in the picker.
     *  Only financial_services, healthcare, and hvac have CLT_Catalog_Item__c
     *  rows seeded; the rest surface as empty cards (recommendationsFor returns
     *  an empty list) until their catalog rows are seeded. */
    public static final List<String> INDUSTRY_KEYS = new List<String>{
        'financial_services', 'insurance', 'healthcare', 'retail',
        'technology_comms', 'manufacturing', 'energy_utilities', 'hvac',
        'automotive', 'travel_hospitality', 'public_sector', 'legal'
    };

    private static final Map<String, String> INDUSTRY_LABELS = new Map<String, String>{
        'financial_services' => 'Financial Services',
        'insurance' => 'Insurance',
        'healthcare' => 'Healthcare',
        'retail' => 'Retail',
        'technology_comms' => 'Technology, Media & Communications',
        'manufacturing' => 'Manufacturing',
        'energy_utilities' => 'Energy & Utilities',
        'hvac' => 'HVAC',
        'automotive' => 'Automotive',
        'travel_hospitality' => 'Travel & Hospitality',
        'public_sector' => 'Public Sector & Education',
        'legal' => 'Legal'
    };

    private static final String DEFAULT_INDUSTRY = 'financial_services';

    /** DTO returned to callers / serialized to JSON for the REST layer. */
    public class Recommendation {
        public String cltApiName;
        public String industryKey;
        public String capabilityKey;
        public String label;
        public String description;
        public Integer displayOrder;
        public String defaultPayloadJson;
        public String dtoFieldName;
    }

    public class IndustryOption {
        public String key;
        public String label;
        public IndustryOption(String key, String label) {
            this.key = key;
            this.label = label;
        }
    }

    /** Comma-separated list of valid industry keys, for the prompt template vocabulary. */
    public static String industryKeyOptions() {
        return String.join(INDUSTRY_KEYS, ', ');
    }

    /** Industries with display labels for the UI picker. */
    public static List<IndustryOption> industriesWithLabels() {
        List<IndustryOption> out = new List<IndustryOption>();
        for (String k : INDUSTRY_KEYS) {
            out.add(new IndustryOption(k, INDUSTRY_LABELS.get(k)));
        }
        return out;
    }

    /** Validate a candidate industry key; fall back to the default when unknown/blank. */
    public static String resolveIndustryKey(String candidate) {
        if (String.isBlank(candidate)) {
            return DEFAULT_INDUSTRY;
        }
        String norm = candidate.trim().toLowerCase();
        return INDUSTRY_LABELS.containsKey(norm) ? norm : DEFAULT_INDUSTRY;
    }

    public static String labelFor(String industryKey) {
        String k = resolveIndustryKey(industryKey);
        return INDUSTRY_LABELS.get(k);
    }

    /** Deterministic recommendations for an industry, ordered by Display_Order__c. */
    public static List<Recommendation> recommendationsFor(String industryKey) {
        String key = resolveIndustryKey(industryKey);
        List<Recommendation> out = new List<Recommendation>();
        for (CLT_Catalog_Item__c row : [
            SELECT CLT_Api_Name__c, Industry_Key__c, Capability_Key__c, Label__c,
                   Description__c, Display_Order__c, Default_Payload_JSON__c, DTO_Field_Name__c
            FROM CLT_Catalog_Item__c
            WHERE Industry_Key__c = :key
            WITH USER_MODE
            ORDER BY Display_Order__c ASC NULLS LAST, Label__c ASC
        ]) {
            Recommendation r = new Recommendation();
            r.cltApiName = row.CLT_Api_Name__c;
            r.industryKey = row.Industry_Key__c;
            r.capabilityKey = row.Capability_Key__c;
            r.label = row.Label__c;
            r.description = row.Description__c;
            r.displayOrder = row.Display_Order__c == null ? null : Integer.valueOf(row.Display_Order__c);
            r.defaultPayloadJson = row.Default_Payload_JSON__c;
            r.dtoFieldName = row.DTO_Field_Name__c;
            out.add(r);
        }
        return out;
    }
}
