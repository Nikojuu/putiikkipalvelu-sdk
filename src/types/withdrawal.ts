/**
 * Withdrawal Notice Types
 *
 * Types for the KKV peruutustoiminto / EU CRD Article 11a mandatory
 * withdrawal function (effective 19.6.2026).
 */

/**
 * A single item being withdrawn (partial withdrawal).
 * Omit the items array entirely to indicate "whole order".
 */
export interface WithdrawalItem {
  /** Optional reference to a known line item id (matched orders only). */
  lineItemId?: string;
  /** Product name as the consumer sees it. */
  productName: string;
  /** Number of units being withdrawn. */
  quantity: number;
}

/**
 * Parameters for submitting a withdrawal notice.
 *
 * The function must accept the notice regardless of whether the order
 * can be resolved server-side (KKV requires the function to record any
 * submission as a legal record of intent).
 */
export interface WithdrawalNoticeParams {
  /** Consumer's name (KKV mandate). */
  name: string;
  /** Email where the confirmation will be sent (KKV mandate — consumer chooses). */
  email: string;
  /** Order number as the consumer types it. Optional — best-effort matched server-side. */
  orderNumber?: string;
  /**
   * Items being withdrawn for a partial withdrawal.
   * Omit / empty array = whole order.
   */
  items?: WithdrawalItem[];
  /** Optional free-text message from the consumer (max 2000 chars). */
  message?: string;
  /**
   * Pre-submit confirmation flag — MUST be `true`.
   * This represents the two-step UX step legally required by § 356a BGB
   * (and implied by KKV "selkeästi merkitty vahvistustoiminto").
   */
  confirmRead: true;
  /**
   * Honeypot field — leave empty. Submissions with a non-empty value are
   * silently dropped server-side as bot traffic.
   */
  honeypot?: string;
}

/**
 * Response from a successful withdrawal submission.
 */
export interface WithdrawalSubmitResponse {
  /** Human-readable per-store sequence (e.g. "PER-0042"). */
  noticeNumber: string;
  /** ISO timestamp of submission — printed on the confirmation email. */
  createdAt: string;
}

/**
 * Order details resolved from a withdrawal token (the signed link in the
 * order confirmation email). Used to pre-fill the withdrawal form.
 */
export interface WithdrawalResolveTokenResponse {
  /** Order number as a string ready to display. */
  orderNumber: string;
  /** Customer's full name from the order. */
  customerName: string;
  /** Customer's email from the order. */
  customerEmail: string;
  /** Line items eligible for partial withdrawal (excludes shipping rows). */
  items: WithdrawalItem[];
  /** ISO timestamp when the token expires. */
  expiresAt: string;
}
