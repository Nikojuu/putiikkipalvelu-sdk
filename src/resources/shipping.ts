/**
 * Shipping Resource
 *
 * Methods for fetching shipment methods and pickup locations.
 */

import type {
  FetchOptions,
  ShipmentMethodsResponse,
  CartItem,
  Campaign,
} from "../types/index.js";
import type { Fetcher } from "../utils/fetch.js";
import { calculateCartWithCampaigns } from "../utils/cart-calculations.js";

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
 * Calculate total cart value in cents from cart items
 * Uses sale price if available, otherwise regular price
 */
function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => {
    // Use variation price if exists, otherwise product price
    // Prefer salePrice over regular price
    const itemPrice = item.variation
      ? (item.variation.salePrice ?? item.variation.price)
      : (item.product.salePrice ?? item.product.price);
    return total + itemPrice * item.cartQuantity;
  }, 0);
}

/**
 * Options for fetching shipment methods with weight-based filtering
 */
export interface GetShippingOptionsParams extends FetchOptions {
  /** Cart items - weight and total will be calculated automatically */
  cartItems?: CartItem[];
  /** Active campaigns - used to calculate cart total with discounts for free shipping */
  campaigns?: Campaign[];
  /** Discount amount in cents (from discount code) - subtracted from cart total for free shipping threshold */
  discountAmount?: number;
  /** Country code (default: "FI") */
  country?: string;
}

/**
 * Shipping resource for fetching shipment methods and pickup locations
 */
export function createShippingResource(fetcher: Fetcher) {
  return {
    /**
     * Get shipping options for a specific postal code.
     * Returns pickup points and home delivery options in a unified format.
     *
     * **Pickup points are returned first** as they are more popular in Finland.
     *
     * @param postalCode - Customer's postal code (e.g., "00100")
     * @param options - Fetch options including optional cartItems for weight-based filtering
     * @returns Unified shipping options (pickupPoints sorted by distance, homeDelivery sorted by price)
     *
     * @example
     * ```typescript
     * const { pickupPoints, homeDelivery } = await client.shipping.getOptions("00100");
     *
     * // Show pickup points (more popular in Finland)
     * pickupPoints.forEach(point => {
     *   console.log(`${point.name} - ${point.carrier}`);
     *   console.log(`  ${point.address}, ${point.city}`);
     *   console.log(`  ${(point.distance! / 1000).toFixed(1)} km away`);
     *   console.log(`  Price: ${point.price / 100}€`);
     * });
     *
     * // Show home delivery options
     * homeDelivery.forEach(option => {
     *   console.log(`${option.name}: ${option.price / 100}€`);
     *   if (option.estimatedDelivery) {
     *     console.log(`  Delivery: ${option.estimatedDelivery} days`);
     *   }
     * });
     * ```
     *
     * @example Weight-based filtering
     * ```typescript
     * const options = await client.shipping.getOptions("00100", {
     *   cartItems: cartItems
     * });
     * // Only shows methods that support the cart's total weight
     * ```
     *
     * @example International shipping
     * ```typescript
     * const options = await client.shipping.getOptions("112 22", {
     *   country: "SE"
     * });
     * ```
     */
    async getOptions(
      postalCode: string,
      options?: GetShippingOptionsParams
    ): Promise<ShipmentMethodsResponse> {
      const params = new URLSearchParams();

      if (options?.cartItems?.length) {
        const cartWeight = calculateCartWeight(options.cartItems);
        params.set("cartWeight", cartWeight.toString());

        // Send cart total for free shipping calculation
        // Use calculateCartWithCampaigns if campaigns provided (accounts for campaign discounts)
        const cartTotal = options.campaigns
          ? calculateCartWithCampaigns(options.cartItems, options.campaigns).cartTotal
          : calculateCartTotal(options.cartItems);

        // Subtract discount code amount if provided (ensures free shipping threshold uses total after discount)
        const finalCartTotal = options.discountAmount
          ? Math.max(0, cartTotal - options.discountAmount)
          : cartTotal;

        params.set("cartTotal", finalCartTotal.toString());
      }

      if (options?.country) {
        params.set("country", options.country);
      }

      const queryString = params.toString();
      const url = `/api/storefront/v1/shipment-methods/${encodeURIComponent(postalCode)}${queryString ? `?${queryString}` : ""}`;

      return fetcher.request<ShipmentMethodsResponse>(url, {
        method: "GET",
        ...options,
      });
    },

    /**
     * @deprecated Use getOptions() instead. This method is kept for backwards compatibility.
     */
    async getWithLocations(
      postalCode: string,
      options?: GetShippingOptionsParams
    ): Promise<ShipmentMethodsResponse> {
      return this.getOptions(postalCode, options);
    },
  };
}

/**
 * Type for the shipping resource
 */
export type ShippingResource = ReturnType<typeof createShippingResource>;
