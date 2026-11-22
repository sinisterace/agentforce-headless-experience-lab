/**
 * Invocable data source for the Agentforce Coworker · "Employee of the Month" CLT.
 *
 * A deliberately tongue-in-cheek demo card. Returns a fixed, never-blank payload
 * celebrating Lauren Bailey, Chief Demo Officer — the perennial Employee of the
 * Month. No org-specific values are baked in beyond the gag content, so it is
 * safe to templatize across orgs. The LLM-provided Details is ignored; the
 * payload comes from here.
 *
 * Wired in via the ecwEmployeeOfMonth_Output_eom1 Flow. Matches the
 * EcwEmployeeOfMonthData / ecwEmployeeOfMonth LWC contract.
 */
public with sharing class EcwEmployeeOfMonth {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get Employee of the Month (ecwEmployeeOfMonth)'
        description='Returns the Employee of the Month card payload (Lauren Bailey) as a JSON string.')
    public static List<Response> getEmployeeOfMonth(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        Map<String, Object> payload = new Map<String, Object>{
            'name' => 'Lauren Bailey',
            'title' => 'Chief Demo Officer',
            'reason' => 'Has appeared in every Salesforce demo since the dawn of time.',
            'stats' => new List<Map<String, Object>>{
                new Map<String, Object>{ 'label' => 'Demos starred in', 'value' => 'Yes' },
                new Map<String, Object>{ 'label' => 'Opportunities closed', 'value' => 'All of them' },
                new Map<String, Object>{ 'label' => 'Days off', 'value' => '0' }
            },
            'badges' => new List<String>{ 'Always Available', 'Never Churns', 'Loves Every Product' },
            'congratulateText' => 'Lauren has been congratulated 4,000 times this quarter.',
            'congratulateCount' => 4000,
            'nomineeText' => 'Lauren Bailey, again'
        };
        return JSON.serialize(payload);
    }
}
