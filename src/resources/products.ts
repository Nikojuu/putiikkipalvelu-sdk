import type {
  FetchOptions,
  Product,
  ProductDetail,
  ProductListResponse,
  ProductCountResponse,
  ProductListParams,
} from "../types/index.js";
import type { Fetcher } from "../utils/fetch.js";

/**
 * Products resource for fetching product data
 */
export function createProductsResource(fetcher: Fetcher) {
  return {
    /**
     * Get latest products ordered by creation date (newest first).
     *
     * @param take - Number of products to return (required, must be >= 1)
     * @param options - Fetch options (caching, headers, etc.)
     * @returns Array of products
     *
     * @example Basic usage
     * ```typescript
     * const products = await client.products.latest(6);
     * ```
     *
     * @example Next.js - with caching
     * ```typescript
     * const products = await client.products.latest(6, {
     *   next: { revalidate: 3600, tags: ['products'] }
     * });
     * ```
     */
    async latest(take: number, options?: FetchOptions): Promise<Product[]> {
      return fetcher.request<Product[]>("/api/storefront/v1/latest-products", {
        params: { take },
        ...options,
      });
    },

    /**
     * Get a single product by its URL slug.
     *
     * @param slug - Product URL slug
     * @param options - Fetch options (caching, headers, etc.)
     * @returns Full product details including categories and variations
     * @throws NotFoundError if product doesn't exist or is not visible
     *
     * @example Basic usage
     * ```typescript
     * const product = await client.products.getBySlug('my-product');
     * console.log(product.name, product.categories);
     * ```
     *
     * @example Next.js - with caching
     * ```typescript
     * const product = await client.products.getBySlug('my-product', {
     *   next: { revalidate: 3600, tags: ['product', 'my-product'] }
     * });
     * ```
     */
    async getBySlug(
      slug: string,
      options?: FetchOptions
    ): Promise<ProductDetail> {
      return fetcher.request<ProductDetail>(
        `/api/storefront/v1/product/${encodeURIComponent(slug)}`,
        {
          ...options,
        }
      );
    },

    /**
     * Get total product count, optionally filtered by category.
     *
     * @param slugs - Optional category slugs to filter by
     * @param options - Fetch options (caching, headers, etc.)
     * @returns Object with count property
     *
     * @example Get total count
     * ```typescript
     * const { count } = await client.products.count();
     * console.log(`Total products: ${count}`);
     * ```
     *
     * @example Get count for specific category
     * ```typescript
     * const { count } = await client.products.count(['shoes']);
     * console.log(`Products in shoes: ${count}`);
     * ```
     */
    async count(
      slugs?: string[],
      options?: FetchOptions
    ): Promise<ProductCountResponse> {
      const searchParams = new URLSearchParams();
      if (slugs?.length) {
        slugs.forEach((s) => searchParams.append("slugs", s));
      }
      const query = searchParams.toString();
      const endpoint = `/api/storefront/v1/products-count${query ? `?${query}` : ""}`;

      return fetcher.request<ProductCountResponse>(endpoint, {
        ...options,
      });
    },

    /**
     * Get sorted products with pagination.
     * Uses optimized sorting with pre-computed effective prices.
     *
     * @param params - Query parameters (slugs, page, pageSize, sort)
     * @param options - Fetch options (caching, headers, etc.)
     * @returns Products list with totalCount for pagination
     *
     * @example Basic usage
     * ```typescript
     * const { products, totalCount } = await client.products.sorted({
     *   page: 1,
     *   pageSize: 12,
     *   sort: 'newest'
     * });
     * ```
     *
     * @example Filter by category
     * ```typescript
     * const { products, totalCount } = await client.products.sorted({
     *   slugs: ['shoes', 'clothing'],
     *   page: 1,
     *   pageSize: 24,
     *   sort: 'price_asc'
     * });
     * ```
     *
     * @example Real-time data (no cache)
     * ```typescript
     * const data = await client.products.sorted(
     *   { page: 1, pageSize: 12 },
     *   { cache: 'no-store' }
     * );
     * ```
     */
    async sorted(
      params: ProductListParams = {},
      options?: FetchOptions
    ): Promise<ProductListResponse> {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set("page", params.page.toString());
      if (params.pageSize)
        searchParams.set("pageSize", params.pageSize.toString());
      if (params.sort) searchParams.set("sort", params.sort);
      if (params.slugs?.length) {
        params.slugs.forEach((s) => searchParams.append("slugs", s));
      }
      if (params.query) searchParams.set("q", params.query);
      const query = searchParams.toString();
      const endpoint = `/api/storefront/v1/sorted-products${query ? `?${query}` : ""}`;

      return fetcher.request<ProductListResponse>(endpoint, {
        ...options,
      });
    },

  };
}

/**
 * Type for the products resource
 */
export type ProductsResource = ReturnType<typeof createProductsResource>;
