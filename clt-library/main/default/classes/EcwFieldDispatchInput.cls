/**
 * Input shape for the interactive Field dispatch editor CLT.
 *
 * The ecwFieldDispatch LWC, when rendered as an Agentforce input editor
 * (targetType c__ecwFieldDispatchInput), dispatches a `valuechange` event whose
 * detail.value matches these fields. Referenced by the lightningType bundle
 * ecwFieldDispatchInput (schema.json -> @apexClassType/c__EcwFieldDispatchInput)
 * and consumed by EcwReassignDispatch's user_input action input.
 */
public with sharing class EcwFieldDispatchInput {
    @InvocableVariable(label='Technician' description='The technician the user chose to reassign the appointment to')
    public String technician;

    @InvocableVariable(label='Appointment' description='The service appointment number being reassigned')
    public String appointment;

    @InvocableVariable(label='ETA' description='The chosen technician ETA, e.g. 12 min')
    public String eta;

    @InvocableVariable(label='Fit' description='The fit score of the chosen technician, 0-100')
    public Integer fit;
}
