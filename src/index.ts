/**
 * Putiikkipalvelu Storefront SDK
 *
 * A TypeScript SDK for interacting with the Putiikkipalvelu Storefront API.
 *
 * @packageDocumentation
 */

// Main client
export { createStorefrontClient } from "./client.js";
export type { StorefrontClient } from "./client.js";

// Configuration types
export type { StorefrontClientConfig, FetchOptions } from "./types/index.js";

// API types
export type {
  // Store
  StoreConfig,
  StoreInfo,
  StoreSeo,
  PaymentConfig,
  FeatureFlags,
  // Products
  Product,
  // Campaigns
  Campaign,
  CampaignType,
  FreeShippingCampaign,
  BuyXPayYCampaign,
  // Shipping
  ShipmentMethod,
  // Categories
  CategoryReference,
} from "./types/index.js";

// Error classes
export {
  StorefrontError,
  AuthError,
  RateLimitError,
  NotFoundError,
  ValidationError,
} from "./utils/errors.js";
