/**
 * Shipping Resource
 *
 * Methods for fetching shipment methods and pickup locations.
 */

import type {
  FetchOptions,
  ShipmentMethodsWithLocationsResponse,
  CartItem,
} from "../types/index.js";
import type { Fetcher } from "../utils/fetch.js";

/**
 * Calculate total cart weight from cart items
 */
function calculateCartWeight(items: CartItem[]): number {
  return items.reduce((total, item) => {
    const itemWeight = item.variation?.weight ?? item.product.weight ?? 0.5;
    return total + itemWeight * item.cartQuantity;
  }, 0);
}

/**
 * Options for fetching shipment methods with weight-based filtering
 */
export interface GetMethodsOptions extends FetchOptions {
  /** Cart items - weight will be calculated automatically */
  cartItems?: CartItem[];
}

/**
 * Shipping resource for fetching shipment methods and pickup locations
 */
export function createShippingResource(fetcher: Fetcher) {
  return {
    /**
     * Get shipping options for a specific postal code.
     * Returns home delivery methods and pickup locations.
     *
     * @param postalCode - Customer's postal code (e.g., "00100")
     * @param options - Fetch options including optional cartItems for weight-based filtering
     * @returns Home delivery methods and pickup locations
     *
     * @example
     * ```typescript
     * const { homeDeliveryMethods, pickupLocations } = await client.shipping.getWithLocations("00100");
     *
     * // Show home delivery options
     * homeDeliveryMethods.forEach(method => {
     *   console.log(`${method.name}: ${method.price / 100}€`);
     * });
     *
     * // Show pickup locations
     * pickupLocations.forEach(location => {
     *   console.log(`${location.name} - ${location.carrier}`);
     *   console.log(`  ${location.address1}, ${location.city}`);
     *   console.log(`  ${location.distanceInKilometers.toFixed(1)} km away`);
     *   console.log(`  Price: ${location.price / 100}€`);
     * });
     * ```
     *
     * @example Weight-based filtering
     * ```typescript
     * const { homeDeliveryMethods, pickupLocations } = await client.shipping.getWithLocations(
     *   "00100",
     *   { cartItems: cartItems }
     * );
     * // Only shows methods that support the cart's total weight
     * ```
     */
    async getWithLocations(
      postalCode: string,
      options?: GetMethodsOptions
    ): Promise<ShipmentMethodsWithLocationsResponse> {
      const params = new URLSearchParams();
      if (options?.cartItems?.length) {
        const cartWeight = calculateCartWeight(options.cartItems);
        params.set("cartWeight", cartWeight.toString());
      }
      const queryString = params.toString();
      const url = `/api/storefront/v1/shipment-methods/${encodeURIComponent(postalCode)}${queryString ? `?${queryString}` : ""}`;

      return fetcher.request<ShipmentMethodsWithLocationsResponse>(url, {
        method: "GET",
        ...options,
      });
    },
  };
}

/**
 * Type for the shipping resource
 */
export type ShippingResource = ReturnType<typeof createShippingResource>;
