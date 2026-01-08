/**
 * Shipping Resource
 *
 * Methods for fetching shipment methods and pickup locations.
 */

import type {
  FetchOptions,
  ShipmentMethodsResponse,
  ShipmentMethodsWithLocationsResponse,
} from "../types/index.js";
import type { Fetcher } from "../utils/fetch.js";

/**
 * Options for fetching shipment methods with weight-based filtering
 */
export interface GetMethodsOptions extends FetchOptions {
  /** Cart weight in kg - filters methods by max weight */
  cartWeight?: number;
}

/**
 * Shipping resource for fetching shipment methods and pickup locations
 */
export function createShippingResource(fetcher: Fetcher) {
  return {
    /**
     * Get all available shipment methods for the store.
     * Returns methods without pickup locations - use `getWithLocations` for postal code specific data.
     *
     * @param options - Fetch options including optional cartWeight for weight-based filtering
     * @returns Available shipment methods
     *
     * @example
     * ```typescript
     * const { shipmentMethods } = await client.shipping.getMethods();
     *
     * shipmentMethods.forEach(method => {
     *   console.log(`${method.name}: ${method.price / 100}€`);
     * });
     * ```
     *
     * @example Weight-based filtering
     * ```typescript
     * // Calculate cart weight
     * const cartWeight = cartItems.reduce((total, item) => {
     *   const weight = item.variation?.weight ?? item.product.weight;
     *   return total + weight * item.quantity;
     * }, 0);
     *
     * // Get methods that support this weight
     * const { shipmentMethods } = await client.shipping.getMethods({
     *   cartWeight: cartWeight
     * });
     * ```
     */
    async getMethods(
      options?: GetMethodsOptions
    ): Promise<ShipmentMethodsResponse> {
      const params = new URLSearchParams();
      if (options?.cartWeight !== undefined) {
        params.set("cartWeight", options.cartWeight.toString());
      }
      const queryString = params.toString();
      const url = `/api/storefront/v1/shipment-methods${queryString ? `?${queryString}` : ""}`;

      return fetcher.request<ShipmentMethodsResponse>(url, {
        method: "GET",
        ...options,
      });
    },

    /**
     * Get shipment methods with pickup locations for a specific postal code.
     * Calls the Shipit API to fetch nearby pickup points (parcel lockers, etc.)
     *
     * @param postalCode - Customer's postal code (e.g., "00100")
     * @param options - Fetch options including optional cartWeight for weight-based filtering
     * @returns Shipment methods and nearby pickup locations with pricing
     *
     * @example
     * ```typescript
     * const { shipmentMethods, pricedLocations } = await client.shipping.getWithLocations("00100");
     *
     * // Show pickup locations
     * pricedLocations.forEach(location => {
     *   console.log(`${location.name} - ${location.carrier}`);
     *   console.log(`  ${location.address1}, ${location.city}`);
     *   console.log(`  ${location.distanceInKilometers.toFixed(1)} km away`);
     *   console.log(`  Price: ${(location.merchantPrice ?? 0) / 100}€`);
     * });
     * ```
     *
     * @example Weight-based filtering with postal code
     * ```typescript
     * const { shipmentMethods, pricedLocations } = await client.shipping.getWithLocations(
     *   "00100",
     *   { cartWeight: 2.5 }
     * );
     *
     * // Only shows methods where maxWeight >= 2.5kg
     * ```
     */
    async getWithLocations(
      postalCode: string,
      options?: GetMethodsOptions
    ): Promise<ShipmentMethodsWithLocationsResponse> {
      const params = new URLSearchParams();
      if (options?.cartWeight !== undefined) {
        params.set("cartWeight", options.cartWeight.toString());
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
