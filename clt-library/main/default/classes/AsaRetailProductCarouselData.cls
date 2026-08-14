/**
 * @description Lightning Type backing class for ASA Retail · Product Carousel.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Picked for you",
 *   "subtitle": "Based on your recent views",
 *   "currency": "USD",
 *   "products": [
 *     { "id": "p1", "name": "Trail Runner 3", "sku": "TR3-BLK-10", "price": 128,
 *       "compareAtPrice": 160, "rating": 4.7, "reviewCount": 2140,
 *       "imageUrl": "/resource/asaRetailTrailblazerShoe", "category": "shoes",
 *       "badge": "-20%", "availability": "in_stock" }
 *   ]
 * }
 * The renderer shows one focused card at a time and intentionally caps the
 * display at three products.
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaRetailProductCarouselData {

    @AuraEnabled
    global String retailProductCarouselJSON;

    global AsaRetailProductCarouselData(String retailProductCarouselJSON) {
        this.retailProductCarouselJSON = retailProductCarouselJSON;
    }

    global AsaRetailProductCarouselData() {
        this.retailProductCarouselJSON = '';
    }
}
