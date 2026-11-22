/**
 * Invocable data source for the Agentforce Coworker · Service · "CSAT pulse" CLT.
 *
 * Returns the running user's satisfaction pulse — a rolling score, a trend, a
 * responses/positive meta line, and recent verbatim comments tied to REAL cases
 * (number, subject, account) — as a JSON payload for the ecwCsatPulse card. The
 * score/trend/ratings are synthesized (the seed org has no survey/CSAT field) but
 * each comment references a real open case so it reads as authentic across
 * identical-seed clones. Queried with sharing + USER_MODE; no org Ids baked in.
 */
public with sharing class EcwCsatPulse {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    // Curated verbatims paired by index with real cases.
    static final List<String> TEXTS = new List<String>{
        'Tech resolved it the same day — great service.',
        'Clear, quick answer — very helpful.',
        'Still unresolved after the visit — needs follow-up.'
    };
    static final List<String> FULLS = new List<String>{
        'Your technician diagnosed and fixed the issue on the first visit and walked our team through prevention. Exactly the responsiveness we hoped for.',
        'Got a clear, well-documented answer within the hour — no back-and-forth needed. Appreciated the proactive detail.',
        'The issue recurred the day after the visit and we are still waiting on a follow-up. Please prioritize this one.'
    };
    static final List<String> STATES = new List<String>{ 'good', 'good', 'bad' };
    static final List<Integer> RATINGS = new List<Integer>{ 5, 5, 2 };

    @InvocableMethod(label='Get CSAT Pulse (ecwCsatPulse)'
        description='Returns the running user\'s CSAT score, trend, and recent comments as a JSON payload for the CSAT Pulse card.')
    public static List<Response> getCsatPulse(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        Id uid = UserInfo.getUserId();

        // Real cases to anchor the verbatims (fall back to curated accounts if none).
        List<Case> cs = [
            SELECT CaseNumber, Subject, Account.Name FROM Case
            WHERE OwnerId = :uid AND IsClosed = false
            WITH USER_MODE ORDER BY CreatedDate ASC LIMIT 3
        ];
        List<String> fbAccounts = new List<String>{ 'Arroyo Medical Group', 'Union Gate Apartments', 'Alta Canyon Clinics' };

        List<Map<String, Object>> comments = new List<Map<String, Object>>();
        for (Integer i = 0; i < TEXTS.size(); i++) {
            Case c = i < cs.size() ? cs[i] : null;
            comments.add(new Map<String, Object>{
                'text' => TEXTS[i],
                'full' => FULLS[i],
                'who' => (c != null && c.Account != null ? c.Account.Name : fbAccounts[i]),
                'caseNumber' => (c != null ? c.CaseNumber : null),
                'caseSubject' => (c != null ? c.Subject : null),
                'rating' => RATINGS[i],
                'state' => STATES[i]
            });
        }

        return JSON.serialize(new Map<String, Object>{
            'score' => '4.6',
            'scoreMax' => '5',
            'label' => 'CSAT · last 30 days',
            'deltaText' => '+0.3 vs last month',
            'deltaState' => 'good',
            'metaText' => '42 responses · 88% positive',
            'trend' => new List<Decimal>{ 4.0, 4.1, 4.2, 4.1, 4.4, 4.6 },
            'comments' => comments
        });
    }
}