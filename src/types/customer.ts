/**
 * Customer Types
 *
 * Types for customer authentication and account management API endpoints.
 */

// =============================================================================
// Customer Data
// =============================================================================

/**
 * Basic customer information returned from most customer endpoints
 */
export interface Customer {
  /** Unique customer ID */
  id: string;
  /** Customer's first name */
  firstName: string;
  /** Customer's last name */
  lastName: string;
  /** Customer's email address */
  email: string;
}

/**
 * Extended customer information returned after registration
 */
export interface CustomerWithVerification extends Customer {
  /** Account creation timestamp */
  createdAt: string;
  /** Email verification token (for sending verification emails) */
  emailVerificationToken: string;
  /** Token expiration timestamp */
  emailVerificationExpiresAt: string;
}

/**
 * Customer information returned after login
 */
export interface CustomerWithEmailStatus extends Customer {
  /** Email verification timestamp (null if not verified) */
  emailVerified: string | null;
  /** Account creation timestamp */
  createdAt: string;
}

// =============================================================================
// Authentication Request Types
// =============================================================================

/**
 * Data required to register a new customer account
 */
export interface RegisterData {
  /** Customer's first name */
  firstName: string;
  /** Customer's last name */
  lastName: string;
  /** Customer's email address */
  email: string;
  /** Password (minimum 8 characters) */
  password: string;
}

/**
 * Options for the login method
 */
export interface LoginOptions {
  /** Guest cart ID to merge into user's cart after login */
  cartId?: string;
}

// =============================================================================
// Authentication Response Types
// =============================================================================

/**
 * Response from successful registration
 */
export interface RegisterResponse {
  /** Whether the operation was successful */
  success: true;
  /** Created customer with verification token */
  customer: CustomerWithVerification;
  /** Success message */
  message: string;
}

/**
 * Response from successful login
 */
export interface LoginResponse {
  /** Whether the operation was successful */
  success: true;
  /** Authenticated customer data */
  customer: CustomerWithEmailStatus;
  /** Success message */
  message: string;
  /** Session token for authenticated requests */
  sessionId: string;
  /** Session expiration timestamp (ISO 8601) */
  expiresAt: string;
}

/**
 * Response when login fails due to unverified email
 */
export interface LoginVerificationRequiredResponse {
  /** Error message */
  error: string;
  /** Indicates email verification is required */
  requiresVerification: true;
  /** Customer ID for resending verification email */
  customerId: string;
}

/**
 * Response from successful logout
 */
export interface LogoutResponse {
  /** Whether the operation was successful */
  success: true;
  /** Success message */
  message: string;
  /** New guest cart ID (if user had items in cart) */
  cartId?: string;
}

/**
 * Response from get user endpoint
 */
export interface GetUserResponse {
  /** Whether the operation was successful */
  success: true;
  /** Current authenticated customer */
  customer: Customer;
}

/**
 * Response from successful email verification
 */
export interface VerifyEmailResponse {
  /** Whether the operation was successful */
  success: true;
  /** Success message */
  message: string;
}

/**
 * Response from resend verification email
 */
export interface ResendVerificationResponse {
  /** Whether the operation was successful */
  success: true;
  /** Updated customer with new verification token */
  customer: CustomerWithVerification;
  /** Success message */
  message: string;
}

// =============================================================================
// Profile Management Types
// =============================================================================

/**
 * Data for updating customer profile
 */
export interface UpdateProfileData {
  /** Updated first name */
  firstName?: string;
  /** Updated last name */
  lastName?: string;
  /** Updated email address */
  email?: string;
}

/**
 * Extended customer info returned after profile update
 */
export interface CustomerWithCreatedAt extends Customer {
  /** Account creation timestamp */
  createdAt: string;
}

/**
 * Response from updating profile
 */
export interface UpdateProfileResponse {
  /** Success message */
  message: string;
  /** Updated customer data */
  customer: CustomerWithCreatedAt;
}

/**
 * Response from deleting account
 */
export interface DeleteAccountResponse {
  /** Success message */
  message: string;
}

// =============================================================================
// Order Types
// =============================================================================

/**
 * Product information attached to order line item
 */
