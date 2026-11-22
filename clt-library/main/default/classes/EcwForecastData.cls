/**
 * @description Lightning Type backing class for Agentforce Coworker · Sales · Forecast.
 * Holds the card payload as a single JSON string; the LWC parses it.
 *
 * JSON shape (see genAiFunctions/ecwForecast_Output_c3d5/input/schema.json):
 * { "currency", "committed" (number), "total" (number),
 *   "tiers": [{ "label", "amount" (number), "state" (closed|commit|best|pipeline) }] }
 */
@JsonAccess(serializable='always' deserializable='always')
global class EcwForecastData {

    @AuraEnabled
    global String ecwForecastJSON;

    global EcwForecastData(String ecwForecastJSON) {
        this.ecwForecastJSON = ecwForecastJSON;
    }

    global EcwForecastData() {
        this.ecwForecastJSON = '';
    }
}
