import type {
  FetchOptions,
  CheckoutParams,
  StripeCheckoutResponse,
  PaytrailCheckoutResponse,
} from "../types/index.js";
import type { Fetcher } from "../utils/fetch.js";

/**
 * Extended options for checkout requests
 *
 * Checkout requires cart and session context via headers.
 */
export interface CheckoutOptions extends FetchOptions {
  /**
   * Cart ID for guest checkout.
   * Pass this when the user is not logged in.
   */
  cartId?: string;
  /**
   * Session ID for authenticated checkout.
   * Pass this when the user is logged in.
   */
  sessionId?: string;
}

/**
 * Checkout resource for payment processing
 *
 * Handles both Stripe and Paytrail payment providers.
 */
export function createCheckoutResource(fetcher: Fetcher) {
  /**
   * Build headers with cart/session context
   */
  function buildCheckoutHeaders(options?: CheckoutOptions): Record<string, string> {
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
   * Build checkout request body
   */
  function buildCheckoutBody(params: CheckoutParams) {
    return {
      orderId: params.orderId,
      chosenShipmentMethod: params.shipmentMethod,
      customerData: params.customerData,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      ...(params.ticketHolders && { ticketHolders: params.ticketHolders }),
    };
  }

  return {
    /**
     * Create a Stripe checkout session.
     *
     * Redirects the user to Stripe's hosted checkout page.
     * Cart items are validated and stock is reserved on the server.
     *
     * @param params - Checkout parameters (customer data, shipping, URLs)
     * @param options - Checkout options including cart/session context
     * @returns URL to redirect user to Stripe checkout
     * @throws ValidationError for invalid data or empty cart
     * @throws StorefrontError for inventory issues
     *
     * @example Basic usage with redirect
     * ```typescript
     * const { url } = await client.checkout.stripe({
     *   customerData: {
     *     first_name: "John",
     *     last_name: "Doe",
     *     email: "john@example.com",
     *     address: "123 Main St",
     *     postal_code: "00100",
     *     city: "Helsinki",
     *     phone: "+358401234567"
     *   },
     *   shipmentMethod: {
     *     shipmentMethodId: "ship_123",
     *     pickupId: null
     *   },
     *   orderId: "order_abc123",
     *   successUrl: "https://mystore.com/success",
     *   cancelUrl: "https://mystore.com/cancel"
     * }, {
     *   cartId: "cart_xyz",  // For guest users
     *   sessionId: "sess_123" // For logged-in users
     * });
     *
     * // Redirect to Stripe
     * window.location.href = url;
     * ```
     */
    async stripe(
      params: CheckoutParams,
      options?: CheckoutOptions
    ): Promise<StripeCheckoutResponse> {
      const headers = buildCheckoutHeaders(options);
      const body = buildCheckoutBody(params);

      return fetcher.request<StripeCheckoutResponse>(
        "/api/storefront/v1/payments/stripe/checkout",
        {
          method: "POST",
          body,
          headers: {
            ...options?.headers,
            ...headers,
          },
          ...options,
        }
      );
    },

    /**
     * Create a Paytrail checkout session.
     *
     * Returns payment providers for Finnish payment methods.
     * Cart items are validated and stock is reserved on the server.
     *
     * @param params - Checkout parameters (customer data, shipping, URLs)
     * @param options - Checkout options including cart/session context
     * @returns Paytrail response with available payment providers
     * @throws ValidationError for invalid data or empty cart
     * @throws StorefrontError for inventory issues
     *
     * @example Display payment providers
     * ```typescript
     * const response = await client.checkout.paytrail({
     *   customerData: {
     *     first_name: "Matti",
     *     last_name: "Meikäläinen",
     *     email: "matti@example.fi",
     *     address: "Mannerheimintie 1",
     *     postal_code: "00100",
     *     city: "Helsinki",
     *     phone: "+358401234567"
     *   },
     *   shipmentMethod: {
     *     shipmentMethodId: "ship_123",
     *     pickupId: "pickup_456" // For pickup points
     *   },
     *   orderId: "order_abc123",
     *   successUrl: "https://mystore.com/success",
     *   cancelUrl: "https://mystore.com/cancel"
     * }, {
     *   cartId: "cart_xyz"
     * });
     *
     * // Group providers by type
     * const banks = response.providers.filter(p => p.group === "bank");
     * const mobile = response.providers.filter(p => p.group === "mobile");
     * const cards = response.providers.filter(p => p.group === "creditcard");
     * ```
     *
     * @example Submit payment form
     * ```typescript
     * const provider = response.providers.find(p => p.id === "nordea");
     *
     * // Create and submit a form
     * const form = document.createElement("form");
     * form.method = "POST";
     * form.action = provider.url;
     *
     * provider.parameters.forEach(({ name, value }) => {
     *   const input = document.createElement("input");
     *   input.type = "hidden";
     *   input.name = name;
     *   input.value = value;
     *   form.appendChild(input);
     * });
     *
     * document.body.appendChild(form);
     * form.submit();
     * ```
     */
    async paytrail(
      params: CheckoutParams,
      options?: CheckoutOptions
    ): Promise<PaytrailCheckoutResponse> {
      const headers = buildCheckoutHeaders(options);
      const body = buildCheckoutBody(params);

      return fetcher.request<PaytrailCheckoutResponse>(
        "/api/storefront/v1/payments/paytrail/checkout",
        {
          method: "POST",
          body,
          headers: {
            ...options?.headers,
            ...headers,
          },
          ...options,
        }
      );
    },
  };
}

/**
 * Type for the checkout resource
 */
export type CheckoutResource = ReturnType<typeof createCheckoutResource>;
