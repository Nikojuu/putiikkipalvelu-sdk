/**
 * Discount Code Utilities
 *
 * Helper functions for working with discount codes.
 */

import type { AppliedDiscount } from "../types/discount-code.js";
import type { DiscountRemovalReason } from "../types/cart.js";

// =============================================================================
// Format Options
// =============================================================================

/**
 * Options for formatting discount values
 */
export interface FormatDiscountOptions {
  /**
   * Currency symbol to use for fixed amount discounts
   * @default "€"
   */
  currencySymbol?: string;

  /**
   * Whether to show the currency symbol before or after the value
   * @default "after"
   */
  currencyPosition?: "before" | "after";

  /**
   * Number of decimal places for fixed amount
   * @default 2
   */
  decimals?: number;

  /**
   * Whether to include the minus sign prefix
   * @default true
   */
  showMinus?: boolean;
}

// =============================================================================
// Discount Formatting
// =============================================================================

/**
 * Format a discount value for display.
 *
 * @param discount - The applied discount (or just type and value)
 * @param options - Formatting options
 * @returns Formatted discount string (e.g., "-20%" or "-5,00 €")
 *
 * @example
 * ```typescript
 * // Percentage discount
 * formatDiscountValue({ discountType: "PERCENTAGE", discountValue: 20 });
 * // Returns: "-20%"
 *
 * // Fixed amount discount (value in cents)
 * formatDiscountValue({ discountType: "FIXED_AMOUNT", discountValue: 500 });
 * // Returns: "-5,00 €"
 *
 * // Custom currency
 * formatDiscountValue(
 *   { discountType: "FIXED_AMOUNT", discountValue: 1000 },
 *   { currencySymbol: "$", currencyPosition: "before" }
 * );
 * // Returns: "-$10.00"
 * ```
 */
export function formatDiscountValue(
  discount: Pick<AppliedDiscount, "discountType" | "discountValue">,
  options: FormatDiscountOptions = {}
): string {
  const {
    currencySymbol = "€",
    currencyPosition = "after",
    decimals = 2,
    showMinus = true,
  } = options;

  const prefix = showMinus ? "-" : "";

  if (discount.discountType === "PERCENTAGE") {
    return `${prefix}${discount.discountValue}%`;
  }

  // FIXED_AMOUNT: discountValue is in cents, convert to major units
  const amount = (discount.discountValue / 100).toFixed(decimals);
  // Replace dot with comma for Finnish locale
  const formattedAmount = amount.replace(".", ",");

  if (currencyPosition === "before") {
    return `${prefix}${currencySymbol}${formattedAmount}`;
  }

  return `${prefix}${formattedAmount} ${currencySymbol}`;
}

// =============================================================================
// Discount Calculation
// =============================================================================

/**
 * Calculate the discount amount in cents.
 *
 * @param subtotal - Cart subtotal in cents (before discount)
 * @param discount - The applied discount
 * @returns Discount amount in cents (always positive)
 *
 * @example
 * ```typescript
 * // 20% off 100€ subtotal
 * calculateDiscountAmount(10000, { discountType: "PERCENTAGE", discountValue: 20 });
 * // Returns: 2000 (20€ in cents)
 *
 * // Fixed 5€ discount
 * calculateDiscountAmount(10000, { discountType: "FIXED_AMOUNT", discountValue: 500 });
 * // Returns: 500 (5€ in cents)
 *
 * // Fixed discount larger than subtotal (capped)
 * calculateDiscountAmount(300, { discountType: "FIXED_AMOUNT", discountValue: 500 });
 * // Returns: 300 (capped to subtotal)
 * ```
 */
export function calculateDiscountAmount(
  subtotal: number,
  discount: Pick<AppliedDiscount, "discountType" | "discountValue">
): number {
  if (discount.discountType === "PERCENTAGE") {
    return Math.round((subtotal * discount.discountValue) / 100);
  }

  // FIXED_AMOUNT: cap at subtotal (can't discount more than the total)
  return Math.min(discount.discountValue, subtotal);
}

// =============================================================================
// Error Messages
// =============================================================================

/**
 * Supported locales for error messages
 */
export type DiscountMessageLocale = "fi" | "en";

/**
 * Error messages for discount removal reasons
 */
