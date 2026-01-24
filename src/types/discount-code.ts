/**
 * Discount Code Types
 *
 * Types for discount code API endpoints.
 */

// =============================================================================
// Discount Code Types
// =============================================================================

/**
 * Type of discount
 */
export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

/**
 * Applied discount code information (stored in cart)
 */
export interface AppliedDiscount {
  /** The discount code string */
  code: string;
  /** Type of discount */
  discountType: DiscountType;
  /** Discount value (percentage 1-100 or cents for fixed amount) */
  discountValue: number;
}

// =============================================================================
// Discount Code API Request Parameters
// =============================================================================

/**
 * Parameters for applying a discount code
 */
export interface ApplyDiscountParams {
  /** The discount code to apply */
  code: string;
  /** Cart ID for guest users */
  cartId?: string;
  /** Session ID for logged-in users */
  sessionId?: string;
  /** Cart items for campaign conflict check (SDK uses this for instant validation) */
  cartItems?: import("./cart.js").CartItem[];
  /** Active campaigns for campaign conflict check (SDK uses this for instant validation) */
  campaigns?: import("./storeconfig.js").Campaign[];
}

/**
 * Parameters for removing a discount code
 */
export interface RemoveDiscountParams {
  /** Cart ID for guest users */
  cartId?: string;
  /** Session ID for logged-in users */
  sessionId?: string;
}

/**
 * Parameters for getting current discount
 */
export interface GetDiscountParams {
  /** Cart ID for guest users */
  cartId?: string;
  /** Session ID for logged-in users */
  sessionId?: string;
}

// =============================================================================
// Discount Code API Responses
// =============================================================================

/**
 * Response from POST /discount-code/apply
 *
 * Note: No discountAmount returned - cart can change before checkout.
 * Calculate locally or get from cart validate if needed.
 */
export interface ApplyDiscountResponse {
  /** Whether the discount was applied successfully */
  success: boolean;
  /** Applied discount details */
  discount: {
    code: string;
    discountType: DiscountType;
    discountValue: number;
    /** Minimum order amount for this code (in cents) - for UI display */
    minOrderAmount: number | null;
  };
}

/**
 * Response from GET /discount-code/apply (get current discount)
 *
 * Returns stored discount data without re-validation.
 * Use /cart/validate for full validation.
 */
export interface GetDiscountResponse {
  /** Current discount (null if none applied) */
  discount: AppliedDiscount | null;
}

/**
 * Response from DELETE /discount-code/apply
 */
export interface RemoveDiscountResponse {
  /** Whether the discount was removed successfully */
  success: boolean;
}

/**
 * Error response from discount code endpoints
 */
export interface DiscountCodeError {
  /** Error message (Finnish, user-friendly) */
  error: string;
  /** Error code for programmatic use */
  code:
    | "MISSING_CODE"
    | "MISSING_CART_TOTAL"
    | "CART_MISSING"
    | "NOT_FOUND"
    | "INACTIVE"
    | "NOT_STARTED"
    | "EXPIRED"
    | "MAX_USES_REACHED"
    | "MIN_ORDER_NOT_MET"
    | "CAMPAIGN_ACTIVE"
    | "INTERNAL_ERROR";
}
