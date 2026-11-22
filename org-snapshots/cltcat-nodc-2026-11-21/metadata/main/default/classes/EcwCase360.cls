/**
 * Invocable data source for the Agentforce Coworker · Service · "Case 360" CLT.
 *
 * Returns a rich prep + work surface for the running user's most pressing open
 * case — the oldest High-priority case (falling back to the oldest open case) —
 * with the full customer context (account, contact, email, phone), the case
 * description, key facts, the real Status picklist values (for the in-card status
 * control), and the other open cases in the queue (for the related list). Queried
 * with sharing + USER_MODE; no org-specific literals. Returns '' when the user has
 * no open cases, so the card falls back to its never-blank sample.
 */
public with sharing class EcwCase360 {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get Case 360 (ecwCase360)'
        description='Returns a rich prep + work snapshot of the running user\'s most pressing open case as a JSON payload for the Case 360 card.')
    public static List<Response> getCase360(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        Id uid = UserInfo.getUserId();

        List<Case> focusList = [
            SELECT Id, CaseNumber, Subject, Description, Priority, Status, Origin, CreatedDate,
                   AccountId, Account.Name, Contact.Name, Contact.Email, Contact.Phone
            FROM Case WHERE OwnerId = :uid AND IsClosed = false AND Priority = 'High'
            WITH USER_MODE ORDER BY CreatedDate ASC LIMIT 1
        ];
        if (focusList.isEmpty()) {
            focusList = [
                SELECT Id, CaseNumber, Subject, Description, Priority, Status, Origin, CreatedDate,
                       AccountId, Account.Name, Contact.Name, Contact.Email, Contact.Phone
                FROM Case WHERE OwnerId = :uid AND IsClosed = false
                WITH USER_MODE ORDER BY CreatedDate ASC LIMIT 1
            ];
        }
        if (focusList.isEmpty()) return '';
        Case c = focusList[0];

        Integer acctOpen = 0;
        if (c.AccountId != null) {
            acctOpen = [SELECT COUNT() FROM Case WHERE AccountId = :c.AccountId AND IsClosed = false WITH USER_MODE];
        }
        Integer ageDays = c.CreatedDate.date().daysBetween(Date.today());

        // Status picklist values for the in-card status control.
        List<String> statusOptions = new List<String>();
        for (Schema.PicklistEntry e : Case.Status.getDescribe().getPicklistValues()) {
            if (e.isActive()) statusOptions.add(e.getLabel());
        }

        // Other open cases in the queue (for the related list), most urgent first.
        List<Map<String, Object>> related = new List<Map<String, Object>>();
        for (Case r : [
            SELECT CaseNumber, Subject, Priority, Account.Name, CreatedDate
            FROM Case WHERE OwnerId = :uid AND IsClosed = false AND Id != :c.Id
            WITH USER_MODE ORDER BY Priority ASC, CreatedDate ASC LIMIT 4
        ]) {
            related.add(new Map<String, Object>{
                'caseNumber' => r.CaseNumber,
                'subject' => r.Subject,
                'account' => (r.Account != null ? r.Account.Name : null),
                'priority' => r.Priority,
                'ageText' => r.CreatedDate.date().daysBetween(Date.today()) + 'd open'
            });
        }

        return JSON.serialize(new Map<String, Object>{
            'caseNumber' => c.CaseNumber,
            'subject' => c.Subject,
            'description' => c.Description,
            'priority' => (c.Priority == null ? 'Normal' : c.Priority),
            'status' => (c.Status == null ? 'New' : c.Status),
            'origin' => c.Origin,
            'ageText' => ageDays + 'd open',
            'account' => (c.Account != null ? c.Account.Name : null),
            'contactName' => (c.Contact != null ? c.Contact.Name : null),
            'contactEmail' => (c.Contact != null ? c.Contact.Email : null),
            'contactPhone' => (c.Contact != null ? c.Contact.Phone : null),
            'accountOpen' => acctOpen,
            'statusOptions' => statusOptions,
            'related' => related
        });
    }
}