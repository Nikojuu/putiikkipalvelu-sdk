/**
 * Store Configuration Types
 *
 * Types for the store config endpoint response.
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
  navPages: NavPage[];
  campaigns: Campaign[];
  features: FeatureFlags;
}

/**
 * A published CMS page exposed in navigation
 */
export interface NavPage {
  /** URL-friendly slug */
  slug: string;
  /** Page display title */
  title: string;
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
  /** Alt text for Open Graph image */
  ogImageAlt: string | null;
  /** Twitter card image URL */
  twitterImageUrl: string | null;
  /** Twitter handle (e.g., @storename) */
  twitterHandle: string | null;
  /** Instagram profile URL */
  instagramUrl: string | null;
  /** Facebook page URL */
  facebookUrl: string | null;
  /** TikTok profile URL */
  tiktokUrl: string | null;
  /** YouTube channel URL */
  youtubeUrl: string | null;
  /** Pinterest profile URL */
  pinterestUrl: string | null;
  /** LinkedIn page URL */
  linkedinUrl: string | null;
  /** Price range indicator (e.g., "€€") */
  priceRange: string | null;
  /** Business type description */
  businessType: string | null;
  /** Business founding date (ISO 8601) */
  foundingDate: string | null;
  /** Google Search Console verification code */
  googleVerificationCode: string | null;
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
// Campaigns
// =============================================================================

/** Campaign type */
export type CampaignType = "BUY_X_PAY_Y";

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
  /** Buy X Pay Y campaign details (if type is BUY_X_PAY_Y) */
  BuyXPayYCampaign: BuyXPayYCampaign | null;
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
// Supporting Types (used by campaigns)
// =============================================================================

/**
 * Shipit shipping method details
 * Represents a shipping service synced from the Shipit API
 * Supports multiple carriers in a single method for multi-carrier shipping
 */
export interface ShipitShippingMethod {
  /** Unique ID */
  id: string;
  /** Shipit service identifiers for all selected carriers */
  serviceIds: string[];
  /** Service name */
  name: string;
  /** Carrier names (e.g., ["Posti", "Matkahuolto"]) */
  carriers: string[];
  /** Carrier logo URLs */
  logos: string[];
  /** Whether pickup is included */
  pickUpIncluded: boolean;
  /** Whether home delivery is available */
  homeDelivery: boolean;
  /** Whether worldwide delivery is available */
  worldwideDelivery: boolean;
  /** Whether fragile handling is available */
  fragile: boolean;
  /** Whether domestic deliveries are available */
  domesticDeliveries: boolean;
  /** Additional information */
  information: string | null;
  /** Service description */
  description: string;
  /** Package height in cm */
  height: number;
  /** Package length in cm */
  length: number;
  /** Package width in cm */
  width: number;
  /** Package weight in kg @deprecated Use maxWeight instead */
  weight: number;
  /** Maximum package weight in kg for this shipping tier */
  maxWeight: number;
  /** Service type */
  type: string;
  /** Shipit price in cents */
  price: number;
  /** Whether to show pickup point selector (true) or home delivery only (false) */
  showPickupPoints: boolean;
  /** Reference to parent shipment method */
  shipmentMethodId: string;
  /** Created timestamp */
  createdAt: string;
  /** Updated timestamp */
  updatedAt: string;
}

/**
 * Shipping method
 */
export interface ShipmentMethod {
  /** Unique identifier */
  id: string;
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
  /** Associated Shipit method (if using Shipit integration) */
  shipitMethod?: ShipitShippingMethod | null;
}

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
  /** Parent category ID (null if root category) */
  parentId: string | null;
}
