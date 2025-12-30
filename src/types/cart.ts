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
 * Changes detected during cart validation
 */
export interface CartValidationChanges {
  /** Number of items removed (product deleted or out of stock) */
  removedItems: number;
  /** Number of items with adjusted quantity (insufficient stock) */
  quantityAdjusted: number;
  /** Number of items with changed price */
  priceChanged: number;
}

/**
 * Response from GET /cart/validate
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
