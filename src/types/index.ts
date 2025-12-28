/**
 * Putiikkipalvelu Storefront SDK Types
 *
 * These types define the shape of data returned by the Storefront API.
 * Keep in sync with API implementation when making changes.
 */

// =============================================================================
// Store Configuration
// =============================================================================

/**
 * Complete store configuration returned by the API.
 * Includes business info, SEO settings, payments, campaigns, and feature flags.
 */
export interface StoreConfig {
  store: StoreInfo;
  seo: StoreSeo;
  payments: PaymentConfig;
  campaigns: Campaign[];
  features: FeatureFlags;
}

/**
 * Store business information
 */
export interface StoreInfo {
  /** Unique store identifier */
  id: string;
  /** Store display name */
  name: string;
  /** Contact email */
  email: string;
  /** Contact phone number */
  phone: string;
  /** Street address */
  address: string;
  /** City */
  city: string;
  /** Postal/ZIP code */
  postalCode: string;
  /** Country code (e.g., "FI") */
  country: string;
  /** Currency code (e.g., "EUR") */
  currency: string;
  /** Currency symbol (e.g., "€") */
  currencySymbol: string;
  /** Default VAT rate as percentage (e.g., 25.5) */
  defaultVatRate: number;
  /** Business/VAT ID */
  businessId: string;
  /** Store logo URL */
  logoUrl: string | null;
}

/**
 * Store SEO and social media configuration
 */
export interface StoreSeo {
  /** SEO meta title */
  seoTitle: string | null;
  /** SEO meta description */
  seoDescription: string | null;
  /** Store domain URL */
  domain: string | null;
  /** Open Graph image URL */
  openGraphImageUrl: string | null;
  /** Twitter card image URL */
  twitterImageUrl: string | null;
  /** Instagram profile URL */
  instagramUrl: string | null;
  /** Facebook page URL */
  facebookUrl: string | null;
  /** Price range indicator (e.g., "€€") */
  priceRange: string | null;
  /** Business type description */
  businessType: string | null;
}

/**
 * Payment configuration
 */
export interface PaymentConfig {
  /** Available payment methods (e.g., ["stripe", "paytrail"]) */
  methods: string[];
  /** Default VAT rate */
  defaultVatRate: number;
}

/**
 * Feature flags for the store
 */
export interface FeatureFlags {
  /** Whether wishlist functionality is enabled */
  wishlistEnabled: boolean;
  /** Whether guest checkout is allowed */
  guestCheckoutEnabled: boolean;
  /** Whether newsletter signup is enabled */
  newsletterEnabled: boolean;
  /** Whether product reviews are enabled */
  reviewsEnabled: boolean;
}

// =============================================================================
// Products
// =============================================================================

/**
 * Product information
 */
export interface Product {
  /** Unique product identifier */
  id: string;
  /** Product name */
  name: string;
  /** URL-friendly slug */
  slug: string;
  /** Product description (HTML allowed) */
  description: string | null;
  /** Price in cents (e.g., 1500 = €15.00) */
  price: number;
  /** Stock quantity (null = unlimited) */
  quantity: number | null;
  /** Array of image URLs */
  images: string[];
  /** Stock keeping unit */
  sku: string | null;
}

// =============================================================================
// Campaigns
// =============================================================================

/** Campaign type */
export type CampaignType = "FREE_SHIPPING" | "BUY_X_PAY_Y";

/**
 * Store campaign (promotion)
 */
export interface Campaign {
  /** Unique campaign identifier */
  id: string;
  /** Store ID this campaign belongs to */
  storeId: string;
  /** Campaign display name */
  name: string;
  /** Campaign description */
  description: string | null;
  /** Type of campaign */
  type: CampaignType;
  /** Campaign start date (ISO 8601) */
  startDate: string;
  /** Campaign end date (ISO 8601), null = no end */
  endDate: string | null;
  /** Whether campaign is currently active */
  isActive: boolean;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
  /** Free shipping campaign details (if type is FREE_SHIPPING) */
  FreeShippingCampaign: FreeShippingCampaign | null;
  /** Buy X Pay Y campaign details (if type is BUY_X_PAY_Y) */
  BuyXPayYCampaign: BuyXPayYCampaign | null;
}

/**
 * Free shipping campaign details
 */
export interface FreeShippingCampaign {
  /** Unique identifier */
  id: string;
  /** Parent campaign ID */
  campaignId: string;
  /** Minimum spend in cents to qualify for free shipping */
  minimumSpend: number;
  /** Shipping methods eligible for free shipping */
  shipmentMethods: ShipmentMethod[];
}

/**
 * Buy X Pay Y campaign details (e.g., "Buy 3, Pay 2")
 */
export interface BuyXPayYCampaign {
  /** Unique identifier */
  id: string;
  /** Parent campaign ID */
  campaignId: string;
  /** Number of items customer must buy */
  buyQuantity: number;
  /** Number of items customer pays for */
  payQuantity: number;
  /** Categories this campaign applies to */
  applicableCategories: CategoryReference[];
}

// =============================================================================
// Shipping
// =============================================================================

/**
 * Shipping method
 */
export interface ShipmentMethod {
  /** Unique identifier */
  id: string;
  /** Store ID */
  storeId: string;
  /** Shipping method name (e.g., "Posti - Paketti") */
  name: string;
  /** Description */
  description: string | null;
  /** Price in cents */
  price: number;
  /** Whether this method is active */
  active: boolean;
  /** Minimum estimated delivery days */
  min_estimate_delivery_days: number | null;
  /** Maximum estimated delivery days */
  max_estimate_delivery_days: number | null;
}

// =============================================================================
// Categories
// =============================================================================

/**
 * Category reference (lightweight, used in relationships)
 */
export interface CategoryReference {
  /** Unique identifier */
  id: string;
  /** Category name */
  name: string;
  /** URL-friendly slug */
  slug: string;
}

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
