import type { FetchOptions, Category, CategoryResponse } from "../types/index.js";
import type { Fetcher } from "../utils/fetch.js";

/**
 * Categories resource for fetching category data
 */
export function createCategoriesResource(fetcher: Fetcher) {
  return {
    /**
     * Get all top-level categories with nested children.
     * Returns a hierarchical tree of categories (up to 5 levels deep).
     *
     * @param options - Fetch options (caching, headers, etc.)
     * @returns Array of top-level categories with nested children
     *
     * @example Basic usage
     * ```typescript
     * const categories = await client.categories.list();
     * categories.forEach(cat => {
     *   console.log(cat.name, cat.children.length);
     * });
     * ```
     *
     * @example Next.js - with caching
     * ```typescript
     * const categories = await client.categories.list({
     *   next: { revalidate: 3600, tags: ['categories'] }
     * });
     * ```
     */
    async list(options?: FetchOptions): Promise<Category[]> {
      return fetcher.request<Category[]>("/api/storefront/v1/categories", {
        ...options,
      });
    },

    /**
     * Get a single category by its URL slug.
     *
     * @param slug - Category URL slug
     * @param options - Fetch options (caching, headers, etc.)
     * @returns Category data
     * @throws NotFoundError if category doesn't exist
     *
     * @example Basic usage
     * ```typescript
     * const { category } = await client.categories.getBySlug('shoes');
     * console.log(category.name);
     * ```
     *
     * @example Next.js - with caching
     * ```typescript
     * const { category } = await client.categories.getBySlug('shoes', {
     *   next: { revalidate: 86400, tags: ['category', 'shoes'] }
     * });
     * ```
     */
    async getBySlug(
      slug: string,
      options?: FetchOptions
    ): Promise<CategoryResponse> {
      return fetcher.request<CategoryResponse>(
        `/api/storefront/v1/categories/${encodeURIComponent(slug)}`,
        {
          ...options,
        }
      );
    },
  };
}

/**
 * Type for the categories resource
 */
export type CategoriesResource = ReturnType<typeof createCategoriesResource>;
