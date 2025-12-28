import type { FetchOptions, StoreConfig } from "../types/index.js";
import type { Fetcher } from "../utils/fetch.js";

/**
 * Store resource for fetching store configuration
 */
export function createStoreResource(fetcher: Fetcher) {
  return {
    /**
     * Get the complete store configuration including settings, SEO, payments, campaigns, and features.
     *
     * @example Basic usage
     * ```typescript
     * const config = await client.store.getConfig();
     * console.log(config.store.name);
     * console.log(config.seo.seoTitle);
     * console.log(config.campaigns);
     * ```
     *
     * @example Next.js - with caching
     * ```typescript
     * const config = await client.store.getConfig({
     *   next: { revalidate: 300, tags: ['store-config'] }
     * });
     * ```
     *
     * @example Nuxt - wrap with useAsyncData
     * ```typescript
     * const { data: config } = await useAsyncData(
     *   'store-config',
     *   () => client.store.getConfig()
     * );
     * ```
     *
     * @example Standard fetch caching
     * ```typescript
     * const config = await client.store.getConfig({
     *   cache: 'force-cache'
     * });
     * ```
     */
    async getConfig(options?: FetchOptions): Promise<StoreConfig> {
      return fetcher.request<StoreConfig>("/api/storefront/v1/store-config", {
        ...options,
      });
    },
  };
}

/**
 * Type for the store resource
 */
export type StoreResource = ReturnType<typeof createStoreResource>;
