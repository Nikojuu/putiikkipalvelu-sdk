/**
 * Discount Code Resource
 *
 * Provides methods for managing discount codes in the cart.
 */

import type {
  ApplyDiscountParams,
  ApplyDiscountResponse,
  GetDiscountParams,
  GetDiscountResponse,
  RemoveDiscountParams,
  RemoveDiscountResponse,
} from "../types/index.js";
import type { Fetcher } from "../utils/fetch.js";
import { calculateCartWithCampaigns } from "../utils/cart-calculations.js";
import { StorefrontError } from "../utils/errors.js";
import { getPriceInfo } from "../utils/pricing.js";

/**
 * Creates the discount code resource with methods for managing discount codes.
 */
export function createDiscountCodeResource(fetcher: Fetcher) {
  return {
    /**
     * Apply a discount code to the cart
     *
     * Checks for BuyXPayY campaign conflict before calling API.
     * Discount codes cannot be used when a campaign discount is active.
     *
     * @param params - Parameters including code, session info, and cart/campaign data for conflict check
     * @returns Applied discount details
     * @throws {StorefrontError} With code "CAMPAIGN_ACTIVE" if a BuyXPayY campaign is active
     *
     * @example
     * ```typescript
     * const result = await client.discountCode.apply({
     *   code: "SUMMER20",
     *   cartId: cartId,
     *   cartItems: cart.items,
     *   campaigns: storeConfig.campaigns,
     * });
     * ```
     */
    async apply(params: ApplyDiscountParams): Promise<ApplyDiscountResponse> {
      const { code, cartId, sessionId, cartItems, campaigns } = params;

      // Check for campaign conflict BEFORE calling API
      if (cartItems && campaigns && cartItems.length > 0) {
        const campaignResult = calculateCartWithCampaigns(cartItems, campaigns);
        if (campaignResult.totalSavings > 0) {
          throw new StorefrontError(
            "Alennuskoodia ei voi käyttää kun kampanja-alennus on voimassa",
            400,
            "CAMPAIGN_ACTIVE"
          );
        }
      }

      // Calculate cart total from items using effective price (handles sale prices)
      const cartTotal = cartItems
        ? cartItems.reduce((sum, item) => {
            const priceInfo = getPriceInfo(item.product, item.variation);
            return sum + priceInfo.effectivePrice * item.cartQuantity;
          }, 0)
        : 0;

      return fetcher.request<ApplyDiscountResponse>("/api/storefront/v1/discount-code/apply", {
        method: "POST",
        body: { code, cartTotal },
        headers: {
          ...(cartId && { "x-cart-id": cartId }),
          ...(sessionId && { "x-session-id": sessionId }),
        },
      });
    },

    /**
     * Get the currently applied discount code
     *
     * @param params - Session info (cartId or sessionId)
     * @returns Current discount or null if none applied
     *
     * @example
     * ```typescript
     * const { discount } = await client.discountCode.get({ cartId });
     * if (discount) {
     *   console.log(`Code ${discount.code}: ${discount.discountValue}${discount.discountType === 'PERCENTAGE' ? '%' : '¢'} off`);
     * }
     * ```
     */
    async get(params: GetDiscountParams = {}): Promise<GetDiscountResponse> {
      const { cartId, sessionId } = params;

      return fetcher.request<GetDiscountResponse>("/api/storefront/v1/discount-code/apply", {
        method: "GET",
        headers: {
          ...(cartId && { "x-cart-id": cartId }),
          ...(sessionId && { "x-session-id": sessionId }),
        },
      });
    },

    /**
     * Remove the currently applied discount code
     *
     * @param params - Session info (cartId or sessionId)
     * @returns Success status
     *
     * @example
     * ```typescript
     * await client.discountCode.remove({ cartId });
     * ```
     */
    async remove(params: RemoveDiscountParams = {}): Promise<RemoveDiscountResponse> {
      const { cartId, sessionId } = params;

      return fetcher.request<RemoveDiscountResponse>("/api/storefront/v1/discount-code/apply", {
        method: "DELETE",
        headers: {
          ...(cartId && { "x-cart-id": cartId }),
          ...(sessionId && { "x-session-id": sessionId }),
        },
      });
    },
  };
}

/**
 * Type for the discount code resource
 */
export type DiscountCodeResource = ReturnType<typeof createDiscountCodeResource>;
