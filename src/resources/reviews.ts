/**
 * Reviews Resource
 *
 * Read approved product reviews and submit new ones. Submitting works both
 * anonymously and for logged-in customers — pass a sessionId to run the
 * verified-purchase check and (if the store enabled it) reveal a reward code.
 */

import type {
  FetchOptions,
  ReviewListResponse,
  SubmitReviewParams,
  SubmitReviewResponse,
} from "../types/index.js";
import type { Fetcher } from "../utils/fetch.js";

/**
 * Reviews resource for listing and submitting product reviews
 */
export function createReviewsResource(fetcher: Fetcher) {
  return {
    /**
     * List approved reviews for a product, with the aggregate rating and a
     * 1–5 star distribution.
     *
     * @param slug - Product URL slug
     * @param options - Fetch options (caching, headers, etc.)
     * @returns Approved reviews, average rating, count, and distribution
     *
     * @example
     * ```typescript
     * const { reviews, averageRating, reviewCount } =
     *   await client.reviews.list('my-product');
     * ```
     */
    async list(
      slug: string,
      options?: FetchOptions
    ): Promise<ReviewListResponse> {
      return fetcher.request<ReviewListResponse>(
        `/api/storefront/v1/reviews/${encodeURIComponent(slug)}`,
        {
          ...options,
        }
      );
    },

    /**
     * Submit a product review. Anonymous by default; pass a sessionId to submit
     * as a logged-in customer (enables the verified-purchase check + reward code).
     * The review is created as PENDING and appears once the store owner approves it.
     *
     * @param params - Review data (slug, rating 1–5, body, optional title/authorName)
     * @param sessionId - Optional customer session id (logged-in submit)
     * @param options - Fetch options
     * @returns The created review (PENDING) and a reward code if revealed
     *
     * @example Anonymous
     * ```typescript
     * await client.reviews.submit({
     *   slug: 'my-product',
     *   rating: 5,
     *   body: 'Loistava tuote!',
     *   authorName: 'Matti',
     * });
     * ```
     *
     * @example Logged-in (may return a reward code)
     * ```typescript
     * const { reward } = await client.reviews.submit(
     *   { slug: 'my-product', rating: 5, body: 'Loistava tuote!' },
     *   sessionId
     * );
     * if (reward) console.log(`Käytä koodia ${reward.code}`);
     * ```
     */
    async submit(
      params: SubmitReviewParams,
      sessionId?: string,
      options?: FetchOptions
    ): Promise<SubmitReviewResponse> {
      const { headers: optionHeaders, ...restOptions } = options ?? {};
      return fetcher.request<SubmitReviewResponse>(
        "/api/storefront/v1/reviews",
        {
          method: "POST",
          body: params,
          headers: {
            ...(sessionId ? { "x-session-id": sessionId } : {}),
            ...(optionHeaders ?? {}),
          },
          ...restOptions,
        }
      );
    },
  };
}

/**
 * Type for the reviews resource
 */
export type ReviewsResource = ReturnType<typeof createReviewsResource>;
