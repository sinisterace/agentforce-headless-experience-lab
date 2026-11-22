/**
 * Input shape for the interactive AR aging editor CLT.
 *
 * The ecwArAging LWC, when rendered as an Agentforce input editor
 * (targetType c__ecwArAgingInput), dispatches a `valuechange` event whose
 * detail.value matches these fields. Referenced by the lightningType bundle
 * ecwArAgingInput (schema.json → @apexClassType/c__EcwArAgingInput) and
 * consumed by EcwArRemind's user_input action input.
 */
public with sharing class EcwArAgingInput {
    @InvocableVariable(label='Accounts' description='Human-readable list of the chosen overdue accounts')
    public String accounts;

    @InvocableVariable(label='Count' description='How many accounts were chosen')
    public Integer count;
}