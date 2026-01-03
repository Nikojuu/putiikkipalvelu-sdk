/**
 * Order Types
 *
 * Types for fetching order details from the Storefront API.
 * These types represent the raw order data returned by GET /order/{id}.
 *
 * Note: These differ from CustomerOrder types in customer.ts which are
 * transformed for customer order history display.
 */

// =============================================================================
// Order Line Items
// =============================================================================

/**
 * Item type for order line items
 */
export type ConfirmationItemType = "PRODUCT" | "VARIATION" | "SHIPPING";

/**
 * A single line item in an order confirmation
 * Represents raw data as stored in the database
 */
export interface ConfirmationOrderLineItem {
  /** Unique line item ID */
  id: string;
  /** Parent order ID */
  orderId: string;
  /** Type of item: PRODUCT, VARIATION, or SHIPPING */
  itemType: ConfirmationItemType;
  /** Quantity ordered */
  quantity: number;
  /** Price per unit in cents */
  price: number;
  /** Total amount in cents (price * quantity) */
  totalAmount: number;
  /** Product or variation code (ID reference) */
  productCode: string;
  /** Display name of the item */
  name: string;
  /** VAT rate percentage */
  vatRate: number;
  /** Product images array */
  images: string[];
}

// =============================================================================
// Order Customer Data
// =============================================================================

/**
 * Customer delivery information attached to an order
 */
export interface ConfirmationOrderCustomerData {
  /** Customer data record ID */
  id: string;
  /** Customer's first name */
  firstName: string;
  /** Customer's last name */
  lastName: string;
  /** Customer's email address */
  email: string;
  /** Customer's phone number */
  phone: string | null;
  /** Delivery street address */
  address: string;
  /** Delivery city */
  city: string;
  /** Delivery postal code */
  postalCode: string;
}

// =============================================================================
// Order Shipment Method
// =============================================================================

/**
 * Shipment method information attached to an order
 * Includes tracking information when available
 */
export interface ConfirmationOrderShipmentMethod {
  /** Shipment method record ID */
  id: string;
  /** Carrier service ID (for Shipit integration) */
  serviceId: string | null;
  /** Shipment method display name */
  name: string;
  /** Description of the shipment method */
  description: string | null;
  /** Carrier logo URL */
  logo: string | null;
  /** Shipping price in cents */
  price: number;
  /** Parent order ID */
  orderId: string;
  /** VAT rate percentage */
  vatRate: number | null;
  /** Tracking number (when shipped) */
  trackingNumber: string | null;
  /** Array of tracking URLs */
  trackingUrls: string[];
  /** Shipit shipment number */
  shipmentNumber: string | null;
  /** Freight document URLs */
  freightDoc: string[];
}

// =============================================================================
// Order Status
// =============================================================================

/**
 * Order status values (matches Prisma OrderStatus enum)
 */
export type OrderStatus =
  | "PENDING"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED"
  | "PAID"
  | "SHIPPED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

// =============================================================================
// Order
// =============================================================================

/**
 * Complete order information returned by GET /order/{id}
 * Used for order confirmation pages and order detail views
 */
export interface Order {
  /** Unique order ID */
  id: string;
  /** Store ID this order belongs to */
  storeId: string;
  /** Order creation timestamp */
  createdAt: string;
  /** Total order amount in cents */
  totalAmount: number;
  /** Current order status */
  status: OrderStatus;
  /** Human-readable order number */
  orderNumber: number;
  /** Order line items (products, variations, shipping) */
  OrderLineItems: ConfirmationOrderLineItem[];
  /** Customer delivery information */
  orderCustomerData: ConfirmationOrderCustomerData | null;
  /** Shipment method with tracking info */
  orderShipmentMethod: ConfirmationOrderShipmentMethod | null;
}
