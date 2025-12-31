/**
 * Pricing Utilities
 *
 * Helper functions for calculating prices with sale logic.
 */

import type { ProductDetail, ProductVariation } from "../types/products.js";
import type { PriceInfo } from "../types/cart.js";

/**
 * Check if a sale is currently active based on start and end dates.
 *
 * @param startDate - Sale start date (ISO string, Date, null, or undefined)
 * @param endDate - Sale end date (ISO string, Date, null, or undefined)
 * @returns true if the sale is currently active
 *
 * @example
 * ```typescript
 * // No dates = always active
 * isSaleActive(null, null); // true
 *
 * // Only start date = active if past start
 * isSaleActive("2024-01-01", null); // true if today >= Jan 1
 *
 * // Both dates = active if within range
 * isSaleActive("2024-01-01", "2024-12-31"); // true if within range
 * ```
 */
export function isSaleActive(
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): boolean {
  // If no dates are set, sale is considered active
  if (!startDate && !endDate) {
    return true;
  }

  const now = new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  // If only start date is set
  if (start && !end) {
    return now >= start;
  }

  // If only end date is set
  if (!start && end) {
    return now <= end;
  }

  // If both dates are set
  if (start && end) {
    return now >= start && now <= end;
  }

  return true;
}

/**
 * Get price information for a product or variation.
 * Returns the effective price (sale or regular) and sale status.
 * All prices are in cents.
 *
 * @param product - The product to get price info for
 * @param variation - Optional variation (takes precedence over product price)
 * @returns Price information with effective price, original price, and sale status
 *
 * @example
 * ```typescript
 * // Product without variation
 * const priceInfo = getPriceInfo(product);
 * console.log(priceInfo.effectivePrice); // 1990 (cents)
 * console.log(priceInfo.isOnSale); // true
 *
 * // Product with selected variation
 * const priceInfo = getPriceInfo(product, selectedVariation);
 * ```
 */
export function getPriceInfo(
  product: ProductDetail,
  variation?: ProductVariation
): PriceInfo {
  if (variation) {
    // Use variation pricing
    const isOnSale =
      isSaleActive(variation.saleStartDate, variation.saleEndDate) &&
      variation.salePrice !== null;

    const originalPrice = variation.price ?? product.price;
    const effectivePrice = isOnSale
      ? (variation.salePrice ?? originalPrice)
      : originalPrice;

    return {
      effectivePrice,
      originalPrice,
      isOnSale,
      salePercent: isOnSale ? (variation.salePercent ?? null) : null,
    };
  }

  // Use product pricing
  const isOnSale =
    isSaleActive(product.saleStartDate, product.saleEndDate) &&
    product.salePrice !== null;

  const originalPrice = product.price;
  const effectivePrice = isOnSale
    ? (product.salePrice ?? originalPrice)
    : originalPrice;

  return {
    effectivePrice,
    originalPrice,
    isOnSale,
    salePercent: isOnSale ? (product.salePercent ?? null) : null,
  };
}
