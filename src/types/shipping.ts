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
 * Returned from Shipit API with shipmentMethodId and price attached
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
  /** Location type (e.g., "parcel_locker", "service_point", "outdoor_parcel_locker") */
  type?: string;
  /** Structured opening hours */
  openingHours?: PickupLocationOpeningHours | null;
  /** Raw opening hours string from Shipit */
  openingHoursRaw?: string | null;
  /** Additional metadata */
  metadata?: unknown | null;
  /** The shipment method ID this location belongs to */
  shipmentMethodId: string;
  /** Price in cents (from store settings) */
  price: number;
}

// =============================================================================
// API Responses
// =============================================================================

/**
 * Response from GET /shipment-methods/[postalCode]
 */
export interface ShipmentMethodsWithLocationsResponse {
  /** Home delivery methods (custom methods + Shipit home delivery) */
  homeDeliveryMethods: ShipmentMethod[];
  /** Pickup locations with shipmentMethodId and price attached */
  pickupLocations: PickupLocation[];
}
