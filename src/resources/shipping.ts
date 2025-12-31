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
 * Shipping resource for fetching shipment methods and pickup locations
 */
export function createShippingResource(fetcher: Fetcher) {
  return {
    /**
     * Get all available shipment methods for the store.
     * Returns methods without pickup locations - use `getWithLocations` for postal code specific data.
     *
     * @param options - Fetch options (caching, headers, etc.)
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
     */
    async getMethods(options?: FetchOptions): Promise<ShipmentMethodsResponse> {
      return fetcher.request<ShipmentMethodsResponse>(
        "/api/storefront/v1/shipment-methods",
        {
          method: "GET",
          ...options,
        }
      );
    },

    /**
     * Get shipment methods with pickup locations for a specific postal code.
     * Calls the Shipit API to fetch nearby pickup points (parcel lockers, etc.)
     *
     * @param postalCode - Customer's postal code (e.g., "00100")
     * @param options - Fetch options (caching, headers, etc.)
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
     * @example Filter by carrier
     * ```typescript
     * const { pricedLocations } = await client.shipping.getWithLocations("00100");
     *
     * const postiLocations = pricedLocations.filter(
     *   loc => loc.carrier === "Posti"
     * );
     * ```
     */
    async getWithLocations(
      postalCode: string,
      options?: FetchOptions
    ): Promise<ShipmentMethodsWithLocationsResponse> {
      return fetcher.request<ShipmentMethodsWithLocationsResponse>(
        `/api/storefront/v1/shipment-methods/${encodeURIComponent(postalCode)}`,
        {
          method: "GET",
          ...options,
        }
      );
    },
  };
}

/**
 * Type for the shipping resource
 */
export type ShippingResource = ReturnType<typeof createShippingResource>;