const REMOVAL_MESSAGES: Record<DiscountRemovalReason, Record<DiscountMessageLocale, string>> = {
  CAMPAIGN_ACTIVE: {
    fi: "Alennuskoodi poistettu - kampanja-alennus aktivoitui",
    en: "Discount code removed - campaign discount activated",
  },
  MIN_ORDER_NOT_MET: {
    fi: "Alennuskoodi poistettu - ostoskorin summa alittaa minimitilauksen",
    en: "Discount code removed - cart total below minimum order",
  },
  CODE_INVALID: {
    fi: "Alennuskoodi poistettu - koodi ei ole enää voimassa",
    en: "Discount code removed - code is no longer valid",
  },
};

/**
 * Default removal message when reason is unknown
 */
const DEFAULT_REMOVAL_MESSAGE: Record<DiscountMessageLocale, string> = {
  fi: "Alennuskoodi poistettu",
  en: "Discount code removed",
};

/**
 * Get a user-friendly message for discount removal reason.
 *
 * @param reason - The removal reason from cart validation
 * @param locale - Locale for the message (fi or en)
 * @returns Localized user-friendly message
 *
 * @example
 * ```typescript
 * getDiscountRemovalMessage("CAMPAIGN_ACTIVE", "fi");
 * // Returns: "Alennuskoodi poistettu - kampanja-alennus aktivoitui"
 *
 * getDiscountRemovalMessage("MIN_ORDER_NOT_MET", "en");
 * // Returns: "Discount code removed - cart total below minimum order"
 * ```
 */
export function getDiscountRemovalMessage(
  reason: DiscountRemovalReason | undefined,
  locale: DiscountMessageLocale = "fi"
): string {
  if (!reason) {
    return DEFAULT_REMOVAL_MESSAGE[locale];
  }

  return REMOVAL_MESSAGES[reason]?.[locale] ?? DEFAULT_REMOVAL_MESSAGE[locale];
}

// =============================================================================
// Apply Error Messages
// =============================================================================

/**
 * Error codes from discount code apply endpoint
 */
export type DiscountApplyErrorCode =
  | "NOT_FOUND"
  | "INACTIVE"
  | "NOT_STARTED"
  | "EXPIRED"
  | "MAX_USES_REACHED"
  | "MIN_ORDER_NOT_MET"
  | "CAMPAIGN_ACTIVE";

/**
 * Error messages for discount apply errors
 */
const APPLY_ERROR_MESSAGES: Record<DiscountApplyErrorCode, Record<DiscountMessageLocale, string>> = {
  NOT_FOUND: {
    fi: "Alennuskoodia ei löydy",
    en: "Discount code not found",
  },
  INACTIVE: {
    fi: "Alennuskoodi ei ole käytössä",
    en: "Discount code is not active",
  },
  NOT_STARTED: {
    fi: "Alennuskoodi ei ole vielä voimassa",
    en: "Discount code is not yet valid",
  },
  EXPIRED: {
    fi: "Alennuskoodi on vanhentunut",
    en: "Discount code has expired",
  },
  MAX_USES_REACHED: {
    fi: "Alennuskoodi on käytetty loppuun",
    en: "Discount code usage limit reached",
  },
  MIN_ORDER_NOT_MET: {
    fi: "Ostoskorin summa alittaa alennuskoodin minimitilauksen",
    en: "Cart total is below the minimum order for this code",
  },
  CAMPAIGN_ACTIVE: {
    fi: "Alennuskoodia ei voi käyttää kun kampanja-alennus on voimassa",
    en: "Discount code cannot be used when a campaign discount is active",
  },
};

/**
 * Default apply error message when code is unknown
 */
const DEFAULT_APPLY_ERROR: Record<DiscountMessageLocale, string> = {
  fi: "Alennuskoodin käyttö epäonnistui",
  en: "Failed to apply discount code",
};

/**
 * Get a user-friendly message for discount apply error.
 *
 * @param errorCode - The error code from apply endpoint
 * @param locale - Locale for the message (fi or en)
 * @returns Localized user-friendly message
 *
 * @example
 * ```typescript
 * getDiscountApplyErrorMessage("EXPIRED", "fi");
 * // Returns: "Alennuskoodi on vanhentunut"
 * ```
 */
export function getDiscountApplyErrorMessage(
  errorCode: DiscountApplyErrorCode | string | undefined,
  locale: DiscountMessageLocale = "fi"
): string {
  if (!errorCode) {
    return DEFAULT_APPLY_ERROR[locale];
  }

  const messages = APPLY_ERROR_MESSAGES[errorCode as DiscountApplyErrorCode];
  return messages?.[locale] ?? DEFAULT_APPLY_ERROR[locale];
}
