/**
 * Category Types
 *
 * Types for category-related API endpoints.
 */

// =============================================================================
// Categories
// =============================================================================

/**
 * Category with nested children.
 * Used by: /categories, /categories/{slug}
 */
export interface Category {
  /** Unique category identifier */
  id: string;
  /** Category display name */
  name: string;
  /** URL-friendly slug */
  slug: string;
  /** SEO meta title for search engines (max 60 chars) */
  metaTitle: string | null;
  /** SEO meta description for search engines (max 160 chars) */
  metaDescription: string | null;
  /** Store ID this category belongs to */
  storeId: string;
  /** Parent category ID (null if root category) */
  parentId: string | null;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Child categories (recursive) */
  children: Category[];
}

// =============================================================================
// API Responses
// =============================================================================

/**
 * Response from /categories/{slug}
 */
export interface CategoryResponse {
  /** The category data */
  category: Category;
}
