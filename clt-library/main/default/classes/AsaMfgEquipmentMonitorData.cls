/**
 * @description Lightning Type backing class for ASA Manufacturing · Equipment Monitor.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Machine health",
 *   "asset": { "name": "Trailblazer Assembly Cell", "model": "TB-9000", "assetId": "LINE-3",
 *              "location": "Plant 2 · Bay 4", "imageUrl": "/resource/asaMfgTrailblazerCell" },
 *   "status": "running", "statusLabel": "Running",
 *   "updatedText": "Live · updated 12s ago",
 *   "metrics": [
 *     { "label": "OEE", "value": "87", "unit": "%", "state": "good" },
 *     { "label": "Spindle temp", "value": "62", "unit": "°C", "state": "warn" },
 *     { "label": "Throughput", "value": "142", "unit": "/hr", "state": "good" },
 *     { "label": "Uptime", "value": "6d 4h", "state": "good" }
 *   ],
 *   "trend": { "label": "OEE · last 12h", "points": [72,78,74,80,83,81,85,84,86,88,87,87] },
 *   "submitText": "Create work order",
 *   "submitValue": "Open a work order for the Trailblazer Assembly Cell (LINE-3)"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaMfgEquipmentMonitorData {

    @AuraEnabled
    global String mfgEquipmentMonitorJSON;

    global AsaMfgEquipmentMonitorData(String mfgEquipmentMonitorJSON) {
        this.mfgEquipmentMonitorJSON = mfgEquipmentMonitorJSON;
    }

    global AsaMfgEquipmentMonitorData() {
        this.mfgEquipmentMonitorJSON = '';
    }
}
