/**
 * Putiikkipalvelu Storefront SDK Types
 *
 * These types define the shape of data returned by the Storefront API.
 * Keep in sync with API implementation when making changes.
 */

// Domain types
export * from "./storeconfig.js";
export * from "./products.js";
export * from "./categories.js";
export * from "./cart.js";
export * from "./shipping.js";
export * from "./customer.js";
export * from "./order.js";
export * from "./checkout.js";
export * from "./discount-code.js";
export * from "./pages.js";
export * from "./ticket.js";
export * from "./digital-downloads.js";
export * from "./withdrawal.js";
export * from "./reviews.js";

// =============================================================================
// SDK Configuration
// =============================================================================

/**
 * SDK client configuration options
 */
export interface StorefrontClientConfig {
  /**
   * Your store's API key (required)
   * Get this from Dashboard > Settings > API Keys
   */
  apiKey: string;

  /**
   * Base URL for the Storefront API
   * @example "https://putiikkipalvelu.fi/api/storefront/v1"
   */
  baseUrl: string;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;
}

/**
 * Options that can be passed to any API method.
 * Framework-agnostic - works with Next.js, Nuxt, or plain fetch.
 */
export interface FetchOptions {
  /**
   * AbortSignal for cancelling requests
   */
  signal?: AbortSignal;

  /**
   * Additional headers to send with the request
   */
  headers?: Record<string, string>;

  /**
   * Standard fetch cache mode
   */
  cache?: RequestCache;

  /**
   * Framework-specific options passthrough.
   * These are spread directly to the underlying fetch call.
   *
   * @example Next.js caching
   * ```typescript
   * await client.store.getConfig({
   *   next: { revalidate: 60, tags: ['store-config'] }
   * });
   * ```
   */
  [key: string]: unknown;
}