export interface OrderProductInfo {
  /** Product or variation ID */
  id: string;
  /** Product name */
  name: string;
  /** Product images */
  images: string[];
  /** Product slug (null for shipping items) */
  slug: string | null;
  /** Variation ID if this is a variation */
  variationId?: string;
  /** Variation option name (e.g., "Size") */
  optionName?: string;
  /** Variation option value (e.g., "Large") */
  optionValue?: string;
  /** True if this is a shipping item */
  isShipping?: boolean;
  /** True if product is no longer available */
  unavailable?: boolean;
}

/**
 * A single line item in an order
 */
export interface OrderLineItem {
  /** Line item ID */
  id: string;
  /** Item type: PRODUCT, VARIATION, or SHIPPING */
  itemType: "PRODUCT" | "VARIATION" | "SHIPPING";
  /** Quantity ordered */
  quantity: number;
  /** Price per unit in cents */
  price: number;
  /** Total amount in cents */
  totalAmount: number;
  /** Product or variation code (ID) */
  productCode: string;
  /** Item name */
  name: string;
  /** VAT rate percentage */
  vatRate: number;
  /** Product information */
  product: OrderProductInfo;
}

/**
 * Shipment method info attached to order
 */
export interface OrderShipmentMethod {
  /** Shipment method name */
  name: string;
  /** Shipping price in cents */
  price: number;
  /** VAT rate percentage */
  vatRate: number;
  /** Carrier logo URL */
  logo: string | null;
}

/**
 * Order status values
 */
export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

/**
 * A customer order
 */
export interface CustomerOrder {
  /** Order ID */
  id: string;
  /** Human-readable order number */
  orderNumber: string;
  /** Total order amount in cents */
  totalAmount: number;
  /** Order status */
  status: OrderStatus;
  /** Order creation timestamp */
  createdAt: string;
  /** Order line items with product info */
  OrderLineItems: OrderLineItem[];
  /** Shipment method details */
  orderShipmentMethod: OrderShipmentMethod | null;
}

/**
 * Response from getting customer orders
 */
export interface GetOrdersResponse {
  /** Whether the operation was successful */
  success: true;
  /** Customer's orders */
  orders: CustomerOrder[];
}

// =============================================================================
// Wishlist Types
// =============================================================================

/**
 * Variation option in wishlist item
 */
export interface WishlistVariationOption {
  /** Option ID */
  id: string;
  /** Option value (e.g., "Large", "Red") */
  value: string;
  /** Option type details */
  optionType: {
    /** Option type ID */
    id: string;
    /** Option type name (e.g., "Size", "Color") */
    name: string;
  };
}

/**
 * Variation details in wishlist item
 */
export interface WishlistVariation {
  /** Variation ID */
  id: string;
  /** Variation SKU */
  sku: string | null;
  /** Variation price in cents */
  price: number;
  /** Sale price in cents */
  salePrice: number | null;
  /** Quantity in stock */
  quantity: number;
  /** Variation images */
  images: string[];
  /** Variation options (size, color, etc.) */
  options: WishlistVariationOption[];
}

/**
 * Product details in wishlist item
 */
export interface WishlistProduct {
  /** Product ID */
  id: string;
  /** Product name */
  name: string;
  /** Product slug */
  slug: string;
  /** Product description */
  description: string | null;
  /** Product images */
  images: string[];
  /** Product price in cents */
  price: number;
  /** Sale price in cents */
  salePrice: number | null;
  /** Sale percentage (e.g., "-20%") */
  salePercent: string | null;
  /** Sale start date */
  saleStartDate: string | null;
  /** Sale end date */
  saleEndDate: string | null;
  /** Quantity in stock */
  quantity: number;
  /** Product SKU */
  sku: string | null;
  /** Product status */
  status: string;
}

/**
 * A wishlist item with product and optional variation details
 */
export interface WishlistItem {
  /** Wishlist item ID */
  id: string;
  /** Customer ID */
  customerId: string;
  /** Product ID */
  productId: string;
  /** Variation ID (if applicable) */
  variationId: string | null;
  /** When the item was added to wishlist */
  createdAt: string;
  /** Product details */
  product: WishlistProduct;
  /** Variation details (if applicable) */
  variation: WishlistVariation | null;
}

/**
 * Response from getting wishlist
 */
export interface WishlistResponse {
  /** Wishlist items */
  items: WishlistItem[];
}

/**
 * Response from adding item to wishlist
 */
export interface AddToWishlistResponse {
  /** Success message */
  message: string;
}

/**
 * Response from removing item from wishlist
 */
export interface RemoveFromWishlistResponse {
  /** Success message */
  message: string;
}
