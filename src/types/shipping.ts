/**
 * Shipping Types
 *
 * Types for shipment methods and pickup locations.
 * ShipmentMethod and ShipitShippingMethod are re-exported from storeconfig.
 */

import type { ShipmentMethod } from "./storeconfig.js";

// =============================================================================
// Pickup Location (from Shipit API)
// =============================================================================

/**
 * Opening hours for a pickup location
 */
export interface PickupLocationOpeningHours {
  monday: string[];
  tuesday: string[];
  wednesday: string[];
  thursday: string[];
  friday: string[];
  saturday: string[];
  sunday: string[];
  exceptions: string[];
}

/**
 * A pickup location (parcel locker, pickup point, etc.)
 * Returned from Shipit API with merchant pricing added
 */
export interface PickupLocation {
  /** Unique location ID from Shipit */
  id: string;
  /** Shipit service ID */
  serviceId: string;
  /** Location name */
  name: string;
  /** Street address */
  address1: string;
  /** City */
  city: string;
  /** Postal code */
  zipcode: string;
  /** Country code (e.g., "FI") */
  countryCode: string;
  /** Carrier name (e.g., "Posti", "Matkahuolto") */
  carrier: string;
  /** Carrier logo URL */
  carrierLogo: string;
  /** GPS latitude */
  latitude?: number;
  /** GPS longitude */
  longitude?: number;
  /** Distance from postal code in meters */
  distanceInMeters: number;
  /** Distance from postal code in kilometers */
  distanceInKilometers: number;
  /** Location type */
  type?: string;
  /** Structured opening hours */
  openingHours?: PickupLocationOpeningHours | null;
  /** Raw opening hours string from Shipit */
  openingHoursRaw?: string | null;
  /** Additional metadata */
  metadata?: unknown | null;
  /** Merchant's price in cents (from store settings) */
  merchantPrice: number | null;
}

// =============================================================================
// API Responses
// =============================================================================

/**
 * Response from GET /shipment-methods
 */
export interface ShipmentMethodsResponse {
  /** Available shipment methods */
  shipmentMethods: ShipmentMethod[];
}

/**
 * Response from GET /shipment-methods/[postalCode]
 * Includes pickup locations near the postal code
 */
export interface ShipmentMethodsWithLocationsResponse {
  /** Available shipment methods */
  shipmentMethods: ShipmentMethod[];
  /** Pickup locations near the postal code with merchant pricing */
  pricedLocations: PickupLocation[];
}
