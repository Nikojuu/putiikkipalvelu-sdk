import type { FetchOptions, StorePage } from "../types/index.js";
import type { Fetcher } from "../utils/fetch.js";

/**
 * Pages resource for fetching CMS pages by slug.
 */
export function createPagesResource(fetcher: Fetcher) {
  return {
    /**
     * Get a published page by its slug.
     *
     * @param slug - The page slug (e.g. "terms", "privacy-policy")
     * @param options - Fetch options (caching, headers, etc.)
     * @returns The page with its content blocks
     * @throws NotFoundError if page doesn't exist or isn't published
     *
     * @example
     * ```typescript
     * const page = await client.pages.getBySlug("terms");
     * console.log(page.title, page.blocks);
     * ```
     */
    async getBySlug(slug: string, options?: FetchOptions): Promise<StorePage> {
      return fetcher.request<StorePage>(
        `/api/storefront/v1/pages/${encodeURIComponent(slug)}`,
        { ...options }
      );
    },
  };
}

/**
 * Type for the pages resource
 */
export type PagesResource = ReturnType<typeof createPagesResource>;
