/**
 * @description Lightning Type backing class for ASA Retail · Store Pickup.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Pick up in store",
 *   "subtitle": "Ready today at a store near you",
 *   "product": { "name": "Trailblazer Running Shoe", "variant": "Size 10 · Black", "category": "shoes" },
 *   "stores": [
 *     { "id": "s1", "name": "Union Square", "distance": "0.4 mi", "availability": "in_stock",
 *       "pickupEta": "Ready in 2 hours", "address": "333 Post St, San Francisco",
 *       "hours": "Open until 9:00 PM", "phone": "+14155550142", "mapsUrl": "https://..." }
 *   ]
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaRetailStorePickupData {

    @AuraEnabled
    global String retailStorePickupJSON;

    global AsaRetailStorePickupData(String retailStorePickupJSON) {
        this.retailStorePickupJSON = retailStorePickupJSON;
    }

    global AsaRetailStorePickupData() {
        this.retailStorePickupJSON = '';
    }
}