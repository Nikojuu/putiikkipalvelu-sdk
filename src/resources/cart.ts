/**
 * Cart Resource
 *
 * Methods for managing the shopping cart stored in Redis.
 * Supports both guest carts (via cartId) and authenticated user carts (via sessionId).
 */

import type {
  FetchOptions,
  CartResponse,
  CartValidationResponse,
  CartSessionOptions,
  AddToCartParams,
  UpdateCartQuantityParams,
  RemoveFromCartParams,
} from "../types/index.js";
import type { Fetcher } from "../utils/fetch.js";

/**
 * Build headers object for cart operations
 */
function buildCartHeaders(options?: CartSessionOptions): Record<string, string> {
  const headers: Record<string, string> = {};
  if (options?.cartId) {
    headers["x-cart-id"] = options.cartId;
  }
  if (options?.sessionId) {
    headers["x-session-id"] = options.sessionId;
  }
  return headers;
}

/**
 * Cart resource for managing shopping cart
 */
export function createCartResource(fetcher: Fetcher) {
  return {
    /**
     * Fetch the current cart contents.
     *
     * @param options - Cart session options (cartId for guests, sessionId for logged-in users)
     * @param fetchOptions - Fetch options (caching, headers, etc.)
     * @returns Cart items and cartId (for guests)
     *
     * @example Guest user
     * ```typescript
     * const cartId = localStorage.getItem('cart-id');
     * const { items, cartId: newCartId } = await client.cart.get({ cartId });
     * ```
     *
     * @example Logged-in user
     * ```typescript
     * const { items } = await client.cart.get({ sessionId });
     * ```
     */
    async get(
      options?: CartSessionOptions,
      fetchOptions?: FetchOptions
    ): Promise<CartResponse> {
      return fetcher.request<CartResponse>("/api/storefront/v1/cart", {
        method: "GET",
        headers: buildCartHeaders(options),
        ...fetchOptions,
      });
    },

    /**
     * Add an item to the cart.
     * If the item already exists, quantity is incremented.
     *
     * @param params - Add to cart parameters
     * @param fetchOptions - Fetch options
     * @returns Updated cart with new cartId for guests
     * @throws ValidationError if quantity exceeds available stock
     *
     * @example Add product
     * ```typescript
     * const { items, cartId } = await client.cart.addItem({
     *   cartId: existingCartId,
     *   productId: 'prod_123',
     *   quantity: 2
     * });
     * // Save cartId for future requests
     * localStorage.setItem('cart-id', cartId);
     * ```
     *
     * @example Add product with variation
     * ```typescript
     * const { items, cartId } = await client.cart.addItem({
     *   cartId,
     *   productId: 'prod_123',
     *   variationId: 'var_456',
     *   quantity: 1
     * });
     * ```
     */
    async addItem(
      params: AddToCartParams,
      fetchOptions?: FetchOptions
    ): Promise<CartResponse> {
      const { cartId, sessionId, ...body } = params;
      return fetcher.request<CartResponse>("/api/storefront/v1/cart", {
        method: "POST",
        headers: buildCartHeaders({ cartId, sessionId }),
        body: {
          cartId,
          ...body,
        },
        ...fetchOptions,
      });
    },

    /**
     * Update item quantity by delta (atomic operation).
     * Use positive delta to increase, negative to decrease.
     * Minimum quantity is 1 (use removeItem to delete).
     *
     * @param params - Update quantity parameters
     * @param fetchOptions - Fetch options
     * @returns Updated cart
     * @throws NotFoundError if item not in cart or quantity would go below 1
     *
     * @example Increment quantity
     * ```typescript
     * const { items } = await client.cart.updateQuantity({
     *   cartId,
     *   productId: 'prod_123',
     *   delta: 1
     * });
     * ```
     *
     * @example Decrement quantity
     * ```typescript
     * const { items } = await client.cart.updateQuantity({
     *   cartId,
     *   productId: 'prod_123',
     *   variationId: 'var_456',
     *   delta: -1
     * });
     * ```
     */
    async updateQuantity(
      params: UpdateCartQuantityParams,
      fetchOptions?: FetchOptions
    ): Promise<CartResponse> {
      const { cartId, sessionId, ...body } = params;
      return fetcher.request<CartResponse>("/api/storefront/v1/cart", {
        method: "PATCH",
        headers: buildCartHeaders({ cartId, sessionId }),
        body: {
          cartId,
          ...body,
        },
        ...fetchOptions,
      });
    },

    /**
     * Remove an item from the cart.
     *
     * @param params - Remove from cart parameters
     * @param fetchOptions - Fetch options
     * @returns Updated cart
     *
     * @example Remove product
     * ```typescript
     * const { items } = await client.cart.removeItem({
     *   cartId,
     *   productId: 'prod_123'
     * });
     * ```
     *
     * @example Remove variation
     * ```typescript
     * const { items } = await client.cart.removeItem({
     *   cartId,
     *   productId: 'prod_123',
     *   variationId: 'var_456'
     * });
     * ```
     */
    async removeItem(
      params: RemoveFromCartParams,
      fetchOptions?: FetchOptions
    ): Promise<CartResponse> {
      const { cartId, sessionId, ...body } = params;
      return fetcher.request<CartResponse>("/api/storefront/v1/cart", {
        method: "DELETE",
        headers: buildCartHeaders({ cartId, sessionId }),
        body: {
          cartId,
          ...body,
        },
        ...fetchOptions,
      });
    },

    /**
     * Validate cart before checkout.
     * Checks product availability, stock levels, and prices.
     * Auto-fixes issues (removes unavailable items, adjusts quantities).
     *
     * @param options - Cart session options
     * @param fetchOptions - Fetch options
     * @returns Validated cart with change metadata
     *
     * @example Validate before checkout
     * ```typescript
     * const { items, hasChanges, changes } = await client.cart.validate({ cartId });
     *
     * if (hasChanges) {
     *   if (changes.removedItems > 0) {
     *     notify('Some items were removed (out of stock)');
     *   }
     *   if (changes.quantityAdjusted > 0) {
     *     notify('Some quantities were adjusted');
     *   }
     *   if (changes.priceChanged > 0) {
     *     notify('Some prices have changed');
     *   }
     * }
     * ```
     */
    async validate(
      options?: CartSessionOptions,
      fetchOptions?: FetchOptions
    ): Promise<CartValidationResponse> {
      return fetcher.request<CartValidationResponse>(
        "/api/storefront/v1/cart/validate",
        {
          method: "GET",
          headers: buildCartHeaders(options),
          ...fetchOptions,
        }
      );
    },
  };
}

/**
 * Type for the cart resource
 */
export type CartResource = ReturnType<typeof createCartResource>;
