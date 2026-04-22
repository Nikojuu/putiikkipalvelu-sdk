/**
 * Product Types
 *
 * Types for product-related API endpoints.
 */

import type { CategoryReference } from "./storeconfig.js";

// =============================================================================
// Product Variations
// =============================================================================

/**
 * Product variation option (e.g., Size: Large)
 */
export interface VariationOption {
  /** Option value (e.g., "Large", "Red") */
  value: string;
  /** Option type information */
  optionType: {
    /** Option type name (e.g., "Size", "Color") */
    name: string;
  };
}

/**
 * Product variation for listings (minimal fields)
 */
export interface ProductVariationListing {
  /** Unique variation identifier */
  id: string;
  /** Variation price in cents */
  price: number;
  /** Sale price in cents (null if not on sale) */
  salePrice: number | null;
  /** Sale discount percentage as string (null if not on sale) */
  salePercent: string | null;
  /** Sale start date (ISO 8601), null = immediate */
  saleStartDate: string | null;
  /** Sale end date (ISO 8601), null = no end */
  saleEndDate: string | null;
}

/**
 * Full product variation (for product detail page)
 */
export interface ProductVariation extends ProductVariationListing {
  /** Variation weight in kg (null = use product weight) */
  weight: number | null;
  /** Available quantity (null = unlimited) */
  quantity: number | null;
  /** Stock keeping unit */
  sku: string | null;
  /** Variation-specific images */
  images: string[];
  /** Variation-specific description */
  description: string | null;
  /** Whether variation is visible on store */
  showOnStore: boolean;
  /** Variation options (size, color, etc.) */
  options: VariationOption[];
}

// =============================================================================
// Products
// =============================================================================

/**
 * Product for listing (cards, grids)
 * Used by: /latest-products, /sorted-products
 */
export interface Product {
  /** Unique product identifier */
  id: string;
  /** Product display name */
  name: string;
  /** URL-friendly slug */
  slug: string;
  /** Product description */
  description: string;
  /** Base price in cents */
  price: number;
  /** Product images (URLs) */
  images: string[];
  /** Available quantity (null = unlimited) */
  quantity: number | null;
  /** Sale price in cents (null if not on sale) */
  salePrice: number | null;
  /** Sale discount percentage as string (null if not on sale) */
  salePercent: string | null;
  /** Sale start date (ISO 8601), null = immediate */
  saleStartDate: string | null;
  /** Sale end date (ISO 8601), null = no end */
  saleEndDate: string | null;
  /** True if this product is delivered as a digital download (no shipping) */
  isDigital?: boolean;
  /** Product variations (minimal fields for listing) */
  variations: ProductVariationListing[];
}

/**
 * Full product detail (single product page)
 * Used by: /product/{slug}
 */
/**
 * Ticket info attached to a ticket product
 */
export interface ProductTicketInfo {
  /** Ticket info ID */
  id: string;
  /** Whether holder name is required per ticket at checkout */
  requiresHolder: boolean;
  /** Maximum uses per ticket (0 = unlimited) */
  maxUses: number;
  /** Ticket sales start (ISO 8601), null = sales open immediately */
  salesStart: string | null;
  /** Ticket sales end (ISO 8601), null = sales never end */
  salesEnd: string | null;
}

export interface ProductDetail extends Omit<Product, "variations"> {
  /** Product weight in kg (for shipping calculations) */
  weight: number;
  /** Stock keeping unit */
  sku: string | null;
  /** SEO meta title */
  metaTitle: string | null;
  /** SEO meta description */
  metaDescription: string | null;
  /** Product categories */
  categories: CategoryReference[];
  /** Full product variations */
  variations: ProductVariation[];
  /** Ticket info (present if product is a ticket, null otherwise) */
  ticketInfo: ProductTicketInfo | null;
  /**
   * HTML instructions shown to the buyer after a digital purchase.
   * Only populated when isDigital=true; null otherwise.
   */
  digitalContent?: string | null;
}

// =============================================================================
// API Responses
// =============================================================================

/**
 * Response from /sorted-products
 */
export interface ProductListResponse {
  /** Category/collection name */
  name: string;
  /** Products in the list */
  products: Product[];
  /** Total count for pagination (only in sorted-products) */
  totalCount?: number;
}

/**
 * Response from /products-count
 */
export interface ProductCountResponse {
  /** Number of products */
  count: number;
}

// =============================================================================
// Query Parameters
// =============================================================================

/**
 * Sort options for product listing
 */
export type ProductSortOption =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "popularity"
  | "relevance";

/**
 * Parameters for sorted products
 */
export interface ProductListParams {
  /** Category slugs to filter by (omit for all products) */
  slugs?: string[];
  /** Page number (1-based, default: 1) */
  page?: number;
  /** Products per page (default: 12, max: 100) */
  pageSize?: number;
  /** Sort order */
  sort?: ProductSortOption;
  /** Full-text search query */
  query?: string;
}
