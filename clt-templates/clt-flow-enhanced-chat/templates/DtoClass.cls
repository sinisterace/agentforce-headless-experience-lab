/**
 * @description Lightning Type backing class for <Human Readable Card Title>.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "<field1>": "...",
 *   "<field2>": [ ... ]
 * }
 *
 * Anti-pattern note: a single JSON-string field is deliberately used so one
 * DTO/Flow shape serves any card. If you prefer strongly-typed fields, add
 * @AuraEnabled fields instead — but then the Flow must set each one and the
 * schema description must list each one. The JSON-blob form is simpler to
 * scale across many card types.
 */
@JsonAccess(serializable='always' deserializable='always')
global class <DtoClass> {

    @AuraEnabled
    global String <jsonField>;

    global <DtoClass>(String <jsonField>) {
        this.<jsonField> = <jsonField>;
    }

    global <DtoClass>() {
        this.<jsonField> = '';
    }
}
