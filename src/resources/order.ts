import type { FetchOptions, Order } from "../types/index.js";
import type { Fetcher } from "../utils/fetch.js";

/**
 * Order resource for fetching order details
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
     *
     * @example Next.js - with caching
     * ```typescript
     * const order = await client.order.get(orderId, {
     *   next: { revalidate: 60, tags: ['order', orderId] }
     * });
     * ```
     *
     * @example Display line items
     * ```typescript
     * const order = await client.order.get(orderId);
     * order.OrderLineItems.forEach(item => {
     *   if (item.itemType !== 'SHIPPING') {
     *     console.log(`${item.name} x${item.quantity} = ${item.totalAmount / 100} EUR`);
     *   }
     * });
     * ```
     *
     * @example Show tracking info
     * ```typescript
     * const order = await client.order.get(orderId);
     * if (order.orderShipmentMethod?.trackingNumber) {
     *   console.log(`Tracking: ${order.orderShipmentMethod.trackingNumber}`);
     *   order.orderShipmentMethod.trackingUrls?.forEach(url => {
     *     console.log(`Track at: ${url}`);
     *   });
     * }
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
  };
}

/**
 * Type for the order resource
 */
export type OrderResource = ReturnType<typeof createOrderResource>;
