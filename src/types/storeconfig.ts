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
// Supporting Types (used by campaigns)
// =============================================================================

/**
 * Shipit shipping method details
 * Represents a shipping service synced from the Shipit API
 */
export interface ShipitShippingMethod {
  /** Unique ID */
  id: string;
  /** Shipit service identifier */
  serviceId: string;
  /** Service name */
  name: string;
  /** Carrier name (e.g., "Posti", "Matkahuolto") */
  carrier: string;
  /** Carrier logo URL */
  logo: string;
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
  /** Whether pickup point selection is available */
  pickupPoint: boolean;
  /** Whether only parcel locker delivery is available */
  onlyParchelLocker: boolean;
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
