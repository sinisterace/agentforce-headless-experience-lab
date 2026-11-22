/**
 * Invocable data source for the Agentforce Coworker · Sales · "Needs attention" CLT.
 *
 * Returns a curated set of open deals that need action (overdue, closing soon, or
 * stalled), ranked by urgency, as a JSON payload for the ecwNeedsAttention LWC.
 * The feed is CURATED/STATIC by design but populated with REAL opportunity names
 * from the seed data, so it reads as authentic in every templatized org (they all
 * share the same seed) without the noise/repetition of a live query. No org Ids are
 * baked in — only seed-stable names. (To go live later, swap buildPayloadJson() for
 * a query over the running user's at-risk open Opportunities; the contract is ready.)
 */
public with sharing class EcwNeedsAttention {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get Deals That Need Attention (ecwNeedsAttention)'
        description='Returns open deals that are overdue, closing soon, or stalled, as a JSON payload for the Needs Attention card.')
    public static List<Response> getNeedsAttention(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        List<Map<String, Object>> items = new List<Map<String, Object>>{
            new Map<String, Object>{ 'name' => 'Entry System Upgrade - Juniper Hill Academy',       'stage' => 'Negotiation/Review',    'amount' => 250000, 'flag' => 'Overdue 8d',       'state' => 'bad' },
            new Map<String, Object>{ 'name' => 'Warehouse Camera Expansion - Alta Canyon Clinics',   'stage' => 'Proposal/Price Quote',  'amount' => 250000, 'flag' => 'Closes in 5d',     'state' => 'warn' },
            new Map<String, Object>{ 'name' => 'Warehouse Camera Expansion - Lakepoint Distribution','stage' => 'Negotiation/Review',    'amount' => 250000, 'flag' => 'No activity 41d',  'state' => 'warn' },
            new Map<String, Object>{ 'name' => 'Visitor Kiosk Pilot - Iron Mesa Manufacturing',      'stage' => 'Prospecting',           'amount' => 250000, 'flag' => 'No activity 36d',  'state' => 'warn' },
            new Map<String, Object>{ 'name' => 'Entry System Upgrade - Valencia Campus Services',     'stage' => 'Value Proposition',     'amount' => 250000, 'flag' => 'No activity 33d',  'state' => 'warn' },
            new Map<String, Object>{ 'name' => 'Visitor Kiosk Pilot - Keystone Food Markets',         'stage' => 'Proposal/Price Quote',  'amount' => 125000, 'flag' => 'Closes in 9d',     'state' => 'warn' }
        };

        Decimal atRiskTotal = 0;
        for (Map<String, Object> i : items) atRiskTotal += (Decimal) i.get('amount');

        return JSON.serialize(new Map<String, Object>{
            'atRiskTotal' => atRiskTotal,
            'count' => items.size(),
            'items' => items
        });
    }
}