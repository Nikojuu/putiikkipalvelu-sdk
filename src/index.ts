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
  ProductDetail,
  ProductVariation,
  ProductVariationListing,
  VariationOption,
  ProductListResponse,
  ProductCountResponse,
  ProductListParams,
  ProductSortOption,
  // Campaigns
  Campaign,
  CampaignType,
  BuyXPayYCampaign,
  // Shipping
  ShipmentMethod,
  ShipitShippingMethod,
  // Pickup locations (from shipping.ts)
  PickupLocation,
  ShipmentMethodsWithLocationsResponse,
  // Categories (full types)
  Category,
  CategoryResponse,
  // Categories (reference)
  CategoryReference,
  // Cart
  CartItem,
  CartResponse,
  CartValidationResponse,
  CartValidationChanges,
  CartSessionOptions,
  AddToCartParams,
  UpdateCartQuantityParams,
  RemoveFromCartParams,
  // Pricing & Calculation Types
  PriceInfo,
  CalculatedCartItem,
  CartCalculationResult,
  // Customer
  Customer,
  RegisterData,
  LoginOptions,
  RegisterResponse,
  LoginResponse,
  LoginVerificationRequiredResponse,
  LogoutResponse,
  GetUserResponse,
  VerifyEmailResponse,
  ResendVerificationResponse,
  // Customer Profile Management
  UpdateProfileData,
  UpdateProfileResponse,
  DeleteAccountResponse,
  // Customer Orders
  OrderProductInfo,
  OrderLineItem,
  OrderShipmentMethod,
  OrderStatus,
  CustomerOrder,
  GetOrdersResponse,
  // Customer Wishlist
  WishlistVariationOption,
  WishlistVariation,
  WishlistProduct,
  WishlistItem,
  WishlistResponse,
  AddToWishlistResponse,
  RemoveFromWishlistResponse,
  // Customer Password Reset
  ForgotPasswordResponse,
  ResetPasswordResponse,
  // Order (for confirmation/detail pages)
  Order,
  ConfirmationOrderLineItem,
  ConfirmationOrderCustomerData,
  ConfirmationOrderShipmentMethod,
  ConfirmationItemType,
  // Checkout
  CheckoutCustomerData,
  CheckoutShipmentMethod,
  CheckoutParams,
  StripeCheckoutResponse,
  PaytrailCheckoutResponse,
  PaytrailProvider,
  PaytrailGroup,
  CheckoutErrorCode,
  CheckoutErrorDetails,
} from "./types/index.js";

// Checkout options (re-exported from resource for convenience)
export type { CheckoutOptions } from "./resources/checkout.js";

// Pricing utilities
export { isSaleActive, getPriceInfo } from "./utils/pricing.js";

// Cart calculation utilities
export { calculateCartWithCampaigns } from "./utils/cart-calculations.js";

// Error classes
export {
  StorefrontError,
  AuthError,
  RateLimitError,
  NotFoundError,
  ValidationError,
  VerificationRequiredError,
} from "./utils/errors.js";
