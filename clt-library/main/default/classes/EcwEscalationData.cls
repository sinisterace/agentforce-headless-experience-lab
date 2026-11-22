/**
 * @description Lightning Type backing class for Agentforce Coworker · Service · Escalate case.
 * Holds the card payload as a single JSON string; the LWC parses it.
 *
 * JSON shape (see genAiFunctions/ecwEscalation_Output_h8k2/input/schema.json):
 * { "title", "caseInfo": { number, subject, account, priority, opened, channel },
 *   "severity": { label, state (ok|warn|bad) }, "reason",
 *   "lines": [{ item, detail, metric }], "summary": { label, total, note },
 *   "routeTo", "ackText", "action" }
 */
@JsonAccess(serializable='always' deserializable='always')
global class EcwEscalationData {

    @AuraEnabled
    global String ecwEscalationJSON;

    global EcwEscalationData(String ecwEscalationJSON) {
        this.ecwEscalationJSON = ecwEscalationJSON;
    }

    global EcwEscalationData() {
        this.ecwEscalationJSON = '';
    }
}
