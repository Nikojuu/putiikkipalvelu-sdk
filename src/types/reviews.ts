/**
 * Review Types
 *
 * Types for the product reviews & ratings endpoints.
 */

/** Moderation status of a review */
export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

/**
 * A single approved review as returned by the public list endpoint.
 */
export interface Review {
  /** Unique review identifier */
  id: string;
  /** Star rating 1–5 */
  rating: number;
  /** Optional short title (null if omitted) */
  title: string | null;
  /** Review body (plain text). Empty when the moderator hid the content. */
  body: string;
  /** True when the moderator redacted the text — show a placeholder, keep stars */
  contentHidden: boolean;
  /** True when tied to a verified purchase (and the store shows the badge) */
  verifiedPurchase: boolean;
  /** Store owner's reply (null if none) */
  merchantReply: string | null;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Display name (logged-in first name → anonymous name → fallback) */
  reviewerName: string;
}

/**
 * Response from GET /reviews/{slug} — approved reviews for a product.
 */
export interface ReviewListResponse {
  /** Average rating across approved reviews (null when none) */
  averageRating: number | null;
  /** Number of approved reviews */
  reviewCount: number;
  /** Count of approved reviews per star, keyed "1".."5" */
  distribution: Record<string, number>;
  /** Most recent approved reviews */
  reviews: Review[];
}

/**
 * Parameters for submitting a review.
 * Pass a sessionId to {@link ReviewsResource.submit} for logged-in reviews
 * (enables the verified-purchase check + reward code); omit it for anonymous.
 */
export interface SubmitReviewParams {
  /** Slug of the product being reviewed */
  slug: string;
  /** Star rating 1–5 */
  rating: number;
  /** Review body text */
  body: string;
  /** Optional short title */
  title?: string;
  /** Display name for anonymous reviews (ignored when a sessionId is passed) */
  authorName?: string;
}

/** Reward discount code revealed to a logged-in reviewer (if enabled). */
export interface SubmitReviewReward {
  /** The discount code, e.g. "KIITOS10" */
  code: string;
  /** "PERCENTAGE" | "FIXED_AMOUNT" */
  discountType: string;
  /** Percentage (e.g. 10) or fixed amount in cents, per discountType */
  discountValue: number;
}

/**
 * Response from POST /reviews. The created review is always PENDING (the store
 * owner moderates it). `reward` is non-null only for logged-in reviewers when
 * the store has enabled a (still-live) reward code.
 */
export interface SubmitReviewResponse {
  success: boolean;
  review: {
    id: string;
    status: ReviewStatus;
    verifiedPurchase: boolean;
  };
  reward: SubmitReviewReward | null;
}
