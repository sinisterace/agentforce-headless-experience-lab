/**
 * Invocable data source for the Agentforce Coworker · Service · "Escalate case" CLT.
 *
 * Returns a case-escalation summary (case context, severity, impacted line items with a
 * business-impact total, and the on-call route) as a JSON payload for the ecwEscalation
 * ledger card.
 *
 * CURATED by design: seed-stable, no org Ids, portable across the templatized fleet
 * (same approach as the other ecw CLTs). If a future template ships real Case data,
 * swap buildPayloadJson for a WITH USER_MODE query and keep the same shape.
 */
public with sharing class EcwEscalation {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get Escalation (ecwEscalation)'
        description='Returns a case-escalation summary as a JSON payload for the Escalate Case card.')
    public static List<Response> getEscalation(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    static Map<String, Object> line(String item, String detail, String metric) {
        return new Map<String, Object>{ 'item' => item, 'detail' => detail, 'metric' => metric };
    }

    @TestVisible
    static String buildPayloadJson() {
        return JSON.serialize(new Map<String, Object>{
            'title' => 'Escalate case',
            'caseInfo' => new Map<String, Object>{
                'number' => '00043219', 'subject' => 'SSO login outage — enterprise', 'account' => 'PixelArc',
                'priority' => 'High', 'opened' => 'Opened 2h 10m ago', 'channel' => 'Web'
            },
            'severity' => new Map<String, Object>{ 'label' => 'Sev 1', 'state' => 'bad' },
            'reason' => 'Multiple enterprise customers can\'t authenticate via SSO; impact is widening.',
            'lines' => new List<Object>{
                line('Affected accounts', 'PixelArc, Northwind, Acme +4', '7'),
                line('Users impacted', 'SSO authentication failures', '~2,400'),
                line('Revenue at risk', 'Enterprise SLA credits', '$48K'),
                line('SLA window', 'P1 response SLA', '22m left')
            },
            'summary' => new Map<String, Object>{ 'label' => 'Business impact', 'total' => 'High', 'note' => '7 accounts · ~2,400 users · $48K at risk' },
            'routeTo' => 'Tier 2 · Platform on-call',
            'ackText' => 'I confirm this meets Sev 1 escalation criteria.',
            'action' => 'Escalate to Tier 2'
        });
    }
}