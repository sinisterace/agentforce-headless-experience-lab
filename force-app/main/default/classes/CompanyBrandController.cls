/**
 * @description Read-only feed for the personalized Experience site (the `companyBrandHero`
 * support-hub LWC). One call returns everything the page renders — brand (name, accent, logo),
 * the "About" summary, highlight signals, and the Popular Questions FAQ — all read at render
 * time from the active Company_Knowledge__c record (no callout, no Named Credential). Grant the
 * site's user read via the Company_Knowledge_Access permission set.
 */
public with sharing class CompanyBrandController {

    public class FaqItem {
        @AuraEnabled public String question;
        @AuraEnabled public String answer;
    }

    public class Brand {
        @AuraEnabled public String companyName;
        @AuraEnabled public String accentColor;
        @AuraEnabled public String logoUrl;
        @AuraEnabled public String website;
        @AuraEnabled public String summary;
        @AuraEnabled public List<String> signals;
        @AuraEnabled public List<FaqItem> faqs;
        @AuraEnabled public Boolean found;
    }

    @AuraEnabled(cacheable=true)
    public static Brand getActiveBrand() {
        Brand b = new Brand();
        b.signals = new List<String>();
        b.faqs = new List<FaqItem>();

        List<Company_Knowledge__c> recs = [
            SELECT Company_Name__c, Accent_Color__c, Logo_Url__c, Website__c,
                   Summary__c, Signals_JSON__c, Faq_Json__c
            FROM Company_Knowledge__c
            WHERE Is_Active__c = true
            WITH USER_MODE
            ORDER BY LastModifiedDate DESC
            LIMIT 1
        ];
        if (recs.isEmpty()) {
            b.found = false;
            b.companyName = 'Your Company';
            b.accentColor = '#0B5CAB';
            return b;
        }

        Company_Knowledge__c r = recs[0];
        b.found = true;
        b.companyName = String.isBlank(r.Company_Name__c) ? 'Your Company' : r.Company_Name__c;
        b.accentColor = String.isBlank(r.Accent_Color__c) ? '#0B5CAB' : r.Accent_Color__c;
        b.logoUrl = r.Logo_Url__c;
        b.website = r.Website__c;
        b.summary = r.Summary__c;
        b.signals = parseSignals(r.Signals_JSON__c);
        b.faqs = parseFaqs(r.Faq_Json__c);
        return b;
    }

    private static List<String> parseSignals(String raw) {
        List<String> out = new List<String>();
        if (String.isBlank(raw)) {
            return out;
        }
        try {
            for (Object o : (List<Object>) JSON.deserializeUntyped(raw)) {
                if (o != null && String.isNotBlank(String.valueOf(o))) {
                    out.add(String.valueOf(o));
                }
            }
        } catch (Exception e) {
            // ignore malformed signals — the section just renders empty
        }
        return out;
    }

    private static List<FaqItem> parseFaqs(String raw) {
        List<FaqItem> out = new List<FaqItem>();
        if (String.isBlank(raw)) {
            return out;
        }
        try {
            for (Object o : (List<Object>) JSON.deserializeUntyped(raw)) {
                if (!(o instanceof Map<String, Object>)) {
                    continue;
                }
                Map<String, Object> m = (Map<String, Object>) o;
                String q = m.get('q') == null ? null : String.valueOf(m.get('q'));
                String a = m.get('a') == null ? null : String.valueOf(m.get('a'));
                if (String.isNotBlank(q) && String.isNotBlank(a)) {
                    FaqItem item = new FaqItem();
                    item.question = q;
                    item.answer = a;
                    out.add(item);
                }
            }
        } catch (Exception e) {
            // ignore malformed FAQ — the section just renders empty
        }
        return out;
    }
}
