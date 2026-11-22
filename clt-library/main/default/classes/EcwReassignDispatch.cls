/**
 * Handler for the Employee Agent's interactive "reassign service appointment" action.
 *
 * The agent calls this action's user_input tool, which renders the ecwFieldDispatch
 * card as an input editor. When the dispatcher taps "Reassign to <tech>", the card
 * dispatches `valuechange` and the chosen selection arrives here as an
 * EcwFieldDispatchInput. The demo org (and the orgfarm template it seeds) has no
 * Field Service data, so this records nothing — it just returns a human confirmation
 * for the agent to relay.
 */
public with sharing class EcwReassignDispatch {
    public class Request {
        @InvocableVariable(required=true label='Selection' description='The technician the user chose to reassign the appointment to.')
        public EcwFieldDispatchInput selection;
    }
    public class Response {
        @InvocableVariable(label='Confirmation' description='Confirmation to relay to the user.')
        public String confirmation;
    }

    @InvocableMethod(label='Reassign Dispatch (ecwFieldDispatch)'
        description='Records the dispatcher\'s technician reassignment from the field dispatch card and returns a confirmation.')
    public static List<Response> run(List<Request> requests) {
        Response resp = new Response();
        EcwFieldDispatchInput sel = (requests != null && !requests.isEmpty()) ? requests[0].selection : null;
        if (sel == null || String.isBlank(sel.technician)) {
            resp.confirmation = 'No technician was selected.';
            return new List<Response>{ resp };
        }
        String appt = String.isBlank(sel.appointment) ? 'the appointment' : sel.appointment;
        String etaPart = String.isBlank(sel.eta) ? '' : (' — ' + sel.eta + ' ETA');
        resp.confirmation = appt + ' reassigned to ' + sel.technician + etaPart + '.';
        return new List<Response>{ resp };
    }
}
