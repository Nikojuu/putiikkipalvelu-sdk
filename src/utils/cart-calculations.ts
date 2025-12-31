/**
 * Cart Calculation Utilities
 *
 * Functions for calculating cart totals with campaign discounts.
 */

import type { CartItem } from "../types/cart.js";
import type { Campaign } from "../types/storeconfig.js";
import type {
  CalculatedCartItem,
  FreeShippingStatus,
  CartCalculationResult,
} from "../types/cart.js";
import { getPriceInfo } from "./pricing.js";

/**
 * Internal type for tracking eligible units in Buy X Pay Y campaigns
 */
interface EligibleUnit {
  price: number;
  productId: string;
  variationId?: string;
  originalItem: CartItem;
}

/**
 * Calculate cart totals with campaign discounts applied.
 *
 * Supports two campaign types:
 * - **FREE_SHIPPING**: Free shipping when cart total exceeds minimum spend
 * - **BUY_X_PAY_Y**: Buy X items, pay for Y (e.g., Buy 3 Pay 2 = 1 free item)
 *
 * @param items - Cart items to calculate
 * @param campaigns - Active campaigns to apply
 * @returns Calculation result with totals, savings, and free shipping status
 *
 * @example
 * ```typescript
 * const result = calculateCartWithCampaigns(cartItems, activeCampaigns);
 *
 * console.log(result.cartTotal);     // 4990 (cents)
 * console.log(result.totalSavings);  // 1990 (cents)
 * console.log(result.freeShipping.isEligible); // true
 *
 * // Render calculated items
 * result.calculatedItems.forEach(({ item, paidQuantity, freeQuantity }) => {
 *   console.log(`${item.product.name}: ${paidQuantity} paid, ${freeQuantity} free`);
 * });
 * ```
 */
export function calculateCartWithCampaigns(
  items: CartItem[],
  campaigns: Campaign[]
): CartCalculationResult {
  // Find applicable campaigns
  const freeShippingCampaign = campaigns.find(
    (c) => c.type === "FREE_SHIPPING" && c.isActive
  );
  const buyXPayYCampaign = campaigns.find(
    (c) => c.type === "BUY_X_PAY_Y" && c.isActive
  );

  // Calculate original total (without campaign discounts)
  const originalTotal = items.reduce((total, { product, variation, cartQuantity }) => {
    const priceInfo = getPriceInfo(product, variation);
    return total + priceInfo.effectivePrice * cartQuantity;
  }, 0);

  // No Buy X Pay Y campaign - return items as-is
  if (!buyXPayYCampaign?.BuyXPayYCampaign) {
    const calculatedItems = items.map((item) => ({
      item,
      paidQuantity: item.cartQuantity,
      freeQuantity: 0,
      totalQuantity: item.cartQuantity,
    }));

    const freeShipping = calculateFreeShipping(
      originalTotal,
      freeShippingCampaign
    );

    return {
      calculatedItems,
      cartTotal: originalTotal,
      originalTotal,
      totalSavings: 0,
      freeShipping,
    };
  }

  // Apply Buy X Pay Y campaign
  const { buyQuantity, payQuantity, applicableCategories } =
    buyXPayYCampaign.BuyXPayYCampaign;
  const applicableCategoryIds = new Set(
    applicableCategories.map((c) => c.id)
  );

  // Find all individual units eligible for the campaign
  const eligibleUnits: EligibleUnit[] = items.flatMap((item) => {
    const { product, variation } = item;
    const itemCategories = product.categories?.map((cat) => cat.id) || [];

    // Check if any of the product's categories are in the campaign's list
    const isEligible = itemCategories.some((id) =>
      applicableCategoryIds.has(id)
    );

    if (isEligible) {
      const priceInfo = getPriceInfo(product, variation);

      // Create an entry for each single unit of the item
      return Array.from({ length: item.cartQuantity }, () => ({
        price: priceInfo.effectivePrice,
        productId: product.id,
        variationId: variation?.id,
        originalItem: item,
      }));
    }

    return [];
  });

  // Not enough eligible items - return original quantities
  if (eligibleUnits.length < buyQuantity) {
    const calculatedItems = items.map((item) => ({
      item,
      paidQuantity: item.cartQuantity,
      freeQuantity: 0,
      totalQuantity: item.cartQuantity,
    }));

    const freeShipping = calculateFreeShipping(
      originalTotal,
      freeShippingCampaign
    );

    return {
      calculatedItems,
      cartTotal: originalTotal,
      originalTotal,
      totalSavings: 0,
      freeShipping,
    };
  }

  // Sort by price to find the cheapest items to make free
  eligibleUnits.sort((a, b) => a.price - b.price);

  const numToMakeFree = buyQuantity - payQuantity;
  const itemsToMakeFree = eligibleUnits.slice(0, numToMakeFree);

  // Calculate total savings from free items
  const totalSavings = itemsToMakeFree.reduce(
    (sum, item) => sum + item.price,
    0
  );

  // Create a map to count how many units of each product/variation should be free
  const freeCountMap = new Map<string, number>();
  for (const freebie of itemsToMakeFree) {
    const key = `${freebie.productId}${freebie.variationId ? `_${freebie.variationId}` : ""}`;
    freeCountMap.set(key, (freeCountMap.get(key) || 0) + 1);
  }

  // Calculate paid and free quantities for each item
  const calculatedItems: CalculatedCartItem[] = items.map((item) => {
    const key = `${item.product.id}${item.variation?.id ? `_${item.variation.id}` : ""}`;
    const freeQuantity = freeCountMap.get(key) || 0;
    const paidQuantity = item.cartQuantity - freeQuantity;

    return {
      item,
      paidQuantity: Math.max(0, paidQuantity),
      freeQuantity,
      totalQuantity: item.cartQuantity,
    };
  });

  // Calculate final cart total after Buy X Pay Y discounts
  const cartTotal = originalTotal - totalSavings;

  // Calculate free shipping using the final cart total
  const freeShipping = calculateFreeShipping(cartTotal, freeShippingCampaign);

  return {
    calculatedItems,
    cartTotal,
    originalTotal,
    totalSavings,
    freeShipping,
  };
}

/**
 * Calculate free shipping eligibility
 */
function calculateFreeShipping(
  cartTotal: number,
  campaign?: Campaign
): FreeShippingStatus {
  if (!campaign?.FreeShippingCampaign) {
    return {
      isEligible: false,
      minimumSpend: 0,
      remainingAmount: 0,
    };
  }

  const minimumSpend = campaign.FreeShippingCampaign.minimumSpend;
  const isEligible = cartTotal >= minimumSpend;
  const remainingAmount = isEligible ? 0 : minimumSpend - cartTotal;

  // Extract eligible shipment method IDs from the campaign
  const eligibleShipmentMethodIds = campaign.FreeShippingCampaign.shipmentMethods?.map(
    (method) => method.id
  );

  return {
    isEligible,
    minimumSpend,
    remainingAmount,
    campaignName: campaign.name,
    eligibleShipmentMethodIds,
  };
}
