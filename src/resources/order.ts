import type {
  FetchOptions,
  Order,
  OrderDownloadsResponse,
  DownloadUrlResponse,
  DownloadsAuthOptions,
  ReleasePendingOrderResponse,
} from "../types/index.js";
import type { Fetcher } from "../utils/fetch.js";

function buildDownloadAuthHeaders(
  auth?: DownloadsAuthOptions
): Record<string, string> {
  const headers: Record<string, string> = {};
  if (auth?.sessionId) headers["x-session-id"] = auth.sessionId;
  return headers;
}

/**
 * Order resource for fetching order details and digital downloads
 *
 * Used for order confirmation pages and viewing order details.
 * For customer order history, use the customer.getOrders() method instead.
 */
export function createOrderResource(fetcher: Fetcher) {
  return {
    /**
     * Get order details by ID.
     *
     * Retrieves complete order information including line items,
     * customer data, and shipment method with tracking info.
     *
     * @param orderId - The order ID to fetch
     * @param options - Fetch options (caching, headers, etc.)
     * @returns Complete order details
     * @throws NotFoundError if order doesn't exist or belongs to different store
     *
     * @example Basic usage (order confirmation page)
     * ```typescript
     * const order = await client.order.get(orderId);
     * console.log(`Order #${order.orderNumber} - ${order.status}`);
     * console.log(`Total: ${order.totalAmount / 100} EUR`);
     * ```
     */
    async get(orderId: string, options?: FetchOptions): Promise<Order> {
      return fetcher.request<Order>(
        `/api/storefront/v1/order/${encodeURIComponent(orderId)}`,
        {
          ...options,
        }
      );
    },

    /**
     * List downloadable files for a paid order.
     *
     * Requires EITHER a download token (from the order confirmation email)
     * OR a valid customer session (for logged-in customers viewing their own
     * order history).
     *
     * Returns only line items that have digital content or downloadable files.
     * The order must be paid (status !== PENDING or FAILED).
     *
     * @param orderId - The order ID
     * @param auth - Token (guest) or sessionId (logged-in customer)
     * @param options - Fetch options
     *
     * @example Guest access via email token
     * ```typescript
     * const token = new URLSearchParams(location.search).get("token");
     * const { items } = await client.order.listDownloads(orderId, { token });
     * ```
     *
     * @example Logged-in customer
     * ```typescript
     * const { items } = await client.order.listDownloads(orderId, { sessionId });
     * ```
     */
    async listDownloads(
      orderId: string,
      auth?: DownloadsAuthOptions,
      options?: FetchOptions
    ): Promise<OrderDownloadsResponse> {
      const { headers: extraHeaders, ...restOptions } = options ?? {};
      return fetcher.request<OrderDownloadsResponse>(
        `/api/storefront/v1/order/${encodeURIComponent(orderId)}/downloads`,
        {
          ...restOptions,
          params: auth?.token ? { token: auth.token } : undefined,
          headers: {
            ...buildDownloadAuthHeaders(auth),
            ...(extraHeaders ?? {}),
          },
        }
      );
    },

    /**
     * Issue a short-lived presigned URL to download a specific file from a
     * paid order. Increments the download counter and records a download
     * event (IP, user agent) on the server.
     *
     * The returned URL is typically valid for ~5 minutes — redirect the
     * browser to it or trigger a download immediately.
     *
     * @param orderId - The order ID
     * @param downloadId - The OrderDownload.id
     * @param auth - Token (guest) or sessionId (logged-in customer)
     * @param options - Fetch options
     *
     * @example
     * ```typescript
     * const { url } = await client.order.getDownloadUrl(orderId, downloadId, { token });
     * window.location.href = url;
     * ```
     */
    /**
     * Release an abandoned PENDING Paytrail order: cancel it and restore its
     * reserved stock.
     *
     * Stock is reserved when a Paytrail checkout session is created, before
     * the customer pays. Call this when the customer has idled past the
     * payment-page timeout — BEFORE redirecting them back to the cart, so
     * their own reservation doesn't count against them in cart validation —
     * or to release a previous pending order before creating a new checkout
     * session for the same cart.
     *
     * Race-safe: only an order still in PENDING status is affected. If a
     * payment callback finalized the order first, nothing changes and the
     * current status is returned — check for PAID/SHIPPED and send the
     * customer to the success page instead of the cart.
     *
     * @param orderId - The order ID to release
     * @param options - Fetch options (headers, signal, etc.)
     * @returns Whether the order was released, and its status after the call
     * @throws StorefrontError with status 404 if the order doesn't exist or belongs to a different store
     * @throws StorefrontError with status 400 if the order is not a Paytrail or PayPal order (Stripe sessions expire on their own)
     *
     * @example Payment-page timeout
     * ```typescript
     * const { released, status } = await client.order.releasePending(orderId);
     * if (!released && (status === "PAID" || status === "SHIPPED")) {
     *   router.push(`/payment/success/${orderId}`); // payment won the race
     * } else {
     *   router.push("/cart?expired=1");
     * }
     * ```
     */
    async releasePending(
      orderId: string,
      options?: FetchOptions
    ): Promise<ReleasePendingOrderResponse> {
      return fetcher.request<ReleasePendingOrderResponse>(
        `/api/storefront/v1/order/${encodeURIComponent(orderId)}/release`,
        {
          ...options,
          method: "POST",
        }
      );
    },

    async getDownloadUrl(
      orderId: string,
      downloadId: string,
      auth?: DownloadsAuthOptions,
      options?: FetchOptions
    ): Promise<DownloadUrlResponse> {
      const { headers: extraHeaders, ...restOptions } = options ?? {};
      return fetcher.request<DownloadUrlResponse>(
        `/api/storefront/v1/order/${encodeURIComponent(
          orderId
        )}/downloads/${encodeURIComponent(downloadId)}`,
        {
          ...restOptions,
          method: "POST",
          params: auth?.token ? { token: auth.token } : undefined,
          headers: {
            ...buildDownloadAuthHeaders(auth),
            ...(extraHeaders ?? {}),
          },
        }
      );
    },
  };
}

/**
 * Type for the order resource
 */
export type OrderResource = ReturnType<typeof createOrderResource>;
