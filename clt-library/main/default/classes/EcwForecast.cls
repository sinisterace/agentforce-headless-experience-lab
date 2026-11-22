/**
 * Invocable data source for the Agentforce Coworker · Sales · "Forecast" CLT.
 *
 * Builds the RUNNING USER's forecast coverage as confidence tiers — Closed,
 * Commit, Best Case, Pipeline — summing to total forecast, as a JSON payload for
 * the ecwForecast LWC. Confidence is DERIVED FROM STAGE POSITION (OpportunityStage
 * SortOrder: the last open stage = Commit, the next = Best Case, earlier =
 * Pipeline) so it is portable across orgs even when ForecastCategory isn't set.
 * Closed = won this quarter. Queried with sharing + USER_MODE; no org-specific
 * literals. Returns '' when there is no forecast, so the card uses its sample.
 */
public with sharing class EcwForecast {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get My Forecast (ecwForecast)'
        description='Returns the running user\'s forecast as Closed / Commit / Best Case / Pipeline tiers, as a JSON payload for the Forecast card.')
    public static List<Response> getForecast(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        Id uid = UserInfo.getUserId();

        // Rank open stages by SortOrder (0 = earliest … n-1 = closest to close).
        List<OpportunityStage> openStages = [
            SELECT MasterLabel, SortOrder FROM OpportunityStage
            WHERE IsActive = true AND IsClosed = false WITH USER_MODE ORDER BY SortOrder
        ];
        Map<String, Integer> rank = new Map<String, Integer>();
        Integer n = openStages.size();
        for (Integer i = 0; i < n; i++) rank.put(openStages[i].MasterLabel, i);

        // Open amount by stage → fold into tiers by rank.
        Decimal commitAmt = 0, best = 0, pipe = 0;
        for (AggregateResult ar : [
            SELECT StageName s, SUM(Amount) a FROM Opportunity
            WHERE OwnerId = :uid AND IsClosed = false AND Amount != null
            WITH USER_MODE GROUP BY StageName
        ]) {
            Decimal amt = (Decimal) ar.get('a');
            if (amt == null) amt = 0;
            Integer r = rank.containsKey((String) ar.get('s')) ? rank.get((String) ar.get('s')) : 0;
            if (n <= 1 || r == n - 1) commitAmt += amt;
            else if (r == n - 2) best += amt;
            else pipe += amt;
        }

        // Closed won this quarter.
        Decimal closed = 0;
        for (AggregateResult ar : [
            SELECT SUM(Amount) a FROM Opportunity
            WHERE OwnerId = :uid AND IsWon = true AND CloseDate = THIS_QUARTER AND Amount != null WITH USER_MODE
        ]) { Decimal v = (Decimal) ar.get('a'); if (v != null) closed = v; }

        Decimal total = closed + commitAmt + best + pipe;
        if (total <= 0) return '';

        List<Map<String, Object>> tiers = new List<Map<String, Object>>{
            new Map<String, Object>{ 'label' => 'Closed',    'amount' => closed,    'state' => 'closed' },
            new Map<String, Object>{ 'label' => 'Commit',     'amount' => commitAmt, 'state' => 'commit' },
            new Map<String, Object>{ 'label' => 'Best case',  'amount' => best,      'state' => 'best' },
            new Map<String, Object>{ 'label' => 'Pipeline',   'amount' => pipe,      'state' => 'pipeline' }
        };

        return JSON.serialize(new Map<String, Object>{
            'currency' => 'USD',
            'committed' => closed + commitAmt,
            'total' => total,
            'tiers' => tiers
        });
    }
}
