/**
 * Handler for the Employee Agent's interactive "escalate case" action.
 *
 * The agent calls this action's user_input tool, which renders the ecwEscalation
 * card as an input editor. When the agent acknowledges and taps "Escalate to Tier 2",
 * the card dispatches `valuechange` and the choice arrives here as an
 * EcwEscalationInput. The demo org (and the orgfarm template it seeds) records no
 * escalation — this just returns a human confirmation for the agent to relay.
 */
public with sharing class EcwRaiseEscalation {
    public class Request {
        @InvocableVariable(required=true label='Selection' description='The case escalation the user confirmed.')
        public EcwEscalationInput selection;
    }
    public class Response {
        @InvocableVariable(label='Confirmation' description='Confirmation to relay to the user.')
        public String confirmation;
    }

    @InvocableMethod(label='Raise Escalation (ecwEscalation)'
        description='Records the agent\'s case escalation from the escalation card and returns a confirmation.')
    public static List<Response> run(List<Request> requests) {
        Response resp = new Response();
        EcwEscalationInput sel = (requests != null && !requests.isEmpty()) ? requests[0].selection : null;
        if (sel == null) {
            resp.confirmation = 'No escalation was submitted.';
            return new List<Response>{ resp };
        }
        String route = String.isBlank(sel.routeTo) ? 'Tier 2' : sel.routeTo;
        String casePart = String.isBlank(sel.caseNumber) ? 'The case' : ('Case ' + sel.caseNumber);
        String sevPart = String.isBlank(sel.severity) ? '' : (' at ' + sel.severity);
        resp.confirmation = casePart + ' escalated to ' + route + sevPart + '.';
        return new List<Response>{ resp };
    }
}