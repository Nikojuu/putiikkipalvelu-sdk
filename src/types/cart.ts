/**
 * Cart Types
 *
 * Types for cart-related API endpoints.
 */

import type { ProductDetail, ProductVariation } from "./products.js";

// =============================================================================
// Cart Items
// =============================================================================

/**
 * A single item in the shopping cart
 */
export interface CartItem {
  /** Full product details */
  product: ProductDetail;
  /** Quantity of this item in the cart */
  cartQuantity: number;
  /** Selected variation (if product has variations) */
  variation?: ProductVariation;
}

// =============================================================================
// Cart API Responses
// =============================================================================

/**
 * Response from GET /cart, POST /cart, PATCH /cart, DELETE /cart
 */
export interface CartResponse {
  /** Items currently in the cart */
  items: CartItem[];
  /** Cart ID for guest users (undefined for logged-in users) */
  cartId?: string;
}

/**
 * Reason why a discount code was removed during validation
 */
export type DiscountRemovalReason =
  | "CAMPAIGN_ACTIVE"
  | "MIN_ORDER_NOT_MET"
  | "CODE_INVALID";

/**
 * Changes detected during cart validation
 */
export interface CartValidationChanges {
  /** Number of items removed (product deleted or out of stock) */
  removedItems: number;
  /** Number of items with adjusted quantity (insufficient stock) */
  quantityAdjusted: number;
  /** Number of items with changed price */
  priceChanged: number;
  /** Whether discount code was removed */
  discountCouponRemoved: boolean;
  /** Reason why discount was removed (only present if discountCouponRemoved is true) */
  discountRemovalReason?: DiscountRemovalReason;
}

/**
 * Response from GET /cart/validate
 *
 * Returns validated cart items and change metadata.
 * No totals or discount data - those are calculated client-side or fetched separately.
 */
export interface CartValidationResponse {
  /** Validated cart items (with auto-fixed quantities/prices) */
  items: CartItem[];
  /** Whether any changes were made during validation */
  hasChanges: boolean;
  /** Details about what changed */
  changes: CartValidationChanges;
}

// =============================================================================
// Cart API Request Parameters
// =============================================================================

/**
 * Options for cart operations that require session context
 */
export interface CartSessionOptions {
  /** Cart ID for guest users (from cookie or local storage) */
  cartId?: string;
  /** Session ID for logged-in users (from auth cookie) */
  sessionId?: string;
}

/**
 * Parameters for adding an item to cart
 */
export interface AddToCartParams extends CartSessionOptions {
  /** Product ID to add */
  productId: string;
  /** Variation ID (required if product has variations) */
  variationId?: string;
  /** Quantity to add (default: 1) */
  quantity?: number;
}

/**
 * Parameters for updating cart item quantity
 */
export interface UpdateCartQuantityParams extends CartSessionOptions {
  /** Product ID to update */
  productId: string;
  /** Variation ID (if applicable) */
  variationId?: string;
  /** Quantity change: positive to add, negative to subtract */
  delta: number;
}

/**
 * Parameters for removing an item from cart
 */
export interface RemoveFromCartParams extends CartSessionOptions {
  /** Product ID to remove */
  productId: string;
  /** Variation ID (if applicable) */
  variationId?: string;
}

// =============================================================================
// Pricing Types
// =============================================================================

/**
 * Price information for a product or variation
 */
export interface PriceInfo {
  /** Current effective price in cents (sale price if on sale, otherwise regular) */
  effectivePrice: number;
  /** Original/regular price in cents */
  originalPrice: number;
  /** Whether the item is currently on sale */
  isOnSale: boolean;
  /** Sale percentage (e.g., "-20%") if applicable */
  salePercent: string | null;
}

// =============================================================================
// Cart Calculation Types
// =============================================================================

/**
 * A cart item with calculated paid and free quantities (for Buy X Pay Y campaigns)
 */
export interface CalculatedCartItem {
  /** Original cart item */
  item: CartItem;
  /** Number of units the customer pays for */
  paidQuantity: number;
  /** Number of units that are free (from campaign) */
  freeQuantity: number;
  /** Total quantity in cart */
  totalQuantity: number;
}

/**
 * Result of cart calculation with campaigns applied
 */
export interface CartCalculationResult {
  /** Cart items with paid/free quantities calculated */
  calculatedItems: CalculatedCartItem[];
  /** Final cart total after discounts (in cents) */
  cartTotal: number;
  /** Original cart total before discounts (in cents) */
  originalTotal: number;
  /** Total savings from campaigns (in cents) */
  totalSavings: number;
}
