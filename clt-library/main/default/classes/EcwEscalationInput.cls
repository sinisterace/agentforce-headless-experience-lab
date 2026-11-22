/**
 * Input shape for the interactive Escalate case editor CLT.
 *
 * The ecwEscalation LWC, when rendered as an Agentforce input editor
 * (targetType c__ecwEscalationInput), dispatches a `valuechange` event whose
 * detail.value matches these fields. Referenced by the lightningType bundle
 * ecwEscalationInput (schema.json -> @apexClassType/c__EcwEscalationInput) and
 * consumed by EcwRaiseEscalation's user_input action input.
 */
public with sharing class EcwEscalationInput {
    @InvocableVariable(label='Case number' description='The case number being escalated')
    public String caseNumber;

    @InvocableVariable(label='Severity' description='The escalation severity, e.g. Sev 1')
    public String severity;

    @InvocableVariable(label='Route to' description='The on-call team the case is routed to, e.g. Tier 2 · Platform on-call')
    public String routeTo;

    @InvocableVariable(label='Subject' description='The case subject line')
    public String subject;
}
