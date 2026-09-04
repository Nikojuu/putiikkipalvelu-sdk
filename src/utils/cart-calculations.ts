/**
 * Cart Calculation Utilities
 *
 * Functions for calculating cart totals with campaign discounts.
 */

import type { CartItem } from "../types/cart.js";
import type { Campaign } from "../types/storeconfig.js";
import type {
  CalculatedCartItem,
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
 * Whether a campaign is live right now: toggled active AND inside its date
 * window. The storefront receives every toggled-on campaign from store-config
 * (which is cached server-side for 24 h), so the date window is evaluated
 * here, at render time, rather than on the server — a campaign scheduled for
 * tomorrow shows up tomorrow, and one that ended yesterday disappears today,
 * without waiting on the cache.
 *
 * `endDate` is stored as the end of its day by the dashboard, so `>=` keeps
 * the last day inclusive.
 *
 * @example
 * ```typescript
 * const live = storeConfig.campaigns.filter((c) => isCampaignActive(c));
 * ```
 */
export function isCampaignActive(
  campaign: Campaign,
  now: Date = new Date()
): boolean {
  if (!campaign.isActive) return false;
  if (campaign.startDate && new Date(campaign.startDate) > now) return false;
  if (campaign.endDate && new Date(campaign.endDate) < now) return false;
  return true;
}

/**
 * Calculate cart totals with campaign discounts applied.
 *
 * Supports BUY_X_PAY_Y campaigns: Buy X items, pay for Y (e.g., Buy 3 Pay 2 = 1 free item)
 *
 * @param items - Cart items to calculate
 * @param campaigns - Active campaigns to apply
 * @returns Calculation result with totals and savings
 *
 * @example
 * ```typescript
 * const result = calculateCartWithCampaigns(cartItems, activeCampaigns);
 *
 * console.log(result.cartTotal);     // 4990 (cents)
 * console.log(result.totalSavings);  // 1990 (cents)
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
  const buyXPayYCampaign = campaigns.find(
    (c) => c.type === "BUY_X_PAY_Y" && isCampaignActive(c)
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

    return {
      calculatedItems,
      cartTotal: originalTotal,
      originalTotal,
      totalSavings: 0,
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

  // The offer repeats for every complete set of `buyQuantity` eligible units
  // (6 units in "Osta 3, maksa 2" -> 2 free); the free units are the cheapest
  // across the whole pool. Mirrors the backend checkout engine.
  // Not enough eligible items for one set, or an inverted/equal buy/pay pair
  // (a merchant typo such as "Osta 2, maksa 3" would otherwise make
  // slice(0, -n) mark every unit except the last n free) - return original
  // quantities
  const freePerSet = buyQuantity - payQuantity;
  const completeSets =
    buyQuantity > 0 ? Math.floor(eligibleUnits.length / buyQuantity) : 0;
  const numToMakeFree = freePerSet * completeSets;
  if (freePerSet <= 0 || numToMakeFree <= 0) {
    const calculatedItems = items.map((item) => ({
      item,
      paidQuantity: item.cartQuantity,
      freeQuantity: 0,
      totalQuantity: item.cartQuantity,
    }));

    return {
      calculatedItems,
      cartTotal: originalTotal,
      originalTotal,
      totalSavings: 0,
    };
  }

  // Sort by price to find the cheapest items to make free
  eligibleUnits.sort((a, b) => a.price - b.price);

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

  return {
    calculatedItems,
    cartTotal,
    originalTotal,
    totalSavings,
  };
}
