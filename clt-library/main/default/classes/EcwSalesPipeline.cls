/**
 * Invocable data source for the Agentforce Coworker · Sales · "My pipeline" CLT.
 *
 * Queries the RUNNING USER's real open Opportunities (with sharing, USER_MODE)
 * and returns the card payload as a JSON string matching EcwSalesPipelineData /
 * the ecwSalesPipeline LWC contract. NO org-specific values are baked in, so it
 * is safe to templatize across many orgs — each cloned org renders its own live
 * pipeline. Returns '' when the user has no open pipeline, so the card falls
 * back to its never-blank sample rather than showing an empty $0 snapshot.
 *
 * Wired in via the ecwSalesPipeline_Output_a1f7 Flow (the LLM-provided Details
 * is ignored; data comes from here). This is the reference Apex-backed pattern
 * for employee ("ecw") CLTs that should show real per-org data.
 */
public with sharing class EcwSalesPipeline {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get My Sales Pipeline (ecwSalesPipeline)'
        description='Returns the running user\'s open sales pipeline as a JSON payload for the My Pipeline card.')
    public static List<Response> getPipeline(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        Id uid = UserInfo.getUserId();

        // Open pipeline grouped by stage.
        List<AggregateResult> byStage = [
            SELECT StageName stg, SUM(Amount) amt, COUNT(Id) cnt
            FROM Opportunity
            WHERE OwnerId = :uid AND IsClosed = false AND Amount != null
            WITH USER_MODE
            GROUP BY StageName
        ];
        if (byStage.isEmpty()) return '';

        // Canonical open-stage order from OpportunityStage.SortOrder.
        Map<String, Integer> order = new Map<String, Integer>();
        for (OpportunityStage s : [
            SELECT MasterLabel, SortOrder FROM OpportunityStage
            WHERE IsActive = true AND IsClosed = false WITH USER_MODE
        ]) {
            order.put(s.MasterLabel, s.SortOrder == null ? 9999 : s.SortOrder);
        }

        List<Map<String, Object>> stageRows = new List<Map<String, Object>>();
        Decimal openTotal = 0;
        Integer openCount = 0;
        for (AggregateResult ar : byStage) {
            String label = (String) ar.get('stg');
            Decimal amt = (Decimal) ar.get('amt');
            Integer cnt = (Integer) ar.get('cnt');
            if (amt == null) amt = 0;
            openTotal += amt;
            openCount += (cnt == null ? 0 : cnt);
            stageRows.add(new Map<String, Object>{
                'label' => label, 'amount' => amt,
                '_o' => order.containsKey(label) ? order.get(label) : 9999
            });
        }
        stageRows.sort(new StageComparator());

        List<Map<String, Object>> stages = new List<Map<String, Object>>();
        for (Map<String, Object> r : stageRows) {
            stages.add(new Map<String, Object>{ 'label' => r.get('label'), 'amount' => r.get('amount') });
        }

        // Largest open deal — date-independent, so it stays meaningful no matter
        // how a cloned org's close dates fall.
        Decimal largestDeal = 0;
        for (AggregateResult ar : [
            SELECT MAX(Amount) mx FROM Opportunity
            WHERE OwnerId = :uid AND IsClosed = false AND Amount != null WITH USER_MODE
        ]) { Decimal v = (Decimal) ar.get('mx'); if (v != null) largestDeal = v; }

        // Win rate — this quarter if there were decided deals, else all-time.
        String winLabel = 'Win rate (QTD)';
        Integer won = countOpps('IsWon = true AND CloseDate = THIS_QUARTER', uid);
        Integer lost = countOpps('IsClosed = true AND IsWon = false AND CloseDate = THIS_QUARTER', uid);
        Integer decided = won + lost;
        if (decided == 0) {
            won = countOpps('IsWon = true', uid);
            lost = countOpps('IsClosed = true AND IsWon = false', uid);
            decided = won + lost;
            winLabel = 'Win rate';
        }

        // QoQ pipeline-generation delta (amount created this vs last quarter).
        Decimal genThis = sumAmount('CreatedDate = THIS_QUARTER', uid);
        Decimal genLast = sumAmount('CreatedDate = LAST_QUARTER', uid);

        List<Map<String, Object>> stats = new List<Map<String, Object>>();
        stats.add(new Map<String, Object>{ 'label' => 'Open opportunities', 'value' => String.valueOf(openCount) });
        stats.add(new Map<String, Object>{ 'label' => 'Largest deal', 'value' => compact(largestDeal) });
        if (decided > 0) {
            Integer rate = (Integer) Math.round((Double) won / decided * 100);
            stats.add(new Map<String, Object>{
                'label' => winLabel, 'value' => rate + '%',
                'state' => rate >= 50 ? 'good' : (rate >= 25 ? 'warn' : 'bad')
            });
        } else {
            stats.add(new Map<String, Object>{ 'label' => winLabel, 'value' => '—' });
        }
        Decimal avg = openCount > 0 ? (openTotal / openCount) : 0;
        stats.add(new Map<String, Object>{ 'label' => 'Avg deal size', 'value' => compact(avg) });

        Map<String, Object> payload = new Map<String, Object>{
            'currency' => 'USD',
            'openTotal' => openTotal,
            'stages' => stages,
            'stats' => stats
        };
        // Only show the QoQ delta when both quarters actually generated pipeline,
        // so static seed data can't produce a misleading -100%.
        if (genLast != null && genLast > 0 && genThis > 0) {
            payload.put('deltaPct', ((genThis - genLast) / genLast * 100).setScale(0));
            payload.put('deltaText', 'vs last quarter');
        }
        return JSON.serialize(payload);
    }

    static Integer countOpps(String clause, Id uid) {
        String q = 'SELECT COUNT() FROM Opportunity WHERE OwnerId = :uid AND ' + clause;
        return Database.countQueryWithBinds(q, new Map<String, Object>{ 'uid' => uid }, AccessLevel.USER_MODE);
    }

    static Decimal sumAmount(String clause, Id uid) {
        String q = 'SELECT SUM(Amount) amt FROM Opportunity WHERE OwnerId = :uid AND Amount != null AND ' + clause;
        List<AggregateResult> rs = Database.queryWithBinds(q, new Map<String, Object>{ 'uid' => uid }, AccessLevel.USER_MODE);
        if (!rs.isEmpty()) { Decimal v = (Decimal) rs[0].get('amt'); return v == null ? 0 : v; }
        return 0;
    }

    // 1_420_000 → "$1.42M", 320000 → "$320K", else "$1234".
    @TestVisible
    static String compact(Decimal n) {
        if (n == null) return '$0';
        Decimal a = Math.abs(n);
        String sign = n < 0 ? '-' : '';
        if (a >= 1000000) return sign + '$' + stripTrailing((a / 1000000).setScale(2)) + 'M';
        if (a >= 1000) return sign + '$' + String.valueOf((a / 1000).setScale(0)) + 'K';
        return sign + '$' + String.valueOf(a.setScale(0));
    }

    static String stripTrailing(Decimal d) {
        String s = String.valueOf(d);
        if (s.contains('.')) { s = s.replaceAll('0+$', ''); s = s.replaceAll('\\.$', ''); }
        return s;
    }

    class StageComparator implements Comparator<Map<String, Object>> {
        public Integer compare(Map<String, Object> a, Map<String, Object> b) {
            return ((Integer) a.get('_o')) - ((Integer) b.get('_o'));
        }
    }
}
