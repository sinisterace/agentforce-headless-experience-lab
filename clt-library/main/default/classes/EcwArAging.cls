/**
 * Invocable data source for the Agentforce Coworker · Finance · "AR aging" CLT.
 *
 * Returns accounts-receivable aging for the finance team — buckets, DSO, and top
 * overdue accounts — as a JSON payload for the ecwArAging card. CURATED amounts by
 * design (the seed org has no AR objects) but the overdue accounts use REAL seed
 * account names for authenticity. No org Ids baked in; consistent across the fleet.
 */
public with sharing class EcwArAging {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get AR Aging (ecwArAging)'
        description='Returns accounts-receivable aging, DSO, and top overdue accounts, as a JSON payload for the AR Aging card.')
    public static List<Response> getArAging(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        List<Map<String, Object>> buckets = new List<Map<String, Object>>{
            new Map<String, Object>{ 'label' => 'Current', 'amount' => 720000, 'state' => 'good' },
            new Map<String, Object>{ 'label' => '1–30',    'amount' => 300000, 'state' => 'info' },
            new Map<String, Object>{ 'label' => '31–60',   'amount' => 140000, 'state' => 'warn' },
            new Map<String, Object>{ 'label' => '60+',      'amount' => 80000,  'state' => 'bad' }
        };
        Decimal total = 0;
        for (Map<String, Object> b : buckets) total += (Decimal) b.get('amount');

        List<Map<String, Object>> top = new List<Map<String, Object>>{
            new Map<String, Object>{ 'account' => 'Alta Canyon Clinics',  'amount' => 48000, 'bucket' => '60+',   'state' => 'bad' },
            new Map<String, Object>{ 'account' => 'Keystone Food Markets', 'amount' => 42000, 'bucket' => '31–60', 'state' => 'warn' },
            new Map<String, Object>{ 'account' => 'Union Gate Apartments', 'amount' => 36000, 'bucket' => '31–60', 'state' => 'warn' },
            new Map<String, Object>{ 'account' => 'Pacific Ridge Builders','amount' => 29000, 'bucket' => '1–30',  'state' => 'info' }
        };

        return JSON.serialize(new Map<String, Object>{
            'totalOutstanding' => total,
            'dso' => '42 days',
            'buckets' => buckets,
            'top' => top
        });
    }
}
