import type { StorefrontClientConfig } from "./types/index.js";
import { createFetcher } from "./utils/fetch.js";
import { createStoreResource, type StoreResource } from "./resources/store.js";

/**
 * The Storefront API client
 */
export interface StorefrontClient {
  /**
   * The configured API key (masked for security)
   */
  readonly apiKey: string;

  /**
   * The base URL for API requests
   */
  readonly baseUrl: string;

  /**
   * Store configuration resource
   */
  readonly store: StoreResource;
}

/**
 * Create a new Storefront API client
 */
export function createStorefrontClient(config: StorefrontClientConfig): StorefrontClient {
  if (!config.apiKey) {
    throw new Error("apiKey is required");
  }
  if (!config.baseUrl) {
    throw new Error("baseUrl is required");
  }

  // Ensure baseUrl doesn't have trailing slash
  const baseUrl = config.baseUrl.replace(/\/$/, "");

  // Mask API key for security (show first 8 chars only)
  const maskedApiKey =
    config.apiKey.length > 8
      ? `${config.apiKey.slice(0, 8)}...`
      : config.apiKey;

  // Create the fetcher for making authenticated requests
  const fetcher = createFetcher({
    apiKey: config.apiKey,
    baseUrl,
    timeout: config.timeout,
  });

  return {
    apiKey: maskedApiKey,
    baseUrl,
    store: createStoreResource(fetcher),
  };
}
