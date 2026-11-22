/**
 * Invocable data source for the Agentforce Coworker · Finance · "AP approvals" CLT.
 *
 * Returns vendor invoices / POs awaiting the finance team's approval as a JSON payload
 * for the ecwApApprovals card. CURATED by design (the seed org has no AP objects) and
 * themed to the company's domain. No org Ids baked in; consistent across the fleet.
 */
public with sharing class EcwApApprovals {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get AP Approvals (ecwApApprovals)'
        description='Returns vendor invoices and POs awaiting approval, as a JSON payload for the AP Approvals card.')
    public static List<Response> getApApprovals(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        List<Map<String, Object>> items = new List<Map<String, Object>>{
            item('INV-4821', 'Sentinel Hardware Co.', 'Invoice', 82000, 'Due in 2 days', 'Received 3d ago', 'warn'),
            item('PO-2290',  'NorthGate Camera Supply', 'PO', 64000, 'Due in 5 days', 'Received 1d ago', 'ok'),
            item('INV-4809', 'Veritas Access Controls', 'Invoice', 58000, 'Overdue 1 day', 'Received 9d ago', 'bad'),
            item('INV-4815', 'BluePeak Installations', 'Invoice', 46000, 'Due in 6 days', 'Received 2d ago', 'ok'),
            item('PO-2284',  'Cedar Signal Networks', 'PO', 34000, 'Due in 8 days', 'Received 4d ago', 'ok')
        };
        Decimal total = 0;
        for (Map<String, Object> i : items) total += (Decimal) i.get('amount');

        return JSON.serialize(new Map<String, Object>{
            'headline' => items.size() + ' awaiting approval',
            'totalAmount' => total,
            'items' => items
        });
    }

    static Map<String, Object> item(String id, String vendor, String type, Decimal amount, String due, String aging, String state) {
        return new Map<String, Object>{ 'id' => id, 'vendor' => vendor, 'type' => type, 'amount' => amount, 'due' => due, 'aging' => aging, 'state' => state };
    }
}