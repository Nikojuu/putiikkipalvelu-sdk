/**
 * Shipping Types
 *
 * Types for shipment methods and pickup locations.
 * Uses unified response format that works with any provider (Shipit, custom, future integrations).
 */

// =============================================================================
// Opening Hours
// =============================================================================

/**
 * Opening hours for a pickup location
 */
export interface OpeningHours {
  monday: string[];
  tuesday: string[];
  wednesday: string[];
  thursday: string[];
  friday: string[];
  saturday: string[];
  sunday: string[];
  exceptions: string[];
}

// =============================================================================
// Home Delivery Option
// =============================================================================

/**
 * A home delivery option (works for any provider)
 */
export interface HomeDeliveryOption {
  /** ShipmentMethods.id - unique identifier for this method */
  id: string;
  /** Display name (e.g., "Posti Kotipaketti") */
  name: string;
  /** Optional description */
  description: string | null;
  /** Price in cents (0 if free shipping applies) */
  price: number;
  /** Original price in cents (always the base price before free shipping) */
  originalPrice: number;
  /** Free shipping threshold in cents, null = no free shipping available for this method */
  freeShippingThreshold: number | null;
  /** Carrier logo URL */
  logo: string | null;
  /** Provider type */
  provider: "shipit" | "custom";
  /** Carrier name (e.g., "Posti", "Matkahuolto") - null for custom methods */
  carrier: string | null;
  /** Estimated delivery time (e.g., "1-3") - null if not available */
  estimatedDelivery: string | null;
}

// =============================================================================
// Pickup Point Option
// =============================================================================

/**
 * A pickup point option (parcel locker, service point, etc.)
 * Works for any provider that supports pickup locations.
 */
export interface PickupPointOption {
  /** Unique pickup point ID from carrier */
  id: string;
  /** ShipmentMethods.id - needed for checkout */
  shipmentMethodId: string;
  /** Shipit service ID - needed for checkout and shipment creation */
  serviceId: string;
  /** Location name (e.g., "Lidl Graniittitalo") */
  name: string;
  /** Street address */
  address: string;
  /** City */
  city: string;
  /** Postal code */
  postalCode: string;
  /** Price in cents (0 if free shipping applies) */
  price: number;
  /** Original price in cents (always the base price before free shipping) */
  originalPrice: number;
  /** Free shipping threshold in cents, null = no free shipping available for this method */
  freeShippingThreshold: number | null;
  /** Carrier logo URL */
  logo: string | null;
  /** Provider type */
  provider: "shipit" | "custom";
  /** Carrier name (e.g., "Posti", "Matkahuolto") */
  carrier: string | null;
  /** Distance from customer's postal code in meters */
  distance: number | null;
  /** Structured opening hours */
  openingHours: OpeningHours | null;
  /** GPS coordinates */
  coordinates: { lat: number; lng: number } | null;
}

// =============================================================================
// API Response
// =============================================================================

/**
 * Response from GET /shipment-methods/[postalCode]
 *
 * Returns unified shipping options regardless of provider.
 * Pickup points are sorted by distance, home delivery by price.
 */
export interface ShipmentMethodsResponse {
  /** Home delivery options (sorted by price) */
  homeDelivery: HomeDeliveryOption[];
  /** Pickup point options (sorted by distance) */
  pickupPoints: PickupPointOption[];
  /** Lowest free shipping threshold across ALL applicable methods.
   *  Use this for "Add €X for free shipping" messages to show the easiest path to free shipping.
   *  null if no methods have free shipping thresholds configured. */
  lowestFreeShippingThreshold: number | null;
}

