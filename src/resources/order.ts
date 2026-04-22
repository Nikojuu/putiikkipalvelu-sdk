import type {
  FetchOptions,
  Order,
  OrderDownloadsResponse,
  DownloadUrlResponse,
  DownloadsAuthOptions,
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
